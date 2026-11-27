// Alertas por WhatsApp para el equipo, escritas por Claude en las pasadas de correo (la nube).
// Cómo llegan: Claude crea un archivo de texto en la carpeta del Drive "ALERTAS WHATSAPP (bot)".
//   - Nombre: alerta_<lo que sea>.txt  (un archivo por alerta)
//   - Primera línea opcional: "PARA: 595981607760, 5959..."  (si falta, va a ALERTAS_DESTINOS)
//   - El resto: el texto de la alerta, tal cual se manda.
// El bot revisa la carpeta cada minuto, manda cada alerta UNA sola vez y solo a números de
// ALERTAS_DESTINOS (.env). Guarda lo enviado en data/alertas.json. Solo lee el Drive (no borra nada).
import { readFileSync, writeFileSync } from 'node:fs'
import { accessToken, gmailConfigurado } from './gmail.js'

const CARPETA = process.env.ALERTAS_CARPETA_ID || '1d0Mxy3LS9qm2OUYtw9QjSufNC_EOEZFk'
const DESTINOS = (process.env.ALERTAS_DESTINOS || '').split(',').map((s) => s.replace(/\D/g, '')).filter(Boolean)
const DATA = './data/alertas.json'
const MAX_HORAS = 24 // no se mandan alertas más viejas que esto
let sockActual = null, iniciado = false, ultimoError = ''
let enviadas = {}
try { enviadas = JSON.parse(readFileSync(DATA, 'utf8')) } catch {}

export const esEquipo = (tel) => !!tel && DESTINOS.includes(String(tel).replace(/\D/g, ''))

async function drive(ruta) {
  const res = await fetch('https://www.googleapis.com/drive/v3/' + ruta, {
    headers: { Authorization: 'Bearer ' + (await accessToken()) },
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`Drive ${res.status}: ${(await res.text()).slice(0, 150)}`)
  return res
}

// WhatsApp no muestra enlaces Markdown: [texto](url) → texto: url
const limpiar = (t) => t.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1: $2').replace(/\*\*(.+?)\*\*/g, '*$1*').trim()

async function revisar() {
  if (!sockActual || !DESTINOS.length) return
  const desde = new Date(Date.now() - MAX_HORAS * 3600_000).toISOString()
  const q = encodeURIComponent(`'${CARPETA}' in parents and trashed=false and name contains 'alerta' and createdTime > '${desde}'`)
  const { files = [] } = await (await drive(`files?q=${q}&orderBy=createdTime&pageSize=50&fields=files(id,name,mimeType)`)).json()
  for (const f of files) {
    if (enviadas[f.id]) continue
    const ruta = f.mimeType === 'application/vnd.google-apps.document' ? `files/${f.id}/export?mimeType=text/plain` : `files/${f.id}?alt=media`
    let texto = (await (await drive(ruta)).text()).replace(/^﻿/, '').trim()
    let para = DESTINOS
    const m = texto.match(/^PARA:\s*([^\n]+)\n/i)
    if (m) {
      para = m[1].split(/[,;\s]+/).map((s) => s.replace(/\D/g, '')).filter((n) => DESTINOS.includes(n))
      texto = texto.slice(m[0].length).trim()
    }
    if (!texto || !para.length) { enviadas[f.id] = { t: Date.now(), omitida: true }; continue }
    for (const n of para) await sockActual.sendMessage(`${n}@s.whatsapp.net`, { text: limpiar(texto) })
    enviadas[f.id] = { t: Date.now(), para }
    console.log(`🔔 alerta "${f.name}" enviada a ${para.join(', ')}`)
  }
  // se olvidan las de más de 3 días
  for (const [id, v] of Object.entries(enviadas)) if (Date.now() - v.t > 3 * 86400_000) delete enviadas[id]
  writeFileSync(DATA, JSON.stringify(enviadas))
}

export function iniciarAlertas(sock) {
  sockActual = sock // cada reconexión trae un socket nuevo
  if (iniciado || !gmailConfigurado()) return
  iniciado = true
  if (!DESTINOS.length) { console.log('🔔 Alertas: falta ALERTAS_DESTINOS en el .env (no se mandan)'); return }
  const ciclo = () => revisar()
    .then(() => { if (ultimoError) console.log('🔔 Alertas: funcionando de nuevo'); ultimoError = '' })
    .catch((e) => { if (e.message !== ultimoError) console.error('🔔 Alertas:', e.message); ultimoError = e.message })
  ciclo()
  setInterval(ciclo, 60_000)
}
