import {
  normalizeMessageContent,
  isJidGroup,
  isJidBroadcast,
  isJidStatusBroadcast,
  isJidNewsletter,
  isLidUser,
  isPnUser,
  jidNormalizedUser,
} from '@whiskeysockets/baileys'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import * as R from './respuestas.js'
import { responderIA } from './ia.js'

const HORAS_PAUSA = Number(process.env.HORAS_PAUSA || 12)
const ADMIN = (process.env.ADMIN_NUMBER || '').replace(/\D/g, '')
const ESPERA_MS = Number(process.env.ESPERA_MS ?? 5000) // junta los mensajes seguidos del cliente antes de responder
const MAX_HISTORIAL = 30
const OLVIDO_MS = 48 * 3600_000 // conversación sin actividad por 48 h → se empieza de cero
const DATA = './data/estado.json'

// ---------- estado persistente (pausas y conversaciones por chat) ----------
mkdirSync('./data', { recursive: true })
let estado = { pausas: {}, chats: {} }
try { estado = { ...estado, ...JSON.parse(readFileSync(DATA, 'utf8')) } } catch {}
estado.chats ||= {}
const guardar = () => writeFileSync(DATA, JSON.stringify(estado, null, 2))

// IDs de mensajes que mandó el bot (para distinguirlos de los que manda un humano desde el celular)
const enviadosPorBot = new Set()
export function registrarEnviado(id) {
  enviadosPorBot.add(id)
  if (enviadosPorBot.size > 5000) enviadosPorBot.delete(enviadosPorBot.values().next().value)
}

// Un mismo chat puede llegar identificado por el teléfono (@s.whatsapp.net) o por un
// código interno de WhatsApp (@lid). Las pausas se guardan con todas las formas conocidas.
const pausar = (ids, horas = HORAS_PAUSA) => { for (const id of ids) estado.pausas[id] = Date.now() + horas * 3600_000; guardar() }
const reanudar = (ids) => { for (const id of ids) delete estado.pausas[id]; guardar() }
const enPausa = (ids) => ids.some((id) => (estado.pausas[id] || 0) > Date.now())

async function identidades(sock, key) {
  const ids = new Set()
  for (const j of [key.remoteJid, key.remoteJidAlt]) if (j && (isPnUser(j) || isLidUser(j))) ids.add(jidNormalizedUser(j))
  const mapa = sock.signalRepository?.lidMapping
  for (const j of [...ids]) {
    try {
      const otro = isLidUser(j) ? await mapa?.getPNForLID(j) : await mapa?.getLIDForPN(j)
      if (otro) ids.add(jidNormalizedUser(otro))
    } catch {}
  }
  const pn = [...ids].find((j) => isPnUser(j))
  return { ids: [...ids], principal: pn || [...ids][0] || key.remoteJid, telefono: pn ? pn.split('@')[0] : null }
}

const contacto = (nombre, tel) => (tel ? `${nombre} (+${tel})\nAbrir chat: https://wa.me/${tel}` : `${nombre} (número no disponible)`)

