// Cierre del día para gerencia (Luzana): un resumen macro por WhatsApp, todos los días a CIERRE_HORA.
// Sale de la copia del Pool (POOL_ACTUAL.json): lo cobrado hoy por tipo de aviso, pedidos nuevos,
// pendientes de pago, pagos para verificar y cómo viene mañana. Sin detalles de clientes.
import { readFileSync, writeFileSync } from 'node:fs'
import { poolCompleto, estados } from './pool.js'
import { texto as fechaTexto } from './fechas.js'

const HORA = process.env.CIERRE_HORA || '18:30'
const DESTINOS = (process.env.CIERRE_DESTINOS || process.env.ALERTAS_DESTINOS || '').split(',').map((s) => s.replace(/\D/g, '')).filter(Boolean)
const DATA = './data/cierre.json'
let sockActual = null, iniciado = false

const hoyPY = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Asuncion' }).format(new Date()) // aaaa-mm-dd
const horaPY = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Asuncion', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date())
const gs = (n) => 'Gs. ' + Math.round(n).toLocaleString('es-PY')
const isoAFecha = (iso) => new Date(iso + 'T00:00:00Z')

// Fecha en que se cobró un aviso (aaaa-mm-dd), sacada del campo "pago" del Pool, que viene en varios formatos
export function fechaPago(a, anio) {
  const p = a.pago
  if (!p) return null
  if (typeof p === 'object' && /^\d{4}-\d{2}-\d{2}/.test(p.fecha || '')) return p.fecha.slice(0, 10)
  const s = typeof p === 'string' ? p : JSON.stringify(p)
  const comp = [...s.matchAll(/\d{6,}(20\d{2})(\d{2})(\d{2})\b/g)].map((m) => `${m[1]}-${m[2]}-${m[3]}`) // los comprobantes terminan en aaaammdd
  if (comp.length) return comp.sort().at(-1)
  const dm = [...s.matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/g)].map((m) => `${m[3] || anio}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`)
  return dm.length ? dm.sort().at(-1) : null
}

const grupo = (t = '') => {
  t = String(t).toLowerCase()
  if (/marca|licencia|autor/.test(t)) return 'Marcas'
  if (/asamblea/.test(t)) return 'Asambleas'
  if (/sociedad|constituc|estatut/.test(t)) return 'Sociedades y estatutos'
  return 'Otros avisos'
}

export function armarCierre(pool, hoy = hoyPY()) {
  const anio = hoy.slice(0, 4)
  const avisos = Object.values(pool.avisos || {}).filter((a) => a.estado !== 'liberada')
  const pagados = avisos.filter((a) => (a.estado === 'confirmada' || /pagad/.test(a.estado || '')) && !a.estudio && fechaPago(a, anio) === hoy)
  const porGrupo = {}
  for (const a of pagados) { const g = (porGrupo[grupo(a.tipo)] ||= { n: 0, gs: 0 }); g.n++; g.gs += Number(a.total) || 0 }
  const total = pagados.reduce((t, a) => t + (Number(a.total) || 0), 0)
  const nuevos = avisos.filter((a) => String(a.recibido || a.creado || '').slice(0, 10) === hoy).length
  const pend = avisos.filter((a) => ['sin_pago', 'presupuestado'].includes(a.estado))
  const pendGs = pend.reduce((t, a) => t + (Number(a.total) || 0), 0)
  const hace7 = new Date(Date.now() - 7 * 86400_000).toISOString()
  const verificar = avisos.filter((a) => a.estado === 'pago_informado').length +
    Object.values(pool.dias ? pool.pagos_sin_asignar || {} : {}).filter((p) => !p.asignado && String(p.fecha || '') >= hace7.slice(0, 10)).length
  const manana = new Date(isoAFecha(hoy).getTime() + 86400_000).toISOString().slice(0, 10)
  const est = estados(pool)[manana]
  const salenManana = avisos.filter((a) => (a.fechas || []).includes(manana)).length
  const ESTADO = { cerrado: '🔒 edición cerrada', lleno: '🔴 lleno', casi: '🟠 casi lleno', abierto: '🟢 abierto' }
  const copia = pool.actualizado ? new Date(pool.actualizado).toLocaleTimeString('es-PY', { timeZone: 'America/Asuncion', hour: '2-digit', minute: '2-digit' }) : '?'

  const L = [`📊 *CIERRE DEL DÍA* · ${fechaTexto(isoAFecha(hoy))}`, '', `💰 *Cobrado hoy: ${gs(total)}* (${pagados.length} ${pagados.length === 1 ? 'aviso' : 'avisos'})`]
  for (const g of ['Asambleas', 'Marcas', 'Sociedades y estatutos', 'Otros avisos']) if (porGrupo[g]) L.push(`   · ${g}: ${porGrupo[g].n} — ${gs(porGrupo[g].gs)}`)
  L.push('', `📨 Pedidos nuevos hoy: ${nuevos}`, `⏳ Presupuestados sin pagar: ${pend.length}${pendGs ? ' — ' + gs(pendGs) : ''}`, `💳 Pagos para verificar: ${verificar}`)
  L.push(`📅 Mañana (${fechaTexto(isoAFecha(manana))}): ${ESTADO[est] || '—'} · salen ${salenManana} avisos`)
  L.push('', `Según el Pool (copia de las ${copia}). Aviso automático.`)
  return L.join('\n')
}

export function iniciarCierre(sock) {
  sockActual = sock
  if (iniciado) return
  iniciado = true
  if (!DESTINOS.length) return
  setInterval(async () => {
    try {
      const hoy = hoyPY()
      if (horaPY() < HORA) return
      let enviado = ''
      try { enviado = JSON.parse(readFileSync(DATA, 'utf8')).dia } catch {}
      if (enviado === hoy) return
      const pool = poolCompleto()
      if (!pool || !sockActual) return // todavía no se leyó el Pool: se reintenta en el próximo minuto
      writeFileSync(DATA, JSON.stringify({ dia: hoy }))
      const texto = armarCierre(pool, hoy)
      for (const n of DESTINOS) await sockActual.sendMessage(`${n}@s.whatsapp.net`, { text: texto })
      console.log(`📊 cierre del día enviado a ${DESTINOS.join(', ')}`)
    } catch (e) { console.error('📊 Cierre:', e.message) }
  }, 60_000)
}
