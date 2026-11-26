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
