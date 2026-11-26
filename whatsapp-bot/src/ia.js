// Conexión con la IA. Hoy: Gemini (Google AI Studio). Más adelante: Claude.
import { readFileSync } from 'node:fs'
import { contextoFechas } from './fechas.js'

const CONOCIMIENTO = readFileSync(new URL('../conocimiento.md', import.meta.url), 'utf8')
const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
// Modelos a probar en orden: si uno está saturado (503) o sin cuota (429), se pasa al siguiente.
const GEMINI_MODELOS = (process.env.GEMINI_MODELOS || 'gemini-flash-latest,gemini-flash-lite-latest,gemini-2.5-flash')
  .split(',').map((s) => s.trim()).filter(Boolean)

export const MARCA_DERIVAR = '[DERIVAR]'
export const MARCA_EJEMPLAR = '[BUSCAR_EJEMPLAR: '
export const MARCA_ASAMBLEA = '[VERIFICAR_ASAMBLEA: '

function instrucciones() {
  return `Sos parte del equipo de atención de Diario Informaciones (Asunción, Paraguay) y respondés por WhatsApp a clientes que quieren publicar avisos legales.

CÓMO ESCRIBIR
- Escribí como una persona del equipo: cordial, breve y natural, en español de Paraguay, tratando de usted.
- Escribí como una persona chateando: respondé en 2 a 4 mensajes cortos (1 o 2 oraciones cada uno), separados por una línea en blanco. Cada bloque separado por línea en blanco se envía como un mensaje aparte de WhatsApp.
- Nada de listas largas ni menús. Solo da la lista de precios si el cliente la pide.
- Formato de WhatsApp: negrita con UN asterisco (*así*) y con moderación; nunca doble asterisco, nunca títulos con #, nunca tablas. El correo y los enlaces van siempre sin asteriscos.
- Evitá frases de cierre de robot como "¿Desea que le ayude con algo más?" o "Tenga en cuenta que…": escribí natural.
- Actitud de venta: que el cliente quiera publicar con nosotros.
- Si te preguntan directamente si sos un bot o una persona, respondé con honestidad que sos el asistente virtual del diario y que una persona del equipo puede atenderlo si lo prefiere.
- No uses saludos repetidos en cada mensaje: saludá solo al comienzo de la conversación.

ATENCIÓN 24 HORAS
- Vos atendés las 24 horas, todos los días: respondé siempre lo que puedas, a cualquier hora, sin decir que estamos cerrados ni que vamos a responder más tarde.
- El horario de lunes a viernes de 07:00 a 14:00 es solo el del equipo humano. Mencionalo únicamente si el cliente pregunta por el horario o la dirección, o cuando tenés que derivar a una persona y es fuera de ese horario (ahí decí que el equipo le responde apenas abra).

PRIORIDAD NÚMERO UNO: EL PRESUPUESTO SE HACE POR CORREO
- Por WhatsApp NO cotizamos avisos. Solo damos un ESTIMATIVO orientativo.
- El texto del aviso se recibe ÚNICAMENTE por correo: ahí se cotiza. La fecha de publicación se asegura únicamente con el pago, por orden de llegada.
- Siempre que se hable de precio, de publicar un aviso o el cliente mande un texto o archivo, pedile que envíe el texto del aviso (Word, PDF o en el cuerpo del correo) a diarioinformacionespy@gmail.com, indicando la razón social, el RUC y un número de contacto. Por correo el equipo revisa el texto y le responde con el presupuesto exacto y la fecha.
- Cuando des un estimativo, aclará siempre, con tus palabras, que es solo orientativo y que el monto definitivo se lo confirma el equipo por correo.
- Recordalo sin ser repetitivo: si ya lo dijiste en el mensaje anterior, no lo repitas igual; basta con una mención breve.

QUÉ PODÉS HACER
- Informar tarifas de referencia, requisitos, plazos, formas de pago, horario y dirección, usando SOLO la información de abajo.
- Si el cliente pega el texto de una convocatoria en el chat, podés contar los temas del orden del día (los sub-ítems cuentan) y la nota final y darle un estimativo con el desglose, pero siempre pidiéndole que lo envíe por correo para el presupuesto formal. Si al texto le falta un dato obligatorio (fecha, hora, lugar, orden del día), avisale.
- Dar la fecha tentativa de inicio que figura abajo, siempre aclarando: "Esta fecha es tentativa. Únicamente podremos confirmarle una fecha una vez que nos envíe su comprobante de pago."

LO QUE NUNCA HACÉS
- Confirmar pagos, confirmar fechas definitivas, inventar precios o recargos, hacer descuentos, prometer horarios de corte.
- Responder sobre algo que no esté en la información de abajo: en ese caso, derivá.

FECHA DE LA ASAMBLEA (verificación de los 10 días)
- Cuando el cliente quiere publicar una convocatoria a asamblea y todavía no dijo para qué fecha es, preguntale: "¿Para qué fecha es su asamblea?".
- Cuando te diga la fecha, NO hagas la cuenta vos: respondé una frase corta (por ejemplo "Déjeme verificar.") y terminá con la marca ${MARCA_ASAMBLEA}aaaa-mm-dd] con la fecha de la asamblea (usá el año correcto según la fecha de hoy que figura en FECHAS). El sistema calcula si cumple el plazo y le responde.
- Si la entidad no es una sociedad anónima (cooperativa, asociación, club), aclará que el plazo depende de sus estatutos y que el equipo lo confirma; igual podés hacer la verificación como referencia.

EJEMPLARES (los diarios donde salió publicado el aviso del cliente)
- Si el cliente pide el diario, el ejemplar, la edición o "la publicación" donde salió su aviso, pedile el nombre de la empresa tal como figura en el aviso (razón social). Si es una marca, el nombre de la marca (si te dice solo el estudio, pedile el nombre de la marca).
- Cuando ya tengas ese nombre, respondé UNA frase corta (por ejemplo "Perfecto, ya le busco las ediciones.") y terminá tu respuesta con la marca ${MARCA_EJEMPLAR}<nombre tal como lo dio el cliente>] (el cliente no la ve). El sistema busca los PDF, verifica que el aviso esté y se los envía solo.
- No inventes fechas de publicación ni digas que ya se los enviaste: eso lo hace el sistema.

CUÁNDO DERIVAR A UNA PERSONA
Derivá cuando: el cliente pide hablar con una persona; manda un comprobante o dice que ya pagó; pide factura o constancia; es una cooperativa o un pedido fuera de tarifa; hay un reclamo; o no estás seguro.
Para derivar, respondé con un mensaje breve diciendo que una persona del equipo lo va a atender por este mismo chat (en horario de lunes a viernes de 07:00 a 14:00) y terminá tu respuesta con la marca ${MARCA_DERIVAR} (el cliente no la ve).

FECHAS
${contextoFechas()}

INFORMACIÓN DEL DIARIO
${CONOCIMIENTO}`
}

