// Etiquetas de WhatsApp Business (se ven en el celular y en WhatsApp Web, y se puede filtrar por ellas).
// El bot crea 3 etiquetas con IDs fijos (altos, para no pisar las que ya existen) y marca los chats
// que necesitan una persona con "🙋 Para atender". El que toma el chat le cambia la etiqueta a su nombre.

export const PARA_ATENDER = '90'
const ETIQUETAS = [
  { id: PARA_ATENDER, name: '🙋 Para atender', color: 1 },
  { id: '91', name: 'Hugo', color: 5 },
  { id: '92', name: 'Claudio', color: 9 },
]

let listas = false
export async function crearEtiquetas(sock) {
  if (listas) return
  for (const e of ETIQUETAS) {
    try { await sock.addLabel('', { ...e, deleted: false }) } catch (err) { console.error(`Etiqueta "${e.name}":`, err.message); return }
  }
  listas = true
  console.log('🏷️  Etiquetas listas: 🙋 Para atender, Hugo, Claudio')
}

export async function etiquetar(sock, jid, id = PARA_ATENDER) {
  try { await sock.addChatLabel(jid, id) } catch (err) { console.error('No se pudo etiquetar el chat:', err.message) }
}

export async function quitarEtiqueta(sock, jid, id = PARA_ATENDER) {
  try { await sock.removeChatLabel(jid, id) } catch (err) { console.error('No se pudo quitar la etiqueta:', err.message) }
}
