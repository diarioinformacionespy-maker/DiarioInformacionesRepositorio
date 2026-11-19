"""Presupuestador de avisos - Diario Informaciones (etapa a).

Lee el texto de un aviso, lo clasifica, valida los items exigidos,
calcula el presupuesto con tarifas.json y arma un BORRADOR de correo.
Nunca envia nada: una persona revisa y aprueba.

Uso:
    python presupuestador.py aviso.txt [--dias 5] [--fecha-asamblea 20/12/2026]
                                       [--expedientes 5 --logos 1] [--asunto "..."]
    cat aviso.txt | python presupuestador.py -
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from dataclasses import dataclass, field, asdict
from datetime import date, datetime, time, timedelta
from pathlib import Path

BASE = Path(__file__).resolve().parent

MESES = {"enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6, "julio": 7,
         "agosto": 8, "septiembre": 9, "setiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12}
NUMEROS = {"un": 1, "uno": 1, "una": 1, "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5,
           "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10}

# Estados (seccion 2 quater del skill)
DISPONIBLE_VALIDADO = "DISPONIBLE Y VALIDADO"
DISPONIBLE_PENDIENTE = "DISPONIBLE PENDIENTE"
SIN_FECHAS = "SIN FECHAS"
REVISION = "REVISIÓN LEGAL"


def cargar_json(nombre: str, opcional: bool = False) -> dict:
    p = BASE / nombre
    if not p.exists():
        if opcional:
            return {}
        raise FileNotFoundError(p)
    return json.loads(p.read_text(encoding="utf-8"))


def gs(monto: int | None) -> str:
    return "consultar" if monto is None else f"{int(round(monto)):,}".replace(",", ".")


def normalizar(texto: str) -> str:
    """Minusculas y sin tildes, para buscar palabras clave."""
    t = unicodedata.normalize("NFD", texto.lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn")


# --------------------------------------------------------------------------- #
# Lectura del aviso
# --------------------------------------------------------------------------- #

def detectar_tipo(t: str) -> str:
    if "derecho de autor" in t or "derechos de autor" in t:
        return "derecho_autor"
    if "marca" in t and ("dinapi" in t or "acta" in t or "clase" in t):
        if "renovacion" in t:
            return "marca_renovacion"
        if "transferencia" in t:
            return "marca_transferencia"
        return "marca_registro"
    if "asamblea" in t:
        return "asamblea"
    if "modificacion" in t and "estatuto" in t:
        return "modificacion_estatuto"
    if "constitucion" in t and ("sociedad" in t or "s.r.l" in t or "e.a.s" in t or "s.a." in t):
        return "constitucion"
    if "edicto" in t or "extravio" in t or "extraviad" in t:
        return "edicto_extravio"
    return "otro"


def detectar_entidad(texto: str, t: str) -> str | None:
    if "cooperativa" in t:
        return "cooperativa"
    if "mutual" in t:
        return "mutual"
    if "club" in t:
        return "club"
    if "consorcio" in t:
        return "consorcio"
    if "asociacion" in t:
        return "asociacion"
    if re.search(r"\be\.?\s?a\.?\s?s\.?(\W|$)", t) or "empresa por acciones simplificadas" in t:
        return "eas"
    if re.search(r"\bs\.?\s?r\.?\s?l\b", t):
        return "srl"
    if re.search(r"\bs\.\s?a\.?(\W|$)|\bsociedad anonima\b|\bsaeca\b|\bs\.a\.e\.c\.a\b", t):
        return "sa"
    return None


def contar_temas(texto: str) -> list[int]:
    """Cuenta los puntos del orden del dia. Devuelve una lista: una cantidad por asamblea."""
    norm = normalizar(texto)
    partes = re.split(r"orden\s+del\s+dia", norm)
    if len(partes) < 2:
        return []
    resultado = []
    item = re.compile(r"^\s*(\d{1,2}|[a-z]|[ivx]{1,4})\s*[\)\.\-–°º]\s*\S", re.M)
    for seg in partes[1:]:
        # cortar donde empieza otra convocatoria / firma
        seg = re.split(r"\n\s*(asamblea\s+general|el directorio|la comision|nota:|obs)", seg)[0]
        resultado.append(len(item.findall(seg)))
    return resultado


def contar_asambleas(t: str) -> int:
    n = len(re.findall(r"orden\s+del\s+dia", t))
    return max(n, 1)


def encontrar_fechas(texto: str) -> list[date]:
    t = normalizar(texto)
    out = []
    for d, m, a in re.findall(r"\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\b", t):
        try:
            out.append(date(int(a), int(m), int(d)))
        except ValueError:
            pass
    for d, m, a in re.findall(r"\b(\d{1,2})\s+de\s+([a-z]+)\s+(?:de|del)\s+(\d{4})", t):
        if m in MESES:
            try:
                out.append(date(int(a), MESES[m], int(d)))
            except ValueError:
                pass
    return out


def tiene_hora(t: str) -> bool:
    return bool(re.search(r"\b\d{1,2}\s*[:.]\s*\d{2}\b|\b\d{1,2}\s*(hs|horas|h)\b", t))


def tiene_lugar(t: str) -> bool:
    return bool(re.search(r"\b(local|sede|domicilio|sito|sita|calle|avda|avenida|salon|oficinas?|"
                          r"auditorio|en la ciudad de|asuncion|ruta|km|zoom|virtual|plataforma)\b", t))


def dias_pedidos(t: str) -> int | None:
    m = re.search(r"\b(\d{1,2}|" + "|".join(NUMEROS) + r")\s*\(?\d*\)?\s*(dias|publicaciones|veces)\b", t)
    if not m:
        return None
    v = m.group(1)
    return int(v) if v.isdigit() else NUMEROS[v]


def contar_expedientes(t: str) -> int:
    n = len(re.findall(r"\b(acta|expediente|exp\.)\s*(n[°ºro.]*)?\s*:?\s*\d", t))
    return n


CARACTERES_POR_LINEA = 85   # una línea del cliente en tamaño estándar (12 pt, hoja A4, márgenes normales)


def contar_lineas(texto: str, desde_por_escritura: bool = True) -> int:
    """Regla Eddy 10/11/2026: una LÍNEA es una línea del cliente tal como la envía, pero
    medida en tamaño ESTÁNDAR (12 pt). Así, si el cliente achica la letra (ej. 6 pt) para
    meter más texto por línea, igual se cuentan las líneas reales a tamaño normal.
    Cada párrafo ocupa ceil(caracteres / 85) líneas (mínimo 1). Se cuenta desde 'Por escritura'."""
    import math
    t = texto
    if desde_por_escritura:
        i = normalizar(t).find("por escritura")
        if i >= 0:
            t = t[i:]
    return sum(max(1, math.ceil(len(l.strip()) / CARACTERES_POR_LINEA))
               for l in t.splitlines() if l.strip())


# --------------------------------------------------------------------------- #
# Calendario de ediciones
# --------------------------------------------------------------------------- #

def hay_edicion(d: date, cfg: dict) -> bool:
    return d.weekday() not in cfg.get("dias_sin_edicion", []) and \
        d.isoformat() not in cfg.get("feriados_sin_edicion", [])


def primera_edicion_posible(ahora: datetime, cfg: dict) -> date:
    d = ahora.date() + timedelta(days=1)
    hc = cfg.get("hora_cierre")
    if hc:
        h, m = map(int, hc.split(":"))
        if ahora.time() >= time(h, m):
            d += timedelta(days=1)
    if cfg.get("lugar_desde"):
        d = max(d, date.fromisoformat(cfg["lugar_desde"]))
    while not hay_edicion(d, cfg):
        d += timedelta(days=1)
    return d


def ediciones_desde(inicio: date, n: int, cfg: dict) -> list[date]:
    out, d = [], inicio
    while len(out) < n:
        if hay_edicion(d, cfg):
            out.append(d)
        d += timedelta(days=1)
    return out


def proponer_fechas(asamblea: date, regla: dict, ahora: datetime, cfg: dict):
    """Devuelve (fechas, motivo). fechas=None si no hay bloque compatible."""
    n = regla["publicaciones"]
    min_ult = regla["min_dias_desde_ultima"]
    max_pri = regla.get("max_dias_desde_primera")
    inicio = primera_edicion_posible(ahora, cfg)
    if max_pri:
        inicio = max(inicio, asamblea - timedelta(days=max_pri))
    while not hay_edicion(inicio, cfg):
        inicio += timedelta(days=1)
    bloque = ediciones_desde(inicio, n, cfg)
    if cfg.get("criterio_anticipacion") == "resolucion":
        ref, cual = bloque[0], "primera"
    else:
        ref, cual = bloque[-1], "última"
    dias = (asamblea - ref).days
    if dias >= min_ult and bloque[-1] < asamblea:
        return bloque, f"Criterio {cfg.get('criterio_anticipacion', 'conservador')}: {cual} publicación {dias} días antes de la asamblea (mínimo {min_ult})."
    return None, (f"Criterio {cfg.get('criterio_anticipacion', 'conservador')}: con {n} publicaciones desde el "
                  f"{inicio:%d/%m/%Y}, la {cual} quedaría a {dias} días de la asamblea (mínimo {min_ult}).")


# --------------------------------------------------------------------------- #
# Presupuesto
# --------------------------------------------------------------------------- #

@dataclass
class Resultado:
    tipo: str
    entidad: str | None = None
    dias: int | None = None
    lineas_desglose: list = field(default_factory=list)
    total: int | None = None
    estado: str = DISPONIBLE_PENDIENTE
    flag: bool = False
    motivos: list = field(default_factory=list)
    faltantes: list = field(default_factory=list)
    fechas: list = field(default_factory=list)
    fecha_asamblea: str | None = None
    fecha_propuesta: str | None = None
    preset: str = "presupuesto"
    detalle_unitario: str = ""
    monto_unitario: int | None = None

    def marcar(self, motivo: str):
        self.flag = True
        self.motivos.append(motivo)


def tarifa_asamblea(temas: int, dias: int, tar: dict) -> int | None:
    tabla = tar["asamblea_5_dias"] if dias == 5 else tar["asamblea_3_dias"] if dias == 3 else None
    if tabla is None:
        return None
    if 1 <= temas <= 5:
        return tabla["1-5"]
    return tabla.get(str(temas))


def presupuestar(texto: str, *, dias: int | None = None, fecha_asamblea: date | None = None,
                 expedientes: int | None = None, logos: int | None = None,
                 ahora: datetime | None = None, tar: dict | None = None, cfg: dict | None = None) -> Resultado:
    tar = tar or cargar_json("tarifas.json")
    cfg = cfg or cargar_json("config.json")
    ahora = ahora or datetime.now()
    t = normalizar(texto)
    r = Resultado(tipo=detectar_tipo(t))
    dias_txt = dias if dias is not None else dias_pedidos(t)

    if r.tipo == "asamblea":
        _asamblea(r, texto, t, dias_txt, fecha_asamblea, ahora, tar, cfg)
    elif r.tipo in ("marca_registro", "marca_renovacion"):
        tb = tar[r.tipo]
        r.dias = tb["dias"]
        n = expedientes or contar_expedientes(t)
        if not n:
            r.faltantes.append("Número de acta / expediente de DINAPI.")
            r.marcar("No se encontró número de acta.")
            n = 1
        if logos is None:
            r.marcar("No se puede saber por texto si lleva logo ni cuántos logos distintos: indicar --logos.")
            logos = 0
        if logos:
            r.lineas_desglose.append((f"{n} expediente(s) con logo", n * tb["por_expediente_con_logo"]))
            r.lineas_desglose.append((f"{logos} logo(s) distinto(s)", logos * tb["por_logo"]))
        else:
            r.lineas_desglose.append((f"{n} expediente(s) sin logo", n * tb["por_expediente_sin_logo"]))
        r.detalle_unitario = f"por {r.dias} día(s) de publicación"
        if r.tipo == "marca_renovacion" and "renovacion" not in t[:300]:
            r.faltantes.append("El encabezado debe decir expresamente que es una solicitud de renovación.")
    elif r.tipo == "marca_transferencia":
        tb = tar[r.tipo]
        r.dias = tb["dias"]
        n = expedientes or contar_expedientes(t) or 1
        r.lineas_desglose.append((f"{n} expediente(s)", n * tb["por_expediente"]))
        r.detalle_unitario = "por 1 día de publicación"
    elif r.tipo == "derecho_autor":
        tb = tar[r.tipo]
        r.dias = tb["dias"]
        n = expedientes or contar_expedientes(t) or 1
        monto = tb["1-4"] if n <= 4 else tb["5-8"] if n <= 8 else tb["mas_de_8"]
        r.lineas_desglose.append((f"{n} expediente(s)", monto))
        r.detalle_unitario = "por 3 días de publicación"
    elif r.tipo in ("constitucion", "modificacion_estatuto"):
        tb = tar[r.tipo]
        r.dias = tb["dias"]
        lineas = contar_lineas(texto)
        extra = max(0, (lineas - 8) // 3)   # Hugo 09/11: tramo de 3 incompleto NO se cobra
        r.lineas_desglose.append(("Base hasta 8 líneas", tb["base_hasta_8_lineas"]))
        if extra:
            r.lineas_desglose.append((f"{lineas} líneas: {extra} tramo(s) completo(s) de 3 líneas extra",
                                      extra * tb["extra_cada_3_lineas"]))
        r.detalle_unitario = "por 3 días de publicación (orientativo)"
        r.marcar("Monto ORIENTATIVO: las líneas reales se calculan a ojo según el formato del diario.")
    elif r.tipo == "edicto_extravio":
        tb = tar[r.tipo]
        r.dias = dias_txt or 1
        r.lineas_desglose.append((f"{r.dias} publicación(es)", r.dias * tb["por_publicacion"]))
        r.detalle_unitario = f"por {r.dias} día(s) de publicación"
        if r.dias > 1:
            r.marcar("Confirmar que el edicto se cobra 100.000 por cada día publicado.")
    else:
        r.marcar("Tipo de aviso no reconocido: derivar a una persona.")
        r.preset = "recibido"

    if r.lineas_desglose and all(m is not None for _, m in r.lineas_desglose):
        r.total = sum(m for _, m in r.lineas_desglose)
    elif r.preset == "presupuesto":
        r.marcar("Hay ítems sin tarifa en la lista: consultar precio.")
        r.preset = "recibido"

    if r.faltantes and r.preset in ("presupuesto", "recibido") and r.estado != REVISION:
        # Eddy: "si el texto no esta cubierto, se le dice al cliente que le falta"
        r.preset = "faltan_datos"
        r.estado = DISPONIBLE_PENDIENTE
    if r.flag and r.estado == DISPONIBLE_VALIDADO:
        r.estado = DISPONIBLE_PENDIENTE
    if not r.fechas and r.preset == "presupuesto":
        r.fechas = [primera_edicion_posible(ahora, cfg).isoformat()]
    return r


def _asamblea(r, texto, t, dias_txt, fecha_asamblea, ahora, tar, cfg):
    r.entidad = detectar_entidad(texto, t)
    segunda = bool(re.search(r"segunda\s+convocatoria", t)) and not re.search(r"primera\s+convocatoria", t)

    # Items legales minimos
    fechas = encontrar_fechas(texto)
    fa = fecha_asamblea or (max(fechas) if fechas else None)
    if not fa:
        r.faltantes.append("Fecha de realización de la asamblea.")
    if not tiene_hora(t):
        r.faltantes.append("Hora de realización.")
    if not tiene_lugar(t):
        r.faltantes.append("Lugar de realización.")
    temas = contar_temas(texto)
    if not temas or 0 in temas:
        r.faltantes.append("Orden del día con los asuntos a tratar (numerados).")
    if not re.search(r"\b(ordinaria|extraordinaria)\b", t):
        r.faltantes.append("Tipo de asamblea (ordinaria o extraordinaria).")

    # Dias de publicacion
    if r.entidad == "sa" or r.entidad is None:
        r.dias = dias_txt or (3 if segunda else 5)
    else:
        r.dias = dias_txt
    if r.entidad is None:
        r.marcar("Tipo jurídico de la entidad no identificado: consultar.")
    elif r.entidad != "sa":
        r.marcar(f"Entidad '{r.entidad}': plazos legales PENDIENTES en el skill. Derivar a una persona.")
        r.estado = REVISION
        if not dias_txt:
            r.marcar("El cliente no indicó por cuántos días publicar: no se cotiza.")
            r.preset = "recibido"
            return

    # Precio: cada asamblea por separado
    for i, n in enumerate(temas or [0], 1):
        etiqueta = f"Asamblea {i}" if len(temas) > 1 else "Asamblea"
        monto = tarifa_asamblea(n, r.dias, tar) if n else None
        r.lineas_desglose.append((f"{etiqueta}: {n or '?'} tema(s), {r.dias} días", monto))
    montos = [m for _, m in r.lineas_desglose]
    if len(set(montos)) == 1:
        r.monto_unitario = montos[0]
    r.detalle_unitario = (f"cada una por {r.dias} días de publicación" if len(montos) > 1
                          else f"por {r.dias} días de publicación")

    # Fechas (solo S.A., que es la unica regla cargada)
    if fa:
        r.fecha_asamblea = fa.isoformat()
        if r.entidad == "sa" or r.entidad is None:
            regla = cfg["plazos"]["sa_segunda" if segunda else "sa_primera"]
            regla = dict(regla, publicaciones=r.dias)
            bloque, motivo = proponer_fechas(fa, regla, ahora, cfg)
            r.motivos.append(motivo)
            if bloque:
                r.fechas = [d.isoformat() for d in bloque]
                if r.estado != REVISION and not r.faltantes:
                    r.estado = DISPONIBLE_VALIDADO
            else:
                r.estado = SIN_FECHAS
                r.preset = "sin_fechas"
                ult = ediciones_desde(primera_edicion_posible(ahora, cfg), r.dias, cfg)[-1]
                r.fecha_propuesta = (ult + timedelta(days=regla["min_dias_desde_ultima"])).isoformat()


# --------------------------------------------------------------------------- #
# Borrador de correo
# --------------------------------------------------------------------------- #

class _Default(dict):
    def __missing__(self, k):
        return "[COMPLETAR " + k + "]"


def fmt_fecha(iso: str) -> str:
    return datetime.fromisoformat(iso).strftime("%d/%m/%Y")


def borrador(r: Resultado, asunto: str = "Publicación") -> str:
    pago = cargar_json("datos_pago.json", opcional=True) or cargar_json("datos_pago.example.json")
    v = _Default({k: v for k, v in pago.items() if not k.startswith("_")})
    v["asunto_original"] = asunto
    v["total"] = gs(r.total)
    v["monto_unitario"] = gs(r.monto_unitario if r.monto_unitario is not None else r.total)
    v["detalle_unitario"] = r.detalle_unitario
    if r.fechas:
        v["fecha_inicio"] = fmt_fecha(r.fechas[0])
    v["faltantes"] = "\n".join(f"- {f}" for f in r.faltantes)
    if r.fecha_asamblea:
        v["fecha_asamblea"] = fmt_fecha(r.fecha_asamblea)
    if r.fecha_propuesta:
        v["fecha_propuesta"] = fmt_fecha(r.fecha_propuesta)
    plantilla = (BASE / "presets" / f"{r.preset}.md").read_text(encoding="utf-8")
    return plantilla.format_map(v)


def informe(r: Resultado) -> str:
    out = [f"Tipo de aviso : {r.tipo}" + (f"  (entidad: {r.entidad or '¿?'})" if r.tipo == "asamblea" else ""),
           f"Días          : {r.dias or '¿?'}"]
    for concepto, monto in r.lineas_desglose:
        out.append(f"  - {concepto:<45} Gs. {gs(monto)}")
    out.append(f"TOTAL         : Gs. {gs(r.total)}")
    if r.fecha_asamblea:
        out.append(f"Asamblea      : {fmt_fecha(r.fecha_asamblea)}")
    if r.fechas:
        out.append("Fechas tentat.: " + ", ".join(fmt_fecha(f) for f in r.fechas) + "  (sujetas a cupo)")
    out.append(f"ESTADO        : {r.estado}" + ("   ⚑ FLAG - revisar" if r.flag else ""))
    for m in r.motivos:
        out.append(f"  · {m}")
    if r.faltantes:
        out.append("Faltan en el texto:")
        out += [f"  - {f}" for f in r.faltantes]
    out.append(f"Preset        : {r.preset}")
    return "\n".join(out)


def limpiar_correo(cuerpo: str) -> str:
    """Quita el texto citado de correos anteriores y firmas de antivirus."""
    corte = re.split(r"\n\s*(El .{5,80} escribi[oó]:|_{5,}\s*\n\s*De:|-{2,}\s*Original|De: .+\n\s*Enviado:)", cuerpo)[0]
    lineas = [l for l in corte.splitlines() if not l.lstrip().startswith(">") and "avast.com" not in l]
    return "\n".join(lineas).strip()


EXT_TEXTO = (".doc", ".docx", ".pdf", ".jpg", ".jpeg", ".png", ".odt", ".rtf")


def procesar_correo(asunto: str, cuerpo: str, adjuntos: list[str] | None = None,
                    textos_adjuntos: dict[str, str] | None = None,
                    advertencias: list[str] | None = None, **kw) -> Resultado:
    """Decide la respuesta para un correo entrante.

    adjuntos: nombres de TODOS los archivos adjuntos.
    textos_adjuntos: {nombre: texto} de los adjuntos que se pudieron leer.
    advertencias: avisos del lector (ej. "texto leído por IA, verificar").
    """
    adjuntos = adjuntos or []
    textos_adjuntos = textos_adjuntos or {}
    cuerpo_limpio = limpiar_correo(cuerpo)
    t_cuerpo = normalizar(cuerpo_limpio + " " + asunto)
    es_pago = lambda n: re.search(r"pago|comprobante|transf|recibo|boleta", normalizar(n))
    pago = bool(re.search(r"comprobante|transferencia realizada|pago realizado|adjunto (el )?pago|"
                          r"foto de transferencia|ya (se )?(pago|abono|transfiri)", t_cuerpo)) \
        or any(es_pago(a) for a in adjuntos)
    # Textos de aviso: los adjuntos leidos que no son comprobantes
    textos_aviso = [tx for n, tx in textos_adjuntos.items() if tx.strip() and not es_pago(n)]
    texto = "\n\n".join([cuerpo_limpio] + textos_aviso)
    sin_leer = [a for a in adjuntos if a.lower().endswith(EXT_TEXTO) and a not in textos_adjuntos
                and not es_pago(a) and not re.fullmatch(r"image\d*\.(png|jpe?g)", a.lower())]

    if pago:
        r = Resultado(tipo=detectar_tipo(normalizar(texto + " " + asunto)), preset="confirmacion_pago")
        r.marcar("El cliente dice que ya pagó: verificar la acreditación en el banco y confirmar el día "
                 "(no hace falta revisar el texto).")
        r.fechas = [primera_edicion_posible(kw.get("ahora") or datetime.now(),
                                            kw.get("cfg") or cargar_json("config.json")).isoformat()]
        return r

    r = presupuestar(texto + "\n" + asunto, **kw)
    if sin_leer and (r.tipo == "otro" or r.preset != "presupuesto"):
        r = Resultado(tipo=detectar_tipo(normalizar(texto + " " + asunto)), preset="recibido")
        r.marcar("No se pudo leer el adjunto (" + ", ".join(sin_leer) + "). Una persona debe cotizar.")
    elif r.tipo == "asamblea" and not contar_temas(texto):
        r.motivos, r.flag = [], False
        r.marcar("El cliente pregunta sin enviar el texto: pedir el texto del aviso para cotizar.")
        r.faltantes = ["El texto completo de la convocatoria (para cotizar según el orden del día)."]
        r.preset = "faltan_datos"
    for adv in advertencias or []:
        r.marcar(adv)
    if r.flag and r.estado == DISPONIBLE_VALIDADO:
        r.estado = DISPONIBLE_PENDIENTE
    return r


def registrar(r: Resultado, asunto: str):
    reg = {"fecha": datetime.now().isoformat(timespec="seconds"), "asunto": asunto, **asdict(r)}
    with open(BASE / "registro.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(reg, ensure_ascii=False) + "\n")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("archivo", help="archivo .txt con el aviso, o - para leer de la entrada")
    ap.add_argument("--dias", type=int, help="días de publicación pedidos por el cliente")
    ap.add_argument("--fecha-asamblea", help="dd/mm/aaaa (si no se detecta bien del texto)")
    ap.add_argument("--expedientes", type=int)
    ap.add_argument("--logos", type=int, help="cantidad de logos DISTINTOS (0 = sin logo)")
    ap.add_argument("--asunto", default="Publicación")
    ap.add_argument("--json", action="store_true", help="salida en JSON")
    a = ap.parse_args(argv)

    texto = sys.stdin.read() if a.archivo == "-" else Path(a.archivo).read_text(encoding="utf-8")
    fa = datetime.strptime(a.fecha_asamblea, "%d/%m/%Y").date() if a.fecha_asamblea else None
    r = presupuestar(texto, dias=a.dias, fecha_asamblea=fa, expedientes=a.expedientes, logos=a.logos)
    registrar(r, a.asunto)
    if a.json:
        print(json.dumps({**asdict(r), "borrador": borrador(r, a.asunto)}, ensure_ascii=False, indent=2))
    else:
        print(informe(r))
        print("\n" + "=" * 20 + " BORRADOR DE CORREO (revisar antes de enviar) " + "=" * 20 + "\n")
        print(borrador(r, a.asunto))


if __name__ == "__main__":
    main()
