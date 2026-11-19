"""Cruce automático de pagos: correos de Banco GNB  <->  avisos del pool.

Lee los avisos de transferencia que GNB manda a diarioinformacionespy@gmail.com:
- "TRANSFERENCIA RECIBIDA DE CTA DE TERCEROS" (Transferencias@bancognb.com.py): entre cuentas GNB.
- "Transferencia SPI" / "Transferencia Interbancaria Recibida" (noreply@bancognb.com.py): desde otros bancos.
Los "Transferencias Enviadas" (salidas) se ignoran.

Reglas de cruce (de más seguro a menos):
1. CODIGO: el concepto trae el código AV-AAMMDD-XX y el importe coincide  -> confirmar.
2. NOMBRE+IMPORTE: el ordenante coincide con la razón social del aviso y el importe con su total -> confirmar
   y avisar al equipo (sin código en el concepto).
3. Solo importe o solo nombre -> "a revisar": una persona decide.
El comprobante (foto) que manda el cliente nunca confirma por sí solo.
"""
from __future__ import annotations

import html as _h
import re
import unicodedata


def _txt(s: str) -> str:
    s = re.sub(r"(?is)<(style|script).*?</\1>", " ", s or "")
    s = re.sub(r"(?i)<br\s*/?>|</tr>|</p>|</div>", "\n", s)
    s = re.sub(r"(?i)</td>\s*<td[^>]*>", " | ", s)
    s = re.sub(r"<[^>]+>", " ", s)
    return _h.unescape(s)


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", (s or "").upper())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"\b(S\.?\s?A\.?\s?E\.?\s?C\.?\s?A\.?|S\.?\s?R\.?\s?L\.?|E\.?\s?A\.?\s?S\.?|S\.?\s?A\.?|SOCIEDAD ANONIMA|LTDA\.?)(?=\W|$)", " ", s)
    return re.sub(r"[^A-Z0-9 ]", " ", re.sub(r"\s+", " ", s)).split() and " ".join(re.sub(r"[^A-Z0-9 ]", " ", s).split())


def parsear(html: str, asunto: str = "") -> dict | None:
    t = _txt(html)
    a = (asunto or "").upper()
    if "ENVIADA" in a or "ENVIADA" in t.upper()[:300]:
        return None  # transferencia que salió de la cuenta del diario
    def campo(*nombres):
        for n in nombres:
            m = re.search(re.escape(n) + r"\s*:?\s*\|?\s*([^\n|]+)", t, re.I)
            if m and m.group(1).strip():
                return m.group(1).strip()
        return ""
    importe = campo("Importe", "Monto")
    imp = int(re.sub(r"[^\d]", "", importe.split(",")[0])) if re.search(r"\d", importe) else None
    return {
        "tipo": "spi" if "INTERBANCARIA" in t.upper() or "SPI" in a else "gnb",
        "fecha": campo("Fecha y Hora", "Fecha y hora", "Fecha"),
        "comprobante": campo("Nro. de Comprobante", "N° Comprobante", "Nro de Comprobante"),
        "ordenante": campo("Nombre del Ordenante", "Enviado por", "Ordenante", "Originante", "Remitente"),
        "banco_origen": campo("Entidad Pagadora", "Entidad Originante", "Banco Origen"),
        "importe": imp,
        "concepto": campo("Concepto", "Comentario", "Descripción", "Motivo"),
        "referencia": campo("Referencia"),
    }


RE_CODIGO = re.compile(r"\bAV-?\d{6}-?[A-Z0-9]{1,4}\b", re.I)


def cruzar(pago: dict, avisos: list[dict]) -> dict:
    """Devuelve {'nivel': 'codigo'|'nombre_importe'|'revisar'|'sin_cruce', 'aviso': ..., 'motivo': ...}."""
    pend = [a for a in avisos if a.get("estado") in ("sin_pago", "pago_informado")]
    cod = RE_CODIGO.search(pago.get("concepto") or "")
    if cod:
        c = cod.group(0).upper().replace("AV", "AV-", 1).replace("--", "-")
        for a in pend:
            if a.get("codigo", "").upper().replace("-", "") == c.replace("-", ""):
                ok = a.get("total") in (None, pago["importe"])
                return {"nivel": "codigo" if ok else "revisar", "aviso": a,
                        "motivo": "Código en el concepto" + ("" if ok else f"; importe distinto (pagó {pago['importe']}, total {a.get('total')})")}
    nom = norm(pago.get("ordenante", ""))
    def coincide(a):
        if not nom:
            return False
        for n in (a.get("razon_social"), a.get("cliente"), a.get("contacto")):
            n = norm(n or "")
            if not n:
                continue
            if n in nom or nom in n:
                return True
            pal = [w for w in n.split() if len(w) > 3]   # "JUAN PEREIRA" ~ "PEREIRA BARRETO JUAN RAMON"
            if len(pal) >= 2 and all(w in nom.split() for w in pal):
                return True
        return False
    con = norm(pago.get("concepto", ""))
    def en_concepto(a):   # el comentario de la transferencia nombra a la empresa ("Comercial Yasy SA")
        pal = [w for w in norm(a.get("razon_social") or a.get("cliente", "")).split() if len(w) > 3]
        return bool(con) and any(w in con.split() for w in pal if w not in {"PARAGUAY", "COMERCIAL", "INDUSTRIAL", "GRUPO", "EMPRESA"})
    por_nombre = [a for a in pend if coincide(a) or en_concepto(a)]
    for a in por_nombre:
        if a.get("total") == pago["importe"]:
            return {"nivel": "nombre_importe", "aviso": a, "avisos": [a], "motivo": "Quien paga (empresa o contacto) e importe coinciden, sin código en el concepto"}
    # varios avisos del mismo cliente pagados juntos (ej. asamblea ordinaria + extraordinaria)
    grupos = {}
    for a in por_nombre:
        grupos.setdefault(norm(a.get("razon_social") or a.get("cliente", "")), []).append(a)
    for g in grupos.values():
        if len(g) > 1 and sum(a.get("total") or 0 for a in g) == pago["importe"]:
            return {"nivel": "nombre_importe", "aviso": g[0], "avisos": g, "motivo": f"Pago conjunto de {len(g)} avisos del mismo cliente"}
    if por_nombre:
        return {"nivel": "revisar", "aviso": por_nombre[0], "motivo": f"Coincide el nombre pero no el importe (pagó {pago['importe']})"}
    por_importe = [a for a in pend if a.get("total") == pago["importe"]]
    if len(por_importe) == 1:
        return {"nivel": "revisar", "aviso": por_importe[0], "motivo": "Solo coincide el importe: puede pagar otra persona (contador, socio)"}
    return {"nivel": "sin_cruce", "aviso": None, "motivo": "No coincide con ningún aviso pendiente"}
