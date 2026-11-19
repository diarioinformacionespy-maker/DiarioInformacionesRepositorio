"""Regla de recepción de avisos en el Pool de Espacios.

Al recibir un aviso, Claude:
1. Define cuántos días se publica según el tipo (DIAS_POR_TIPO, o lo que pida el cliente).
2. Busca el primer día abierto desde la primera edición posible, con N días SEGUIDOS abiertos.
   Solo el diseñador cierra días; un día cerrado no recibe avisos nuevos.
3. Si es asamblea, verifica que la primera publicación quede al menos 10 días antes de la asamblea.
4. Carga el aviso en el pool (colección `avisos`) con sus fechas: provisional al cotizar,
   confirmada cuando se acredita el pago.
"""
from __future__ import annotations

from datetime import date, datetime, time, timedelta

DIAS_POR_TIPO = {
    "asamblea": 5,               # 3 si es segunda convocatoria o si el cliente lo pide
    "marca_registro": 3,
    "marca_renovacion": 1,
    "marca_transferencia": 1,
    "derecho_autor": 3,
    "constitucion": 3,
    "modificacion_estatuto": 3,
    "edicto_extravio": 1,
}
# Reglas de Luzana Benavides (dueña), 06/11/2026:
# - Los domingos no se inician publicaciones: se arranca el lunes.
#   Eddy 13/11/2026: el domingo figura CERRADO por defecto en el Pool.
# - En temporada baja no se atiende el sábado: lo pedido el viernes arranca el lunes.
# - Las asambleas se publican 5 días, pero el espacio se controla hasta 3 días
#   (basta con que los primeros 3 días tengan lugar).
# - Si un día se llena (el diseñador lo marca CERRADO), se designa la fecha siguiente.
NO_INICIA = {6}            # 6 = domingo (date.weekday())
TEMPORADA_BAJA = True      # True: tampoco se inicia el sábado
DIAS_CONTROL_ESPACIO = 3
MIN_DIAS_ASAMBLEA = 10   # Art. 1082 CC; criterio del equipo: contado hasta la primera publicación
HORA_CIERRE = time(14, 0)


def primera_edicion(ahora: datetime | None = None) -> date:
    ahora = ahora or datetime.now()
    d = ahora.date() + timedelta(days=1)
    # Eddy 09/11: la hora no cierra el día; solo el diseñador (CERRADO en el Pool)
    while not puede_iniciar(d):
        d += timedelta(days=1)
    return d


def puede_iniciar(d: date) -> bool:
    no = set(NO_INICIA) | ({5} if TEMPORADA_BAJA else set())   # 5 = sábado
    return d.weekday() not in no


def asignar(tipo: str, cerrados: set[str], *, dias: int | None = None,
            fecha_asamblea: date | None = None, ahora: datetime | None = None) -> dict:
    n = dias or DIAS_POR_TIPO.get(tipo, 1)
    d = primera_edicion(ahora)
    for _ in range(180):
        bloque = [d + timedelta(days=k) for k in range(n)]
        control = bloque[:min(n, DIAS_CONTROL_ESPACIO)]
        if puede_iniciar(d) and all(x.isoformat() not in cerrados for x in control):
            break
        d += timedelta(days=1)
    else:
        return {"ok": False, "motivo": "No hay días abiertos en los próximos 180 días."}
    res = {"ok": True, "dias": n, "fechas": [x.isoformat() for x in bloque]}
    if tipo == "asamblea" and fecha_asamblea:
        anticipacion = (fecha_asamblea - bloque[0]).days
        res["anticipacion"] = anticipacion
        if anticipacion < MIN_DIAS_ASAMBLEA:
            res["ok"] = False
            res["motivo"] = "no_cumple_plazo"
            res["fecha_asamblea_minima"] = (bloque[0] + timedelta(days=MIN_DIAS_ASAMBLEA)).isoformat()
    return res


# --------------------------------------------------------------------------- #
# Cierre del día: reprogramar avisos SIN PAGO
# --------------------------------------------------------------------------- #
ESTADOS = {
    "sin_pago": "Cotizado, sin pago: fecha tentativa, NO garantizada",
    "pago_informado": "Mandó comprobante: verificar acreditación cuanto antes",
    "confirmada": "Pago acreditado: fecha garantizada",
    "liberada": "Cancelado o vencido",
}


def a_reprogramar(avisos: list[dict], cerrados: set[str], ahora: datetime | None = None) -> list[dict]:
    """Avisos sin pago cuya fecha de inicio cayó en un día cerrado o ya no es posible.
    Se procesan por orden de llegada del correo (campo `recibido`)."""
    primera = primera_edicion(ahora).isoformat()
    out = [a for a in avisos if a.get("estado") == "sin_pago"
           and (a["fechas"][0] < primera or any(f in cerrados for f in a["fechas"]))]
    return sorted(out, key=lambda a: a.get("recibido", ""))


def reprogramar(aviso: dict, cerrados: set[str], ahora: datetime | None = None) -> dict:
    fa = date.fromisoformat(aviso["fecha_asamblea"]) if aviso.get("fecha_asamblea") else None
    return asignar(aviso.get("tipo", "asamblea"), cerrados, dias=len(aviso["fechas"]), fecha_asamblea=fa, ahora=ahora)


if __name__ == "__main__":
    ahora = datetime(2026, 11, 6, 16, 30)
    print(asignar("asamblea", {"2026-11-09"}, fecha_asamblea=date(2026, 11, 19), ahora=ahora))
    print(asignar("marca_registro", {"2026-11-09"}, ahora=ahora))
    print(asignar("marca_renovacion", set(), ahora=ahora))
