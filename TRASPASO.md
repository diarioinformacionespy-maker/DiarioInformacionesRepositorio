# Traspaso de sesión: Diario Informaciones (19/11/2026)

Los datos viven en el Pool, el Tablero, Gmail y Drive. Esta nota solo resume el contexto operativo de la sesión anterior.

## Recursos
- Pool: https://claude.ai/artifact/K8BwwrrupCZmyjLCjTcuop (colecciones: avisos, dias, envios_auto, pagos_sin_asignar, historial, config)
- Tablero: https://claude.ai/artifact/Kv8tDTU625WrFrJ2qAFA5S (colección pendientes)
- Corrección de Asambleas: https://claude.ai/artifact/6jTV3HLvW7QoAWzRGGCE4F
- Skill: /home/user/skill-diario/DIARIO INFORMACIONES/SKILL.md (también skill/diario-informaciones/SKILL.md en el repo)
- Drive: CORREGIDOS (1U9Qbsjx47OLvRMmi-2q9oP0s6YW28w3n), ORIGINALES/2026-11-19 (1Kb8jljNNhflb34VnjjWEJL0i8ylkUwkX), Adjuntos clientes (1l2VlKylNhWYg2uA6_ocdzVutwjVBDdNd), REPORTES (1P2uyWLlPaMChh0hk90ZB45KNff12Myjo)

## Reglas vigentes
- Horario de envío: 07:00–14:59 borrador (Label_8 "✋ HUGO - PULSAR ENVIAR"); desde 15:00 envío automático con KV (Label_12 "🔎 REVISAR", registro en envios_auto).
- REGLA §00: ante la duda, borrador + tarjeta en el Tablero. Nunca borrar borradores.
- Pagos: solo GNB o SUDAMERIS con coincidencia de empresa/monto/datos. Otro banco o boleta dudosa → consultar al cliente. Solo importe → pagos_sin_asignar.
- Fecha tentativa: próximo día no cerrado (nunca domingo). Nunca decir hasta qué hora.
- Cerrados: no se confirma nada en un día cerrado.
- Modo de frecuencia: normal hoy (cada 10 min). Ver MODOS_PASADAS.md.

## Rutinas
- Desactivadas el 19/11 (12): las de :07, :17, :27, :37, :47, :57; nocturnas 20–23 h; madrugada 00–02 h; final 03:00; apertura 06:45; reporte Luzana 18:50; fin de semana.
- Activa: one-shot del 30/11 (trig_01YcAVtMBdE2NJyM2idWyCtM).
- Pendiente: Eddy recrea las rutinas nuevas en claude.ai con /home/user/Prompt-pasadas-sesion-nueva.txt. El reporte de Luzana (18:50) necesita NoClick conectado.

## Conectores
- Mantener: Gmail, Google Drive, Claude Docs, NoClick (https_mcp_noclick_com).
- Apagar: Figma, Vercel, Graphify, Playwright, Chrome, Premiere, CapCut, OpenArt, Higgsfield, Firecrawl y otros no usados.

## Pendientes con clientes (al 19/11, ~17:00 Asunción)
- Ordinaria POLVO (PR-261119-093801-B): el cuerpo dice Extraordinaria, el título y el punto 3 dicen Ordinaria. Consultar al cliente antes de publicar.
- VIRTUAL PARAGUAY: pago (AV-261119-03).
- LEMANITA: RUC para factura (tarjeta lemanita-correccion-1911).
- La Santariteña: verificación de crédito por gerencia.
- SABOR DEL CAMPO: respuesta sobre folio.
- Ferrere: textos.
- YPANE (AV-261119-07): decidir excepción viernes 20 o "fecha no disponible".
- Kalgary: factura (tarjeta kalgary-factura-1911).
- Géminis: copia de factura (tarjeta geminis-copia-factura-1911).
- PAUMAR (AV-261119-01): presupuestado, asamblea 03/12, tentativa 21–25/11. Respondido automáticamente 15:39.

## Consultas abiertas con Eddy
- Conectar el upload presencial del Pool con el skill: opciones (1) pasada programada en la sesión del skill leyendo registros con origen presencial y corregido_pendiente (recomendada), (2) sesión suscripta con watch_url, (3) send_message desde el Pool. Sin decidir.
- Precios de modelo industrial (Gs. 120.000 por columna) y acta de denuncia (Gs. 100.000 por día): no cargar sin confirmación de Eddy.
- Mudanza a la cuenta corporativa de Claude: no iniciar sin confirmación.
- Reporte de Luzana sin conector Drive/NoClick: conocido.

## Pendientes técnicos
- Eddy vuelve a subir /home/user/skill-diario/diario-informaciones.skill a claude.ai (el skill cambió en 43ff29a).
- Git: main en 43ff29a. Esta nota se commitea en la rama traspaso-19-11.
