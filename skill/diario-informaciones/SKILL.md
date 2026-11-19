---
name: "diario-informaciones"
description: Analiza el flujo de atención por WhatsApp (bot) para avisos judiciales que se publican en DIARIO INFORMACIONES; recibe el aviso, lo interpreta, presupuesta y responde por Gmail con presets. Usar cuando se pida diseñar, revisar o implementar el bot de WhatsApp, el presupuestador de avisos, la conexión con Gmail o las respuestas predefinidas de avisos judiciales.
metadata:
  type: project
---

# Análisis: atención de avisos judiciales por WhatsApp + Gmail

Objetivo: que una persona escriba por WhatsApp con su aviso judicial (edicto, citación, remate, llamado, etc.), el sistema lo lea, calcule un presupuesto de publicación en DIARIO INFORMACIONES y responda por Gmail con un preset aprobado.


## 00. ANTE LA DUDA, BORRADOR — REGLA PERMANENTE (Eddy, 13/11/2026). Está por encima de cualquier autorización de envío automático
Si Claude **duda o no sabe qué hacer** en un correo, la respuesta queda **SIEMPRE en BORRADOR** con el KV, Label_8 "✋ HUGO - PULSAR ENVIAR", UNREAD e INBOX, y **Hugo la envía a mano**. Esta regla **NO se levanta nunca**: tampoco en temporada alta ni cuando se habiliten los envíos automáticos (§0 ter, "Aguardamos su pago", "Recibido" a estudios, confirmaciones de pago, etc.). Un correo con duda **nunca** sale solo.
Cuenta como duda, entre otros casos:
- El pago no está verificado por el GNB, coincide solo el importe, o llegó a otra cuenta que no sea GNB ni Sudameris (regla 18/11: el print de una transferencia a la cuenta Sudameris de Luzana se acepta si coincide, con tarjeta VERIFICAR PAGO SUDAMERIS).
- Hay que interpretar el precio: sub-ítems, nota anexa larga, cooperativas o tipos de aviso no tarifados.
- Las fechas no cierran: el plazo del Art. 1082 no se cumple, el pago llegó después del corte, o el día está cerrado o casi lleno.
- El tipo de asamblea no coincide con el orden del día, el texto es ambiguo, o hay datos que faltan o se contradicen.
- El cliente reclama, se queja, pide algo fuera de lo común o menciona un acuerdo previo que no aparece en el hilo.
- Hay respuestas a mano de Hugo o Claudio que contradicen el Pool, o cualquier caso que no esté cubierto por este skill.
En esos casos, además del borrador, se deja una **tarjeta en el Tablero de Pendientes** que explica la duda en una línea. Si un envío automático autorizado tiene alguna duda en ese correo en particular, ese correo pasa a borrador y los demás siguen su curso.

## 00 bis. Reglas de Eddy del 13/11/2026 (tarde)
- **REGLAS COMPLEMENTARIAS DE CLAUDIO (19/11/2026, pasadas por Eddy).**
  - **Pedidos especiales** (ej. publicar 6 días u otra cantidad fuera de lo tarifado): BORRADOR con la fecha tentativa y el **monto en blanco** ("Gs. ______") para que el equipo lo complete a mano + tarjeta. Nunca inventar el precio.
  - **UNIVERSIDAD NACIONAL DE VILLARRICA DEL ESPÍRITU SANTO (UNVES):** siempre BORRADOR, con el monto y la fecha tentativa que pide el cliente, hasta que el equipo verifique los datos. Nunca envío automático ni reserva sin verificar.
  - **Notas u observaciones de las asambleas:** todo lo que NO es encabezado (fecha, hora y lugar de la asamblea) ni orden del día se cobra aparte, sumado al precio por los puntos del orden del día: **más de 3 líneas Gs. 10.000 · más de 5 líneas Gs. 20.000 · más de 8 líneas Gs. 30.000 · más de 11 líneas Gs. 40.000.** Reemplaza la tabla de escalones del 17/11 (que llegaba solo hasta 6 líneas).
  - **Diarios que piden los clientes** (ejemplares o PDF de la edición): los manda el equipo, desde el chat de WhatsApp remitido a Nelson Páez o desde la carpeta "Diarios Web" (Descargas Públicas, en el escritorio de la PC de la oficina). Claude no los tiene: deja el pedido en BORRADOR ("en breve le remitimos el ejemplar") + tarjeta para el equipo.
- **CORREGIDOS: NINGÚN AVISO DE LA PRÓXIMA EDICIÓN SIN TEXTO (Hugo, 19/11/2026).** El viernes 20 faltaron en la exportación a InDesign CAPIME (pago confirmado sin que se armara el corregido) y los 2 avisos presenciales de POLVO DE ESTRELLAS (cargados con un PDF que nunca se pasó al Drive). En CADA pasada, además del correo:
  1. Avisos con `archivo.en_drive:false` (presenciales): bajar el archivo, subirlo a ORIGINALES/<día de llegada>, leerlo (si es escaneado, renderizar las páginas y leerlas) y armar el CORREGIDO. **Un PDF puede traer VARIOS avisos** (ej. Ordinaria y Extraordinaria): separar cada uno en su propio aviso del Pool (mismo código + "-B", "-C"…), cada uno con su CORREGIDO, su `corregido_bloques` y su Op.
  2. Todo aviso `confirmada` cuya primera fecha sea la próxima edición abierta (o la edición en armado) y que NO tenga `corregido_bloques`: armarlo en esa misma pasada, venga de correo, presencial o pago de otro banco.
  3. Si falta el texto (no hay archivo ni texto en el correo): tarjeta URGENTE "FALTA TEXTO" para Hugo, ese mismo día.
- **DÍA CERRADO NUNCA SE CONFIRMA (Eddy, 19/11/2026).** Antes de confirmar un pago o mandar un presupuesto, mirar en el Pool (colección `dias`) si el día está `"cerrado": true`. Un día cerrado NUNCA se ofrece ni se confirma, aunque el pago haya llegado antes del cierre. La fecha de inicio es SIEMPRE el próximo día NO cerrado al momento de confirmar. El lugar en el diario NO se guarda por haber pagado antes del cierre: si el pago no quedó confirmado al 100% como del cliente correcto (comprobante o match GNB completo) antes del cierre, una vez cerrada la edición pasa al siguiente día disponible. Error real: el 18/11 a las 15:26 se confirmó a "MO" S.A. del 19 al 21/11 cuando el jueves 19 ya estaba cerrado desde las 13:37; hubo que mandar corrección.
- **DEPÓSITO EN EFECTIVO GNB CON BOLETA (Eddy y Hugo, 19/11/2026).** El banco NO manda correo por esos depósitos y la boleta puede tener datos erróneos o no acreditarse: se verifican ÚNICAMENTE A MANO (el equipo la baja, la imprime y la pasa a gerencia). Que la boleta es del cliente lo confirma el propio cliente al enviarla (Luzana no puede saber de quién es una boleta); gerencia solo verifica que el depósito SE ACREDITÓ en la cuenta GNB. Qué hago: (1) NO le contesto ni le consulto nada al cliente, ni siquiera en modo automático; (2) tarjeta en el Tablero "OBSERVAR Y VERIFICAR DEPÓSITO GNB — <cliente> Gs. <monto>"; (3) dejo la respuesta en BORRADOR (Label_8, UNREAD, INBOX) con la fecha tentativa (el próximo día no cerrado) y el presupuesto. No reservo en el Pool. Cuando gerencia confirma la acreditación, el equipo envía el borrador a mano (si la fecha tentativa ya cerró, actualizo el borrador al siguiente día disponible). Son casos aislados.
- **CORREOS: NUNCA UNA RUTA EN EL htmlBody (Eddy, 19/11/2026).** En Gmail `reply` / `create_draft`, el `htmlBody` se pega COMPLETO como texto HTML; NUNCA poner una ruta de archivo (ej. "@/tmp/.../x.html"), porque se envía literal al cliente (error real con CAPIME el 18/11).
- **HISTORIAL DEL POOL (Eddy, 19/11/2026).** Cada vez que se escriba en el Pool (colecciones `avisos`, `dias`, `envios_auto`, `pagos_sin_asignar`) con ArtifactData, agregar en la MISMA batch un documento en la colección `historial` con: `fecha_hora` (ISO, hora de Asunción -03:00), `quien`: "Claude", `accion` (ej. "cerrar día", "confirmar aviso", "cambiar fechas"), `coleccion`, `doc_id`, `detalle` (1 línea: qué cambió, antes → después). El `doc_id` del historial es `<aaaa-mm-ddTHHMMSS>-<doc_id>`.
- **CONSULTAR ANTES DE RESERVAR (Eddy, 18/11/2026, casos CAACE y LA SANTARITEÑA).** Si hay una duda sobre un dato del texto (ej. "Nº 8 Folio 71" repetido entre dos escrituras de CAACE) o sobre un pago (ej. boleta GNB del 27/10 presentada el 18/11 para LA SANTARITEÑA), SIEMPRE se le escribe al cliente para consultar ANTES de reservarle la fecha. No se reserva ni se confirma mientras la duda siga abierta.
- **HORARIO DE ENVÍO (Eddy, 18/11/2026, "seguimos en fase de aprendizaje")** — reemplaza al "MODO AUTOMÁTICO PERMANENTE todo el día" del 13/11 en días hábiles.
  - **[ACTUALIZADO por Eddy, 18/11/2026, tarde — reemplaza el corte de las 19:00]** **De 07:00 a 14:59 (hora de Asunción): NO se envía nada.** Toda respuesta queda en BORRADOR con el KV (create_draft en el hilo), Label_8 "✋ HUGO - PULSAR ENVIAR", UNREAD e INBOX; el equipo la revisa y la envía a mano. El Pool se actualiza igual (presupuestado, pagos GNB/Sudameris) y se arman los CORREGIDOS.
  - **Desde las 15:00 y antes de las 07:00: MODO AUTOMÁTICO "out of office"**: Claude responde todo solo (reply en el hilo, KV, includeSignature false, Label_12 "🔎 REVISAR", envios_auto).
  - **Excepción:** si Eddy dice "respondele" en la conversación, se envía en el momento.
  - **Pasadas programadas:** :07 :17 :27 :37 :47 :57 de 7 a 19 (lun-vie) con la condición horaria (borrador hasta las 14:59, automático desde las 15:00); nuevas "Avisos nocturnos" (:17 de 20 a 23, lun-vie; rige el modo automático desde las 15:00) y "Avisos de madrugada" (:17 de 0 a 2, mar-sáb), automáticas; 03:03 madrugada y 06:45 apertura siguen automáticas. Sábado y domingo sin cambios.
- **MODO AUTOMÁTICO PERMANENTE** [REEMPLAZADO el 18/11/2026 en días hábiles de 07:00 a 14:59 por la regla HORARIO DE ENVÍO de arriba] (todos los días, hasta que Eddy diga lo contrario). Cada hilo respondido solo lleva la etiqueta Label_12 "🔎 REVISAR" (antes "Pendiente de procesamiento manual"; Hugo revisa si la respuesta automática estuvo bien — fase de aprendizaje) y se registra en envios_auto. §00 sigue por encima: ante la duda, borrador + alerta en el Tablero (formato de tarjeta del Tablero: titulo, cliente, codigo, tipo, prioridad urgente/hoy/normal, creado, vence, detalle, accion, gmail, solucionado:false).
- **COMENTARIO DE LA TRANSFERENCIA**: debajo de los datos del GNB va siempre "COMENTARIO de la transferencia: AV261113-09" (código sin guiones, en rojo). Usar `BANCOC(codigo, …)` en gen.py.
- **Plazo de 10 días**: se cuenta SIEMPRE desde la primera publicación (lunes 16 = día 1). Nunca desde la última.
- **Cambio de fecha confirmado por el cliente**: si el cliente confirma por correo una modificación (con documento nuevo), (1) verificar el documento, (2) guardarlo en Drive "Adjuntos clientes"/día con el nombre "MODIFICADO <dd-mm> - <empresa> - <archivo>" (SOLO si lo confirmó por correo), (3) responder recalcando que la convocatoria ha sido modificada y "Aguardamos el pago para procesar la publicación para esa fecha", (4) actualizar el Pool.
- **Respuesta al cambio confirmado según el pago**: si el cliente NO pagó → cerrar con "Aguardamos su pago para procesar la publicación para esa fecha" + importe, código, datos GNB y COMENTARIO. Si YA pagó (GNB) → "Publicación confirmada" con las fechas.
- **Ejercicio sin año**: si el texto dice "ejercicio cerrado el 31 de diciembre" sin año, se completa con el año anterior (hoy 2025) y se le avisa al cliente: «Como corresponde al ejercicio anterior, lo publicaremos como "ejercicio cerrado el 31 de diciembre de 2025". Si es otro año, avísenos antes de la primera publicación.» Si el cliente pone un año distinto del anterior, se le consulta.
- **Links en el Pool**: todo aviso cargado en el Pool lleva `thread_id` (link al correo) y `drive_url` (el archivo en Drive "Adjuntos clientes"; si hubo versión modificada, `drive_url` = la modificada y `drive_url_2` = la original). Buscar el archivo en la subcarpeta del día del correo.
- **SALUDO FORMAL (pedido de Luzana, 14/11/2026)**: el diario es jurídico y siempre se saluda con formalidad y abreviatura:
  - Título profesional si el cliente lo usa (firma, presentación o pie): «Estimado Dr. Fernando:», «Estimada Dra. Ana:», «Estimado Abog. …», «Estimada Lic. …», «Estimado Ing. …», «Estimada Esc. …» (escribana), «Estimado C.P. …», «Estimado Arq. …», «Estimado Prof. …», «Estimado Mg. …». Si firma con título, SIEMPRE se lo saluda con su título (nunca Sr./Sra.).
  - Sin título: «Estimado Sr. Edgar:» / «Estimada Sra. Mirta:».
  - Sr./Sra. y Dr./Dra. SOLO cuando el propio correo lo deja claro (cómo firma o se presenta, "Sra.", "Abogada", etc.). No se deduce el género solo del nombre de pila. Si no está claro o escribe una empresa o un estudio → «De nuestra mayor consideración:» (formal y neutro).
  - CON TÍTULO → título + APELLIDO: firma «Lic. Diego Varanda» → «Estimado Lic. Varanda:»; «Dr. Fernando Benítez» → «Estimado Dr. Benítez:». Si no se conoce el apellido, título + nombre.
  - SIN TÍTULO → Sr./Sra. + el nombre con que se presenta: firma solo «Mirta» → «Estimada Sra. Mirta:». Si firma con nombre y apellido sin título → Sr./Sra. + NOMBRE de pila («Estimado Sr. Cristhian:»), por defecto hasta que Eddy lo cambie.
  - Nunca «Estimado/a cliente».
