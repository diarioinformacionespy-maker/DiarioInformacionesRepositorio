// Copia local del estado del Pool de espacios, para responder "¿puede salir mañana?".
// Claude, en cada pasada de correo, escribe en la DESCRIPCIÓN del archivo pool_estado_bot.json del Drive:
//   { "actualizado": "<ISO>", "dias": { "aaaa-mm-dd": "abierto" | "casi" | "lleno" | "cerrado" } }
// (solo días y estado, sin datos de clientes). El bot la baja cada 5 minutos a data/pool.json.
// Si no se puede leer, data/pool.json envejece y el bot deja de decir si hay lugar (fechas.js).
import { writeFileSync } from 'node:fs'
import { accessToken, gmailConfigurado } from './gmail.js'

const CADA_MS = 5 * 60_000
let iniciado = false, ultimoError = ''

async function drive(ruta) {
  const res = await fetch('https://www.googleapis.com/drive/v3/' + ruta, {
    headers: { Authorization: 'Bearer ' + (await accessToken()) },
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`Drive ${res.status}: ${(await res.text()).slice(0, 150)}`)
  return res
}

export async function actualizarPool() {
  const id = process.env.POOL_FILE_ID || '1QCXynffaa3kT6sQ74TuHYoHPjPYH1f4c'
  const { description } = await (await drive(`files/${id}?fields=description`)).json()
  if (!description) throw new Error('el archivo del Pool no tiene datos')
  const p = JSON.parse(description)
  if (!p.actualizado || typeof p.dias !== 'object') throw new Error('formato inválido')
  writeFileSync('./data/pool.json', JSON.stringify(p))
  return p
}

export function iniciarPool() {
  if (iniciado || !gmailConfigurado()) return
  iniciado = true
  const ciclo = () => actualizarPool()
    .then((p) => { if (ultimoError) console.log('📅 Pool de espacios: leído de nuevo'); ultimoError = ''; return p })
    .catch((e) => { if (e.message !== ultimoError) console.error('📅 Pool de espacios:', e.message); ultimoError = e.message })
  ciclo().then((p) => p && console.log(`📅 Pool de espacios leído (${Object.keys(p.dias).length} días)`))
  setInterval(ciclo, CADA_MS)
}
