// Estado del Pool de espacios, para responder "¿puede salir mañana?".
// Claude regenera en cada pasada (cada 30 min en horario hábil) el archivo POOL_ACTUAL.json en la carpeta
// del Drive "Pool de espacios". El bot lo baja cada 5 minutos, calcula el estado de los próximos 30 días
// (abierto / casi / lleno / cerrado, con las mismas reglas que la página del Pool) y guarda SOLO eso en
// data/pool.json (sin datos de clientes). Si no se puede leer, data/pool.json envejece y el bot deja de
// decir si hay lugar (fechas.js).
import { writeFileSync } from 'node:fs'
import { accessToken, gmailConfigurado } from './gmail.js'

const CARPETA = process.env.POOL_CARPETA_ID || '1bHbb1GXcfaVdWf8A862kWX0fJnyj6U08'
const NOMBRE = 'POOL_ACTUAL.json'
const CADA_MS = 5 * 60_000
let iniciado = false, ultimoError = '', ultimoId = '', ultimoMod = ''

async function drive(ruta) {
  const res = await fetch('https://www.googleapis.com/drive/v3/' + ruta, {
    headers: { Authorization: 'Bearer ' + (await accessToken()) },
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`Drive ${res.status}: ${(await res.text()).slice(0, 150)}`)
  return res
}

const iso = (d) => d.toISOString().slice(0, 10)
const espacio = (a) => (a.espacio != null ? +a.espacio : /^marca/.test(a.tipo || '') ? (a.logo === false ? 1 / 3 : 0.5) : 1)

// Mismo criterio que la página del Pool: domingo cerrado salvo que el diseñador lo abra;
// casi lleno desde el 75 % de la capacidad de referencia; lleno desde el 100 %.
export function estados(pool) {
  const cap = pool.config?.capacidad_ref || 40
  const avisos = Object.values(pool.avisos || {}).filter((a) => a.estado !== 'liberada')
  const hoy = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Asuncion' }))
  const out = {}
  for (let i = 0; i <= 30; i++) {
    const d = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i))
    const f = iso(d), dia = pool.dias?.[f] || {}
    const cerrado = dia.cerrado !== undefined ? !!dia.cerrado : d.getUTCDay() === 0
    if (cerrado) { out[f] = 'cerrado'; continue }
    const c = avisos.filter((a) => (a.fechas || []).includes(f)).reduce((t, a) => t + espacio(a), 0)
    out[f] = c >= cap ? 'lleno' : c >= cap * 0.75 ? 'casi' : 'abierto'
  }
  return out
}

export async function actualizarPool() {
  const q = encodeURIComponent(`'${CARPETA}' in parents and name='${NOMBRE}' and trashed=false`)
  const { files } = await (await drive(`files?q=${q}&orderBy=modifiedTime desc&pageSize=1&fields=files(id,modifiedTime)`)).json()
  if (!files?.length) throw new Error(`no está ${NOMBRE} en la carpeta del Pool`)
  const f = files[0]
  if (f.id === ultimoId && f.modifiedTime === ultimoMod) return null // sin cambios
  const pool = JSON.parse((await (await drive(`files/${f.id}?alt=media`)).text()).replace(/^﻿/, ''))
  const p = { actualizado: pool.actualizado || f.modifiedTime, dias: estados(pool) }
  writeFileSync('./data/pool.json', JSON.stringify(p))
  ultimoId = f.id; ultimoMod = f.modifiedTime
  return p
}

export function iniciarPool() {
  if (iniciado || !gmailConfigurado()) return
  iniciado = true
  const ciclo = () => actualizarPool()
    .then((p) => { if (p) console.log(`📅 Pool de espacios leído (actualizado ${p.actualizado})`); ultimoError = '' })
    .catch((e) => { if (e.message !== ultimoError) console.error('📅 Pool de espacios:', e.message); ultimoError = e.message })
  ciclo()
  setInterval(ciclo, CADA_MS)
}