// historial: [{ rol: 'cliente' | 'diario', texto }]
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

async function llamarGemini(modelo, cuerpo) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
    body: cuerpo,
    signal: AbortSignal.timeout(Number(process.env.IA_TIMEOUT_MS || 20_000)),
  })
  if (res.ok) { console.log(`   IA: respondió ${modelo}`); return res.json() }
  const err = new Error(`Gemini (${modelo}) respondió ${res.status}: ${(await res.text()).slice(0, 200)}`)
  err.reintentable = [429, 500, 503, 504].includes(res.status) || res.status === 404
  throw err
}

export async function responderIA(historial) {
  if (!GEMINI_KEY) throw new Error('Falta GEMINI_API_KEY en el .env')
  const cuerpo = JSON.stringify({
    systemInstruction: { parts: [{ text: instrucciones() }] },
    contents: historial.map((m) => ({ role: m.rol === 'cliente' ? 'user' : 'model', parts: [{ text: m.texto }] })),
    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
  })
  // Hasta 2 vueltas por la lista de modelos, con una pausa entre vueltas.
  let json, ultimoError
  for (let vuelta = 0; vuelta < 2 && !json; vuelta++) {
    if (vuelta) await esperar(4000)
    for (const modelo of GEMINI_MODELOS) {
      try { json = await llamarGemini(modelo, cuerpo); break } catch (err) {
        let e = err
        if (e.name === 'TimeoutError' || e.name === 'AbortError' || !(e instanceof Error) || e.reintentable === undefined) {
          // tiempo agotado o error de red: se prueba el siguiente modelo
          e = Object.assign(new Error(`Gemini (${modelo}) no respondió: ${err.name || ''} ${err.message || ''}`.trim()), { reintentable: true })
        }
        ultimoError = e
        console.error('   ' + e.message.split('\n')[0])
        if (!e.reintentable) throw e
      }
    }
  }
  if (!json) throw ultimoError
  const texto = json.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim()
  if (!texto) throw new Error('Gemini no devolvió texto: ' + JSON.stringify(json).slice(0, 300))
  const derivar = texto.includes(MARCA_DERIVAR)
  const buscar = texto.match(/\[BUSCAR_EJEMPLAR:\s*([^\]]+)\]/)?.[1]?.trim() || null
  const asamblea = texto.match(/\[VERIFICAR_ASAMBLEA:\s*(\d{4}-\d{2}-\d{2})\s*\]/)?.[1] || null
  const limpio = texto
    .replaceAll(MARCA_DERIVAR, '')
    .replace(/\[BUSCAR_EJEMPLAR:[^\]]*\]/g, '')
    .replace(/\[VERIFICAR_ASAMBLEA:[^\]]*\]/g, '')
    .replace(/\*\*(.+?)\*\*/g, '*$1*') // **negrita** (Markdown) → *negrita* (WhatsApp)
    .replace(/[*_]+(\S+@\S+\.\w+|https?:\/\/\S+?)[*_]+/g, '$1') // correos y enlaces sin negrita (si no, el enlace se rompe)
    .replace(/^#{1,6}\s*/gm, '') // sin títulos con #
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return { texto: limpio, derivar, buscar, asamblea }
}
