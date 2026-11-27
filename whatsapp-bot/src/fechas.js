// Fecha tentativa de inicio, con las mismas reglas del Pool de Espacios:
// - se arranca mañana; si ya pasó la hora de cierre (14:00), pasado mañana
// - nunca se inicia en domingo (los sábados sí se publica; TEMPORADA_BAJA=1 los excluye)
// No ve los días que el diseñador cerró a mano: por eso la fecha es siempre TENTATIVA.

const TZ = process.env.TZ_ATENCION || 'America/Asuncion'
const HORA_CIERRE = Number(process.env.HORA_CIERRE || 14)
const TEMPORADA_BAJA = (process.env.TEMPORADA_BAJA ?? '0') !== '0'
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

// Fecha y hora actuales en Asunción, como fecha "local" sin zona
export function ahora() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).map((x) => [x.type, x.value]),
  )
  return { fecha: new Date(Date.UTC(+p.year, +p.month - 1, +p.day)), hora: +p.hour, minuto: +p.minute }
}

const sumar = (d, n) => new Date(d.getTime() + n * 86400000)
export const texto = (d) => `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`
const puedeIniciar = (d) => d.getUTCDay() !== 0 && !(TEMPORADA_BAJA && d.getUTCDay() === 6)

// Primer día de inicio que el Pool permite: los primeros 3 días de la publicación no pueden estar cerrados
// (mismo criterio que la página del Pool, "dias_control"). Sin datos del Pool, el inicio por reglas.
export function primerLibre(diasPub = DIAS_PUB) {
  const pool = leerPool()
  let d = proximoInicio()
  if (!pool) return d
  const ctl = Math.min(diasPub, 3)
  for (let i = 0; i < 60; i++, d = sumar(d, 1)) {
    if (!puedeIniciar(d)) continue
    let ok = true
    for (let k = 0; k < ctl; k++) if (pool[sumar(d, k).toISOString().slice(0, 10)] === 'cerrado') { ok = false; break }
    if (ok) return d
  }
  return proximoInicio()
}

export function proximoInicio() {
  const { fecha, hora } = ahora()
  let d = sumar(fecha, hora >= HORA_CIERRE ? 2 : 1)
  while (!puedeIniciar(d)) d = sumar(d, 1)
  return d
}

// ---------- verificación de la fecha de asamblea (S.A., criterio del Pool: 10 días desde la PRIMERA publicación) ----------
const MIN_DIAS = Number(process.env.ASAMBLEA_MIN_DIAS || 10)
const MAX_DIAS = Number(process.env.ASAMBLEA_MAX_DIAS || 30)
const DIAS_PUB = 5
const corta = (d) => `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`
const diasEntre = (a, b) => Math.round((b - a) / 86400000)

// Devuelve el texto para el cliente (siempre dice que la fecha es tentativa).
export function verificarAsamblea(iso) {
  const m = String(iso).match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const asamblea = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  const { fecha: hoy } = ahora()
  const inicio = primerLibre()
  const CORREO = process.env.CORREO_AVISOS || 'diarioinformacionespy@gmail.com'
  const pregunta = `¿Ya tiene el texto para enviarlo a ${CORREO}?`

  if (asamblea <= hoy) return `Esa fecha ya pasó. ¿Me confirma para qué fecha es su asamblea?`

  const minima = sumar(inicio, MIN_DIAS)
  if (asamblea < minima) {
    return `Contamos con disponibilidad a partir del ${texto(inicio)}, así que su asamblea tendría que ser el ${texto(minima)} o después, para cumplir los ${MIN_DIAS} días de anticipación (Art. 1082 del Código Civil). Podrían pasarla a esa fecha?`
  }

  // Si la asamblea está muy lejos, se empieza más tarde para no superar los 30 días de anticipación
  let desde = inicio
  if (diasEntre(inicio, asamblea) > MAX_DIAS) {
    desde = sumar(asamblea, -MAX_DIAS)
    while (!puedeIniciar(desde)) desde = sumar(desde, 1)
  }
  const hasta = sumar(desde, DIAS_PUB - 1)
  if (desde > inicio) {
    return `Para su asamblea del ${texto(asamblea)}, la fecha tentativa sería del ${texto(desde)} al ${texto(hasta)} (${DIAS_PUB} días), así no superamos los ${MAX_DIAS} días de anticipación. Únicamente podremos confirmarle una fecha una vez que nos envíe su comprobante de pago. ${pregunta}`
  }
  return `Perfecto. Fecha tentativa: del ${texto(desde)} al ${texto(hasta)} (${DIAS_PUB} días); su asamblea del ${texto(asamblea)} cumple los ${MIN_DIAS} días de anticipación (Art. 1082 del Código Civil). Únicamente podremos confirmarle una fecha una vez que nos envíe su comprobante de pago. ${pregunta}`
}

