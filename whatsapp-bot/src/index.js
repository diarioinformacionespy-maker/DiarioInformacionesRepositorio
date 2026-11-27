import 'dotenv/config'
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import { rmSync } from 'node:fs'
import { manejarMensaje, registrarEnviado } from './handler.js'

const AUTH_DIR = process.env.AUTH_DIR || './auth'
const PAIRING_NUMBER = (process.env.PAIRING_NUMBER || '').replace(/\D/g, '')
import { crearEtiquetas } from './etiquetas.js'
import { iniciarPool } from './pool.js'
const logger = pino({ level: process.env.LOG_LEVEL || 'warn' })

let reintentos = 0

async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: false, // así el celular sigue recibiendo notificaciones
    syncFullHistory: false,
  })

  sock.ev.on('creds.update', saveCreds)

  // Vincular con código de 8 dígitos en lugar de QR (si se configuró PAIRING_NUMBER)
  if (PAIRING_NUMBER && !sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(PAIRING_NUMBER)
        console.log(`\n🔑 Código de vinculación: ${code}`)
        console.log('   En el celular: WhatsApp Business → Dispositivos vinculados → Vincular con número de teléfono\n')
      } catch (e) {
        console.error('No se pudo pedir el código de vinculación:', e.message)
      }
    }, 3000)
  }

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr && !PAIRING_NUMBER) {
      console.log('\n📱 Escaneá este QR desde WhatsApp Business → Dispositivos vinculados:\n')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      reintentos = 0
      console.log(`✅ Conectado como ${sock.user?.id}`)
      setTimeout(() => crearEtiquetas(sock), 10000) // cuando terminó de sincronizar
      iniciarPool()
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      if (code === DisconnectReason.loggedOut) {
        console.error('❌ Sesión cerrada desde el celular. Borro la sesión; reiniciá para vincular de nuevo.')
        rmSync(AUTH_DIR, { recursive: true, force: true })
        process.exit(1)
      }
      const espera = Math.min(60_000, 2_000 * 2 ** reintentos++)
      console.warn(`⚠️  Conexión cerrada (código ${code}). Reintento en ${espera / 1000}s...`)
      setTimeout(iniciar, espera)
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      try {
        await manejarMensaje(sock, msg)
      } catch (e) {
        logger.error(e, 'Error manejando mensaje')
      }
    }
  })

  // Envoltorio para que el handler sepa qué mensajes mandó el bot (y no los confunda con un humano)
  const sendOriginal = sock.sendMessage.bind(sock)
  sock.sendMessage = async (...args) => {
    const res = await sendOriginal(...args)
    if (res?.key?.id) registrarEnviado(res.key.id)
    return res
  }
}

process.on('unhandledRejection', (e) => logger.error(e, 'unhandledRejection'))
iniciar()
