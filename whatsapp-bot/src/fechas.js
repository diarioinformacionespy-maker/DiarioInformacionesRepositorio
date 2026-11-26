// Fecha tentativa de inicio, con las mismas reglas del Pool de Espacios:
// - se arranca mañana; si ya pasó la hora de cierre (14:00), pasado mañana
// - nunca se inicia en domingo; en temporada baja tampoco en sábado
// No ve los días que el diseñador cerró a mano: por eso la fecha es siempre TENTATIVA.

const TZ = process.env.TZ_ATENCION || 'America/Asuncion'
const HORA_CIERRE = Number(process.env.HORA_CIERRE || 14)
const TEMPORADA_BAJA = (process.env.TEMPORADA_BAJA ?? '1') !== '0'
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
  const inicio = proximoInicio()
  const tentativa = 'Esta fecha es tentativa. Únicamente podremos confirmarle una fecha una vez que nos envíe su comprobante de pago.'

  if (asamblea <= hoy) {
    return `Disculpe, el ${texto(asamblea)} ya pasó o es hoy. ¿Me confirma la fecha de la asamblea?`
  }

  const minima = sumar(inicio, MIN_DIAS)
  if (asamblea < minima) {
    return [
      `Nosotros tenemos espacio en el diario a partir del ${texto(inicio)}.`,
      `Con esa fecha, la asamblea tendría que ser el ${texto(minima)} o después, porque la ley exige al menos ${MIN_DIAS} días desde la primera publicación. Para el ${texto(asamblea)} no llegaríamos a cumplir ese plazo.`,
      `Le sugerimos consultar la posibilidad de reprogramar la asamblea para el ${texto(minima)} o una fecha posterior. Con gusto verificamos de nuevo con la fecha nueva.`,
    ].join('\n\n')
  }

  // Si la asamblea está muy lejos, se empieza más tarde para no superar los 30 días de anticipación
  let desde = inicio
  if (diasEntre(inicio, asamblea) > MAX_DIAS) {
    desde = sumar(asamblea, -MAX_DIAS)
    while (!puedeIniciar(desde)) desde = sumar(desde, 1)
  }
  const hasta = sumar(desde, DIAS_PUB - 1)
  const lejos = desde > inicio
  return [
    lejos
      ? `Su asamblea del ${texto(asamblea)} está a más de ${MAX_DIAS} días, así que conviene empezar a publicar el ${texto(desde)} (del ${corta(desde)} al ${corta(hasta)}), para no pasarnos de la anticipación máxima.`
      : `Perfecto: tenemos espacio a partir del ${texto(desde)}. Si publicamos del ${corta(desde)} al ${corta(hasta)} (5 días), su asamblea del ${texto(asamblea)} cumple los ${MIN_DIAS} días de anticipación que exige la ley.`,
    tentativa,
  ].join('\n\n')
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
