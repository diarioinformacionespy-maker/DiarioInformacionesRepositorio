import {
  normalizeMessageContent,
  isJidGroup,
  isJidBroadcast,
  isJidStatusBroadcast,
  isJidNewsletter,
  isLidUser,
  isPnUser,
  jidNormalizedUser,
  downloadMediaMessage,
} from '@whiskeysockets/baileys'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { etiquetar, quitarEtiqueta } from './etiquetas.js'
import * as R from './respuestas.js'
import { responderIA, transcribirAudio } from './ia.js'
import { buscarEjemplares, gmailConfigurado } from './gmail.js'
import { texto as fechaTexto, verificarAsamblea } from './fechas.js'

const HORAS_PAUSA = Number(process.env.HORAS_PAUSA || 12)
const ADMIN = (process.env.ADMIN_NUMBER || '').replace(/\D/g, '')
const ESPERA_MS = Number(process.env.ESPERA_MS ?? 5000) // junta los mensajes seguidos del cliente antes de responder
const MAX_HISTORIAL = 30
const MAX_AUDIO_SEG = Number(process.env.MAX_AUDIO_SEG || 300) // notas de voz de hasta 5 minutos
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
  if (!m) return { texto: '', adjunto: false, audio: null }
  const texto =
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    ''
  const adjunto = Boolean(m.imageMessage || m.documentMessage || m.videoMessage)
  const audio = m.audioMessage || null
  return { texto: texto.trim(), adjunto, audio }
}

// Parte la respuesta en mensajes cortos (un párrafo por mensaje, máximo 5) para que parezca una persona escribiendo
// Parte la respuesta en mensajes cortos, frase por frase, como escribe una persona en WhatsApp.
const ABREV = /\b(Sr|Sra|Srta|Dr|Dra|Lic|Ing|Abg|Gs|N\.º|Nro|Art|S\.A|S\.R\.L)\.$/i
export function partir(texto, max = 3) {
  const frases = []
  for (const parrafo of texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)) {
    // corta después de . ? ! cuando sigue una frase nueva (mayúscula, ¿ o ¡)
    const trozos = parrafo.split(/(?<=[.?!])\s+(?=[¿¡A-ZÁÉÍÓÚÑ])/)
    let actual = ''
    for (const t of trozos) {
      actual = actual ? actual + ' ' + t : t
      if (!ABREV.test(actual)) { frases.push(actual); actual = '' }
    }
    if (actual) frases.push(actual)
  }
  // una frase muy corta ("Perfecto.") se junta con la siguiente
  const juntas = []
  for (const f of frases) {
    const ult = juntas.at(-1)
    if (ult && ult.length < 25) juntas[juntas.length - 1] = ult + ' ' + f
    else juntas.push(f)
  }
  while (juntas.length > max) juntas.splice(-2, 2, juntas.at(-2) + ' ' + juntas.at(-1))
  return juntas
}

const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