- **CORRECCIÓN AUTOMÁTICA DE AVISOS (Eddy, 15/11/2026)**: reglas = doc pinned "Corrección de Asambleas — Diario Informaciones" (https://claude.ai/artifact/6jTV3HLvW7QoAWzRGGCE4F, pestaña "Pool de reglas de corrección", leer con Claude Docs). Cuándo: al confirmarse el pago de un aviso y cada vez que el cliente manda una versión nueva. Fuente: la ÚLTIMA versión del cliente (último archivo del hilo en Drive "Adjuntos clientes", la versión MODIFICADO, o el texto del correo si no hay archivo). Salida: Google Doc en Drive "Adjuntos clientes/ORIGINALES/CORREGIDOS" (id 1U9Qbsjx47OLvRMmi-2q9oP0s6YW28w3n) con nombre "CORREGIDO - <EMPRESA> - <tipo> <dd-mm> (AV-…)"; si ya existe uno para ese aviso, se reemplaza con update_file (nunca dos). Formato: nombre y tipo centrados en negrita, texto justificado, ORDEN DEL DIA centrado, lugar/fecha y firma a la derecha, línea "Op ____) d-MES" con el vencimiento. Al pie, en gris, la lista de correcciones aplicadas y la fuente. Lo dudoso NO se corrige: se subraya y se marca en rojo "(? Consultar: …)" y va a una tarjeta del Tablero. Nunca cambiar datos (nombres, fechas, horas, lugares). Pool: drive_url = corregido, drive_url_2 = original del cliente, campo corregido {fecha, consultar[]} y **corregido_bloques** = [{s, t}] con estilos AV_Nombre, AV_Tipo, AV_Texto, AV_OrdenDia, AV_Punto, AV_Derecha (lugar y fecha), AV_Firma, AV_OP (dudas como "[? Consultar: …]"). El botón "⬇ EXPORTAR A INDESIGN" del Diario del Pool arma con eso un Texto etiquetado de InDesign (.txt UTF-16) que Hugo coloca con Archivo → Colocar.
- **CARPETAS ORIGINALES / CORREGIDOS (Eddy, 15/11/2026, rige hasta nuevo aviso)**:
  - Todo lo que manda el cliente (adjunto, link de Drive, foto, o TEXTO escrito en el correo) se guarda TAL CUAL en Drive "Adjuntos clientes/ORIGINALES/<aaaa-mm-dd>" (carpeta ORIGINALES id 14rjd_HBXbUD8ZTr-tAoidPNRcK3w00V8). El texto del correo va como "<HHMM> - <asunto> - TEXTO DEL CORREO.txt". Lo hace el script v3; si el script no lo tomó, lo guarda Claude en la pasada.
  - La versión corregida por IA va en "ORIGINALES/CORREGIDOS/<aaaa-mm-dd>" (CORREGIDOS id 1U9Qbsjx47OLvRMmi-2q9oP0s6YW28w3n), en la subcarpeta de la FECHA DE LA PRIMERA PUBLICACIÓN (así Hugo arma la página de cada día). Si se mueve la fecha de publicación, se mueve el doc a la carpeta nueva. Reemplaza a la carpeta vieja "CORREGIDOS (Claude)".
  - **Hugo pide "exportar para InDesign"** → se le dan los CORREGIDOS (IA).
  - **Eddy/Luzana piden "imprimir para que Marta corrija"** → se exportan los ORIGINALES (Marta corrige SOLO desde lo que mandó el cliente). PDF con una hoja por aviso: código, cliente, fechas de publicación y el original tal cual (texto o imagen del archivo), espacio para que Marta marque a mano y firme.
  - **REGLA (Eddy, 18/11/2026, caso AV S.A. / Aquino+): los diarios que se envían a clientes se toman ÚNICAMENTE del correo enviado a Nelson Páez <nelpa90@gmail.com> (asunto "Diarios pdf"; búsqueda `in:sent to:nelpa90@gmail.com filename:pdf`). NUNCA se manda al cliente el PDF del correo "DIARIO" a solpresctp@gmail.com ni de otro correo. Si la edición pedida aún no está en un correo a nelpa90 → no se envía nada (Label_14 + UNREAD + INBOX + tarjeta en el Tablero, o esperar a que Claudio la mande a Nelson). Error del 18/11: a AV S.A. se le mandó la edición del 18/11 tomada de solpresctp; no correspondía.**
- **PEDIDOS DE DIARIOS / PUBLICACIONES YA SALIDAS (Eddy, 16/11/2026)**: cuando un cliente pide que le remitan el diario o las publicaciones ya publicadas (PDF de la edición), Claude NO responde (no tiene acceso a los diarios digitales): pone la etiqueta Label_14 "📰 HUGO - ENVIAR DIARIO" + UNREAD + INBOX y una tarjeta en el Tablero. Hugo lo envía a mano.
  - **ENVÍO DE DIARIOS CON AVISO RESALTADO (Eddy, 16/11/2026, caso BLAZFFER)** — reemplaza lo de abajo cuando se encuentran los PDF:
    1. Buscar los PDF ÚNICAMENTE en el correo enviado a Nelson Páez <nelpa90@gmail.com> (asunto "Diarios pdf", lo manda Claudio para la página web; trae varias ediciones): `in:sent to:nelpa90@gmail.com filename:pdf`. Nombre típico: "DIARIO <Día> dd-mm-aaaa.pdf". NUNCA usar el PDF del correo "DIARIO" a solpresctp@gmail.com ni de ningún otro correo. Si la edición pedida todavía no está en un correo a nelpa90 → no se envía nada: Label_14 + UNREAD + INBOX + tarjeta en el Tablero (o se espera a que Claudio la mande a Nelson).
    2. Verificar con pdftotext que el aviso (nombre de la empresa) esté en CADA edición.
    3. Imagen del aviso resaltado: `scripts/resaltar.py <pdf> <PALABRA> <salida.png> "Diario Informaciones · <día y fecha>"` (esquinas rojas, resto atenuado, franja con fecha y página). Va INLINE en el correo + los PDF adjuntos.

- **Ojo con resaltar.py (17/11, caso MIDA):** busca la palabra DENTRO de otras palabras ("MIDA" coincidió con "unanimidad") y puede marcar otro aviso o solo el título. SIEMPRE mirar la imagen antes de enviarla. Si sale mal, ubicar el aviso con `pdftotext -bbox-layout` (línea del nombre hasta la línea "Op …") y usar `scripts/resaltar_box.py` con `BOX=página,x0,y0,x1,y1`.
- **Varios avisos del mismo cliente en la misma página (Eddy, 18/11/2026, caso AV S.A. / Aquino+):** usar `scripts/resaltar_multi.py` con BOX de varias cajas separadas por ";" (`BOX="2,60,335,200,636;2,205,554,345,856"`) → UNA sola imagen con todos sus avisos marcados. Coordenadas: con `pdftotext -bbox-layout`, desde la línea del nombre (ej. "A.V. S.A.") hasta la línea "Op …) dd-XI" de cada aviso; ojo que el nombre impreso puede diferir del Pool (Pool "AV S.A." → impreso "A.V. S.A."), buscar por dirección/orden del día. Envío: `send_message` con `replyToMessageId` del último mensaje del cliente, to = remitente, cc = los demás del hilo (reply NO acepta adjuntos por referencia sha256; send_message sí), imagen inline cid:att0 + PDF adjunto. Si ya tenemos el RUC en el Pool, no pedirlo.
    4. **Identidad**: confirmada si el pedido llega del MISMO correo/hilo que contrató la publicación. Igual, SIEMPRE pedirle el RUC de la empresa "para nuestros registros". Si el pedido viene de otro correo o sin historial: primero pedir el RUC y razón social, comparar con el aviso/Pool, y recién entonces enviar.
    5. **Horario**: FUERA del horario de atención (L-V después de 14:00, fines de semana) → enviar directo al cliente (send_message con file refs, threaded). DENTRO del horario → borrador con todo adjunto + Label_14 + tarjeta para Hugo.
  - **PIDEN LOS DIARIOS Y ADJUNTAN LA FACTURA (Eddy, 16/11/2026, caso BLAZFFER)** (si NO se encuentran los PDF): NO se responde ni se hace borrador. Solo etiqueta Label_14 "📰 HUGO - ENVIAR DIARIO" + UNREAD + INBOX y tarjeta en el Tablero (con las fechas de publicación si las encuentro). Hugo lo revisa al día siguiente y responde él. **TEMPORAL**: rige hasta que encontremos de dónde sacar el PDF del diario para enviarlo automáticamente (pista: Claudio manda los PDF a nelpa90@gmail.com con asunto "Diarios pdf" para subirlos a la web).
  - **CÓMO SE RESPONDE (modelo de Claudio, 16/11/2026)** (cuando NO mandan factura): Claude deja un BORRADOR listo para enviar (sin notas internas) en el mismo hilo, con este texto:
    > Buen día, puede ver y descargar los diarios en PDF de nuestra página web en la sección de ARCHIVO, haciendo clic en la fecha de edición de su publicación dentro del calendario que le aparecerá en ese apartado: http://www.editorialinformaciones.com/archivo
    - Si Claude encuentra en Gmail/Pool las fechas de publicación de esa sociedad, las agrega: "Su publicación salió los días …".
    - Si NO puede ubicar la publicación de alguna sociedad, agrega: "Necesitamos el RUC de <SOCIEDAD> para localizar su publicación." (como hizo Claudio con MoSA).
    - Saludo formal según la regla de saludos; firma del diario (KV), sin nombre de persona.
    - Hugo/Claudio adjunta los PDF de los diarios que sí tiene y pulsa Enviar. Etiquetas: Label_14 + UNREAD + INBOX + tarjeta en el Tablero.
- **PEDIDOS DE FACTURA (Eddy, 16/11/2026, casos JCB y Finanzas y Terrenos)**: cuando el cliente pide/reclama la factura, NO se responde (la factura se hace a mano). Solo tarjeta tipo "factura" en el Tablero con el correo del cliente y la publicación; el hilo queda como está.
- **ACTITUD DE VENTA SIEMPRE (Eddy, 16/11/2026, caso Consulting DO)**: en cada respuesta, ser un buen vendedor: que el cliente QUIERA publicar con nosotros. Tono cordial y servicial ("queremos ayudarle a que salga a tiempo", "con gusto lo atendemos"), invitar a confirmar cuanto antes.
  - **Consultas de precio/fecha SIN texto**: NO prometer una fecha concreta. Decir que "estamos tomando publicaciones a partir del <próxima fecha real>" y que **la fecha se asegura únicamente con el pago**, por orden de llegada.
  - **Siempre advertir los 10 días** desde la PRIMERA publicación hasta la asamblea, con un ejemplo concreto ("si comenzamos el miércoles 18, la asamblea debe ser el sábado 28 o posterior") y ofrecer verificar su fecha.
  - **Pedir el texto "para poder cotizarle con precisión"**: solo con el texto sabemos los temas y revisamos que cumpla la ley. Dar la tarifa de referencia (desde Gs. 150.000 por 5 días, 1-5 temas) pero aclarar que el exacto sale con el texto.
- **BORRADORES SIN NOTAS INTERNAS (Eddy, 16/11/2026, tras el error REFLEX)**: un borrador SIEMPRE debe poder enviarse tal cual al cliente. NUNCA poner en el borrador "[HUGO: …]", "completar", "NO ENVIAR" ni ninguna nota interna. Si falta un dato que solo sabe el diario (p. ej. un precio), NO se hace borrador: solo tarjeta en el Tablero con el texto sugerido, y Hugo escribe la respuesta.
- **PAGOS: GNB o Sudameris (Eddy, 18/11/2026, casos M360 y CAACE).** Además del correo del GNB, se acepta como pago un print/boleta del cliente de una transferencia o depósito a la **cuenta SUDAMERIS de Luzana Benavides Ortega** (caja de ahorro 251416098 / 25-1416098), SOLO Sudameris.
  - Si el comprobante coincide con el cliente (empresa, monto exacto, concepto, o el correo que lo acompaña nombra los avisos) → se toma como pago y SE RESERVA la fecha (confirmación al cliente, Pool confirmada).
  - Si no coincide → queda pendiente y NO se reserva.
  - SIEMPRE (haya o no coincidencia) se crea tarjeta en el Tablero con título "VERIFICAR PAGO SUDAMERIS — <cliente> Gs. <monto>" (tipo `verificar_pago_sudameris`) para que Luzana confirme que el dinero entró.
  - Cualquier pago que no sea GNB ni Sudameris (otro banco, boleta vieja, depósito en ventanilla sin aviso) → NO se confirma; se consulta al cliente + tarjeta `verificar_pago`.
- **Verificar pago sin GNB**: tarjeta urgente para Luzana en el Tablero; Hugo o Claudio marcan "verificado"/"no_llego".
- **CADA CORREO DEL GNB SE BUSCA ACTIVAMENTE (Eddy, 18/11/2026, caso FAQ PAR): cada vez que llega un correo del GNB (noreply@bancognb.com.py o Transferencias@bancognb.com.py), SIEMPRE hay que buscar a qué aviso/cliente corresponde, aunque el cliente no haya mandado comprobante ni escrito.** Cruzar con el Pool (presupuestados sin pago) por código, nombre del ordenante e importe. Solo importe sin nombre ni código → NO escribir al cliente (pagos_sin_asignar + Tablero). Detalle en §13 "Búsqueda activa".
- **Hugo puede adelantar a mano** un aviso pagado el día anterior si el diario tiene lugar; su fecha manda. El cierre manual de un día en el Pool es la palabra final.
- **Sábado mismo día**: excepción solo si el sábado no está cerrado y tiene menos de 30 lugares → borrador + alerta urgente.
- **Lugares**: 40 lugares de 15 cm por día. Asamblea/aviso normal = 1; marca con logo = ½; marca sin logo = ⅓ (campo `logo` en el aviso; si no se sabe, ½).
- **Horarios**: hábiles 06:45, cada 10 min 6:57–14:57, 17:17, 19:17, control 23:45; madrugada 03:03 (lun–sáb); sábado 8–15, 18, 21; domingo sin pasadas.

## 0. SUSPENSIÓN TOTAL DE ENVÍOS (Eddy, 10/11/2026), prioridad máxima, hasta nuevo aviso
**PRUEBA DE RESPUESTAS AUTOMÁTICAS (Eddy, 13/11/2026):** la suspensión se levanta **del viernes después de las 14:00 hasta el sábado a las 23:59**, cuando el equipo no trabaja. En ese lapso rige **§0 ter completo**: se envían solos los presupuestos, "fecha no disponible", "faltan datos", "comprobante recibido" o la confirmación con GNB, el "Recibido" a los estudios y la consulta de Ord/Ext. Siempre aplica §00: **ante la duda, borrador**. Cada envío se anota en `envios_auto` y queda una tarjeta resumen en el Tablero para que Hugo lo supervise el lunes a la mañana. **El domingo y de lunes a viernes en horario se vuelve al modo borrador.** La prueba vale para cada fin de semana hasta que Eddy diga lo contrario.
**No se envía NADA a ningún cliente, ni dentro ni fuera de horario.** Todo queda como **BORRADOR** en el hilo, con el diseño del KV y Label_8, más UNREAD e INBOX. **Hugo los envía a mano** cuando llega su horario. §0 ter (envío automático fuera de horario) y el "Recibido" automático a los estudios quedan **SUSPENDIDOS**: a los estudios también se les deja borrador. Motivo: "hasta que aprendas mejor las reglas y los precios y estemos más confiados". Solo Eddy levanta esta regla.

**Reglas de fechas y pagos (Eddy, 10/11/2026, por ahora):**
- **No prometer fechas.** Aunque el cliente ya haya pagado, la confirmación de pago NO lleva fechas de publicación. Solo se le da fecha si el cliente pregunta expresamente cuándo sale su aviso.
- **En todo presupuesto y respuesta** se le recuerda al cliente que **debe abonar para que le guardemos una fecha próxima**. Sin pago no hay lugar reservado. Los presupuestos tampoco llevan "Fechas propuestas".
- **"Hemos recibido su pago" lleva el comprobante en el hilo.** El comprobante del cliente (o la imagen del aviso GNB) tiene que quedar a la vista en esa respuesta como adjunto, para que el hilo sea el registro del pago. A Eddy le gusta así.

- **UN correo del cliente = UNA respuesta que contempla TODOS sus archivos (Hugo y Eddy, 10/11/2026).** Si un correo trae 2 o más avisos (adjuntos o texto), se hace un solo borrador. Ese borrador lista cada aviso con su precio y su código, y lleva el total. Nunca un borrador por archivo.
  - **Volumen (Hugo):** un correo puede traer hasta 40 archivos, o un solo archivo de 40 páginas con muchos avisos. Hay que leer TODOS los archivos y TODAS las páginas, sin cortar en el primero. Contar los avisos que salen y armar una tabla con cada uno (empresa, tipo, temas o líneas, precio, código), el total y cuántos avisos son.
  - Si algún archivo o página no se pudo leer, decirlo en la tarjeta del Tablero y no cotizar a medias.
- **Cada correo es independiente; nunca acoplar (Eddy, 10/11/2026).** Lo que llega en correos DISTINTOS no se suma ni se menciona entre sí. Cada correo se responde por separado, en su propio hilo, aunque parezca del mismo cliente. Cada asamblea tiene su presupuesto, su pago y su correo propios. No se suman totales ni se mencionan otros pedidos: nada de "Ordinaria + Extraordinaria: Gs. 300.000 en total". Cada respuesta habla solo del aviso de ese correo.

- **Presupuestos sin pago vs. pagos (Eddy y Hugo, 10/11/2026).**
  - Poner "Disponibilidad" en el presupuesto está bien.
  - Todo lo que se pagó a la tarde o fuera de hora sale al día siguiente. A las 7:00 Hugo revisa lo pagado y lo incluye si entra.
  - Un presupuesto sin pago no tiene fecha asegurada: se corre al día siguiente disponible. Ejemplo: presupuestado el lunes a la tarde y sin pago a la mañana del martes → se intenta el miércoles.
  - **Si pagó:** borrador "Hemos recibido su pago", que Hugo envía.
  - **Si no pagó:** correo **"AGUARDAMOS SU PAGO"**, que **SÍ se envía automáticamente, sin esperar a Hugo** (única excepción a la regla de no enviar).
    - Va en la pasada de las 06:45, a cada presupuesto del día anterior sin pago acreditado.
    - Una sola vez por presupuesto; se registra en envios_auto.
    - Diseño KV, respondiendo en el hilo del presupuesto.
    - Texto: seguimos aguardando su pago; la fecha se reserva recién cuando se acredita, por orden de llegada; repetir importe, código y datos de la cuenta.
    - Sin prometer fecha concreta.
    - NUNCA a los estudios (Berke, Abente), que pagan por estado de cuenta.
    - Nunca a quien ya mandó comprobante.

- **FECHA TENTATIVA en presupuestos (Eddy, 10/11/2026).** Reemplaza el "no prometer fechas".
  - El presupuesto muestra **"Fecha tentativa: <día>"**.
  - **DOMINGO SIEMPRE CERRADO (Eddy, 13/11/2026):** los domingos no se toman publicaciones. En el Pool el domingo aparece **CERRADO por defecto** (el diseñador puede reabrirlo a mano). Nunca se ofrece ni se confirma un domingo como fecha de inicio ni como fecha tentativa: se pasa al **lunes**. Las publicaciones que ya están corriendo siguen saliendo el domingo (días corridos). Por eso, un presupuesto hecho el sábado lleva como fecha tentativa el lunes.
  - **Corrección de Eddy (10/11):** si el presupuesto sale EN HORARIO (antes del cierre) y el día siguiente NO está CERRADO en el Pool, la fecha tentativa es MAÑANA, porque todavía puede pagar hoy.
  - Solo los presupuestos de la tarde o de fuera de horario (que se procesan a la mañana siguiente) se corren un día más, según la regla de Hugo.
  - Mientras el diseñador no cierre el día, se ofrece ese día.
  - Debajo, siempre esta aclaración: *"Esta fecha es tentativa. Únicamente podremos confirmarle una fecha una vez que nos envíe su comprobante de pago."*
  - **NO ACLARAR HORARIOS DE CORTE (Eddy, 18/11/2026, caso Ferrere):** no hace falta decirle al cliente que lo que entra antes de las 18:00 sale mañana, ni poner horas límite ('hoy antes de las 14:00', 'antes de las 18:00') ni prometer que sale al día siguiente. En el presupuesto va la fecha tentativa y la frase 'Únicamente podremos confirmarle una fecha una vez que nos envíe su comprobante de pago.': la fecha de inicio se le asegura DEFINITIVAMENTE recién cuando recibimos el pago (en la confirmación de pago). SÍ se le dice que hay lugar disponible (ej. 'contamos con disponibilidad para el jueves 19'), pero NO hasta qué hora puede mandar el pago o los textos. Si el cliente no mandó los textos, decir que los aguardamos para poder cotizar.
  - La confirmación de pago tampoco promete fecha, salvo que el cliente la pregunte.

- **Qué es UNA LÍNEA (Eddy, 10/11/2026, unifica el criterio).**
  - Una línea es una línea del cliente, tal como manda su aviso (Word, PDF, texto en el correo), medida en **tamaño estándar: 12 pt en hoja A4 con márgenes normales, unos 85 caracteres por línea**.
  - Si el cliente usó letra chica (por ejemplo 6 u 8 pt) para meter más texto en menos líneas, se recalcula a tamaño estándar: cada párrafo ocupa caracteres ÷ 85 líneas, redondeado hacia arriba.
  - En docx o PDF, revisar el tamaño de letra; si es menor a 10 pt, avisarle a Hugo en el borrador.
  - Se cuenta desde "Por escritura" hasta el final.
  - `presupuestador.py` ya usa este criterio (`CARACTERES_POR_LINEA = 85`).

- **A qué avisos aplica la regla de la línea (Hugo, 10/11/2026).**
  - **Aplica** (los clientes mandan cualquier tamaño de letra, se unifica por línea estándar): constitución, modificación de estatuto y comunicados.
  - **Asambleas: NO se cobran por línea.** Se cobran solo por la cantidad de temas a tratar del orden del día (Eddy, 10/11/2026), sin importar el largo del texto.
  - **EL TÍTULO YA DICE QUÉ ASAMBLEA ES (Eddy, 17/11/2026, caso QUENA S.A. de Jauser)**: si la convocatoria tiene como título o subtítulo "Asamblea General Ordinaria" o "Extraordinaria", el texto **no necesita repetirlo** ni decir "se convoca a…". Frases como "El Directorio resuelve que **la misma** se lleve a cabo el día…" son válidas porque "la misma" se entiende por el título. **No** se consulta al cliente, **no** se propone otra redacción y **no** se marca "(? Consultar …)" en el corregido. Error del 17/11: a QUENA S.A. se le propuso reescribir el inicio sin necesidad. **Regla general (Eddy, 17/11):** no se le sugiere al cliente cambiar la redacción de su texto. Solo se consulta por errores de DATOS (fecha o día de la semana que no coincide, nombre de otra empresa, punto vacío, falta de fecha, hora o lugar). Si el cliente responde a una consulta de redacción, se publica su texto tal cual.
  - **LUGAR "EN LA SEDE SOCIAL" / "DOMICILIO SOCIAL" / "DOMICILIO FISCAL" ES VÁLIDO (Eddy, 17/11/2026, caso PENCO S.A. de Baker Tilly)**: si la convocatoria dice que la asamblea se hará en la sede social, el domicilio social o el domicilio fiscal, **NO** hace falta la dirección completa. **No** se la pide al cliente, **no** se marca como "falta dato", **no** se pone "(? Consultar dirección)" en el corregido y **no** frena la confirmación. Solo se pide la dirección cuando la convocatoria no dice NADA sobre el lugar.
  - **SUB-ÍTEMS CUENTAN COMO TEMAS (Eddy, 16/11/2026, caso BOXES AUTO SPA)**: cada sub-ítem (a, b, c, d… o 2.1, 2.2…) es un ítem más del orden del día. Ejemplo: 1, 2, 2a, 2b, 2c, 2d, 3 = **7 temas** → Gs. 170.000 (5 días). En el presupuesto y en el Pool se escribe la cantidad real de temas contando los sub-ítems (nunca "3 puntos" si hay sub-ítems).
  - **No aplica** (precio fijo, no se cuentan líneas): transferencias de marca, licencias de uso y denuncias policiales.
  - **Cooperativas:** suelen ser muy largas. NO se cotizan automáticamente. Pasan primero por diseño y después se define el precio. Dejar un borrador "Recibido, en breve le enviamos el presupuesto", avisarle a Hugo y no inventar monto.
  - **Licencias de uso (Hugo, 10/11/2026):** Gs. 88.000 POR CADA expediente (Hugo, 10/11), 1 día de publicación. Llegan como las marcas y transferencias, casi siempre de los estudios Berkemeyer o Abente Stewart. A ellos NO se les dice fecha ni precio: solo "Recibido".

- **REGLA POR DEFECTO: TODO LO QUE NO CIERRA VA AL TABLERO DE PENDIENTES (Eddy, 10/11/2026).**
  - Ante cualquier duda, se crea una tarjeta en el Tablero (https://claude.ai/artifact/Kv8tDTU625WrFrJ2qAFA5S): un nombre que no coincide, un importe distinto, un comprobante que no se pudo leer, un plazo legal justo, un dato faltante, un archivo ilegible o un caso no previsto.
  - La tarjeta dice qué no cierra y qué hacer. Para pagos se usa tipo "verificar_pago" con prioridad urgente.
  - Nunca se resuelve en silencio ni se deja solo en el resumen del chat.

- **Saludo fijo (Eddy, 10/11/2026).** Nunca "Buen día", "Buenas tardes" ni "Buenas noches". Siempre **"Estimado Sr. <Apellido/Nombre>:"** o **"Estimada Sra. <Nombre>:"**. Si no se sabe el nombre o el género: "Estimado/a cliente:".

- **Pedidos de copia de factura o constancia de una publicación anterior** (Eddy, 10/11/2026). Ejemplo: una escribanía pide la factura escaneada de una asamblea de 2024.
  - Se le deja un borrador KV con el preset `solicitud_factura`: "Recibimos su solicitud… estamos buscando la factura en el archivo… apenas la ubiquemos le enviamos la copia". Se dice "Copia de la factura", nunca "copia escaneada". La tabla lleva empresa, RUC, tipo, fecha y edición.
  - Al hilo se le pone Label_8, UNREAD e INBOX.
  - En el Tablero de Pendientes va una tarjeta tipo "buscar_factura" con prioridad **urgente (ROJO)**, para que el operador busque la factura a mano.
  - Claude NO busca ni inventa la factura, y no promete un plazo.

- **REGLA GENERAL DE PAGO (Eddy, 10/11/2026):** cuando el comprobante del cliente coincide con el correo del GNB, el cliente PAGÓ y **ya se le asegura la fecha**.
- **EXCEPCIÓN — pagó, pero la fecha de la asamblea no cumple los 10 días** (Eddy, 10/11/2026, caso Ganadera E2). Es el único caso en que un pago verificado NO asegura la fecha. Va en ROJO porque la asamblea choca con la condición de los 10 días.
  - El pago se confirma, pero NO se le guarda lugar en ninguna edición, aunque haya espacio.
  - En el borrador, la "Primera edición disponible" va como **"Indefinido (<día tentativo>)"**.
  - Se le explica que la asamblea no llega a los 10 días del Art. 1082 y que debe CAMBIAR la fecha de la asamblea y enviar el texto corregido. Recién entonces se le asegura lugar.
  - En el Pool queda con estado "pagado_sin_fecha" y fechas vacías. En el Tablero va una tarjeta roja.

- **El cliente cambia la fecha de la asamblea por correo** (Eddy, 11/11/2026, caso Ganadera E2).
  - En el Drive ("Adjuntos clientes") se crea el documento corregido con la nueva fecha. El nombre es "<EMPRESA> - CORREGIDO - <tipo> <nueva fecha> (<código>)".
  - El texto es idéntico al original y solo cambia la fecha (y el día de la semana).
  - El PDF original no se toca, porque no se puede editar.
  - En el Pool, `drive_url` apunta al CORREGIDO y `drive_original` al PDF. También se actualizan `texto` y `fecha_asamblea`.
  - Así el diseñador arma la edición con la fecha correcta.

- **NOMBRES DE ARCHIVOS EN EL DRIVE** (Eddy, 11/11/2026): todo archivo que crea Claude **EMPIEZA con el nombre de la empresa** y después va el resto de la información.
  - Ejemplos: "GANADERA E2 S.A. - CORREGIDO - Asamblea Extraordinaria LUNES 23-11 (AV-261109-05)" y "DE JAPON S.A. - TEXTO DEL CORREO - modificación de estatuto (AV-261110-06)".
  - Esta regla reemplaza los formatos anteriores "TEXTO DEL CORREO - empresa…" y "CORREGIDO - empresa…".

- **TABLERO: toda tarjeta lleva el botón "Abrir correo"** (Eddy, 11/11/2026). Cada tarjeta que se crea en `pendientes` TIENE que llevar el campo `gmail` con el enlace al hilo: `https://mail.google.com/mail/?authuser=diarioinformacionespy@gmail.com#all/<threadId>`. Esto vale solo cuando HAY un correo asociado. Si la tarjeta no sale de ningún correo (por ejemplo, un resumen interno o un aviso presencial), va sin enlace.

- **RESPUESTAS QUE HUGO MANDA A MANO → TAMBIÉN AL POOL** (Eddy, 11/11/2026). En cada revisión se leen los correos ENVIADOS desde la última revisión (`in:sent`), no solo los recibidos. Por cada uno:
  - Si es un presupuesto (precio, días): el aviso se carga o actualiza en el Pool como sin_pago, con el total y la nota "cotizado por Hugo a mano".
  - Si confirma un pago o fechas ("Recibido. Las publicaciones estarán siendo publicadas a partir del…"): el aviso pasa a confirmada con esas fechas exactas.
  - Si responde un hilo que tenía borrador de Claude con Label_8: se anota que ya se respondió. El borrador sobrante NO se borra; se avisa para que lo descarten.
  - Si Hugo puso precios o fechas distintos a los del borrador, manda lo que puso Hugo, y se anota la diferencia para aprender.
- **Texto de confirmación de Hugo** (modelo, 11/11/2026): "Recibido. Las publicaciones estarán siendo publicadas a partir del <inicio> al <fin>. Las facturas electrónicas se enviarán automáticamente a su correo en un plazo máximo de 24 horas desde (facturacion@editorialinformaciones.com). Recomendamos estar pendiente a la bandeja de no deseados (SPAM). En caso de no recibir favor ponerse en contacto para enviarlas manualmente desde este correo." Las confirmaciones de pago de Claude llevan esa información: fechas, plazo de 24 h, remitente facturacion@ y el aviso de revisar SPAM.

- **SPAM** (Hugo, 11/11/2026). Claude NO puede ver la carpeta de spam: Gmail la oculta a las herramientas por seguridad.
  - Si un cliente cae en spam, Hugo pulsa "No es spam" y el correo vuelve a la bandeja de entrada.
  - Como ese correo conserva su hora original, en cada revisión, además de lo de los últimos 10 minutos, se buscan los NO LEÍDOS de la bandeja de entrada de las últimas 48 h que no tengan respuesta ni borrador (`in:inbox is:unread newer_than:2d -from:me`). Así se responden los rescatados de spam.
  - Solución de fondo: un filtro de Gmail "No enviar nunca a spam" para los correos que llegan a la casilla.

- **ASAMBLEAS DE FUNDACIONES** (Eddy, 16/11/2026, caso Fundación Marco Aguayo): mismo precio que una S.A. (tabla por temas), PERO en el presupuesto se especifican los días a publicar con el precio por separado: "Publicación por 3 días: Gs. X / Publicación por 5 días: Gs. Y" (ej. 1-5 temas: 3 días 140.000 · 5 días 150.000) y se le pide al cliente que indique por cuántos días quiere publicar.
- **ASAMBLEAS DE ASOCIACIONES** (Hugo, 11/11/2026, caso APEJA): se cotizan IGUAL que las de S.A.: misma tabla por temas y 5 días de publicación (1 a 5 temas = Gs. 150.000).
- **Correos rescatados de spam:** el guardado automático puede tardar hasta la siguiente vuelta en subir los adjuntos al Drive (APEJA tardó ~1 h). Si el adjunto no está, se deja el borrador de recepción y se presupuesta cuando aparezca.

- **SI HUGO YA RESPONDIÓ A MANO, NO SE REDACTA ENCIMA** (Eddy, 11/11/2026).
  - Antes de crear un borrador, se revisa el hilo. Si después del último mensaje del cliente ya hay una respuesta enviada por el diario (Hugo, Claudio u otro), NO se crea borrador ni se "mejora" lo que dijeron.
  - Solo se actualiza el Pool con lo que pusieron.
  - Se vuelve a escribir solo cuando el cliente manda un mensaje NUEVO después de esa respuesta.

- **Orden del día compartido:** cuando un estudio contable manda varias empresas en un mismo detalle y una empresa termina en "para tratar el siguiente:" sin orden del día propio, comparte el ORDEN DEL DÍA que aparece a continuación (el de la empresa siguiente). NO se le pregunta al cliente ni se anota nada para el diseñador: lo entiende al ver el anuncio.

- **Verificar SIEMPRE el tipo de asamblea contra el orden del día (Código Civil, Ley 1183/85):** antes de presupuestar o confirmar, leer cada punto del orden del día y compararlo con el tipo que puso el cliente.
  - Art. 1079, ORDINARIA: memoria, balance, cuenta de resultados, distribución de utilidades, informe del síndico, elección o remoción de directores y síndicos, remuneraciones, aumento de capital y emisión de acciones DENTRO del capital autorizado (Ley 388/94).
  - Art. 1080, EXTRAORDINARIA: modificación del estatuto, aumento de capital fuera del autorizado, reducción o reintegro del capital, fusión, transformación, escisión, disolución anticipada, rescate, reembolso o amortización de acciones, emisión de debentures y bonos, limitación del derecho de preferencia.
  - Art. 1082: la primera publicación debe salir al menos 10 días antes de la asamblea, y la extraordinaria puede convocarse junto con la ordinaria el mismo día a horas distintas.
  - **Tema de Extraordinaria dentro de una Ordinaria (Eddy, 13/11/2026; versión final):**
    1. **Primero se CONSULTA, en el primer correo**, en el momento en que se detecta (no después): "Detectamos que el punto X (ej.: modificación de estatutos) corresponde, según el Código Civil (Art. 1080), a una Asamblea Extraordinaria. ¿Nos confirma si ese punto es correcto?"
    2. **En ese mismo correo se manda ya la cotización nueva**: si el punto es correcto, corresponden **dos asambleas (Ordinaria + Extraordinaria) y por lo tanto dos avisos**, cada uno con su código, su precio y su fecha tentativa.
    3. Se cierra con **"Aguardamos su respuesta para poder proceder"**. No se publica nada hasta que responda, salvo lo del punto 4.
    4. **Si ya pagó la Ordinaria:** hay margen hasta la mañana siguiente (antes de que el diseñador cierre la página) para que responda. Se le dice para qué día queda reservada su Ordinaria. **Si no responde dentro de ese margen, se publica la Ordinaria tal cual**, y esto se le avisa en el mismo correo.
    5. **Si la asamblea justo alcanza los 10 días (Art. 1082)** y no hay margen para esperar la respuesta: se le notifica que **debe cambiar la fecha de la asamblea** para poder hacer las cosas bien (y, si corresponde, las dos asambleas).
    6. **El cliente tiene la palabra final.** En días hábiles (lunes a viernes hasta las 14:00 y noches de lunes a jueves) va en **BORRADOR** para Hugo (regla §00), con tarjeta en el Tablero.
    7. **EXCEPCIÓN FIN DE SEMANA (Eddy, 13/11/2026, ACTIVA YA):** viernes después de las 14:00, sábado y domingo (cuando el diario no trabaja), esta consulta **SE ENVÍA AL CLIENTE EN EL MOMENTO**, con el KV y Label_9, para que tenga respuesta en tiempo real. Se registra en `envios_auto` y se deja una **tarjeta en el Tablero de Hugo para el lunes a la mañana** ("supervisar: consulta Ord/Ext enviada el sábado"). El lunes el equipo solo supervisa lo que se hizo. Esta excepción cubre SOLO esta consulta; cualquier otra duda sigue en borrador.
  - **CHECKLIST DE REVISIÓN DE TODA ASAMBLEA (Eddy, 13/11/2026).** Se revisa siempre y se le avisa al cliente EN EL PRIMER CORREO apenas se detecta:
    1. **Ordinaria y Extraordinaria de la misma empresa el mismo día:** se permite, pero **a horas distintas** (con horas de diferencia). Si vienen a la misma hora o con horarios que se superponen, se le advierte que debe separarlas.
    2. **Ejercicio del balance:** se trata el **ejercicio vencido (el año anterior)**. En 2026 se tratan los balances de 2025; en 2027, los de 2026. Si el texto trae un año viejo (ej.: en 2026 dice "ejercicio 2024" solo), probablemente reutilizaron un aviso anterior: se le pregunta si el año es correcto. Varios ejercicios juntos (ej.: 2024 y 2025) pueden ser válidos si están atrasados; igual se confirma.
    3. **Temas cruzados:** los temas de Ordinaria (Art. 1079) no van en una Extraordinaria, y los de Extraordinaria (Art. 1080) no van en una Ordinaria. Si aparece cualquiera de los dos casos, se aplica el procedimiento de la consulta (ver punto siguiente).
    4. **Ortografía y estilo (lo pule el armado del aviso, sin cambiar el contenido):**
       - Lo que viene TODO EN MAYÚSCULAS se pasa a minúscula normal, salvo títulos del aviso, nombres propios, razón social y siglas (S.A., RUC).
       - Los **cargos van con mayúscula inicial**: Presidente, Secretario/Secretaria, Síndico, Director, Directorio, Vicepresidente.
       - Títulos y tratamientos abreviados: **Dr.** (Doctor), **Dra.**, **Lic.**, **Abog.**, **Ing.**, **C.P.**, con punto.
       - Tildes y errores de tipeo evidentes se corrigen. Datos (fechas, horas, montos, nombres, RUC) **nunca** se cambian sin confirmar con el cliente.
  - Es VÁLIDO que una misma empresa convoque dos asambleas el mismo día a horas distintas, incluso dos Ordinarias (Luzana, 11/11). Cada una es un aviso aparte, con su precio y su código. NO se observa ni se le pregunta al cliente por eso; solo se revisa que cada orden del día corresponda a su tipo.
  - Ante dudas, buscar el texto vigente en la web (bacn.gov.py, pj.gov.py, leyes.com.py) y citar el artículo. Si la red de la sesión no deja abrir esos sitios, usar los resúmenes de esta lista.

- **No se pide acta de directorio:** para publicar una convocatoria (también extraordinaria de S.A.) alcanza con el TEXTO de la convocatoria (Word, PDF o en el cuerpo del correo). Confirmado por Luzana el 12/11.

- **Nota anexa de las asambleas (Luzana 12/11):** el precio de S.A./asociación es Gs. 150.000 hasta 5 puntos del orden del día, PERO si la nota final ("Se recuerda a los señores accionistas…", depósito de acciones, etc.) supera los 3 renglones, se suma Gs. 10.000. Contar los renglones de la nota (85 caracteres por renglón) en cada presupuesto y avisarlo siempre en las referencias de precio, para que el cliente no se encuentre con un adicional.
  - **[REEMPLAZADO por las reglas de Claudio del 19/11 en §00 bis: >3 líneas 10.000 · >5 20.000 · >8 30.000 · >11 40.000]** Escalones (Eddy, 17/11/2026, caso SOL DEL PARAGUAY S.A.): el costo = precio por temas del orden del día + adicional por la nota. Nota de **hasta 3 líneas: sin adicional** · **más de 3 líneas (4 o 5): + Gs. 10.000** · **6 líneas: + Gs. 20.000**. Más de 6 líneas: no está tarifado → ante la duda, borrador para Hugo. Líneas = caracteres de la nota ÷ 85, redondeado hacia arriba. Se cuenta la nota u observación final (lo que va después del orden del día: depósito de acciones, requisitos para participar, etc.), no el cuerpo de la convocatoria.
  - **En el presupuesto se muestra el desglose**: "X temas: Gs. …" + "Nota de N líneas: + Gs. …". **Error del 17/11:** a SOL DEL PARAGUAY S.A. (nota de 297 caracteres = 4 líneas) se le cotizó Gs. 150.000 sin el adicional; correspondía Gs. 160.000. Revisar SIEMPRE la nota antes de enviar un presupuesto de asamblea.

## 0.1 REGLA GENERAL DE LA DUEÑA (Luzana Benavides, 06/11/2026) — tiene prioridad sobre todo lo demás

1. **Domingo:** no se inician publicaciones. Se arranca el **lunes**.
2. **Sábado:** en época de poco trabajo no se atiende. Lo que se pide el **viernes** ya se ofrece **desde el lunes**. (En `pool_fechas.py`: `TEMPORADA_BAJA = True`; en el pool: `config/general.temporada_baja`.)
3. **Asambleas:** se publican **5 días**, pero el espacio se controla **hasta 3 días**: alcanza con que los primeros 3 días tengan lugar (`DIAS_CONTROL_ESPACIO = 3`).
4. **Cupo:** cada fecha tiene una cantidad de lugar; cuando se sobrepasa, **se designa la fecha siguiente**. Hoy el cupo se maneja en forma física: en el pool lo refleja el diseñador marcando el día **CERRADO**.
5. **Orden de llegada y pago:** la fecha se garantiza solo con el pago acreditado; al cerrarse el día, los que no pagaron reciben la próxima fecha disponible.


## 0 bis. OPERATIVA EN MARCHA (aprobada por Eddy, 09/11/2026)

**En horario de atención** todas las respuestas se dejan **en borrador** (fuera de horario rige §0 ter), en el hilo del cliente, con el diseño del KV (`correo_kv.py`), que ya trae el **banner de la firma en pequeño (300 px) justo debajo de "Equipo de Avisos"**. Crear el borrador con `includeSignature: false` para que la firma no se repita al final del hilo citado. Nunca se envía: una persona revisa y envía.

**Paso 1 · El cliente manda el modelo de su nota (texto, Word o PDF)**
1. Leer la nota. Si es asamblea, **revisar primero la fecha**: ítems de ley (fecha, hora, lugar, orden del día, ordinaria/extraordinaria) y plazo de 10 días según el Pool de Espacios (`pool_fechas.asignar`).
2. **Si está correcta** → borrador **"Presupuesto"**: el texto dice que está correcta y que **aguardamos el pago para publicarla**; lleva el precio, la fecha tentativa del pool y el **código de pedido `AV-AAMMDD-NN`**, que el cliente debe poner en el concepto o comentario de la transferencia.
3. **Si no está correcta** → borrador **"Fecha no disponible"** (no cumple el plazo, con la fecha mínima) o **"Faltan datos"** (lo que falta). No se cotiza hasta que esté bien.
4. Cargar el aviso en el pool como `sin_pago`, con su código, contacto, email, thread_id y hora de llegada.

**Paso 2 · El cliente manda el print del pago**
1. El aviso pasa a `pago_informado`.
2. Buscar el aviso de transferencia del banco (`pagos.py`): por código; si no hay código, por nombre e importe.
3. **Si el pago está acreditado** → aviso `confirmada` y borrador **"Pago confirmado"** con las **fechas de publicación tomadas del Pool de Espacios** (fecha garantizada) y la mención de la factura electrónica.
4. **Si todavía no aparece en el banco** → borrador **"Comprobante recibido"**: la fecha se confirma al acreditarse (se muestra la fecha tentativa del pool). Se vuelve a revisar en la próxima pasada.

**Paso 3 · Cierre del día (~15:00)**: el diseñador marca CERRADO; los avisos `sin_pago` de ese día se corren a la próxima fecha del pool y se deja el borrador avisando al cliente.

## 0 ter. RESPUESTA AUTOMÁTICA FUERA DE HORARIO (autorizada por Eddy, 09/11/2026)

**Horario de atención:** lunes a viernes de 07:00 a 14:00 (hora de Asunción). **Fuera de horario** son los días hábiles de 14:00 a 07:00, más los sábados y domingos completos.

- **Dentro del horario**, todo sigue **en borrador**, como dice §0 bis.
- **Fuera del horario**, Claude **responde y envía solo, sin borrador**, pero **únicamente** en estos casos:
  1. **El cliente manda su aviso** (texto, Word o PDF).
     - Claude lo lee y lo revisa.
     - Si es asamblea, controla que la fecha cumpla lo que dicen la ley y los estatutos: ítems de la convocatoria y 10 días de anticipación hasta la primera publicación.
     - Si todo está bien, responde con el **presupuesto**, la **fecha disponible real del Pool de Espacios** (actualizado a ese momento, con los días que el diseñador cerró) y el **código de pedido**.
     - Le avisa que **debe pagar para reservar la fecha**: la fecha no está garantizada hasta que se acredite el pago, por orden de llegada.
  2. **La fecha de la asamblea no cumple el plazo con el espacio disponible.** Claude responde que no llega y cuál es la fecha mínima de asamblea posible, o la primera fecha de publicación libre.
  3. **Faltan datos en el aviso.** Claude responde qué falta, sin cotizar.
  4. **El cliente manda el print del pago.**
     - Claude lo recibe y busca el aviso del banco (§13).
     - Si el pago está acreditado, confirma la fecha del Pool.
     - Si todavía no aparece en el banco, responde "Comprobante recibido": la fecha se confirma al acreditarse. **El print solo nunca confirma.**
  5. **Pedido de un estudio** (Berke o Abente Stewart). Se envía "Recibido" con prioridad, a la hora en que llega, y se pone la alarma roja en Gmail y en el Pool.
  6. **Un día se cerró en el Pool.** Por ejemplo, el diseñador o Luzana cierran el martes a la siesta. A los clientes **sin pago** de ese día, Claude les responde con la **nueva fecha disponible**.
- **Sigue en BORRADOR, aunque sea fuera de horario**, todo lo que no sea claramente uno de esos casos o que deje dudas:
  - Reclamos, enojos o pedidos de descuento.
  - Preguntas legales que no son de rutina.
  - Correcciones de avisos ya publicados.
  - Facturas.
  - Clientes nuevos con pedidos raros.
  - Adjuntos que no se pueden leer (escaneados).
  - Montos que no coinciden.
  - Cualquier cosa que no sea un aviso.
  - Correos del propio equipo.
  - Respuestas automáticas.
- **Controles de cada envío:**
  - Se responde **en el hilo del cliente** (Gmail `reply`), con el diseño del KV y el banner debajo de "Equipo de Avisos".
  - Se envía un solo correo por cliente y por pasada. Nunca se responde dos veces el mismo mensaje.
  - El aviso se carga o actualiza en el Pool.
  - Se anota cada envío en la colección `envios_auto` del Pool: fecha y hora, cliente, hilo, tipo de respuesta y monto. Así el equipo lo revisa a la mañana.
- **Los datos bancarios** salen del último presupuesto enviado por la cuenta (o de `datos_pago.json` si está). Nunca se inventan.
- **La pasada automática** se hace cada hora fuera del horario, como tarea programada.

**Ciclo diario y control humano (Eddy al colaborador, 09/11/2026):**
- **A la mañana**, al abrir (07:00), el colaborador revisa todo lo que Claude respondió solo **fuera de horario**, desde las 14:00 hasta la noche. Lo hace en la sección **"Revisión de la mañana"** del Pool, que lista la colección `envios_auto`: abre cada correo y marca **Bien** o **Corregir**, con una nota de qué falló.
  - Si algo salió mal, se corrige con el cliente en ese mismo momento.
  - Claude toma las notas de "Corregir" como aprendizaje y ajusta el skill.
- **De 07:00 a 14:00** se vuelve al **modo borrador**. El colaborador tiene el mando: decide qué se envía al cliente y corrige en tiempo real.
- **A futuro**, cuando todo sea automático, el colaborador pasa a ser "el jefe de la IA": entra solo para **detectar desvíos y corregirlos**.

**Clientes con estado de cuenta mensual (Hugo, 09/11/2026):**
- **Abente Stewart** (`@abentestewart.com.py`) y **Berkemeyer** (`@berke.com.py`) son estudios de marcas grandes con **estado de cuenta mensual**.
- **Cómo se reconocen:** mandan sus órdenes de publicación (registros, renovaciones, transferencias de marca) **sin pedir presupuesto**.
- **Qué se hace:**
  1. Se responde solo **"Recibido"**, **con prioridad y apenas llega el correo** (Eddy, 09/11). En horario de atención va en borrador y es el primero de la pasada. Fuera de horario se **envía solo**. No lleva precio, sin código y sin pedir el pago.
  2. Se **descargan los adjuntos y se prepara** la publicación.
  3. Se carga en el Pool como `confirmada`, con fecha según el pool y respetando el vencimiento DINAPI si lo indican.
- **Cobro:** a fin de mes el equipo junta las publicaciones del mes y les pasa **a mano** el estado de cuenta que saca el sistema.
  - **Abente Stewart:** el estado de cuenta incluye solo las publicaciones. La **suscripción** se cobra una vez al año, a fin de año.
  - **Berkemeyer:** el estado de cuenta incluye las publicaciones y **1 mes de suscripción**.
- **Prioridad y alarma (Eddy y Hugo, 09/11/2026):** estos estudios (Berke, Abente Stewart y otros estudios grandes con estado de cuenta) **siempre tienen prioridad**. Se les da el primer día posible, antes del vencimiento DINAPI. Si falta lugar, primero se corren los avisos sin pago.
  - **En el Pool:** el aviso se carga con el campo `estudio` ("BERKE" o "STEWART") y `descargado: false`. El día muestra una insignia **roja** "⬇ BERKE · DESCARGAR ADJUNTOS". Cuando el equipo descarga y prepara el aviso, toca **Listo** y la insignia se pone verde.
  - **En Gmail** (a Eddy le encantó, 09/11): al hilo se le aplica la etiqueta roja **"⬇ ESTUDIO - DESCARGAR"** (`Label_7`), con estrella y marca de importante. Al quedar preparado, se le quita la etiqueta.
  - Si la respuesta es de la IA, debe **avisar al equipo** que hay que descargar archivos para publicar.
- A estos clientes **nunca** se les manda el recordatorio de pago previo. Fuera de horario no reciben presupuesto: se les **envía automáticamente el "Recibido"**, que es uno de los casos autorizados en §0 ter, y se aplican la etiqueta roja en Gmail y la insignia roja en el Pool.
- **Todos los demás clientes pagan antes**, con el mismo precio para todos. Si un cliente que no es de estos estudios manda una orden y no paga, se le responde con el presupuesto y el código. Si ya se le respondió solo "recibido", se le manda un **recordatorio**: la fecha no se asigna sin el pago previo, y se le pregunta qué hacemos con su publicación.
- **Antes de mandar un recordatorio** se revisa si el aviso **ya salió publicado**, buscando el nombre en las ediciones enviadas a la imprenta. Si ya salió, corresponde pedir el pago de lo publicado.

**Denuncia policial / orden de no pago de cheques (Eddy, 09/11/2026):**
- Es un "anuncio medio especial".
- El acta de denuncia suele ser de **1 hoja** y se cobra **Gs. 100.000 por día** de publicación, igual que la tarifa de edicto o extravío.
- Si el cliente no manda el texto, se le pide el acta o el texto, la cantidad de días que pide el banco, y la razón social y el RUC.
- Si el texto supera una hoja, se confirma el ajuste antes de publicar.

**Revisión de pendientes (rutina, Eddy 09/11/2026).** Se hace cuando Eddy pide "ver quién quedó sin responder", y en cada pasada:
1. **Bandeja:** buscar los hilos de la última semana cuyo **último mensaje es del cliente**. Se descartan los avisos del banco, la DNIT/SET, Google y los "gracias" o "recibido" del cliente. Cada pedido sin respuesta lleva su borrador.
2. **Presupuestos sin pago:** hilos donde lo último fue nuestro precio y no hay pago.
   - Primero se cruza con los correos del banco (`pagos.py`).
   - Después se busca el nombre de la empresa en las **ediciones enviadas a la imprenta** (correos a `solpresctp@gmail.com`: Gmail indexa el texto de esos PDF; uso interno, no se envía a clientes). Si sale publicado, pagó por otro medio: se carga en el Pool como `confirmada`.
3. **Alerta "Falta el pago"** (solo para clientes que **no** son estudios):
   - Borrador en el hilo, con la etiqueta roja "Falta el pago": no registramos el pago, no se reserva la fecha sin pago previo, (sin horas de corte ni promesa de fecha: ver regla NO ACLARAR HORARIOS DE CORTE), el total, el código, los pasos, la cuenta GNB y la pregunta "¿mantenemos la publicación?".
   - Si es asamblea, se agrega qué pasa si no paga a tiempo: la fecha mínima de asamblea pasa al día siguiente.
   - Si la fecha de asamblea ya no cumple el plazo, en vez de la alerta va **"Fecha no disponible"**, con la fecha mínima.
   - A un cliente que tiene un borrador de seguimiento sin enviar no se le crea otro.
4. **Estudios (Berke, Abente Stewart):** nunca reciben la alerta de pago. Se verifica que tengan su "Recibido", la etiqueta roja en Gmail y la insignia roja en el Pool.
5. **PDF escaneados** (no se pueden leer ni buscar): el borrador se arma con la tarifa base, por ejemplo asamblea de hasta 5 temas a Gs. 150.000. En el Pool y en el mensaje a Eddy se avisa: **"verificar fecha de asamblea y cantidad de temas antes de enviar"**.
6. **Pool:** cargar todo lo que falte (sin pago, confirmados, estudios) y corregir las fechas según lo que el equipo confirmó por correo.
7. **Informe a Eddy:**
   - una tabla con cliente, situación, borrador y enlace;
   - qué hilos ya estaban cerrados;
   - qué cosas tiene que verificar una persona.

**Reporte mensual de estudios.** A pedido, se arma el reporte de los pedidos del mes de `@berke.com.py` y `@abentestewart.com.py`, y se exporta en PDF A4 con el diseño del diario. Incluye:
- fecha, estudio, quién lo mandó, expedientes y marcas, y vencimiento DINAPI;
- si salió publicado (búsqueda en las ediciones) y el monto estimado según la lista de precios;
- los totales para el estado de cuenta (Stewart: solo publicaciones; Berke: publicaciones más 1 mes de suscripción) y los pendientes.
Los montos son estimados: el monto real lo emite el sistema.

**Notificación a estudios:** Abente Stewart (Ramón Valdez) pide que le avisen cuando sale el diario para mandar a retirarlo. Al publicarse su aviso, dejar ese aviso en borrador.

**Principio de trabajo (Eddy, 09/11/2026): "siempre continuá sin que yo te pida".** Claude no espera instrucciones para lo que ya está definido. Apenas detecta algo, avanza solo:
- un pago que entró en el banco;
- un comprobante que mandó el cliente;
- un correo nuevo;
- un día que se cerró en el Pool.

En cada caso cruza los datos, deja el borrador (o lo envía, si es fuera de horario y es un caso autorizado), actualiza el Pool y después le informa a Eddy. Solo pregunta antes de borrar algo, de enviar en horario o cuando falta un dato que no puede deducir.

**Borradores visibles para el equipo (Eddy, 09/11/2026):**
- Un borrador no se puede marcar como "no leído". Por eso, **cada vez que Claude deja un borrador**, al hilo se le aplican:
  - la etiqueta naranja **"📝 BORRADOR LISTO"** (`Label_8`);
  - **UNREAD** e **INBOX**, para que el hilo aparezca en negrita arriba de la bandeja.
- El equipo trabaja con la misma cuenta, así que ve el borrador:
  - dentro del hilo;
  - en la carpeta Borradores;
  - y en la bandeja, con la marca "Borrador" en rojo junto al remitente.
- **Cuando el borrador se envía**, Claude le quita la etiqueta `Label_8` al hilo en la pasada siguiente.
- Si el borrador se descarta, la etiqueta también se quita.

**Colores de las etiquetas en Gmail (Eddy, 09/11/2026):**

| Etiqueta | Color | ID | Cuándo se pone | Cuándo se saca |
|---|---|---|---|---|
| ⬇ ESTUDIO - DESCARGAR | rojo | Label_7 | Pedido de un estudio (Berke, Abente Stewart), con estrella e importante | Cuando el aviso queda preparado |
| 📝 BORRADOR LISTO | naranja | Label_8 | Claude dejó un borrador (se marca también no leído) | Cuando el borrador se envía o se descarta |
| 🌙 IA FUERA DE HORARIO | violeta | Label_9 | Claude **envió** algo fuera de horario (se marca también no leído) | Cuando el colaborador lo revisa a la mañana |
| 💰 ESTUDIO - PAGO | rojo oscuro | Label_10 | Un estudio paga su estado de cuenta: se marca el correo del cliente y el aviso del banco, con estrella | Cuando se registra el pago en el estado de cuenta |

**Pago de un estudio (ejemplo: Abente Stewart, 09/11/2026, "pago mes de julio"):**
1. Se cruza con el banco. En el ejemplo: VICTOR XAVIER ABENTE STEWART, Gs. 2.112.000, concepto "Publicaciones julio".
2. Se responde **"Gracias por su pago"**, confirmando la acreditación con el concepto, el importe, la fecha y el comprobante.
3. Se ponen la etiqueta **💰 ESTUDIO - PAGO** (roja), la estrella y la marca de importante.

**Revisión de la mañana:**
1. Tocar la etiqueta violeta, abrir cada hilo y verificar.
2. Marcar Bien o Corregir en el Pool.
3. Sacar la etiqueta.

**Pasadas automáticas en horario (Eddy, 09/11/2026: "debería ser automático"):**
- De lunes a viernes, de 07:00 a 14:00, a los minutos **:07 y :37** (cada 30 minutos), Claude revisa el correo **solo** y deja los **borradores** sin que nadie lo pida: primero los estudios, después el resto.
- Avisa a Eddy con un resumen corto y el enlace a cada borrador.
- Mide el **tiempo de respuesta** (llegada del correo → borrador) y lo guarda en la colección `tiempos_respuesta` del Pool.
- **Meta:** menos de 30 minutos. Línea base del 09/11, antes de automatizar: unos 20 minutos de promedio, con un rango de 7 a 33 minutos, y solo cuando Eddy lo pedía.

## 1. Flujo de punta a punta

1. **Ingreso (WhatsApp)**: el cliente envía texto, foto o PDF del aviso. El bot confirma recepción y pide los datos que falten.
2. **Lectura del aviso**: el cliente puede enviar Word, PDF, imagen o link de Drive. Extraer del texto/imagen (OCR si es foto; los PDF y las imágenes con diseño requieren revisión humana):
   - tipo de aviso (edicto, remate, citación, convocatoria, balance, otro);
   - juzgado / expediente / partes (solo lo necesario para el aviso; ver privacidad);
   - cantidad de palabras o líneas y formato (columnas, negrita, cuerpo fijo);
   - cantidad de publicaciones solicitadas y fecha deseada;
   - sección o edición especial, si la pide.
3. **Presupuesto**: aplicar la tarifa vigente (ver §3) y devolver un monto desglosado: base, cantidad de publicaciones, extras, total. Marcar como **presupuesto sujeto a confirmación** si falta algún dato.
4. **Respuesta por Gmail**: se redacta un correo a partir de un preset (ver §4), con el presupuesto y los pasos siguientes (pago, envío del original firmado, fecha de publicación).
5. **Seguimiento**: si la persona no responde o confirma, registrar el estado (recibido / presupuestado / confirmado / publicado / cancelado).

### Cómo trabaja hoy el equipo (según Hugo Gomez, 11/5/2026)

- **Canales de entrada:** presencial y correo. El correo es solo Gmail.
- **Respuestas predeterminadas:** casi siempre son (a) presupuesto y (b) fecha de publicación. Varían según lo que pida el cliente.
- **Formatos que envía el cliente:** Word, PDF, imagen o link de Drive. Leer la imagen y el PDF visual es el desafío principal.
- **Cotización:** depende del texto enviado. Al cerrar, se envían datos de transferencia y la confirmación del día de publicación.
- **Cupo del diario:** el espacio disponible varía según el tamaño de cada aviso. A veces el diario cierra o amplía la cantidad de avisos, así que la fecha no siempre está disponible.
- **Criterio humano:** las decisiones (aceptar, precio final, fecha) son a criterio del equipo. El bot no debe decidirlas solo.

## 2. Puntos de análisis que hay que cerrar antes de implementar

| Tema | Pregunta abierta | Por qué importa |
|---|---|---|
| Tarifa | ¿Cobra el diario por palabra, por línea, por módulo o por página? ¿Hay tarifa mínima? | Sin esto no hay presupuesto automático |
| Canal WhatsApp | ¿WhatsApp Business API (Meta, con proveedor) o número común? | Define si el bot puede escribir primero y cuánto cuesta |
| Gmail | ¿Cuenta `mktaudiovisual@civis.com.py` u otra? ¿Cuenta de Workspace? | Permisos OAuth y límites de envío |
| Revisión humana | ¿Todo presupuesto sale solo o lo aprueba una persona? | Errores de monto son costosos |
| Datos personales | ¿Se guardan nombres de partes y expedientes? | Datos judiciales sensibles; minimizar |
| Horario | ¿Qué pasa fuera de horario de la oficina? | Cierres de edición del diario |
| Cierre de edición | ¿Hora límite para publicar al día siguiente? | El bot debe avisar si ya no llega |
| Cupo por edición | ¿Cómo se mide el espacio (tamaño del aviso, centímetros, módulos)? ¿Quién decide cerrar o ampliar? | El espacio varía y la fecha depende de él |
| Entrada presencial | ¿Cómo se carga en el sistema lo que llega en persona? | Hoy no entra por WhatsApp ni por correo |
| Lectura de archivos | ¿Quién revisa el texto extraído de Word, PDF, imagen o link de Drive? | Es el punto más difícil por ser visual |

Recomendación: empezar con **presupuesto automático + borrador de correo**, y que una persona apruebe antes de enviar.

## 2 bis. Asambleas: requisitos legales y plazos (Paraguay)

Fuente: resumen pegado por Eddy, que no fue verificado por un abogado. Antes de automatizar, validar con asesoría jurídica.

**Dos validaciones independientes:**
1. **Legal:** el texto del aviso cumple los datos exigidos y los plazos.
2. **Disponibilidad del diario:** hay suficientes ediciones antes de la asamblea.
Que el diario tenga espacio no significa que la convocatoria cumpla la ley.

**Datos obligatorios en el anuncio (sociedades anónimas, Código Civil art. 1082):**
- Tipo de asamblea (ordinaria o extraordinaria).
- Fecha, hora y lugar de realización.
- Orden del día con los asuntos a tratar.
- Requisitos especiales para participar, si los exigen los estatutos.

Pedir además: razón social completa, si es primera o segunda convocatoria, hora de segunda convocatoria si corresponde, y estatutos (pueden exigir más).

**Plazos para S.A. (régimen general):**

| Convocatoria | Publicaciones | Anticipación |
|---|---|---|
| Ordinaria, primera | 5 días | entre 10 y 30 días antes |
| Extraordinaria, primera | 5 días | entre 10 y 30 días antes |
| Segunda, tras asamblea no realizada | 3 días | mínimo 8 días antes; dentro de los 30 días siguientes a la asamblea caída |

Las convocatorias simultáneas tienen regla propia (art. 1083). Cooperativas, asociaciones civiles, clubes y otras entidades pueden tener leyes especiales y estatutos con cantidades y plazos distintos: no aplicar esta regla automáticamente.

**Interpretación en disputa:** la Resolución DGPEJBF 03/2022 (art. 2) dice que las 5 publicaciones están dentro de los 10 días de anticipación. La Guía de Sociedades 2025 (Vouga Abogados) dice que deben pasar al menos 10 días desde la última publicación hasta la asamblea. Criterio preventivo por defecto: 5 publicaciones consecutivas y al menos 10 días desde la última hasta la asamblea. El asesor jurídico del diario define el criterio final.

**Ejemplo:** asamblea el 20/12/2026. Publicaciones del 01 al 05 de diciembre; la última queda con 15 días de anticipación, así que cumple el criterio conservador.

**Reglas del motor de validación:**

| Validación | Acción |
|---|---|
| Falta un dato obligatorio | Pedir la corrección antes de confirmar |
| Entidad no identificada | Consultar el tipo jurídico |
| No hay suficientes ediciones | Informar que no hay disponibilidad compatible |
| Anticipación insuficiente | Rechazar la fecha y proponer otra |
| Anticipación superior al máximo | Proponer publicaciones posteriores |
| El diario no circula ciertos días | Excluir esas fechas |
| Pasó la hora de cierre de edición | Buscar la siguiente fecha habilitada |
| Estatutos o norma especial sin verificar | Derivar a revisión humana |
| Todo aprobado | Ofrecer fechas disponibles, sujetas a reserva |

**Respuestas sugeridas:**
- *Fechas compatibles:* "Podemos programar la publicación de su convocatoria a Asamblea General para los días [FECHAS], considerando la fecha de asamblea indicada para el [FECHA]. Estas fechas son compatibles con los plazos legales configurados. Para avanzar, necesitamos verificar el contenido completo del aviso y los requisitos estatutarios de su entidad."
- *Fechas no compatibles:* "Verificamos su solicitud y, considerando la fecha prevista para la asamblea del [FECHA], no contamos con fechas de publicación compatibles con el plazo legal aplicable. Le sugerimos consultar la posibilidad de reprogramar la asamblea para el [FECHA PROPUESTA]. Podemos verificar nuevamente la disponibilidad tomando esa fecha como referencia."

**El diario recibe convocatorias de todo tipo de entidad** (confirmado por Eddy, 6/11/2026). Por eso los plazos no pueden ser una sola regla: el motor debe elegir la regla según el tipo jurídico de la entidad.

**Tabla de plazos por tipo de entidad:**

| Tipo de entidad | Norma aplicable | Publicaciones | Anticipación | Estado |
|---|---|---|---|---|
| Sociedad anónima (S.A.) | Código Civil, arts. 1079 a 1084 | 5 (primera convocatoria) | 10 a 30 días; criterio conservador: 10 días desde la última publicación | Pasado en esta sección; falta validar con abogado |
| Cooperativa | Por definir (ley de cooperativas y estatutos) | Por definir | Por definir | **Pendiente** |
| Asociación civil | Por definir (Código Civil y estatutos) | Por definir | Por definir | **Pendiente** |
| Club y otras entidades | Por definir (estatutos y norma especial) | Por definir | Por definir | **Pendiente** |

Regla de uso: si el tipo jurídico no está en la tabla o el plazo está en "pendiente", el motor **no confirma fechas** y nunca aplica el plazo de S.A. a otra entidad. Lo que sí puede hacer:

1. **Si el cliente indica en el correo por cuántos días quiere publicar** (suele pasar), usar esos días para cotizar. Ejemplo: asamblea de cooperativa con 4 temas y pedido de 5 días = tarifa de asamblea 5 días.
2. **Si no indica días**, no cotizar a ciegas: responder con el acuse de recepción y marcar el caso con **FLAG**.
3. **Cualquier caso con entidad pendiente** se deriva a una persona para responder y confirmar fechas, aunque haya cotizado.

Marcar **FLAG** también cuando: falta un dato obligatorio del aviso, el tipo jurídico no está identificado, o el texto no se puede leer con certeza (PDF o imagen con diseño).

## 2 quater. Motor de reglas (índice operativo, 06/11/2026)

Fuente: "00_Indice_Motor_Reglas.pdf", guía operativa para diarios de Paraguay. Es orientación operativa, **no dictamen jurídico**. Antes de habilitar respuestas automáticas definitivas hay que confirmar el texto estatutario, las exigencias de la autoridad y el cómputo de plazos.

**Regla central:** responder si hay fechas comerciales disponibles **y** si el caso cumple las condiciones jurídicas comprobables. Son dos resultados separados: que el diario tenga espacio no confirma el cumplimiento legal.

**Estados que devuelve el sistema:**
- `DISPONIBLE Y VALIDADO`: hay fechas y el caso cumple la ficha.
- `DISPONIBLE PENDIENTE`: hay fechas, pero falta verificar algo jurídico o documental.
- `SIN FECHAS`: no hay bloques compatibles en el calendario.
- `REVISIÓN LEGAL`: derivar a una persona.

**Base del calendario:** ediciones reales, cierres comerciales, feriados sin diario, cupos y fechas ya ocupadas. Distinguir días calendario, hábiles y ediciones. Los conteos deben tener respaldo jurídico.

**Estructura:** 13 fichas independientes: 11 de asambleas y 2 de DINAPI (registro y renovación). Cada expediente guarda: fuente jurídica, versión de la regla, texto recibido, fecha de asamblea o solicitud y documentación.

**Datos que la IA pide al cliente:**
- Tipo de entidad o trámite.
- Fecha de reunión (si aplica) y fecha de solicitud de publicación.
- Texto del anuncio, documentación y fechas ya difundidas.
- Calendario real de ediciones y hora de cierre (lo aporta el diario).

**Clasificación de entidad (antes de aplicar la ficha):** SA / cooperativa / mutual / asociación / club / EAS / SRL / consorcio / DINAPI registro / DINAPI renovación.

**Reglas de decisión:**
- No inventar requisitos ni fechas. Si falta el estatuto, marcar revisión.
- Aplicar la ficha específica y verificar los documentos.
- Buscar bloques disponibles en el calendario y emitir el estado comercial y el jurídico por separado.
- Registrar un motivo trazable de cada resultado y derivar cualquier ambigüedad.

**Respuesta modelo cuando falta información:**
> Podemos revisar el anuncio y ofrecer fechas de publicación. Para confirmar la compatibilidad legal necesitamos identificar el tipo de trámite, revisar sus documentos y consultar las ediciones disponibles.

**Alerta:** el artículo 108 para asociaciones fue modificado por la Ley 4586. Revisar la norma vigente antes de usar esa ficha.

**Fuentes (BACN):** Código Civil; Ley 438/94 de cooperativas; Ley de mutuales; Ley 6480 de EAS; Ley 1294/98 de marcas. Decreto de marcas en WIPO Lex.

**Pendiente de cargar:** el contenido de las 13 fichas. El índice dice qué hay, pero no los plazos de cada una. Hasta que estén, las entidades que no sean S.A. siguen la regla de la sección 2 bis.

## 2 quinquies. Flujo operativo, según Eddy (transcripción de audios, 6/11/2026)

Audios de Eddy explicando cómo trabaja el equipo. Texto corregido de la transcripción automática.

**Audio 1: triage del pedido**
- El primer correo suele ser el texto del aviso y algunas indicaciones del cliente. A veces solo manda el texto, y se asume que es para presupuesto.
- Si el cliente ya pagó, el equipo confirma el día de salida sin revisar el texto.
- Si no pagó, hay que leer el texto y comprobar que cumpla los ítems exigidos por ley.
- **Convocatorias de asamblea, registros de marca y transferencias** pasan con ese chequeo, pero el texto ya viene de DINAPI o viene estándar: **no tienen cambios**.
- **Asambleas, derecho de autor, constituciones y demás** deben redactarse para una persona que revise si el texto cubre los ítems: fecha, hora, lugar y contenido (orden del día). Es el análisis que la IA debe apoyar, no reemplazar.
  - Si el texto está cubierto: se envía el precio y la fecha disponible.
  - Si el texto no está cubierto: se le dice al cliente qué le falta.
  - Si la fecha no alcanza: no se le informa esa fecha como disponible.

**Audio 2: precio y plazos**
- Si el texto está bien según la ley, se pasa el precio final. Casi nunca negocian: pagan.
- Plazos habituales:
  - **Sociedades anónimas:** 5 días de publicación y 10 de anticipación.
  - **Asociaciones y clubes:** suelen ser 3 días.
- Si el cliente pide 5 o 3 días, se cotiza por los días pedidos. La variación solo ocurre en esos casos.
- El 90% de las asambleas son de sociedades anónimas, que se publican por 5 días salvo que el texto indique segunda convocatoria.

**Cómo se conecta con el resto del skill:** el punto de decisión es el texto (ítems cubiertos) y la disponibilidad de fechas. Los precios salen de la sección 3, los plazos por tipo de entidad de la sección 2 bis y el motor de reglas de la sección 2 quater.

## 2 sexies. Mapa de procesos de atención al cliente

Fuente: "matriz para edgar.pdf", formato "Mapa de Procesos" de Editorial Informaciones S.R.L. Componente: direccionamiento estratégico. Modelo de gestión por procesos.

**Macroproceso 1: gestión administrativa**

- **Proceso 1: atención al cliente**
  - Subproceso 1: presencial.
  - Subproceso 2: correo electrónico.
  - Subproceso 3: telefónico para presupuesto.
  - Subproceso 4: del interior del país.
- **Proceso 2: recepción de documento o producto a publicar, retiro del servicio**
  - Subproceso 1: físico. Publicación de diario, imprenta y otros servicios.
    - A: retiro de servicio presencial.
    - B: entrega del servicio en línea.
    - C: entrega del servicio vía courier.
  - Subproceso 2: entrega física a la empresa a pedido del cliente.
  - Subproceso 3: correo electrónico, vía web y otros.
  - Subproceso 4: del interior del país.
- **Proceso 3: facturación**
  - Subproceso 1: carga de datos en el sistema.
  - Subproceso 2: verificar razón social y SET.
  - Subproceso 3: facturación (tipos, grabar en KUDE).
- **Proceso 4: cobros efectivizados e ingresos**
  - Subproceso 1: presencial en efectivo o cheque.
  - Subproceso 2: vía banca web.
- **Proceso 5: incorporación y carga de datos, para toda modalidad** (físico, telefónico, correo, interior)
  - Subproceso 1: fecha de vencimiento, cantidad de días y precio.
  - Subproceso 2: facturación.
  - Subproceso 3: cobros.
  - Subproceso 4: carga de O.P.
- **Proceso 6: gestiones administrativas externas y otras gestiones.**
  - Subproceso 1: gestiones administrativas externas.

**Cómo se conecta con la IA:** los canales de entrada del proceso 1 son presencial, correo, teléfono e interior. El bot WhatsApp cubre el subproceso de presupuesto por teléfono y el de correo. La carga de datos del proceso 5 y la facturación del proceso 3 son los puntos donde el sistema debería escribir, siempre con revisión humana. Los cobros se confirman por el proceso 4, no por la IA.

## 2 ter. Marcas: registro y renovación (Paraguay)

Fuente: resumen pegado por Eddy, no verificado por un abogado. Normas citadas: Ley 1294/1998 de Marcas (arts. 19, 20 y 21) y Decreto 22.365/1998 (arts. 30 y 31).

**Cantidad de publicaciones:**
- **Registro de marca:** 3 publicaciones consecutivas (3 días).
- **Renovación de marca:** 1 publicación (1 día).
- Los dos trámites requieren solicitud ante DINAPI y su orden de publicación.
- Coinciden con la lista de precios: registro 3 días, renovación 1 día.

**Datos obligatorios del anuncio (art. 31 del decreto):**
- Denominación de la marca.
- Logo o diseño, cuando exista.
- Número de acta de DINAPI.
- Fecha y hora de presentación de la solicitud.
- Nombre y dirección del solicitante.
- Clase o clases de la marca.
- Indicación expresa de registro o renovación.

**Validaciones para la IA:**
- Que el número de acta coincida con la orden.
- Que el logo no esté deformado ni sustituido.
- Mantener denominación y clases tal como figuran en el documento.
- Que la orden corresponda al trámite pedido (registro o renovación).
- **No inventar datos faltantes.**
- Para renovación, el encabezado debe decir expresamente que es una solicitud de renovación.

**Plazos:** no hay anticipación fija como en las asambleas. La fecha que controla la IA es la de emisión o entrega de la orden, cualquier vencimiento que indique, y la disponibilidad real del diario. No aplicar el plazo de 15 días hábiles de la Ley 1258/1987: fue derogada por el art. 138 de la Ley 1294/1998.

**Vigencia (art. 19):** la marca dura 10 años. La renovación se puede pedir en el último año de vigencia, con 6 meses de gracia después del vencimiento con recargo. Eso regula cuándo se pide ante DINAPI, no cuándo se publica el aviso.

**Cobro:** ver la sección 3 para el cálculo por expediente y por logo.

## 3. Tarifa (reglas de cálculo)

- Guardar la tarifa en **un solo archivo de configuración** (ej. `tarifas.json`), con fecha de vigencia. Nunca hardcodear montos en el bot.
- Fuente: lista de precios vigente de Diario Informaciones (Editorial Informaciones S.R.L.), recibida el 6/11/2026. Montos en guaraníes (Gs.).

**Publicaciones de asamblea ordinaria y extraordinaria, por 5 días (por puntos/temas):**

| Temas | Costo (Gs.) |
|---|---|
| 1 a 5 | 150.000 |
| 6 | 160.000 |
| 7 | 170.000 |
| 8 | 180.000 |
| 9 | 190.000 |
| 10 | 220.000 |
| 11 | 240.000 |
| 12 | 250.000 |
| 13 | 270.000 |

**Publicaciones de asamblea, por 3 días:** 1 a 5 temas: 140.000 · 6 temas: 150.000 · 7 temas: 160.000 · 8 temas: 170.000.

**Por columna:**

| Concepto | Costo (Gs.) |
|---|---|
| Más de ½ columna, 1 día | 100.000 |
| 1 columna, 1 día | 120.000 |
| Más de 1 columna, 1 día | 130.000 |
| ½ columna, 5 días | 270.000 |
| 1 columna, 5 días | 320.000 |

**Otros avisos:**

| Concepto | Costo (Gs.) |
|---|---|
| Constitución de sociedad, hasta 8 líneas (3 días) | 140.000 (+10.000 por cada 3 líneas más) |
| Modificación de estatuto, hasta 8 líneas (3 días) | 140.000 (+10.000 por cada 3 líneas más) |
| Edictos / extravíos, publicación (1 día) | 100.000 |
| Registro de marca (3 días), con logo | 35.000 por expediente + 25.000 por logo = 60.000 |
| Registro de marca (3 días), sin logo | 25.000 por expediente |
| Transferencia de marca (1 día) | 30.000 |
| Renovación de marca (1 día), con logo | 30.000 por expediente + 25.000 por logo = 55.000 |
| Renovación de marca (1 día), sin logo | 22.000 por expediente |
| Derecho de autor (3 días), 1 a 4 expedientes | 44.000 |
| Derecho de autor (3 días), 5 a 8 expedientes | 55.000 |
| Derecho de autor (3 días), más de 8 expedientes | 85.000 |

**Reglas de cálculo confirmadas por Hugo Gomez (6/11/2026):**

- **Marcas:** cada expediente se cobra por separado. Si varios expedientes llevan el **mismo logo** (ej. una marca con varias clases), se unifican en **una sola publicación** y el logo se cobra **una sola vez**. Solo se cobra el logo por separado cuando los logos son distintos. Ejemplo: 5 expedientes con el mismo logo = 5 × 35.000 + 1 × 25.000 (no 5 × 60.000).
- **Constitución y modificación de estatuto:** la cantidad de líneas varía mucho. Se calcula con el método de Hugo (ver §14): contar las líneas desde "Por escritura" hasta el final, 8 de base y Gs. 10.000 por cada tramo completo de 3 líneas (el incompleto no se cobra).
- **Asambleas:** son los avisos más frecuentes y se cotizan por cantidad de temas a tratar. **Cada asamblea se cotiza por separado**, aunque se publiquen juntas. **Por defecto son 5 días de publicación**; el 3 días se usa solo si el cliente lo pide. Ejemplo: una convocatoria con asamblea extraordinaria (5 temas) y ordinaria (4 temas) = 150.000 + 150.000 = 300.000 Gs. No se suman los temas en una sola tarifa, a diferencia de las marcas. Son el caso prioritario para automatizar.
- Lo que la lista no cubre (formatos especiales, urgencias, recargos) queda como **"consultar"** para una persona. No inventar recargos.
- Redondear siempre al guaraní entero y mostrar el desglose.

## 4. Presets de respuesta por Gmail

Mantener los textos en `presets/` (un archivo por caso) para que cualquier cambio sea de texto, no de código:

- `recibido.md`: confirma recepción y lista datos faltantes.
- `presupuesto.md`: monto, desglose, validez de la cotización y forma de pago.
- `faltan_datos.md`: pide el dato específico (expediente, cantidad de publicaciones, fecha).
- `fuera_de_plazo.md`: avisa que la edición ya cerró y propone la siguiente.
- `confirmacion_publicacion.md`: fecha de publicación y comprobante a enviar.
- `no_podemos.md`: tipo de aviso que el diario no publica.

Variables en los presets: `{nombre}`, `{tipo_aviso}`, `{palabras}`, `{publicaciones}`, `{total}`, `{fecha_publicacion}`.

**Preset real de presupuesto (asambleas), enviado por el equipo el 6/11/2026:**

```
Asunto: Re: {asunto_original}

Buen día, el costo es Gs. {monto_unitario} {detalle_unitario} IVA incluido.
Total: {total} Gs.
Contamos con lugar desde el {fecha_inicio}.

Cuenta para transferencia bancaria
- {banco}
- ALIAS: {alias} - RUC: {ruc}
- Titular: {titular}
- Cta. N°: {nro_cuenta}
- RUC: {ruc}

SU PUBLICACIÓN SERÁ PROCESADA UNA VEZ NOS REMITA POR ESTE MEDIO SU COMPROBANTE Y CONFIRMADA LA ACREDITACIÓN.

OBS. Es indispensable que agregue el RUC y algún Nro. de Contacto en caso de que necesite contactarlo con respecto a su publicación.

{firma}
Diario Informaciones
Horario de atención: Lunes a Viernes - 07:00 a 14:00 horas
{direccion}
Tel: {telefono}
```

- Los datos de pago (banco, alias, RUC, cuenta, titular, dirección, teléfono) **no van en el skill**: se leen de un archivo local de datos de pago. Así el skill se puede transferir a otra cuenta sin exponer datos bancarios de la empresa.
- Ejemplo de monto con dos asambleas: `monto_unitario` = 150.000, `detalle_unitario` = "cada una por 5 días de publicación", `total` = 300.000.
- Antes de enviar, el borrador lo revisa una persona. El cliente recibe la publicación solo después de mandar el comprobante y confirmarse la acreditación.

## 5. Reglas de seguridad y operación

- **Enviar correos o mensajes es acción externa**: el bot crea **borradores** en Gmail; el envío requiere aprobación humana, salvo la respuesta automática fuera de horario autorizada en §0 ter (solo esos casos). Aun en esos casos rige §00: **si hay duda, borrador**.
- No pedir ni guardar contraseñas, datos bancarios o documentos de identidad por WhatsApp. El pago se hace por canal oficial.
- Minimizar datos judiciales: guardar solo lo necesario para publicar y borrar el original según la política que defina el cliente.
- Registrar cada presupuesto y envío (fecha, monto, preset usado) para auditoría.
- Si el aviso es ambiguo o contiene algo que el diario no publica, derivar a una persona en lugar de presupuestar.
- Fechas de publicación: el bot solo propone una fecha tentativa. La confirmación depende del cupo, que decide el equipo.
- Decisiones a criterio (aceptar el trabajo, descuentos, excepciones): siempre a una persona.

## 6. Entregables esperados al usar este skill

1. Diagrama del flujo (WhatsApp → lectura → tarifa → borrador Gmail → aprobación → envío).
2. Lista de preguntas abiertas de la tabla del §2, respondidas o marcadas como pendientes.
3. Esquema de datos: `Consulta` (id, canal, teléfono, estado, tipo de aviso, palabras, publicaciones, total, fecha) y `Preset` (nombre, asunto, cuerpo).
4. Plan de implementación por etapas: (a) presupuestador en texto, (b) borradores Gmail, (c) bot WhatsApp, (d) envío automático tras aprobación.

## 7. Cómo usar este skill

- Antes de codificar, revisar la tabla del §2 con el usuario y pedir la tarifa real.
- Si se pide implementar algo, empezar por la etapa (a) y no saltar a envío automático.
- Cualquier cifra de tarifa que no venga del usuario o del diario debe quedar como `null` y señalarse, no inventarse.

## 8. Operación desde Claude conectado a Gmail (06/11/2026)

Claude opera la cuenta **diarioinformacionespy@gmail.com** desde el conector de Gmail.

**Reglas fijas:**
- **Nunca enviar.** Claude solo lee y crea **borradores**; una persona revisa y envía.
- **Modo ensayo** (por defecto cuando Eddy lo pide): borradores sin destinatario, asunto `[ENSAYO BOT]`, o solo mostrar la respuesta en el chat sin tocar los hilos.
- **Modo operación:** borrador dentro del hilo del cliente (`replyToMessageId`), dirigido al cliente, con el diseño del KV (§9). Las notas internas no van en el correo: van en el chat.
- **Orden de llegada:** los pedidos se atienden por la hora del correo.
- Antes de responder, buscar otros hilos del mismo remitente (los clientes abren varios hilos para un mismo aviso).

**Procedimiento por correo:**
1. Leer el hilo completo (`get_thread`, PLAIN_TEXT) y clasificar: pedido nuevo, consulta de fecha, comprobante de pago, pedido de factura, corrección.
2. Si trae el texto del aviso, pasarlo por `scripts/presupuestador.py` (tarifa, temas, ítems legales).
3. Leer el Pool de Espacios (§10) y calcular las fechas con `scripts/pool_fechas.py`.
4. Si es asamblea, validar el plazo **antes** de pasar el precio.
5. Armar el correo con `scripts/correo_kv.py` y dejarlo en borrador.
6. Cargar o actualizar el aviso en el pool (`ArtifactData`).

**Responder lo que preguntan:** si el cliente pregunta "¿desde qué día?", va la fecha primero; si pide precio sin mandar texto, se da la referencia (desde Gs. 150.000 por 5 días, 1 a 5 temas) y se pide el texto.

**Leer datos de un adjunto por búsqueda:** Gmail indexa el texto de los Word y PDF adjuntos. Se pueden averiguar datos puntuales con búsquedas en el hilo del remitente (ej. `from:cliente "30 de noviembre"`, `from:cliente accionistas`), probando primero con una palabra de control que no exista. Ojo: el texto citado de nuestras respuestas también entra en la búsqueda ("9 de noviembre", "ordinaria o extraordinaria"), y una fecha de diciembre suele ser el cierre del ejercicio, no la asamblea. Sirve para la fecha y el tipo de asamblea; la cantidad de temas no se puede contar así: tomarla de una cotización previa del mismo documento o pedir el texto.

**Limitación actual:** desde esta ventana Claude **no puede abrir adjuntos** (Word, PDF, imagen). Gmail los entrega como un bloque codificado dentro de la respuesta y no hay forma práctica de pasárselo al lector. En ese caso: acuse "Pedido recibido" y derivar a una persona, o pedir el texto en el cuerpo del correo. El bot para PC (`scripts/gmail_bot.py` + `scripts/lector.py`, ver `INSTALAR.md`) sí lee adjuntos.

## 9. KV de respuestas a clientes

Página de muestra: https://claude.ai/artifact/8g3gmSGJLHH2rnZUQuaxkZ · Código: `scripts/correo_kv.py` (HTML con estilos en línea + texto plano).

- Encabezado verde petróleo "Diario Informaciones · Avisos y publicaciones legales".
- **Pie oficial = banner de la firma de Gmail** (`marca/firma_diario_1200px.jpg`: pluma y tintero, "Diario Informaciones · Editorial Informaciones S.R.L. · Desde 1912", horario lunes a viernes 07:00 a 14:00, Rca. de Colombia 1136 casi Brasil, Tel. 021-200598 / 205167). Se muestra en pequeño (300 px de ancho) justo debajo de "Atentamente, Equipo de Avisos", dentro del diseño (pedido de Eddy, 09/11/2026), con la imagen que aloja Gmail para la firma (`correo_kv.FIRMA_URL`, sin adjuntar archivos). Los borradores se crean con `includeSignature: false`: con `true` Gmail pone la firma al final, debajo del texto citado del cliente, y queda duplicada.
- **Una etiqueta de estado por correo:** Presupuesto · Faltan datos · Fecha no disponible · Comprobante recibido · Pedido recibido.
- **Presupuesto:** resumen del pedido, total destacado, fechas propuestas (siempre calculadas), **código de pedido `AV-AAMMDD-NN`** para el concepto de la transferencia, 3 pasos (transferir con el código; responder con comprobante, razón social, RUC y contacto; confirmación al acreditarse), cuenta del diario (solo la de GNB de la empresa) y la nota "las fechas se garantizan al acreditarse el pago".
- **Faltan datos:** lista de lo que falta y, si corresponde, bloque "Para que tenga una referencia" con precio base y primera fecha con lugar.
- **Fecha no disponible:** texto del equipo: *"…la fecha de esta convocatoria ya no llega a los 10 días mínimos de anticipación, como lo estipula el Art. 1082 del Código Civil."* más la fecha mínima sugerida.

## 10. Pool de espacios del diario

Página (anclada en la barra de Eddy): https://claude.ai/artifact/K8BwwrrupCZmyjLCjTcuop · base de datos del artifact (se lee y escribe con `ArtifactData`).

**Quién hace qué:**
- **El diseñador** es el único que carga datos a mano: en "Modo diseñador" marca **CERRADO** el día que ya no admite más avisos (hacia las 15:00). No hay un cupo fijo: la cantidad que entra la decide el diseñador o la jefa según el tamaño de los avisos.
- **Claude** carga cada aviso al recibirlo y lo arrastra por sus días de publicación.

**Días por tipo** (`DIAS_POR_TIPO` en `scripts/pool_fechas.py`): asamblea 5 (3 si es segunda convocatoria o lo pide el cliente) · registro de marca 3 · renovación 1 · transferencia 1 · derecho de autor 3 · constitución/estatuto 3 · edicto 1.

**Fecha de inicio:** primera edición posible (mañana; pasado mañana si ya pasaron las 14:00) y el primer tramo de N días **seguidos y abiertos**. El diario sale todos los días, sábados y domingos incluidos.

**Estructura de la base:**
- `config/general`: `min_dias` (10), `criterio` ("primera"), `hora_cierre` (14).
- `dias/<AAAA-MM-DD>`: `cerrado` (true/false), lo escribe el diseñador.
- `avisos/<código>`: `codigo, cliente, tipo, fechas[], estado, recibido (fecha y hora del correo), email, thread_id, fecha_asamblea, origen`.

**Estados del aviso:**
| Estado | Significado |
|---|---|
| `sin_pago` | Cotizado, sin pago: fecha tentativa, **no garantizada** |
| `pago_informado` | Mandó comprobante: verificar la acreditación cuanto antes; no se corre |
| `confirmada` | Pago acreditado: **fecha garantizada** |
| `liberada` | Cancelado o vencido |

**Cierre del día (proceso de las 15:00):**
1. El diseñador marca el día CERRADO. Los avisos ya cargados ese día se mantienen.
2. Claude busca los avisos `sin_pago` afectados (`a_reprogramar`, por orden de llegada) y les calcula la próxima fecha disponible (`reprogramar`).
3. Si es asamblea y con la nueva fecha ya no se cumplen los 10 días, el correo pide rever la fecha de la asamblea e indica la fecha mínima.
4. Claude actualiza las fechas en el pool y deja en borrador, en el hilo de cada cliente, el aviso: *"La fecha ofrecida ya cerró; la próxima fecha disponible es…"*.
5. Los `pago_informado` no se corren: se avisa al equipo para verificar la acreditación.


**Capacidad de referencia (Eddy, 13/11/2026): un promedio de 40 lugares por día**, sean asambleas o marcas. El Pool pinta cada día sobre 40: desde 30 avisos sale "casi lleno" y desde 40 "revisar si se cierra". (Antes, 09/11: el diseñador estimaba unos 28.) Es aproximado: varía según el tamaño de los avisos que van entrando (ese día había 3 avisos tomados para el día siguiente). El Pool pinta cada día sobre 28: desde 21 avisos sale "casi lleno" y desde 28 "revisar si se cierra". Pero **el día solo se cierra cuando el diseñador lo marca CERRADO** al armar la página en Illustrator. Claude nunca cierra un día por la cuenta. Cada día del Pool tiene **siempre visible el botón CERRAR** (en rojo; sin "modo diseñador") para que el diseñador lo marque. Una vez cerrado, el botón pasa a "Reabrir".

## 11. Lo aprendido del relevamiento N.º 1 (750 hilos, 18/08 al 06/11/2026)

Reportes: resumen https://claude.ai/artifact/2rngGi2VhnSJy9jJQ92jrQ · ampliado con evidencias https://claude.ai/artifact/AQkNY9CEJ1vpFvUk36YyFx

- **Validar el plazo antes de cotizar.** De 27 avisos de "fecha no cumple", 15 se dieron después de cotizar o de cobrar (caso Trading Corp).
- **Fechas siempre calculadas.** Se copió "del 31/08 al 04/08" a tres clientes; MAWES recibió tres fechas en una hora.
- **Pedir razón social, RUC y contacto en la cotización**, por cada aviso (errores de factura: Itapopo, Marallati, notas de crédito).
- **Criterio que usa el equipo:** primera publicación con al menos 10 días de anticipación a la asamblea (pendiente de validar con el asesor jurídico).
- **Clientes con trato especial:** los estudios con órdenes de DINAPI (Abente Stewart, Berke) reciben solo "recibido", sin cotización. Confirmar la lista con el equipo.
- **Si no se sabe el tipo de entidad**, el equipo ofrece las dos opciones: 5 días o 3 días.
- **Un comprobante no garantiza la fecha:** la garantiza la acreditación.
- **Precios atípicos a confirmar:** derecho de autor 33.000 frente a 44.000; comicios universitarios 140.000 c/u; edicto de 3 días 140.000; aviso de emisión de acciones 100.000 por 1 día; disolución de sociedad 200.000 por 3 días.
- Mediana de respuesta del equipo: 18 minutos; el 26 % de los pedidos llega fuera de horario.

## 12. Archivos del skill (`scripts/`)

| Archivo | Para qué |
|---|---|
| `presupuestador.py` | Lee el texto del aviso, clasifica, valida ítems y calcula el precio con `tarifas.json` |
| `pool_fechas.py` | Días por tipo, fecha de inicio según días cerrados, plazo de 10 días, reprogramación al cierre |
| `correo_kv.py` | Arma el correo con el diseño del KV (HTML y texto) |
| `lector.py` | Lee Word, .doc, PDF e imágenes (con LibreOffice y la API de Claude) |
| `gmail_bot.py` | Bot para PC: lee la bandeja, descarga adjuntos y deja borradores (nunca envía) |
| `tarifas.json`, `config.json`, `presets/` | Tarifa vigente, configuración y textos base |
| `datos_pago.example.json` | Plantilla; los datos bancarios reales van en `datos_pago.json`, que no se comparte |

## 13. Cruce automático de pagos (Banco GNB ↔ pool)

Cada transferencia a la cuenta GNB del diario genera un correo del banco a diarioinformacionespy@gmail.com. `scripts/pagos.py` los lee y los cruza con los avisos pendientes del pool.

**Correos del banco que se leen** (buscar `from:(Transferencias@bancognb.com.py OR noreply@bancognb.com.py)` y leer con `get_thread` FULL_CONTENT):
- "TRANSFERENCIA RECIBIDA DE CTA DE TERCEROS" (de otra cuenta GNB): Nombre del Ordenante, Importe, Nro. de Comprobante, **Concepto**.
- "Transferencia SPI · Transferencia Interbancaria Recibida" (de otros bancos): **Enviado por**, Entidad Pagadora, Importe ("PYG 160000"), N° Comprobante, **Comentario**.
- Se ignoran las "Transferencias Enviadas" (salidas de la cuenta del diario).

**Niveles de cruce:**
1. **Código:** el concepto o comentario trae `AV-AAMMDD-XX` y el importe coincide → confirmar.
2. **Nombre + importe:** quien paga (la empresa, el contacto que escribió el correo o la empresa nombrada en el comentario) y el importe coinciden con el aviso. También cuando varios avisos del mismo cliente se pagan juntos (ej. GALME 300.000 = 2 asambleas) → confirmar.
   - Ejemplo: el ordenante puede ser el estudio que gestiona al cliente (Eddy, 18/11/2026, caso MACHAS TRADING): contacto "Contabilidad Peroni" contabilidad@pbq.com.py, GNB ordenante "ESTUDIO PERONI - ABOGADOS" 300.000 sin concepto = Ord+Ext → confirmar.
   - Si el cliente manda el comprobante DESPUÉS de que ya confirmamos con el correo del GNB (se cruzan los correos), NO se responde de nuevo (nunca duplicar); solo anotar en el Pool si hace falta (Eddy, 18/11/2026, caso MACHAS).
3. **A revisar:** coincide solo el nombre o solo el importe, o no hubo presupuesto previo → una persona decide.

**Búsqueda activa de cada correo del GNB (Eddy, 18/11/2026, caso FAQ PAR).** Cada vez que llega un correo del GNB (noreply@bancognb.com.py o Transferencias@bancognb.com.py), SIEMPRE hay que buscar activamente a qué aviso/cliente corresponde, aunque el cliente no haya mandado comprobante ni escrito. Pasos:
1. Leer del correo del GNB: "Enviado por" / "Nombre del Ordenante", importe, "Comentario"/"Concepto", fecha y hora.
2. Buscar en el Pool (colección avisos) los presupuestados sin pago (estado presupuestado / sin_pago) y cruzar por: código en el comentario (AV2611xxxx) → nombre del ordenante = empresa, contacto que escribió o el estudio que la gestiona (ej. ESTUDIO PERONI = MACHAS TRADING; ZAVALA CABALLERO LOURDES = SOL DEL PARAGUAY) → importe exacto (uno o la suma de varios avisos del mismo cliente).
3. Si coincide nombre + importe (o código): confirmar (Pool confirmada con fechas, campo pago con comprobante/ordenante/hora, confirmación al cliente en su hilo: enviada o en borrador según el horario de envío) y armar CORREGIDOS.
4. Si SOLO coincide el importe y no hay nombre ni código que lo vincule: NO escribir al cliente → pagos_sin_asignar + tarjeta en el Tablero.
5. Leer TODOS los mensajes del GNB de un hilo (el resumen muestra solo el último; error del 17/11 con SOL DEL PARAGUAY).
- Ejemplo 18/11: GNB SPI 11:28 "Enviado por: FAQ PAR SA", Gs. 300.000, comentario vacío → presupuesto AV-261117-09/10 de FAQ PAR (Ext+Ord 300.000) → confirmado 19-23/11.

**Al confirmar:** el aviso pasa a `confirmada` en el pool (con los datos del pago en `pago`) y se deja en borrador, en el hilo del cliente, el correo **"Pago confirmado"** con las fechas garantizadas y la mención de la factura electrónica.

**Reglas:** el print del cliente nunca confirma por sí solo (solo pasa el aviso a `pago_informado`); confirma el correo del banco. Los pagos a otras cuentas (por ejemplo la de Sudameris del preset de Hugo) no generan este correo y se verifican a mano. Validado el 06/11/2026: reprodujo las 6 confirmaciones de pago que el equipo hizo a mano ese día.

## 14. Constitución de sociedad: formato del extracto (modelo de Hugo, 09/11/2026)

**Caso de referencia:** SISTEMA S.A. (09/11/2026) mandó la **escritura completa en PDF** y pidió los datos para transferir. Hugo no cotizó: respondió que la publicación se hace con un **resumen de la escritura** que respete los ítems de ley, y mandó un borrador modelo para completar. Esa es la respuesta correcta cuando llega la escritura entera y no el extracto.

**Ítems obligatorios del extracto** (modelo en `scripts/presets/constitucion_modelo.md`):
1. Encabezado: **CONSTITUCIÓN DE SOCIEDAD.**
2. Escritura pública Nro., fecha, escribano público autorizante y **denominación** de la sociedad.
3. **Domicilio.**
4. **Duración** (años) y **objeto**.
5. **Capital** en guaraníes, en números y en letras.
6. **Accionistas.**
7. **Inscripción en la DGRP**: Sección Personas Jurídicas y Comercio, Serie Comercial, entrada Nro. y hora, Nº de inscripción, folio y fecha.

**Cuidado:** el modelo que mandó Hugo tenía datos fijos de otro caso ("bajo el Nº 01 y al folio Nº 01-16 … en fecha 17/05/2025"). En el preset quedaron como espacios para completar, para que ningún cliente publique datos ajenos.

**Cómo responder:**
- Llega la **escritura completa** (o un PDF sin extracto) → mandar el modelo para completar; no cotizar todavía.
- Llega el **extracto** → verificar los 7 ítems; si falta alguno, pedirlo (preset "Faltan datos").
- Extracto completo → cotizar **3 días** por líneas, con el **método de Hugo (09/11/2026)**:
  1. **Contar las líneas desde "Por escritura…" hasta el final del texto**, tal como vienen en el texto del cliente. Los títulos ("CONSTITUCIÓN DE SOCIEDAD", el nombre de la sociedad) **no cuentan**.
  2. **Las primeras 8 líneas** forman el precio base: **Gs. 140.000**.
  3. **Desde la línea 9**, se suman **Gs. 10.000 por cada tramo COMPLETO de 3 líneas** (9–11, 12–14, 15–17…). **Si el excedente no completa 3 líneas, NO se cobra** (Hugo, 09/11 12:00).
  4. **Fórmula:** `total = 140.000 + 10.000 × piso((líneas − 8) / 3)`, con mínimo 140.000.
  5. **Ejemplo, SISTEMA S.A.:** 19 líneas → 11 adicionales → 3 tramos completos (las 2 líneas sobrantes no se cobran) → **Gs. 170.000**. Claude primero estimó 210.000 contando por caracteres y después 180.000 cobrando el tramo incompleto: los dos son errores. **No** se cuenta por caracteres y el tramo incompleto **no** se cobra.
  6. En el presupuesto se muestra el desglose: líneas totales, base y adicionales.
- **Modificación de estatuto:** misma tarifa y misma lógica (extracto de la escritura de modificación).

**Precios observados:** YASY S.A., modificación de estatuto: Gs. 140.000 (06/11/2026) · Cota Arquitectura, constitución: Gs. 190.000 (22/10/2026) · Grupo Halcón S.R.L., disolución por escritura: Gs. 200.000 (26/10/2026).


## Respaldo de scripts (09/11/2026)
La carpeta `scripts/` del skill tiene una copia de `correo_kv.py`, `pool_fechas.py`, `pagos.py`, `presupuestador.py`, `tarifas.json` y `presets/`.
- Si la máquina de la sesión se renueva y `/home/user/diario-bot` no existe, se copian desde aquí.
- Los datos bancarios **no** están en el skill: salen del último presupuesto enviado desde la cuenta (Banco GNB, Editorial Informaciones SRL).

## Cierre real del día (Eddy, 09/11/2026)
La hora de las 14:00 **no cierra la fecha del día siguiente**. Mientras el diseñador no marque ese día como CERRADO en el Pool, se sigue ofreciendo y asegurando, también a los pedidos y pagos que llegan fuera de horario. Ejemplo: el lunes 9 por la tarde se siguieron cargando avisos para el martes 10.
- `pool_fechas.primera_edicion`: antes de saltar al día siguiente por la hora, se consulta si mañana está CERRADO. Si no lo está, se ofrece mañana.

## Lecciones del 09/11/2026 (LA MORADA S.A.)
- **SIEMPRE con el diseño del KV**, sin excepción: también cuando se quiere ahorrar uso. Un borrador en texto plano está mal.
- **Corregir un borrador abierto es riesgoso.** Si el equipo lo tiene abierto en Gmail, envía la versión vieja que ve en pantalla. Por eso:
  1. Avisar al equipo que **cierre y vuelva a abrir** el borrador antes de enviarlo.
  2. Después de corregir, verificar en Enviados qué versión salió.
  3. Si salió la versión equivocada, mandar enseguida una **corrección** con el diseño del KV y un pedido de disculpas, y ponerle la etiqueta correspondiente (violeta si es fuera de horario).
- El aviso del banco no confirma la acreditación. La confirmación real es el **cruce con el extracto** a fin de mes. No escribir "confirmamos la acreditación" basándose solo en el aviso de transferencia: usar "recibimos su comprobante; queda sujeto a verificación con el extracto".
- **La facturación la hace el equipo a mano.** Claude no hace facturas ni las propone como tarea propia. Solo deja anotados en el Pool la razón social, el RUC y el monto, y las diferencias de pago a revisar (por ejemplo, LA MORADA pagó Gs. 310.000 contra Gs. 300.000 cotizados).

## Todo aviso de transferencia se procesa (Eddy, 09/11/2026)
En **cada pasada**, Claude abre **todos** los correos del banco (GNB "Transferencia SPI" y "TRANSFERENCIA RECIBIDA DE CTA DE TERCEROS") que todavía no procesó y los asocia a una publicación:
1. **Primero por el código** AV-… en el comentario o concepto.
2. **Después por nombre e importe:** el ordenante coincide con el cliente o su empresa, y el importe con un presupuesto abierto.
3. **Solo por importe (el ordenante no coincide):** **NO se le escribe al cliente** (Eddy, 09/11). Se **espera su mensaje** con el comprobante. Mientras tanto, el pago queda en `pagos_sin_asignar`, anotado como "probable: [cliente]". Cuando el cliente manda el comprobante, se cruza y se confirma. Ejemplo: MARLEN S.A., Gs. 170.000 → probable SISTEMA S.A.
4. **Pago asociado:** el aviso pasa a `confirmada` en el Pool, con la nota del pago (ordenante, banco, hora, importe y comprobante). Al cliente se le confirman las fechas.
4b. **Nombre "parecido" o persona en copia NO alcanza (Eddy, 16/11/2026, caso Natalia Bauzá / AV S.A.):** solo se confirma sin comprobante si (a) el COMENTARIO trae el código, o (b) el ordenante es la MISMA empresa del aviso o la persona que ESCRIBIÓ el pedido, con el importe exacto. Si el ordenante es otra persona (alguien en copia, un empleado, un tercero), aunque parezca obvio y aunque la suma cierre: NO se confirma ni se escribe; queda en `pagos_sin_asignar` como "probable" + tarjeta, y se **espera que el cliente reclame el pago** mandando su comprobante.
4c. **NUNCA SUPONER (Eddy, 16/11/2026, caso VALZA)**: en pagos sin asignar no se escribe "probable X" ni se vincula a un cliente por el importe u otra coincidencia. Se anotan solo los datos del GNB y "esperar que el cliente lo reclame con su comprobante".
5. **Sin asociación:** queda en la colección `pagos_sin_asignar` del Pool y se le avisa a Eddy.
6. **Pagos de estudios** (estado de cuenta): etiqueta "💰 ESTUDIO - PAGO".

## Error LA MORADA (09/11/2026): no duplicar presupuestos
- El equipo (12:17) cotizó bien: Ordinaria con 6 temas Gs. 160.000 + Extraordinaria Gs. 150.000 = **Gs. 310.000**. Claude, sin ver esa respuesta, mandó otro presupuesto con Gs. 300.000 (a ciegas, "hasta 5 temas"). El cliente pagó 310.000 y pidió que le devolvieran la "diferencia".
- **Regla:** antes de cotizar, **leer TODO el hilo**, incluidos los mensajes ya enviados por el equipo. Si el equipo ya cotizó, no se cotiza de nuevo: se usa su monto.
- **Regla:** si no se pueden contar los temas del orden del día (adjunto ilegible), no se envía un precio "hasta 5 temas" como definitivo. Se deja en borrador con la marca de verificar.
- **Facturas por separado:** si el cliente lo pide, se anota en el Pool para el equipo (la facturación es manual).

## Adjuntos automáticos en Drive (instalado 09/11/2026)
- Un Apps Script en la cuenta del diario (`adjuntos_a_drive.gs`) copia cada 5 minutos los adjuntos (Word, PDF, imágenes, Excel) de los correos de clientes a la carpeta de Drive **"Adjuntos clientes"** (id `1l2VlKylNhWYg2uA6_ocdzVutwjVBDdNd`), en una subcarpeta por día. El nombre del archivo es "HHMM - asunto - nombre", y la descripción dice "De: … | Hilo: <threadId>". Los correos procesados quedan con la etiqueta "adjunto-en-drive". **v2 (15/11/2026)**: no duplica (recuerda cada mensaje procesado; descripción "Msj: <id>"), copia también los archivos compartidos como LINK de Drive/Docs (nombre "… - LINK - …"); si el link no está compartido, el hilo queda con la etiqueta "drive-sin-acceso" → pedirle al cliente que lo comparta o lo adjunte. Función `limpiarDuplicados()` manda a la papelera los duplicados de la v1.
- **Para leer un adjunto:** buscarlo en Drive con `search_files` (title contains el asunto, o por la descripción con el hilo) y leerlo con `read_file_content`. Si devuelve el texto vacío (docx), usar `download_file_content` y extraer el `document.xml`.
- **Siempre leer el adjunto antes de cotizar:** contar los temas del orden del día y las líneas, y revisar errores del texto (título que no coincide con el tipo de asamblea, fechas viejas). Si hay errores, preguntarle al cliente en el mismo presupuesto (ejemplo: REFLEX S.A.).

## Fuera de horario: responder directo (Eddy, 09/11/2026)
- Fuera de horario, Claude **responde directo** a los clientes (envía, no borrador): presupuestos para que transfieran, confirmación de comprobantes y respuestas a consultas.
- Se **promete la fecha abierta del Pool**: mientras el diseñador no marque CERRADO el día siguiente (por ejemplo, el martes), se ofrece ese día.
- Si el sistema de permisos frena un envío (pagos), se deja en borrador y se avisa a Eddy.

## Pool: página del día (09/11/2026)
- Cada día del Pool tiene el botón **ABRIR**. Muestra la página del diario en horizontal, con columnas y estilo periódico.
- Cada tarjeta muestra el tipo, **DÍA X DE N** (inicia / viene de días anteriores / último), el nombre, el estado de pago, el plazo de la asamblea, las fechas, la nota o texto y el código.
- Las tarjetas se **arrastran** para ordenarlas: el orden se guarda en `dias/{fecha}.orden`.
- **Mover a mano** con "◀ Día anterior" / "Siguiente día ▶" (mueve todas las fechas del aviso). **Bloqueos:**
  1. una asamblea que quedaría a menos de 10 días (Art. 1082 C.C.);
  2. pasar el `vence_dinapi`;
  3. un aviso que ya empezó a publicarse (debe salir en días seguidos).
  Si el día nuevo está CERRADO, pide confirmación.
- **Al cargar avisos**, guardar siempre `fecha_asamblea` (asambleas), `vence_dinapi` (marcas) y, si se leyó el Word, `texto`.
- **Control antes de enviar (09/11/2026, error con SISTEMA S.A.):** todo `reply`, `send` o `create_draft` a un cliente DEBE llevar `htmlBody` con el diseño del KV (encabezado verde "Diario Informaciones" y banner debajo de "Equipo de Avisos"). Si un envío falla y se reintenta, se reintenta con el mismo `htmlBody`, nunca solo con `body`. Sin `htmlBody`, no se envía.
- **Gráficos de la página del día (criterio de Luzana, 09/11/2026), tomando como referencia la fecha de la página:** ❌ cruz roja = el aviso **vence ese día** (su último día); 〰 víbora o "caminito" azul = vence al día siguiente; ✔ tilde azul = vence a los 2 días; ┃ raya vertical **azul** = aviso nuevo que **entra ese día**. Todos se pueden ocultar con el botón VER/OCULTAR GRÁFICOS.
- **Página del diario (Luzana, 09/11/2026):** solo aparece lo **corroborado por correo y por PAGO** (estado `confirmada`, más los estudios con estado de cuenta). Si no pagó, no aparece en la página (se lista aparte como "sin pago"). Los avisos **en curso están vivos todos sus días** (las asambleas, 5 días seguidos): no se borran ni desaparecen del diario hasta completar su último día. Duraciones: renovación y transferencia de marca 1 día (entra y sale el mismo día); registro de marca 3 días; asambleas 5; constitución y estatutos 3; edictos 1. Los datos salen del skill y de los textos del cliente o de DINAPI. Ajustes pendientes: revisarlos con Luzana el viernes 13/11.
- **Avisos de 3 días** (derecho intelectual o de autor, registro de marca, constitución de S.A., modificación de estatutos), según Luzana el 09/11: el día que entran llevan **raya vertical azul + tilde ✔ azul** (es nuevo y vence a los 2 días). Al día siguiente, víbora; el último día, cruz. Los avisos de 1 día (renovación, transferencia, edicto) llevan solo la raya.
- **Abrir el anuncio desde el Pool (09/11/2026):** cada tarjeta de la página del día tiene un botón:
  - **📄 ABRIR ANUNCIO:** muestra el archivo de Drive dentro del Pool, con vista previa embebida. Se guarda en los campos `drive_url` y `drive_url_2`.
  - **📝 VER TEXTO:** si el cliente mandó el texto en el cuerpo del correo; se guarda en el campo `texto`. Tiene botón para copiar.
  - **✉ ABRIR CORREO:** si todavía no hay archivo ni texto.
- **Al cargar un aviso, guardar siempre `drive_url` (el adjunto en "Adjuntos clientes") o `texto` (si vino en el correo).**

## Tablero de pendientes de Hugo (10/11/2026)
https://claude.ai/artifact/Kv8tDTU625WrFrJ2qAFA5S, colección `pendientes`.
- En cada pasada, todo lo que sea "hay que revisar" se carga como un documento: titulo, cliente, codigo, prioridad (urgente/hoy/semana), vence, detalle, accion, gmail, solucionado:false, creado.
- No duplicar: usar un doc_id estable por tema.
- Hugo lo marca como SOLUCIONADO; Claude no reabre lo que él marcó.
- **Verificación de pagos (Eddy, 10/11/2026).**
  - Un pago está CHECK **solo** cuando llega el correo del banco GNB, o GNB o Sudameris (regla 18/11): el print del cliente de una transferencia/depósito a la cuenta Sudameris de Luzana que coincide se toma como pago, con tarjeta VERIFICAR PAGO SUDAMERIS. Cualquier otro comprobante (print) del cliente NO alcanza, porque puede ser falso o una transferencia rechazada.
  - Si hay comprobante pero no hay correo del GNB, se carga en el Tablero de Pendientes como `tipo:"verificar_pago"`, con prioridad urgente y el título "CORROBORAR PAGO: <empresa> (Gs. X)".
  - Luzana lo revisa en la banca web y toca **PAGO FUE VERIFICADO** o **NO LLEGÓ EL PAGO**.
  - Con `resultado:"verificado"`: borrador de confirmación. Con `resultado:"no_llego"`: borrador pidiendo que vuelva a transferir, porque no se acreditó en nuestra cuenta.
  - Mientras tanto, no se confirma nada al cliente. El aviso queda en `pago_informado`, no se cuenta como pagado y no ocupa lugar en el día.
  - Leer siempre el comprobante: si dice RECHAZADA, anotarlo en la tarjeta.
  - **Al marcar el botón (Eddy, 10/11):** en la pasada siguiente, en el Pool, "no_llego" pasa el aviso a sin_pago y le borra las fechas, para que desaparezca del día. Se deja un borrador pidiendo que vuelva a transferir. "verificado" pasa el aviso a confirmada y deja el borrador de pago recibido. Después se marca procesado:true.

## Avisos presenciales (Luzana y Eddy, 10/11/2026)
- El cliente llega con su aviso en mano. Se verifican los datos, se factura, paga en efectivo o por transferencia, se escanea y ya ocupa su lugar.
- Hugo o el diseñador lo cargan en el Pool, en la sección "Avisos presenciales" (botón +), con el nombre de la empresa, el día en que sale y el tipo de aviso (el tipo define los días que ocupa).
- Quedan en `avisos` con `origen:"presencial"` y `estado:"confirmada"`, así que cuentan para el espacio del día en las respuestas a clientes.
- La palabra final sobre el espacio la tiene el cierre del diario.
- **DIGITALIZAR AVISO (Eddy, 10/11):** el formulario presencial tiene un botón para sacar una foto o subir un PDF. El archivo queda en el almacén del Pool y se guarda en `avisos.archivo` con `{asset_id, url, nombre, tipo, en_drive:false}`.
  - En cada pasada, por cada aviso con `archivo.en_drive:false`:
    1. Bajarlo con Artifact read (`url` del Pool, `path` = asset_id).
    2. Subirlo a Drive, carpeta "Adjuntos clientes" (1l2VlKylNhWYg2uA6_ocdzVutwjVBDdNd) / subcarpeta del día `aaaa-mm-dd`, con el nombre "PRESENCIAL - <empresa> - <archivo>".
    3. Poner `drive_url` en el aviso y `archivo.en_drive:true`.
  - Así el diseñador tiene todo en el Drive para armar la página.
- **Texto en el cuerpo del correo → también al Drive (Eddy, 10/11).** Si el cliente manda el aviso escrito en el correo, sin adjunto, se crea un documento en "Adjuntos clientes" (1l2VlKylNhWYg2uA6_ocdzVutwjVBDdNd) con el título "<EMPRESA> - TEXTO DEL CORREO - <tipo> (<código>)". El documento lleva solo el texto del aviso. Se pone su `drive_url` en el aviso del Pool. Así el Drive tiene todo: adjuntos, textos de correo y presenciales digitalizados.
- **Texto original para VER DIARIO (Eddy, 10/11).** En cada pasada, por cada aviso pagado sin `texto`:
  - Si tiene `drive_url`, leer el archivo del Drive y guardar en `avisos.texto` el texto tal como va publicado. Sacar los datos de factura y las notas para el diario, y numerar el orden del día.
  - Si se corrigió algo que pidió el cliente, o algo del original parece raro (una fecha vieja, un título equivocado), anotarlo en `texto_revisar`.
  - Si el aviso no tiene archivo, va al Tablero de Pendientes.
  - Así la vista "OCULTAR TODO" muestra el aviso completo, como sale impreso.
- **Revisiones cada 5 minutos de 7 a 15 (Eddy, 10/11).** Corren en los minutos :02, :07, :12, :17, :22, :27, :32, :37, :42, :47, :52 y :57.
- **Nunca borrar borradores en una revisión automática.** delete_draft pide aprobación y traba la revisión (pasó el 10/11 a las 11:07 con Ana Amarilla). Un borrador que ya no sirve se reemplaza con update_draft. Si ya se envió, se deja.
- **Fechas de los estudios (Berkemeyer, Abente) (Hugo, 10/11).** Pagan a fin de mes con el estado de cuenta, así que en el Pool NO figuran como "pagado".
  - Cuando mandan sus marcas, que pueden ser 45 u 80 de una vez, la fecha la DECIDE EL DISEÑADOR.
  - En temporada baja salen prácticamente al día siguiente. En temporada alta, el diseñador ve qué día pueden salir.
  - Claude no les asigna fecha. Carga el aviso en el Pool con `fecha_tentativa` = día siguiente y la nota "fecha a definir por el diseñador".
  - Se respeta siempre el vencimiento DINAPI (`vence_dinapi`). Si está cerca, va al Tablero.
- **Lotes grandes de marcas (Hugo y Eddy, 10/11).** Se trata de sacar el lote ENTERO en una sola fecha; no se reparte salvo excepción.
  - Si no entra, se agregan **hojas interiores** (un pliego extra intercalado, tipo sándwich), sobre todo en temporada alta con Berkemeyer o Abente.
  - En el Pool, el día lleva un campo `hojas_interiores` (N) que suma capacidad. El lote se mueve completo a una fecha, y "repartir" queda solo como opción manual.
  - Pesos aproximados por aviso: asamblea 1; registro de marca 2/3; transferencia o renovación 1/3.
- **Diagramación: el diseñador decide, Claude sugiere (Eddy, 10/11).** No hay un orden fijo por tipo: el diseñador reacomoda los avisos de la manera más eficiente.
  - Claude arma una propuesta de diagramado que minimice el espacio vacío. Acomoda los avisos en las 5 columnas según su largo, como piezas de un rompecabezas, y respeta solo lo necesario (que no se corte un aviso entre columnas).
  - Claude exporta la propuesta para InDesign (script .jsx o archivo IDML) con los textos ya colocados.
  - El diseñador la ajusta a su criterio; su versión final es la que vale.

## Agentes del proyecto (Eddy, 17/11/2026)

Copia de respaldo en `agents/` (el entorno en la nube se borra al reiniciar). Para reinstalarlos: copiar `agents/*.md` a `~/.claude/agents/` y abrir una sesión nueva.
- **Explore** (`agents/Explore.md`, modelo Haiku): solo lee el proyecto y explica dónde está cada cosa, con archivo y línea. No modifica nada. Reemplaza al Explore que trae Claude Code.
- **programador** (`agents/programador.md`, modelo Sonnet): escribe y corrige el código, lo prueba y avisa si hay que sincronizar el skill. No toca Gmail, Drive, el Pool ni el Tablero.
