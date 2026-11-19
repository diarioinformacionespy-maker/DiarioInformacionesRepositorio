"""Lee el texto de cualquier archivo que mande un cliente.

- Word .docx            -> python-docx (texto y tablas)
- Word .doc, .odt, .rtf -> LibreOffice lo convierte a .docx (instalar LibreOffice)
- PDF con texto         -> pdfplumber
- PDF escaneado/diseño  -> Claude (lee el PDF como una persona)
- Imagen (foto, captura)-> Claude
- Texto plano           -> directo

Devuelve un Lectura(texto, metodo, advertencia). Si no se puede leer, texto = "".
"""
from __future__ import annotations

import base64
import io
import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

MODELO = os.environ.get("MODELO_CLAUDE", "claude-opus-5-5")
MIN_CARACTERES_PDF = 80  # menos texto que esto por pagina = probablemente escaneado

PROMPT_TRANSCRIBIR = (
    "Este archivo es un aviso que un cliente quiere publicar en un diario de Paraguay "
    "(convocatoria a asamblea, edicto, marca, constitución de sociedad, etc.). "
    "Transcribí el texto del aviso exactamente como aparece, respetando el orden, los números "
    "del orden del día, fechas, horas y nombres. No resumas, no corrijas y no agregues nada. "
    "Si una parte no se puede leer, escribí [ilegible]. Si hay un logo o imagen de marca, "
    "escribí [LOGO: descripción breve] en su lugar. Devolvé solo la transcripción."
)

TIPOS_IMAGEN = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
                ".gif": "image/gif", ".webp": "image/webp"}


@dataclass
class Lectura:
    texto: str
    metodo: str
    advertencia: str | None = None


# --------------------------------------------------------------------------- #

def leer(nombre: str, datos: bytes) -> Lectura:
    ext = Path(nombre).suffix.lower()
    try:
        if ext == ".docx":
            return Lectura(_docx(datos), "Word (.docx)")
        if ext in (".doc", ".odt", ".rtf"):
            return _via_libreoffice(nombre, datos)
        if ext == ".pdf":
            return _pdf(datos)
        if ext in TIPOS_IMAGEN:
            return _con_claude(datos, TIPOS_IMAGEN[ext], "imagen")
        if ext in (".heic", ".heif", ".tif", ".tiff", ".bmp"):
            return _imagen_convertida(datos)
        if ext in (".txt", ".csv"):
            return Lectura(datos.decode("utf-8", errors="replace"), "texto")
    except Exception as e:  # nunca romper el bot por un archivo
        return Lectura("", "error", f"No se pudo leer {nombre}: {e}")
    return Lectura("", "no soportado", f"Formato {ext or '(sin extensión)'} no soportado: {nombre}")


# --------------------------------------------------------------------------- #

def _docx(datos: bytes) -> str:
    import docx  # python-docx
    d = docx.Document(io.BytesIO(datos))
    partes = [p.text for p in d.paragraphs]
    for tabla in d.tables:
        for fila in tabla.rows:
            partes.append(" | ".join(c.text.strip() for c in fila.cells))
    return "\n".join(partes).strip()


def _soffice() -> str | None:
    for cand in ("soffice", "libreoffice",
                 r"C:\Program Files\LibreOffice\program\soffice.exe",
                 r"C:\Program Files (x86)\LibreOffice\program\soffice.exe"):
        if shutil.which(cand) or Path(cand).exists():
            return shutil.which(cand) or cand
    return None


def _via_libreoffice(nombre: str, datos: bytes) -> Lectura:
    soffice = _soffice()
    if not soffice:
        return Lectura("", "falta LibreOffice", f"Para leer {nombre} hay que instalar LibreOffice.")
    with tempfile.TemporaryDirectory() as tmp:
        origen = Path(tmp) / ("entrada" + Path(nombre).suffix.lower())
        origen.write_bytes(datos)
        subprocess.run([soffice, "--headless", "--convert-to", "docx", "--outdir", tmp, str(origen)],
                       check=True, capture_output=True, timeout=120)
        return Lectura(_docx((Path(tmp) / "entrada.docx").read_bytes()), f"Word antiguo ({Path(nombre).suffix})")


def _pdf(datos: bytes) -> Lectura:
    import pdfplumber
    with pdfplumber.open(io.BytesIO(datos)) as pdf:
        paginas = [p.extract_text() or "" for p in pdf.pages]
    texto = "\n".join(paginas).strip()
    if len(texto) >= MIN_CARACTERES_PDF * max(1, len(paginas)) * 0.5:
        return Lectura(texto, "PDF con texto")
    # escaneado o con diseno: que lo lea Claude
    return _con_claude(datos, "application/pdf", "PDF escaneado o con diseño")


def _imagen_convertida(datos: bytes) -> Lectura:
    from PIL import Image
    try:
        import pillow_heif  # para fotos de iPhone (.heic)
        pillow_heif.register_heif_opener()
    except ImportError:
        pass
    img = Image.open(io.BytesIO(datos)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=90)
    return _con_claude(buf.getvalue(), "image/jpeg", "imagen convertida")


def _con_claude(datos: bytes, media_type: str, origen: str) -> Lectura:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return Lectura("", "sin IA", f"El aviso viene como {origen}: falta configurar ANTHROPIC_API_KEY para leerlo.")
    import anthropic

    b64 = base64.standard_b64encode(datos).decode()
    bloque = ({"type": "document", "source": {"type": "base64", "media_type": media_type, "data": b64}}
              if media_type == "application/pdf" else
              {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}})
    client = anthropic.Anthropic()
    resp = client.beta.messages.create(
        model=MODELO,
        max_tokens=16000,
        output_config={"effort": "low"},  # transcribir es una tarea simple
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",  # si el modelo declina, el API reintenta con otro modelo
        messages=[{"role": "user", "content": [bloque, {"type": "text", "text": PROMPT_TRANSCRIBIR}]}],
    )
    if resp.stop_reason == "refusal":
        return Lectura("", "IA declinó", f"La IA no transcribió el {origen}: revisar a mano.")
    texto = "".join(b.text for b in resp.content if b.type == "text").strip()
    aviso = f"Texto leído por IA desde {origen}: verificar contra el original antes de confirmar."
    if resp.stop_reason == "max_tokens":
        aviso += " (La transcripción quedó cortada.)"
    return Lectura(texto, f"IA ({origen})", aviso)


if __name__ == "__main__":
    import sys
    for ruta in sys.argv[1:]:
        r = leer(ruta, Path(ruta).read_bytes())
        print(f"===== {ruta}  [{r.metodo}]" + (f"  ⚠ {r.advertencia}" if r.advertencia else ""))
        print(r.texto)
