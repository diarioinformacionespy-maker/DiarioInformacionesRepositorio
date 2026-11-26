import {
  normalizeMessageContent,
  isJidGroup,
  isJidBroadcast,
  isJidStatusBroadcast,
  isJidNewsletter,
} from '@whiskeysockets/baileys'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import * as R from './respuestas.js'

const HORAS_PAUSA = Number(process.env.HORAS_PAUSA || 12)
const ADMIN = (process.env.ADMIN_NUMBER || '').replace(/\D/g, '')
const TZ = process.env.TZ_ATENCION || 'America/Asuncion'
const HORA_INICIO = Number(process.env.HORA_INICIO || 7)
const HORA_FIN = Number(process.env.HORA_FIN || 14)
const DATA = './data/estado.json'

// ---------- estado persistente (pausas por chat, último saludo) ----------
mkdirSync('./data', { recursive: true })
let estado = { pausas: {}, saludados: {} }
try { estado = { ...estado, ...JSON.parse(readFileSync(DATA, 'utf8')) } } catch {}
const guardar = () => writeFileSync(DATA, JSON.stringify(estado, null, 2))

// IDs de mensajes que mandó el bot (para distinguirlos de los que manda un humano desde el celular)
const enviadosPorBot = new Set()
export function registrarEnviado(id) {
  enviadosPorBot.add(id)
  if (enviadosPorBot.size > 5000) enviadosPorBot.delete(enviadosPorBot.values().next().value)
}

const pausar = (jid, horas = HORAS_PAUSA) => { estado.pausas[jid] = Date.now() + horas * 3600_000; guardar() }
const reanudar = (jid) => { delete estado.pausas[jid]; guardar() }
const enPausa = (jid) => (estado.pausas[jid] || 0) > Date.now()

function enHorario() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', hourCycle: 'h23' })
      .formatToParts(new Date()).map((x) => [x.type, x.value]),
  )
  const hora = Number(p.hour)
  return !['Sat', 'Sun'].includes(p.weekday) && hora >= HORA_INICIO && hora < HORA_FIN
}

function extraerTexto(message) {
  const m = normalizeMessageContent(message)
  if (!m) return { texto: '', adjunto: false }
  const texto =
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    ''
  const adjunto = Boolean(m.imageMessage || m.documentMessage || m.videoMessage || m.audioMessage)
  return { texto: texto.trim(), adjunto }
}

async function responder(sock, jid, texto, citado) {
  await sock.sendPresenceUpdate('composing', jid)
  await new Promise((r) => setTimeout(r, process.env.SIN_DEMORA ? 0 : 800 + Math.random() * 1200)) // pausa "humana"
  await sock.sendPresenceUpdate('paused', jid)
  await sock.sendMessage(jid, { text: texto }, citado ? { quoted: citado } : undefined)
}

async function avisarAdmin(sock, texto) {
  if (!ADMIN) return
  await sock.sendMessage(`${ADMIN}@s.whatsapp.net`, { text: texto }).catch(() => {})
}

export async function manejarMensaje(sock, msg) {
  const jid = msg.key.remoteJid
  if (!jid || !msg.message) return
  if (isJidGroup(jid) || isJidBroadcast(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid)) return

  const { texto, adjunto } = extraerTexto(msg.message)
  const t = texto.toLowerCase()

  // Mensajes que salen de NUESTRO número
  if (msg.key.fromMe) {
    if (enviadosPorBot.has(msg.key.id)) return // los mandó el bot
    // Lo escribió una persona desde el celular/WhatsApp Web:
    if (t === '#bot') { reanudar(jid); return } // reactivar el bot en este chat
    if (t === '#pausa') { pausar(jid, 24 * 365); return } // pausar indefinidamente
    pausar(jid) // un humano tomó la conversación → el bot se calla HORAS_PAUSA horas
    return
  }

  if (enPausa(jid)) return

  const nombre = msg.pushName || 'Cliente'

  // Fuera de horario: avisamos una sola vez cada 12 h por chat
  if (!enHorario()) {
    const ultimo = estado.saludados[`fh:${jid}`] || 0
    if (Date.now() - ultimo > 12 * 3600_000) {
      estado.saludados[`fh:${jid}`] = Date.now(); guardar()
      await responder(sock, jid, R.FUERA_DE_HORARIO)
    }
    return
  }

  // Archivos (comprobantes, textos de avisos) → pasa a una persona
  if (adjunto) {
    await responder(sock, jid, R.RECIBIDO, msg)
    await avisarAdmin(sock, `📎 ${nombre} (${jid.split('@')[0]}) envió un archivo.`)
    pausar(jid)
    return
  }

  if (['menu', 'menú', 'hola', 'buenas', 'buen dia', 'buen día', 'inicio', '0'].some((k) => t === k || t.startsWith(k + ' '))) {
    estado.saludados[jid] = Date.now(); guardar()
    return responder(sock, jid, R.MENU)
  }

  if (R.OPCIONES[t]) return responder(sock, jid, R.OPCIONES[t])

  if (t === R.OPCION_HUMANO || /\b(persona|humano|asesor|operador)\b/.test(t)) {
    await responder(sock, jid, R.HUMANO)
    await avisarAdmin(sock, `🙋 ${nombre} (${jid.split('@')[0]}) pidió hablar con una persona.\nÚltimo mensaje: "${texto}"`)
    pausar(jid)
    return
  }

  // Primer mensaje del día de este cliente → mostrar menú
  const ultimoSaludo = estado.saludados[jid] || 0
  if (Date.now() - ultimoSaludo > 12 * 3600_000) {
    estado.saludados[jid] = Date.now(); guardar()
    return responder(sock, jid, R.MENU)
  }

  // Texto libre largo (probablemente el texto del aviso) → persona
  if (texto.length > 120) {
    await responder(sock, jid, R.RECIBIDO, msg)
    await avisarAdmin(sock, `📝 ${nombre} (${jid.split('@')[0]}) envió un texto largo.`)
    pausar(jid)
    return
  }

  return responder(sock, jid, R.NO_ENTENDI)
}
