"""KV (identidad visual) de las respuestas por correo - Diario Informaciones.

Genera el correo de respuesta en HTML (estilos en línea, compatible con Gmail
y Outlook) y su versión en texto plano, a partir del resultado del presupuestador.

    from correo_kv import armar_correo
    asunto, html, texto = armar_correo(resultado, nombre="Sra. Pérez", asunto_original="...", codigo="AV-261106-01")
"""
from __future__ import annotations

import html as _h
from datetime import date, datetime

import presupuestador as p

# Paleta y tipografía del KV (seguras para clientes de correo)
TINTA = "#0f3b3d"      # verde petróleo del encabezado
ACENTO = "#0f5f63"
FONDO = "#f3f5f4"
PAPEL = "#ffffff"
TEXTO = "#1c2422"
SUAVE = "#5b6865"
LINEA = "#d9dfdd"
SERIF = "Georgia,'Times New Roman',serif"
SANS = "Arial,Helvetica,sans-serif"

ESTADOS = {  # preset -> (etiqueta, color de fondo, color de texto)
    "presupuesto": ("Presupuesto", "#e3efef", ACENTO),
    "faltan_datos": ("Faltan datos", "#f7eed9", "#7a5000"),
    "sin_fechas": ("Fecha no disponible", "#f9e7e5", "#a3302a"),
    "recibido": ("Pedido recibido", "#eceff3", "#3b4a5c"),
    "confirmacion_pago": ("Comprobante recibido", "#f7eed9", "#7a5000"),
    "pago_confirmado": ("Pago confirmado", "#e5f1e6", "#2e6b3a"),
}
TIPOS = {"asamblea": "Convocatoria a asamblea", "marca_registro": "Registro de marca", "marca_renovacion": "Renovación de marca",
         "marca_transferencia": "Transferencia de marca", "derecho_autor": "Derecho de autor", "constitucion": "Constitución de sociedad",
         "modificacion_estatuto": "Modificación de estatuto", "edicto_extravio": "Edicto / extravío", "otro": "Aviso"}
DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


def fecha_larga(iso: str) -> str:
    d = date.fromisoformat(iso[:10])
    return f"{DIAS[d.weekday()]} {d.day} de {MESES[d.month - 1]}"


def rango(fechas: list[str]) -> str:
    if not fechas:
        return ""
    a, b = date.fromisoformat(fechas[0]), date.fromisoformat(fechas[-1])
    if len(fechas) == 1:
        return f"el {fecha_larga(fechas[0])}"
    if a.month == b.month:
        return f"del {DIAS[a.weekday()]} {a.day} al {DIAS[b.weekday()]} {b.day} de {MESES[b.month - 1]}"
    return f"del {fecha_larga(fechas[0])} al {fecha_larga(fechas[-1])}"


def e(s) -> str:
    return _h.escape(str(s))


def _fila(et, val):
    return (f'<tr><td style="padding:9px 0;border-bottom:1px solid {LINEA};color:{SUAVE};font:13px {SANS};width:42%;vertical-align:top">{e(et)}</td>'
            f'<td style="padding:9px 0;border-bottom:1px solid {LINEA};color:{TEXTO};font:bold 14px {SANS};vertical-align:top">{val}</td></tr>')


def _parrafo(t):
    return f'<p style="margin:0 0 14px;font:15px/1.55 {SANS};color:{TEXTO}">{t}</p>'


# Banner oficial (alojado por la firma de Gmail)
FIRMA_URL = "https://ci3.googleusercontent.com/mail-sig/AIorK4wMpvUEHaJnwAwkRomeeArEGOjYdtdpndZLgDOaBAo8jDsZQvy5sfWEFnzhjm6a778pu-oOULB9HqKC"


def gmail_seguro(html: str) -> str:
    """Gmail descarta la forma abreviada `background:`; usar `background-color` + atributo bgcolor."""
    import re
    html = re.sub(r"background:(#[0-9a-fA-F]{6})", r"background-color:\1", html)
    return re.sub(r'<(td|table)([^>]*?)style="([^"]*?)background-color:(#[0-9a-fA-F]{6})',
                  lambda m: f'<{m.group(1)} bgcolor="{m.group(4)}"{m.group(2)}style="{m.group(3)}background-color:{m.group(4)}', html)