// Contexto de fechas para la IA
export function contextoFechas() {
  const { fecha, hora, minuto } = ahora()
  const inicio = proximoInicio()
  const fin5 = sumar(inicio, 4)
  const asambleaMin = sumar(inicio, 10)
  return [
    `Hoy es ${texto(fecha)} de ${fecha.getUTCFullYear()}, son las ${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')} (hora de Asunción).`,
    `Próxima fecha TENTATIVA de inicio de publicaciones: ${texto(inicio)}.`,
    `Una asamblea de 5 días que empiece ese día se publica del ${texto(inicio)} al ${texto(fin5)}, y la asamblea tiene que ser el ${texto(asambleaMin)} o después (10 días desde la primera publicación).`,
  ].join('\n')
}

// ---------- día que pide el cliente, contra el Pool de espacios ----------
// El estado del Pool lo deja data/pool.json: { "actualizado": ISO, "dias": { "aaaa-mm-dd": "abierto"|"casi"|"lleno"|"cerrado" } }
// Si el archivo no está o tiene más de POOL_MAX_MIN minutos, el bot NO dice si hay lugar: lo deja al equipo.
import { readFileSync } from 'node:fs'
const POOL_MAX_MIN = Number(process.env.POOL_MAX_MIN || 180) // la copia del Pool se regenera cada 30 min en horario hábil
function leerPool() {
  try {
    const p = JSON.parse(readFileSync('./data/pool.json', 'utf8'))
    if (Date.now() - new Date(p.actualizado).getTime() > POOL_MAX_MIN * 60_000) return null
    return p.dias || null
  } catch { return null }
}
const isoDe = (d) => d.toISOString().slice(0, 10)

export function verificarDia(iso) {
  const m = String(iso).match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const pedido = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  const CORREO = process.env.CORREO_AVISOS || 'diarioinformacionespy@gmail.com'
  const cierre = `La fecha se asegura únicamente con el pago, por orden de llegada. Para cotizarlo, envíe el texto de su aviso a nuestro correo oficial, ${CORREO}, con el nombre de la empresa, su RUC y un teléfono de contacto.`
  const inicio = proximoInicio()
  const pool = leerPool()
  const libre = (d) => !pool || !['cerrado'].includes(pool[isoDe(d)])
  let primero = pedido > inicio ? pedido : inicio
  for (let i = 0; i < 60 && !(puedeIniciar(primero) && libre(primero)); i++) primero = sumar(primero, 1)

  if (pedido < inicio || !puedeIniciar(pedido)) {
    const motivo = pedido.getUTCDay() === 0 ? 'Los domingos no sale el diario' : `Para el ${texto(pedido)} ya no llegamos a tomar avisos nuevos`
    return `${motivo}. Contamos con disponibilidad a partir del ${texto(primero)}. ${cierre}`
  }
  if (!pool) return `La disponibilidad del ${texto(pedido)} se la confirmamos por correo. ${cierre}`
  const est = pool[isoDe(pedido)] || 'abierto'
  if (est === 'cerrado') return `El ${texto(pedido)} ya no tenemos lugar. Contamos con disponibilidad a partir del ${texto(primero)}. ${cierre}`
  if (est === 'lleno' || est === 'casi') return `El ${texto(pedido)} ya está casi completo, así que no podemos garantizarle el lugar. ${cierre}`
  return `Por ahora contamos con disponibilidad para el ${texto(pedido)}. ${cierre}`
}
