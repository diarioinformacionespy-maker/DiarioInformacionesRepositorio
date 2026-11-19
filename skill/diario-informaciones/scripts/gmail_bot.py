"""Bot de Gmail - Diario Informaciones.

Lee los correos nuevos de la bandeja, descarga los adjuntos (Word, PDF, imagen)
y los links de Google Drive, cotiza con presupuestador.py y deja un BORRADOR.
NUNCA envía correos: una persona revisa cada borrador y lo envía.

Uso:
    python gmail_bot.py                    # ensayo, una pasada (borradores sin destinatario)
    python gmail_bot.py --modo real        # borradores como respuesta en el hilo del cliente
    python gmail_bot.py --cada 5           # repetir cada 5 minutos
    python gmail_bot.py --consulta "subject:asamblea newer_than:1d"

Primera vez: ver INSTALAR.md (credentials.json de Google y clave de Anthropic).
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import re
import time
from datetime import datetime
from email.message import EmailMessage
from email.utils import parseaddr
from pathlib import Path

import lector
import presupuestador as p

BASE = Path(__file__).resolve().parent
SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",  # leer correos y adjuntos
    "https://www.googleapis.com/auth/gmail.compose",   # crear borradores (el código nunca envía)
    "https://www.googleapis.com/auth/gmail.labels",    # etiqueta BOT-procesado
    "https://www.googleapis.com/auth/gmail.modify",    # poner la etiqueta en el correo
    "https://www.googleapis.com/auth/drive.readonly",  # descargar links de Drive
]
ETIQUETA = "BOT-procesado"
CONSULTA = f"in:inbox -from:me -label:{ETIQUETA} newer_than:2d"
RE_DRIVE = re.compile(r"https?://(?:drive|docs)\.google\.com/[^\s<>\"')]+")


# --------------------------------------------------------------------------- #
# Conexion
# --------------------------------------------------------------------------- #

def conectar():
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build

    token = BASE / "token.json"
    creds = Credentials.from_authorized_user_file(str(token), SCOPES) if token.exists() else None
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(BASE / "credentials.json"), SCOPES)
            creds = flow.run_local_server(port=0)  # abre el navegador para autorizar una sola vez
        token.write_text(creds.to_json(), encoding="utf-8")
    return build("gmail", "v1", credentials=creds), build("drive", "v3", credentials=creds)


# --------------------------------------------------------------------------- #
# Lectura del correo
# --------------------------------------------------------------------------- #

def _b64(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def _partes(payload):
    yield payload
    for parte in payload.get("parts", []) or []:
        yield from _partes(parte)


def cabecera(msg, nombre):
    for h in msg["payload"].get("headers", []):
        if h["name"].lower() == nombre.lower():
            return h["value"]
    return ""


def cuerpo_texto(msg) -> str:
    plano, html = [], []
    for parte in _partes(msg["payload"]):
        if parte.get("filename"):
            continue
        data = parte.get("body", {}).get("data")
        if not data:
            continue
        if parte.get("mimeType") == "text/plain":
            plano.append(_b64(data).decode("utf-8", errors="replace"))
        elif parte.get("mimeType") == "text/html":
            h = _b64(data).decode("utf-8", errors="replace")
            h = re.sub(r"(?is)<(style|script).*?</\1>", "", h)
            h = re.sub(r"(?i)<br\s*/?>|</p>|</div>|</li>", "\n", h)
            html.append(re.sub(r"<[^>]+>", "", h))
    texto = "\n".join(plano) if plano else "\n".join(html)
    import html as _html
    return _html.unescape(texto)


def adjuntos(gmail, msg):
    """Devuelve [(nombre, bytes)] de todos los adjuntos del mensaje."""
    out = []
    for parte in _partes(msg["payload"]):
        nombre = parte.get("filename")
        if not nombre:
            continue
        cuerpo = parte.get("body", {})
        if "attachmentId" in cuerpo:
            data = gmail.users().messages().attachments().get(
                userId="me", messageId=msg["id"], id=cuerpo["attachmentId"]).execute()["data"]
        else:
            data = cuerpo.get("data", "")
        out.append((nombre, _b64(data)))
    return out


def archivos_drive(drive, texto: str):
    """Descarga los archivos de links de Google Drive / Docs que haya en el texto."""
    from googleapiclient.http import MediaIoBaseDownload

    out, errores = [], []
    for url in dict.fromkeys(RE_DRIVE.findall(texto)):
        m = re.search(r"/d/([\w-]{20,})|[?&]id=([\w-]{20,})", url)
        if not m:
            continue
        fid = m.group(1) or m.group(2)
        try:
            meta = drive.files().get(fileId=fid, fields="name,mimeType", supportsAllDrives=True).execute()
            mime = meta["mimeType"]
            if mime == "application/vnd.google-apps.document":
                req = drive.files().export_media(
                    fileId=fid, mimeType="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                nombre = meta["name"] + ".docx"
            elif mime.startswith("application/vnd.google-apps"):
                errores.append(f"Link de Drive con formato no soportado ({mime}): {url}")
                continue
            else:
                req = drive.files().get_media(fileId=fid, supportsAllDrives=True)
                nombre = meta["name"]
            buf = io.BytesIO()
            desc = MediaIoBaseDownload(buf, req)
            listo = False
            while not listo:
                _, listo = desc.next_chunk()
            out.append((nombre, buf.getvalue()))
        except Exception as e:
            errores.append(f"No se pudo abrir el link de Drive (¿está compartido?): {url} ({e.__class__.__name__})")
    return out, errores


# --------------------------------------------------------------------------- #
# Borradores
# --------------------------------------------------------------------------- #

def crear_borrador(gmail, msg, r: p.Resultado, cuerpo_bot: str, asunto_resp: str, modo: str, lecturas: list[str]):
    m = EmailMessage()
    if modo == "real":
        m["To"] = cabecera(msg, "Reply-To") or cabecera(msg, "From")
        if cabecera(msg, "Cc"):
            m["Cc"] = cabecera(msg, "Cc")
        m["Subject"] = asunto_resp
        mid = cabecera(msg, "Message-ID")
        if mid:
            m["In-Reply-To"] = mid
            m["References"] = (cabecera(msg, "References") + " " + mid).strip()
        cuerpo = cuerpo_bot
        if r.flag:  # la nota interna va en el asunto para que se vea y se borre antes de enviar
            m.replace_header("Subject", "[REVISAR] " + asunto_resp)
    else:
        m["Subject"] = "[ENSAYO BOT] " + asunto_resp + f" ({parseaddr(cabecera(msg, 'From'))[1]})"
        cab = ["=== ENSAYO BOT - NO ENVIAR ===",
               f"Estado: {r.estado}" + ("  | FLAG: revisar una persona" if r.flag else ""),
               f"Tipo: {r.tipo} | Total: Gs. {p.gs(r.total)}"]
        cab += [f"- {x}" for x in r.motivos]
        cab += [f"- Faltan: {x}" for x in r.faltantes]
        cab += [f"- Archivo leído: {x}" for x in lecturas]
        cuerpo = "\n".join(cab) + "\n" + "=" * 30 + "\n" + cuerpo_bot
    m.set_content(cuerpo)
    raw = base64.urlsafe_b64encode(m.as_bytes()).decode()
    body = {"message": {"raw": raw}}
    if modo == "real":
        body["message"]["threadId"] = msg["threadId"]
    return gmail.users().drafts().create(userId="me", body=body).execute()


def id_etiqueta(gmail) -> str:
    for et in gmail.users().labels().list(userId="me").execute().get("labels", []):
        if et["name"] == ETIQUETA:
            return et["id"]
    return gmail.users().labels().create(userId="me", body={"name": ETIQUETA}).execute()["id"]


# --------------------------------------------------------------------------- #
# Ciclo principal
# --------------------------------------------------------------------------- #

def procesar_mensaje(gmail, drive, msg, modo: str) -> dict:
    asunto = cabecera(msg, "Subject") or "(sin asunto)"
    cuerpo = cuerpo_texto(msg)
    archivos = adjuntos(gmail, msg)
    de_drive, errores = archivos_drive(drive, p.limpiar_correo(cuerpo))
    archivos += de_drive

    textos, advertencias, lecturas = {}, list(errores), []
    for nombre, datos in archivos:
        if re.fullmatch(r"image\d*\.(png|jpe?g|gif)", nombre.lower()) and len(datos) < 30_000:
            continue  # firmas y logos pegados en el correo
        if re.search(r"pago|comprobante|transf|recibo|boleta", p.normalizar(nombre)):
            textos[nombre] = ""  # comprobante: no hace falta leerlo
            continue
        lec = lector.leer(nombre, datos)
        lecturas.append(f"{nombre} -> {lec.metodo}")
        if lec.texto:
            textos[nombre] = lec.texto
        if lec.advertencia:
            advertencias.append(lec.advertencia)

    r = p.procesar_correo(asunto, cuerpo, [n for n, _ in archivos], textos, advertencias)
    asunto_limpio = re.sub(r"^(re|rv|fw|fwd)\s*:\s*", "", asunto, flags=re.I)
    texto_resp = p.borrador(r, asunto_limpio)
    linea_asunto, _, resto = texto_resp.partition("\n")
    borr = crear_borrador(gmail, msg, r, resto.strip(), linea_asunto.replace("Asunto: ", ""), modo, lecturas)
    p.registrar(r, asunto)
    return {"asunto": asunto, "de": cabecera(msg, "From"), "estado": r.estado, "flag": r.flag,
            "total": p.gs(r.total), "preset": r.preset, "lecturas": lecturas, "borrador": borr.get("id")}


def una_pasada(gmail, drive, consulta: str, modo: str, maximo: int):
    etiqueta = id_etiqueta(gmail)
    res = gmail.users().messages().list(userId="me", q=consulta, maxResults=maximo).execute()
    mensajes = res.get("messages", [])
    print(f"[{datetime.now():%H:%M}] {len(mensajes)} correo(s) nuevo(s)")
    for ref in mensajes:
        msg = gmail.users().messages().get(userId="me", id=ref["id"], format="full").execute()
        try:
            info = procesar_mensaje(gmail, drive, msg, modo)
            print(json.dumps(info, ensure_ascii=False))
        except Exception as e:
            print(f"  ERROR con '{cabecera(msg, 'Subject')}': {e}")
            continue  # sin etiqueta: se reintenta en la próxima pasada
        # Marca como procesado (no lo marca como leído: el equipo lo sigue viendo)
        gmail.users().messages().modify(userId="me", id=ref["id"], body={"addLabelIds": [etiqueta]}).execute()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--modo", choices=["ensayo", "real"], default="ensayo")
    ap.add_argument("--consulta", default=CONSULTA, help="búsqueda de Gmail")
    ap.add_argument("--max", type=int, default=20, help="máximo de correos por pasada")
    ap.add_argument("--cada", type=float, help="repetir cada N minutos")
    a = ap.parse_args()
    gmail, drive = conectar()
    while True:
        una_pasada(gmail, drive, a.consulta, a.modo, a.max)
        if not a.cada:
            break
        time.sleep(a.cada * 60)


if __name__ == "__main__":
    main()