async function escribir(sock, jid, texto, citado) {
  const mensajes = partir(texto.replace(/[¿¡]/g, '')) // sin signos de apertura, como se escribe en WhatsApp
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
    r = await responderIA(c.msgs, nombre === 'Cliente' ? '' : String(nombre).replace(/[^\p{L}\p{N} .'-]/gu, '').trim().slice(0, 40))
    console.log(`→ respuesta IA para ${telefono || principal} en ${Math.round((Date.now() - t0) / 1000)} s${r.derivar ? ' (deriva a una persona)' : ''}`)
  } catch (e) {
    console.error('IA:', e.message)
    await escribir(sock, jid, R.ERROR_IA)
    await avisarAdmin(sock, `⚠️ El asistente no pudo responder (error de la IA): ${contacto(nombre, telefono)}`)
    // Un error de la IA suele ser pasajero (modelo saturado): pausa corta, no las 12 h de cuando atiende una persona
    pausar(ids, Number(process.env.HORAS_PAUSA_ERROR || 0.5))
    return
  }
  if (enPausa(ids)) return // alguien del equipo respondió mientras la IA pensaba
  if (r.texto) {
    await escribir(sock, jid, r.texto)
    anotar(principal, 'diario', r.texto)
  }
  if (r.asamblea) {
    const t = verificarAsamblea(r.asamblea)
    if (t) { await escribir(sock, jid, t); anotar(principal, 'diario', t) }
  }
  if (r.buscar) await enviarEjemplares(sock, { jid, ids, principal, nombre, telefono }, r.buscar)
  if (r.derivar) {
    const ultimo = [...c.msgs].reverse().find((m) => m.rol === 'cliente')?.texto || ''
    await avisarAdmin(sock, `🙋 Para atender: ${contacto(nombre, telefono)}\nÚltimo mensaje: "${ultimo.slice(0, 300)}"`)
    await etiquetar(sock, jid)
    pausar(ids)
  }
}

// ---------- ejemplares: busca en Gmail los PDF web donde salió el aviso y los envía ----------
const ARCHIVO_WEB = 'http://www.editorialinformaciones.com/archivo'
const fechaLarga = (iso) => fechaTexto(new Date(iso + 'T00:00:00Z'))

async function enviarEjemplares(sock, { jid, ids, principal, nombre, telefono }, buscado) {
  const quien = contacto(nombre, telefono)
  if (!gmailConfigurado()) {
    const t = `En breve le remitimos las ediciones por este medio.\n\nTambién puede descargarlas desde nuestra página web, en la sección ARCHIVO, eligiendo la fecha en el calendario: ${ARCHIVO_WEB}`
    await escribir(sock, jid, t); anotar(principal, 'diario', t)
    await avisarAdmin(sock, `📰 Pide ejemplares de "${buscado}": ${quien}\n(El bot todavía no tiene acceso al Gmail para buscarlos.)`)
    await etiquetar(sock, jid)
    pausar(ids)
    return
  }
  let encontrados
  try {
    encontrados = await buscarEjemplares(buscado)
  } catch (e) {
    console.error('Ejemplares:', e.message)
    await escribir(sock, jid, R.ERROR_IA); anotar(principal, 'diario', R.ERROR_IA)
    await avisarAdmin(sock, `📰 No se pudieron buscar los ejemplares de "${buscado}" (error: ${e.message.slice(0, 120)}): ${quien}`)
    await etiquetar(sock, jid)
    pausar(ids)
    return
  }
  console.log(`📰 ejemplares de "${buscado}" para ${telefono || principal}: ${encontrados.map((e) => e.fecha).join(', ') || 'ninguno'}`)

  if (!encontrados.length) {
    const c = historial(principal)
    c.intentosEjemplar = (c.intentosEjemplar || 0) + 1
    if (c.intentosEjemplar >= 2) {
      const t = `No logro ubicarla por acá; ya le paso su pedido al equipo para que le envíe las ediciones.`
      await escribir(sock, jid, t); anotar(principal, 'diario', t)
      await avisarAdmin(sock, `📰 No encontré ejemplares de "${buscado}" (2 intentos): ${quien}`)
      await etiquetar(sock, jid)
      pausar(ids)
    } else {
      const t = `No encontré publicaciones con el nombre "${buscado}". ¿Me confirma el nombre exacto como figura en el aviso?`
      await escribir(sock, jid, t); anotar(principal, 'diario', t)
    }
    guardar()
    return
  }

  const dias = encontrados.map((e) => fechaLarga(e.fecha))
  const lista = dias.length === 1 ? dias[0] : dias.slice(0, -1).join(', ') + ' y ' + dias.at(-1)
  await escribir(sock, jid, `La encontré: salió el ${lista}. Ya le envío ${encontrados.length === 1 ? 'la edición' : 'las ediciones'}.`)
  for (const e of encontrados) {
    await sock.sendMessage(jid, { document: e.pdf, mimetype: 'application/pdf', fileName: e.nombre })
    await pausa(1200)
  }
  const fin = `Listo. También las tiene en nuestra web, sección ARCHIVO: ${ARCHIVO_WEB}`
  await escribir(sock, jid, fin)
  anotar(principal, 'diario', `[Se le enviaron al cliente los ejemplares de "${buscado}": ${lista}]`)
  // Sin aviso al equipo: el envío salió bien y no requiere ninguna acción (queda en el registro del servidor).
}

export async function manejarMensaje(sock, msg) {
  const jid = msg.key.remoteJid
  if (!jid || !msg.message) return
  if (isJidGroup(jid) || isJidBroadcast(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid)) return

  let { texto, adjunto, audio } = extraerTexto(msg.message)
  const t = texto.toLowerCase()
  const { ids, principal, telefono } = await identidades(sock, msg.key)

  // Mensajes que salen de NUESTRO número
  if (msg.key.fromMe) {
    if (enviadosPorBot.has(msg.key.id)) return // los mandó el bot
    // Lo escribió una persona desde el celular/WhatsApp Web:
    if (t === '#bot') { reanudar(ids); await quitarEtiqueta(sock, jid); return } // reactivar el bot en este chat
    if (t === '#pausa') { pausar(ids, 24 * 365); return } // pausar indefinidamente
    if (texto) anotar(principal, 'diario', texto) // así la IA sabe lo que respondió el equipo
    pausar(ids) // un humano tomó la conversación → el bot se calla HORAS_PAUSA horas
    return
  }

  if (enPausa(ids)) {
    if (texto || audio) anotar(principal, 'cliente', texto || '[nota de voz]')
    console.log(`← mensaje de ${telefono || principal} (chat en pausa, no responde)`)
    return
  }

  const nombre = msg.pushName || 'Cliente'

  // Notas de voz: se transcriben con la IA y se responden como si el cliente lo hubiera escrito
  if (audio) {
    if ((audio.seconds || 0) > MAX_AUDIO_SEG) {
      await escribir(sock, jid, R.AUDIO_LARGO); anotar(principal, 'cliente', '[nota de voz larga]'); anotar(principal, 'diario', R.AUDIO_LARGO)
      return
    }
    let transcripcion = null
    try {
      await sock.sendPresenceUpdate('recording', jid).catch(() => {})
      const buf = await downloadMediaMessage(msg, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
      transcripcion = await transcribirAudio(buf, audio.mimetype)
    } catch (e) {
      console.error('Audio:', e.message.split('\n')[0])
    }
    if (!transcripcion) {
      await escribir(sock, jid, R.AUDIO_NO); anotar(principal, 'cliente', '[nota de voz que no se pudo entender]'); anotar(principal, 'diario', R.AUDIO_NO)
      return
    }
    console.log(`🎤 audio de ${telefono || principal} (${audio.seconds || '?'} s) transcripto`)
    texto = transcripcion
  }

  // Archivos (comprobantes, textos de avisos en Word/PDF/foto) → los revisa una persona
  if (adjunto) {
    if (texto) anotar(principal, 'cliente', texto)
    anotar(principal, 'cliente', '[El cliente envió un archivo]')
    await escribir(sock, jid, R.RECIBIDO, msg)
    anotar(principal, 'diario', R.RECIBIDO)
    await avisarAdmin(sock, `📎 Envió un archivo: ${contacto(nombre, telefono)}`)
    await etiquetar(sock, jid)
    pausar(ids)
    return
  }

  if (!texto) return
  console.log(`← mensaje de ${telefono || principal}: "${texto.slice(0, 60)}"`)
  anotar(principal, 'cliente', texto)
  programarRespuesta(sock, { jid, ids, principal, nombre, telefono })
}
