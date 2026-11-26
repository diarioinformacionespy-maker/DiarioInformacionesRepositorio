// ✏️ Editá acá los textos del bot. No hace falta tocar el resto del código.
// Fuente: conocimiento.md (SKILL.md del diario, reglas vigentes al 26/11/2026).

export const NOMBRE = process.env.BOT_NOMBRE || 'Diario Informaciones'

const VOLVER = `\n\nEscriba *menu* para volver a las opciones.`

export const MENU = `¡Hola! 👋 Gracias por escribir a *${NOMBRE}*, avisos y publicaciones legales.

Responda con el número de la opción:

*1* - Tarifas de asambleas
*2* - Tarifas de otros avisos (constitución, marcas, edictos)
*3* - Qué debe tener mi aviso
*4* - Plazos de asambleas
*5* - Cómo pagar
*6* - Horario y dirección
*7* - Hablar con una persona

📝 Para un presupuesto exacto, envíenos directamente el *texto del aviso* (Word, PDF o escrito acá).`

// Número de la opción que deriva a una persona (tiene que coincidir con el menú).
export const OPCION_HUMANO = '7'

export const OPCIONES = {
  1: `📰 *Convocatorias a asamblea* (ordinaria o extraordinaria)
Se cobran por cantidad de *temas del orden del día*. Precios con IVA incluido.

*5 días de publicación:*
• 1 a 5 temas: Gs. 150.000
• 6 temas: Gs. 160.000
• 7 temas: Gs. 170.000
• 8 temas: Gs. 180.000
• 9 temas: Gs. 190.000
• 10 temas: Gs. 220.000
• 11 temas: Gs. 240.000
• 12 temas: Gs. 250.000
• 13 temas: Gs. 270.000

*3 días* (solo si usted lo pide):
• 1 a 5 temas: Gs. 140.000 · 6: Gs. 150.000 · 7: Gs. 160.000 · 8: Gs. 170.000

ℹ️ Los sub-ítems (a, b, c… o 2.1, 2.2…) cuentan como temas.
ℹ️ Cada asamblea se cotiza por separado (ordinaria + extraordinaria = dos avisos).
ℹ️ La nota final (depósito de acciones, requisitos para participar, etc.) suma: más de 3 líneas Gs. 10.000 · más de 5 líneas Gs. 20.000 · más de 8 líneas Gs. 30.000 · más de 11 líneas Gs. 40.000.
ℹ️ Las cooperativas se presupuestan aparte.

Envíenos el texto y le pasamos el precio exacto.${VOLVER}`,

  2: `📋 *Otros avisos* (precios con IVA incluido)

*Constitución de sociedad / modificación de estatuto* (3 días)
• Hasta 8 líneas: Gs. 140.000
• Gs. 10.000 más por cada 3 líneas adicionales completas

*Marcas*
• Registro (3 días): Gs. 25.000 por expediente sin logo · Gs. 35.000 por expediente + Gs. 25.000 por logo
• Renovación (1 día): Gs. 22.000 por expediente sin logo · Gs. 30.000 por expediente + Gs. 25.000 por logo
• Transferencia (1 día): Gs. 30.000
• Licencia de uso (1 día): Gs. 88.000 por expediente
ℹ️ Varios expedientes con el *mismo logo* se publican juntos y el logo se cobra una sola vez.

*Derecho de autor* (3 días)
• 1 a 4 expedientes: Gs. 44.000 · 5 a 8: Gs. 55.000 · más de 8: Gs. 85.000

*Edictos y extravíos:* Gs. 100.000 por día

Para otros avisos, envíenos el texto y le cotizamos.${VOLVER}`,

  3: `✅ *Qué debe tener su aviso*

*Convocatoria a asamblea*
• Tipo de asamblea (ordinaria o extraordinaria)
• Fecha, hora y lugar ("en la sede social" es válido)
• Orden del día
• Si es segunda convocatoria, su horario

*Constitución de sociedad* (se publica un *extracto*, no la escritura completa)
• Escritura N.º, fecha, escribano y denominación
• Domicilio, duración y objeto
• Capital (en números y letras) y accionistas
• Datos de inscripción en la Dirección General de los Registros Públicos

*Marcas*
• Orden de publicación de la DINAPI, con denominación, logo (si tiene), N.º de acta, fecha y hora de presentación, solicitante y clase(s)

Si nos manda el texto, lo revisamos y le avisamos si falta algún dato.${VOLVER}`,

  4: `📅 *Plazos de asambleas*

*Sociedades anónimas:* se publican *5 días*. Entre la *primera publicación* y la asamblea deben pasar *al menos 10 días*.
Ejemplo: si la primera publicación es el miércoles 18, la asamblea debe ser el sábado 28 o después.

*Segunda convocatoria:* 3 publicaciones.

*Asociaciones, clubes y cooperativas:* dependen de sus estatutos. Envíenos el texto y lo revisamos.

⚠️ Los domingos no se inician publicaciones. La fecha se asegura *únicamente con el pago*, por orden de llegada. Le recomendamos no dejarlo para último momento.${VOLVER}`,

  5: `💳 *Cómo pagar*

Transferencia bancaria:
• *Banco: COMPLETAR*
• Titular: COMPLETAR
• Cuenta N.º: COMPLETAR
• Alias: COMPLETAR
• Comentario de la transferencia: *nombre de la empresa que publica el aviso*

Pasos:
1. Envíenos el texto y espere nuestro presupuesto.
2. Transfiera el monto indicado.
3. Envíe el *comprobante* por acá, junto con el *RUC* para la factura y un número de contacto.

Su publicación se procesa cuando recibimos el comprobante y se confirma la acreditación. La factura electrónica llega por correo desde facturacion@editorialinformaciones.com (revise también la carpeta de spam).${VOLVER}`,

  6: `🕐 *Horario de atención*
Lunes a viernes, de 07:00 a 14:00.

📍 *Dirección*
República de Colombia 1136 (casi Brasil), Asunción.

☎️ *Teléfonos*
+595 21 200 598
+595 21 205 167
+595 21 211 985

✉️ *Correo:* diarioinformacionespy@gmail.com
🌐 *Sitio web:* http://www.editorialinformaciones.com/contacto
📂 Ediciones anteriores en PDF: http://www.editorialinformaciones.com/archivo${VOLVER}`,
}

export const HUMANO = `👤 Con gusto. Le paso su consulta a una persona del equipo, que le responde por acá a la brevedad (lunes a viernes, de 07:00 a 14:00).`

export const FUERA_DE_HORARIO = `🌙 Gracias por escribir a *${NOMBRE}*. En este momento estamos fuera del horario de atención (lunes a viernes, de 07:00 a 14:00).

Puede dejarnos su mensaje o el texto de su aviso y le respondemos apenas abramos.`

export const NO_ENTENDI = `No entendí su mensaje 🤔. Escriba *menu* para ver las opciones o *7* para hablar con una persona.`

export const RECIBIDO = `✅ Recibido, muchas gracias. Una persona del equipo lo revisa y le responde por acá con el presupuesto o los pasos a seguir.`
