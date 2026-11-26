// Búsqueda de ejemplares (PDF de la versión WEB del diario) en el Gmail del diario.
// Regla del SKILL.md: la ÚNICA fuente válida son los PDF enviados a Nelson Páez (nelpa90@gmail.com),
// asunto "Diarios pdf", archivos "DIARIO <Día> dd-mm-aaaa.pdf". NUNCA los de la imprenta.
// Acceso de SOLO LECTURA (gmail.readonly). Credenciales en ./google/ (fuera del repositorio).
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const DIR = process.env.GOOGLE_DIR || './google'
const DESTINO_WEB = process.env.EJEMPLARES_DESTINO || 'nelpa90@gmail.com'
const DIAS_BUSQUEDA = Number(process.env.EJEMPLARES_DIAS || 180)
export const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

function cliente() {
  const c = JSON.parse(readFileSync(join(DIR, 'credentials.json'), 'utf8'))
  return c.installed || c.web
}

let cache = { token: null, vence: 0 }
async function accessToken() {
  if (cache.token && Date.now() < cache.vence - 60_000) return cache.token
  const { client_id, client_secret } = cliente()
  const { refresh_token } = JSON.parse(readFileSync(join(DIR, 'token.json'), 'utf8'))
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id, client_secret, refresh_token, grant_type: 'refresh_token' }),
  })
  const j = await res.json()
  if (!res.ok) throw new Error('Google: no se pudo renovar el acceso (' + (j.error_description || j.error) + ')')
  cache = { token: j.access_token, vence: Date.now() + j.expires_in * 1000 }
  return cache.token
}

async function gmail(ruta) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/' + ruta, {
    headers: { Authorization: 'Bearer ' + (await accessToken()) },
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`Gmail ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

// ---------- utilidades de texto ----------
export const normalizar = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()

// "VILLA MORRA S.A." → núcleo "VILLA MORRA" (sin la forma societaria, que se imprime de muchas maneras)
const FORMAS = /\b(S ?A ?E ?C ?A|S ?A|S ?R ?L|E ?A ?S|SOCIEDAD ANONIMA|SOCIEDAD DE RESPONSABILIDAD LIMITADA|LTDA|COOP(ERATIVA)?|ASOCIACION)\b/g
export function nucleo(nombre) {
  const n = normalizar(nombre).replace(FORMAS, ' ').replace(/\s+/g, ' ').trim()
  return n || normalizar(nombre)
}

export function contiene(textoPdf, nombre) {
  const t = ' ' + normalizar(textoPdf) + ' '
  const n = nucleo(nombre)
  if (n.length < 3) return false
  return t.includes(' ' + n + ' ') // palabra completa: "MIDA" no coincide con "UNANIMIDAD"
}

const fechaDeArchivo = (f) => {
  const m = String(f).match(/(\d{1,2})[-_.](\d{1,2})[-_.](\d{4})/)
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null
}

function adjuntosPdf(payload, out = []) {
  if (!payload) return out
  if (payload.filename && /\.pdf$/i.test(payload.filename) && payload.body?.attachmentId) out.push(payload)
  for (const p of payload.parts || []) adjuntosPdf(p, out)
  return out
}

function textoPdf(buf) {
  const dir = mkdtempSync(join(tmpdir(), 'ej-'))
  try {
    const f = join(dir, 'e.pdf')
    writeFileSync(f, buf)
    return execFileSync('pdftotext', ['-q', f, '-'], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// Devuelve [{ fecha:'aaaa-mm-dd', nombre:'DIARIO ... .pdf', pdf:Buffer }] de la publicación más reciente.
export async function buscarEjemplares(nombre) {
  const n = nucleo(nombre)
  if (n.length < 3) return []
  const q = `in:sent to:${DESTINO_WEB} filename:pdf newer_than:${DIAS_BUSQUEDA}d "${n.toLowerCase()}"`
  const lista = await gmail('messages?maxResults=15&q=' + encodeURIComponent(q))
  const vistos = new Map()
  for (const { id } of lista.messages || []) {
    const msg = await gmail(`messages/${id}?format=full`)
    for (const parte of adjuntosPdf(msg.payload)) {
      if (!/diario/i.test(parte.filename)) continue
      const fecha = fechaDeArchivo(parte.filename)
      if (!fecha || vistos.has(fecha)) continue
      const att = await gmail(`messages/${id}/attachments/${parte.body.attachmentId}`)
      const pdf = Buffer.from(att.data, 'base64url')
      let ok = false
      try { ok = contiene(textoPdf(pdf), nombre) } catch (e) { console.error('pdftotext:', e.message) }
      if (ok) vistos.set(fecha, { fecha, nombre: parte.filename, pdf })
    }
  }
  const todas = [...vistos.values()].sort((a, b) => a.fecha.localeCompare(b.fecha))
  if (!todas.length) return []
  // Solo la última publicación: los días que están a 10 días o menos del último encontrado
  const ultima = new Date(todas.at(-1).fecha)
  return todas.filter((e) => (ultima - new Date(e.fecha)) / 86400000 <= 10).slice(-6)
}

export const gmailConfigurado = () => {
  try { readFileSync(join(DIR, 'token.json')); readFileSync(join(DIR, 'credentials.json')); return true } catch { return false }
}