function historial(principal) {
  const c = estado.chats[principal]
  if (!c || Date.now() - c.t > OLVIDO_MS) estado.chats[principal] = { t: Date.now(), msgs: [] }
  return estado.chats[principal]
}
function anotar(principal, rol, texto) {
  const c = historial(principal)
  const ult = c.msgs.at(-1)
  if (ult && ult.rol === rol) ult.texto += '\n' + texto // la IA espera turnos alternados
  else c.msgs.push({ rol, texto })
  c.msgs = c.msgs.slice(-MAX_HISTORIAL)
  while (c.msgs.length && c.msgs[0].rol !== 'cliente') c.msgs.shift()
  c.t = Date.now()
  guardar()
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

// Parte la respuesta en mensajes cortos (un párrafo por mensaje, máximo 5) para que parezca una persona escribiendo
export function partir(texto, max = 5) {
  const partes = texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  // un párrafo muy corto ("Hola.") se junta con el siguiente
  const juntas = []
  for (const p of partes) {
    const ult = juntas.at(-1)
    if (ult && ult.length < 25) juntas[juntas.length - 1] = ult + ' ' + p
    else juntas.push(p)
  }
  while (juntas.length > max) juntas.splice(-2, 2, juntas.at(-2) + '\n\n' + juntas.at(-1))
  return juntas
}

const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

async function escribir(sock, jid, texto, citado) {
  const mensajes = partir(texto)
  for (let i = 0; i < mensajes.length; i++) {
    const m = mensajes[i]
    if (!process.env.SIN_DEMORA) {
      if (i) await pausa(700 + Math.random() * 800) // pausa corta entre mensajes
      await sock.sendPresenceUpdate('composing', jid)
      // "escribiendo…" proporcional al largo, como una persona (entre 1,5 y 6 segundos por mensaje)
      await pausa(Math.min(6000, 1500 + m.length * 30))
      await sock.sendPresenceUpdate('paused', jid)
    }
    await sock.sendMessage(jid, { text: m }, i === 0 && citado ? { quoted: citado } : undefined)
  }
}

async function avisarAdmin(sock, texto) {
  if (!ADMIN) return
  if (texto.includes(`+${ADMIN})`)) return // el que escribe es el propio número de avisos (pruebas): no se avisa a sí mismo
  await sock.sendMessage(`${ADMIN}@s.whatsapp.net`, { text: texto }).catch(() => {})
}

// ---------- respuesta con IA, juntando los mensajes seguidos ----------
const pendientes = new Map() // principal → { timer, jid, ids, nombre, telefono }

function programarRespuesta(sock, datos) {
  const previo = pendientes.get(datos.principal)
  if (previo) clearTimeout(previo.timer)
  const timer = setTimeout(() => {
    pendientes.delete(datos.principal)
    contestar(sock, datos).catch((e) => console.error('Error respondiendo:', e.message))
  }, ESPERA_MS)
  pendientes.set(datos.principal, { ...datos, timer })
}

async function contestar(sock, { jid, ids, principal, nombre, telefono }) {
  if (enPausa(ids)) return
  const c = historial(principal)
  let r
  const t0 = Date.now()
  try {
    r = await responderIA(c.msgs)
    console.log(`→ respuesta IA para ${telefono || principal} en ${Math.round((Date.now() - t0) / 1000)} s${r.derivar ? ' (deriva a una persona)' : ''}`)
  } catch (e) {
    console.error('IA:', e.message)
    await escribir(sock, jid, R.ERROR_IA)
    await avisarAdmin(sock, `⚠️ El asistente no pudo responder (error de la IA): ${contacto(nombre, telefono)}`)
    pausar(ids)
    return
  }
  if (enPausa(ids)) return // alguien del equipo respondió mientras la IA pensaba
  if (r.texto) {
    await escribir(sock, jid, r.texto)
    anotar(principal, 'diario', r.texto)
  }
  if (r.derivar) {
    const ultimo = [...c.msgs].reverse().find((m) => m.rol === 'cliente')?.texto || ''
    await avisarAdmin(sock, `🙋 Para atender: ${contacto(nombre, telefono)}\nÚltimo mensaje: "${ultimo.slice(0, 300)}"`)
    pausar(ids)
  }
}

export async function manejarMensaje(sock, msg) {
  const jid = msg.key.remoteJid
  if (!jid || !msg.message) return
  if (isJidGroup(jid) || isJidBroadcast(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid)) return

  const { texto, adjunto } = extraerTexto(msg.message)
  const t = texto.toLowerCase()
  const { ids, principal, telefono } = await identidades(sock, msg.key)

  // Mensajes que salen de NUESTRO número
  if (msg.key.fromMe) {
    if (enviadosPorBot.has(msg.key.id)) return // los mandó el bot
    // Lo escribió una persona desde el celular/WhatsApp Web:
    if (t === '#bot') { reanudar(ids); return } // reactivar el bot en este chat
    if (t === '#pausa') { pausar(ids, 24 * 365); return } // pausar indefinidamente
    if (texto) anotar(principal, 'diario', texto) // así la IA sabe lo que respondió el equipo
    pausar(ids) // un humano tomó la conversación → el bot se calla HORAS_PAUSA horas
    return
  }

  if (enPausa(ids)) {
    if (texto) anotar(principal, 'cliente', texto)
    console.log(`← mensaje de ${telefono || principal} (chat en pausa, no responde)`)
    return
  }

  const nombre = msg.pushName || 'Cliente'

  // Archivos (comprobantes, textos de avisos en Word/PDF/foto) → los revisa una persona
  if (adjunto) {
    if (texto) anotar(principal, 'cliente', texto)
    anotar(principal, 'cliente', '[El cliente envió un archivo]')
    await escribir(sock, jid, R.RECIBIDO, msg)
    anotar(principal, 'diario', R.RECIBIDO)
    await avisarAdmin(sock, `📎 Envió un archivo: ${contacto(nombre, telefono)}`)
    pausar(ids)
    return
  }

  if (!texto) return
  console.log(`← mensaje de ${telefono || principal}: "${texto.slice(0, 60)}"`)
  anotar(principal, 'cliente', texto)
  programarRespuesta(sock, { jid, ids, principal, nombre, telefono })
}