def armar_correo(r: p.Resultado, *, nombre: str = "", asunto_original: str = "Publicación",
                 codigo: str = "", entidad_nombre: str = "", pago: dict | None = None,
                 horario_fuera: bool = False, referencia: list[str] | None = None,
                 pie_firma_gmail: bool = True) -> tuple[str, str, str]:
    """El banner de la firma va en pequeño (300 px) debajo de "Equipo de Avisos".
    Crear el borrador con includeSignature=False para que no se repita al final del hilo."""
    pago = pago or {k: v for k, v in p.cargar_json("datos_pago.json", opcional=True).items() if not k.startswith("_")}
    etiqueta, chip_bg, chip_fg = ESTADOS.get(r.preset, ESTADOS["recibido"])
    saludo = f"Buen día{', ' + e(nombre) if nombre else ''}:"
    cuerpo, texto = [], [saludo.replace("&#x27;", "'"), ""]

    # --- Resumen del pedido (común)
    filas = [_fila("Tipo de aviso", e(TIPOS.get(r.tipo, "Aviso")))]
    if entidad_nombre:
        filas.append(_fila("Entidad", e(entidad_nombre)))
    if r.fecha_asamblea:
        filas.append(_fila("Fecha de la asamblea", e(fecha_larga(r.fecha_asamblea).capitalize() + date.fromisoformat(r.fecha_asamblea).strftime(" de %Y"))))
    for concepto, monto in r.lineas_desglose:
        filas.append(_fila(concepto.split(":")[0] if ":" in concepto else "Detalle", e(concepto.split(": ", 1)[-1])))
    if codigo:
        filas.append(_fila("Código de pedido", f'<span style="font:bold 14px monospace;color:{ACENTO}">{e(codigo)}</span>'))
    resumen = f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:4px 0 18px">{"".join(filas)}</table>'

    if r.preset == "presupuesto":
        cuerpo.append(_parrafo("Gracias por elegir Diario Informaciones. Revisamos su aviso y está correcto. Aguardamos su pago para poder publicarlo; este es el presupuesto:"))
        cuerpo.append(resumen)
        cuerpo.append(f'''<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{TINTA};border-radius:4px;margin:0 0 18px">
<tr><td style="padding:18px 20px"><div style="font:12px {SANS};letter-spacing:1px;text-transform:uppercase;color:#bfd8d8">Total IVA incluido</div>
<div style="font:bold 30px {SERIF};color:#ffffff;margin-top:4px">Gs. {p.gs(r.total)}</div>
<div style="font:14px {SANS};color:#d7e6e6;margin-top:6px">{e(r.detalle_unitario)}{f" · Gs. {p.gs(r.monto_unitario)} c/u" if r.monto_unitario and r.total != r.monto_unitario else ""}</div>
<div style="font:14px {SANS};color:#ffffff;margin-top:10px">Fechas propuestas: <b>{e(rango(r.fechas))}</b></div></td></tr></table>''')
        pasos = [f"Transfiera <b>Gs. {p.gs(r.total)}</b> a la cuenta de abajo e indique el código <b>{e(codigo)}</b> en el concepto.",
                 "Responda este correo con el comprobante, la <b>razón social</b>, el <b>RUC</b> y un <b>número de contacto</b> para la factura.",
                 "Cuando se acredite el pago, le confirmamos las fechas de publicación y le enviamos la factura electrónica."]
        cuerpo.append(f'<p style="margin:0 0 8px;font:bold 15px {SANS};color:{TEXTO}">Para confirmar su publicación</p>')
        cuerpo.append("".join(f'<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px"><tr><td style="width:26px;vertical-align:top"><div style="width:20px;height:20px;border-radius:10px;background:{ACENTO};color:#fff;font:bold 12px/20px {SANS};text-align:center">{i}</div></td><td style="font:14px/1.5 {SANS};color:{TEXTO}">{t}</td></tr></table>' for i, t in enumerate(pasos, 1)))
        cuerpo.append(f'''<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid {LINEA};border-radius:4px;margin:12px 0 18px"><tr><td style="padding:14px 16px;font:14px/1.6 {SANS};color:{TEXTO}">
<b>{e(pago.get("banco",""))}</b><br>Titular: {e(pago.get("titular",""))}<br>Cuenta: <span style="font-family:monospace">{e(pago.get("nro_cuenta",""))}</span><br>Alias: {e(pago.get("alias",""))} · RUC: {e(pago.get("ruc",""))}</td></tr></table>''')
        cuerpo.append(_parrafo(f'<span style="color:{SUAVE};font-size:13px">Las fechas quedan reservadas por 24 horas y se garantizan al acreditarse el pago. La publicación se procesa una vez confirmada la acreditación.</span>'))
        texto += ["Revisamos su aviso y este es el presupuesto:", *[f"- {c}: Gs. {p.gs(m)}" for c, m in r.lineas_desglose],
                  f"TOTAL IVA incluido: Gs. {p.gs(r.total)}", f"Fechas propuestas: {rango(r.fechas)}", f"Código de pedido: {codigo}", "",
                  "Para confirmar:", f"1. Transfiera Gs. {p.gs(r.total)} e indique el código {codigo} en el concepto.",
                  "2. Responda con el comprobante, razón social, RUC y un número de contacto.",
                  "3. Al acreditarse, confirmamos las fechas y enviamos la factura electrónica.", "",
                  f"{pago.get('banco','')} · Titular: {pago.get('titular','')} · Cuenta: {pago.get('nro_cuenta','')} · RUC: {pago.get('ruc','')}"]
    elif r.preset == "faltan_datos":
        cuerpo.append(_parrafo("Recibimos su aviso. Para poder pasarle el costo y la fecha de publicación necesitamos que nos indique o corrija lo siguiente:"))
        cuerpo.append("".join(f'<p style="margin:0 0 8px;font:14px/1.5 {SANS};color:{TEXTO}">☐ {e(f)}</p>' for f in r.faltantes))
        if referencia:
            cuerpo.append(f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef4f4;border-left:3px solid {ACENTO};margin:6px 0 16px"><tr><td style="padding:12px 16px;font:14px/1.6 {SANS};color:{TEXTO}"><b>Para que tenga una referencia</b><br>' + "<br>".join(referencia) + '</td></tr></table>')
            texto += ["", "Para que tenga una referencia:", *[_h.unescape(x).replace("<b>","").replace("</b>","") for x in referencia]]
        cuerpo.append(_parrafo("Apenas lo recibamos le enviamos el presupuesto exacto y le reservamos la fecha."))
        texto += ["Para pasarle el costo y la fecha necesitamos:", *[f"- {f}" for f in r.faltantes]]
    elif r.preset == "sin_fechas":
        cuerpo.append(_parrafo(f"Revisamos su convocatoria. Con los espacios que tenemos disponibles, la fecha de la asamblea ({e(fecha_larga(r.fecha_asamblea))}) "
                               "ya no llega a los 10 días mínimos de anticipación que exige el Art. 1082 del Código Civil."))
        cuerpo.append(resumen)
        if r.fecha_propuesta:
            cuerpo.append(_parrafo(f"Le sugerimos fijar la asamblea a partir del <b>{e(fecha_larga(r.fecha_propuesta))}</b>. Si nos envía el texto con la nueva fecha, le pasamos el presupuesto enseguida."))
        texto += ["Su fecha de asamblea no llega a los 10 días mínimos (Art. 1082 del Código Civil).",
                  f"Le sugerimos fijarla a partir del {fecha_larga(r.fecha_propuesta)}." if r.fecha_propuesta else ""]
    elif r.preset == "pago_confirmado":
        cuerpo.append(_parrafo(f"Está confirmado el pago de <b>Gs. {p.gs(r.total)}</b>{(' (código ' + e(codigo) + ')') if codigo else ''}. Su publicación saldrá:"))
        cuerpo.append(f'''<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{TINTA};border-radius:4px;margin:0 0 18px"><tr><td style="padding:16px 20px"><div style="font:12px {SANS};letter-spacing:1px;text-transform:uppercase;color:#bfd8d8">Fechas de publicación</div><div style="font:bold 22px {SERIF};color:#ffffff;margin-top:4px">{e(rango(r.fechas)).capitalize()}</div><div style="font:14px {SANS};color:#d7e6e6;margin-top:6px">{len(r.fechas)} días · fecha garantizada</div></td></tr></table>''')
        cuerpo.append(_parrafo("La factura electrónica se enviará a este correo."))
        texto += [f"Está confirmado el pago de Gs. {p.gs(r.total)}.", f"Su publicación saldrá {rango(r.fechas)} ({len(r.fechas)} días).", "La factura electrónica se enviará a este correo."]
    elif r.preset == "confirmacion_pago":
        cuerpo.append(_parrafo("Recibimos su comprobante, muchas gracias."))
        cuerpo.append(_parrafo(f"En cuanto se acredite el pago en nuestra cuenta le confirmamos las fechas de publicación{(' (fecha tentativa: ' + e(rango(r.fechas)) + ')') if r.fechas else ''} y le enviamos la factura electrónica."))
        texto += ["Recibimos su comprobante. Al acreditarse le confirmamos las fechas y enviamos la factura."]
    else:  # recibido / derivado
        cuerpo.append(_parrafo("Recibimos su aviso. Lo está revisando nuestro equipo y en breve le respondemos con el costo y la fecha de publicación."))
        if horario_fuera:
            cuerpo.append(_parrafo(f'<span style="color:{SUAVE};font-size:13px">Nuestro horario de atención es de lunes a viernes de 07:00 a 14:00 horas.</span>'))
        texto += ["Recibimos su aviso. En breve le respondemos con el costo y la fecha."]

    html = f'''<div style="background:{FONDO};padding:24px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:{PAPEL};border:1px solid {LINEA}">
<tr><td style="background:{TINTA};padding:20px 28px"><div style="font:bold 22px {SERIF};color:#ffffff;letter-spacing:.5px">Diario Informaciones</div>
<div style="font:12px {SANS};color:#bfd8d8;letter-spacing:1px;text-transform:uppercase;margin-top:3px">Avisos y publicaciones legales</div></td></tr>
<tr><td style="padding:24px 28px 8px"><span style="display:inline-block;background:{chip_bg};color:{chip_fg};font:bold 11px {SANS};letter-spacing:1px;text-transform:uppercase;padding:5px 9px;border-radius:3px">{e(etiqueta)}</span>
<p style="margin:16px 0 14px;font:15px/1.55 {SANS};color:{TEXTO}">{saludo}</p>{"".join(cuerpo)}
<p style="margin:18px 0 0;font:15px {SANS};color:{TEXTO}">Atentamente,<br><b>Equipo de Avisos</b></p>
<p style="margin:10px 0 6px"><img src="{FIRMA_URL}" width="300" alt="Diario Informaciones · Desde 1912" style="display:block;width:300px;max-width:100%;height:auto;border:0"></p></td></tr>
{"" if pie_firma_gmail else f'''<tr><td style="padding:18px 28px 22px;border-top:1px solid {LINEA};font:12px/1.6 {SANS};color:{SUAVE}">Diario Informaciones · Editorial Informaciones S.R.L.<br>
{e(pago.get("direccion",""))} · Tel. {e(pago.get("telefono",""))}<br>Atención: lunes a viernes de 07:00 a 14:00 horas</td></tr>'''}
</table></td></tr></table></div>'''
    texto += ["", "Atentamente,", "Equipo de Avisos · Diario Informaciones",
              f"{pago.get('direccion','')} · Tel. {pago.get('telefono','')} · Lunes a viernes de 07:00 a 14:00"]
    asunto = "Re: " + asunto_original if not asunto_original.lower().startswith("re:") else asunto_original
    return asunto, gmail_seguro(html), "\n".join(texto)


def nuevo_codigo(n: int = 1, hoy: date | None = None) -> str:
    hoy = hoy or date.today()
    return f"AV-{hoy:%y%m%d}-{n:02d}"
