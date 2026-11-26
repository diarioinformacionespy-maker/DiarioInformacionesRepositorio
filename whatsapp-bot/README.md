# Bot de WhatsApp (Baileys) en un VPS

Bot que atiende el WhatsApp Business del diario: muestra un menú y responde las preguntas frecuentes. Cuando hace falta, le pasa la conversación a una persona del equipo.

## Qué hace

- **Menú** al primer mensaje del día de cada cliente (o cuando escribe `hola` o `menu`).
- **Opciones 1 a 3**: respuestas fijas (aviso, pagos, horarios). Se editan en `src/respuestas.js`.
- **Opción 4, "persona" o "asesor"**: avisa al número `ADMIN_NUMBER` y el bot se calla en ese chat.
- **Archivos y textos largos** (comprobantes, textos de avisos): confirma que los recibió, avisa al admin y le deja el chat a una persona.
- **Fuera de horario**: avisa una sola vez y no molesta más.
- **Si alguien del equipo contesta a mano** (desde el celular o WhatsApp Web), el bot se calla en ese chat por `HORAS_PAUSA` horas.
  - Escribir `#bot` en el chat reactiva el bot.
  - Escribir `#pausa` lo calla para siempre en ese chat.
  - Los clientes no ven esos mensajes como respuestas del bot, pero sí les llegan. Conviene mandarlos y borrarlos "para todos".
- No responde en grupos, estados ni canales.

## ⚠️ Antes de empezar

- Baileys **no es la API oficial**. Si WhatsApp detecta spam o mensajes masivos, puede bloquear el número. Este bot solo responde a quien escribe primero, que es el uso de menor riesgo. **No lo uses para envíos masivos.**
- El número se vincula como un "dispositivo vinculado". **El celular con WhatsApp Business sigue funcionando** y el equipo puede seguir atendiendo desde ahí.
- Hay que abrir WhatsApp en ese celular al menos **una vez cada 14 días**. Si no, WhatsApp desvincula los dispositivos.

## 1. El VPS

Cualquier VPS con **Ubuntu 22.04 o 24.04 y 1 GB de RAM** alcanza: Hetzner, Contabo, DigitalOcean, Vultr, etc., por unos USD 4 a 6 al mes. No necesita dominio ni puertos abiertos, porque el bot solo hace conexiones hacia afuera.

Entrá por SSH e instalá Node 22 y PM2:

```bash
ssh root@IP_DEL_VPS
```

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs unzip
```

```bash
npm install -g pm2
```

## 2. Subir el bot

Desde tu PC, en la carpeta donde descargaste `whatsapp-bot.zip`:

```bash
scp whatsapp-bot.zip root@IP_DEL_VPS:/root/
```

En el VPS:

```bash
cd /root && unzip whatsapp-bot.zip && cd whatsapp-bot && npm install --omit=dev
```

```bash
cp .env.example .env && nano .env
```

En `.env`, poné en `ADMIN_NUMBER` tu número personal (no el del bot), y ajustá los horarios si hace falta.

## 3. Vincular el número (una sola vez)

La primera vez, corré el bot a mano para ver el QR:

```bash
npm start
```

En el celular con el número business: **WhatsApp Business → ⋮ → Dispositivos vinculados → Vincular un dispositivo**, y escaneá el QR de la terminal. Cuando aparezca `✅ Conectado`, cortá con **Ctrl+C**.

> Si el QR se ve mal en tu terminal: en `.env` poné `PAIRING_NUMBER=595981XXXXXX` (el número del bot) y volvé a correr `npm start`. Te va a dar un **código de 8 dígitos**. En el celular elegí *"Vincular con número de teléfono"* y escribí ese código.

La sesión queda guardada en la carpeta `auth/`. **No la compartas:** quien la tenga controla el WhatsApp.

## 4. Dejarlo corriendo 24/7

```bash
pm2 start ecosystem.config.cjs && pm2 save && pm2 startup
```

(`pm2 startup` imprime un comando: copialo y ejecutalo, así el bot arranca solo si se reinicia el VPS).

Comandos útiles:

```bash
pm2 logs whatsapp-bot
```

```bash
pm2 restart whatsapp-bot
```

```bash
pm2 status
```

## 5. Probar

Desde otro celular, escribile `hola` al número business. Tiene que llegar el menú.

## Cambiar textos

Editá `src/respuestas.js` y después:

```bash
pm2 restart whatsapp-bot
```

## Problemas comunes

| Síntoma | Solución |
|---|---|
| `Sesión cerrada desde el celular` | Se desvinculó el dispositivo. Corré `pm2 stop whatsapp-bot`, después `npm start`, escaneá el QR de nuevo y volvé a correr `pm2 start whatsapp-bot`. |
| Reconecta en loop | Mirá `pm2 logs`. Si persiste, borrá `auth/` y vinculá de nuevo. |
| El bot no responde en un chat | Probablemente está en pausa porque alguien respondió a mano. Escribí `#bot` en ese chat. |
| Responde dos veces | Hay dos procesos corriendo. Revisá `pm2 status` y dejá solo uno. |

## Instalación actual (26/11/2026)

- Servidor: DigitalOcean, Droplet `bot-diario-informaciones` (NYC3, Ubuntu 24.04, 1 GB, USD 6/mes).
- Número vinculado: WhatsApp Business del diario. Avisos al admin según `ADMIN_NUMBER` en el `.env` del servidor.
- Se administra desde el panel de DigitalOcean → Droplet → **Web Console** (no hace falta SSH).
- El bot corre con PM2: `pm2 status`, `pm2 logs whatsapp-bot --lines 30 --nostream`, `pm2 restart whatsapp-bot`.

### Datos bancarios

Este repositorio es público, así que en `src/respuestas.js` (opción 5, "Cómo pagar") los datos de la cuenta figuran como `COMPLETAR`. La versión real, con los datos completos, está solo en el servidor. Si se reinstala desde este repositorio, hay que completarlos antes de arrancar el bot.

### Versión con IA (activa desde el 26/11/2026)

- Sin menú: responde conversando, con la información de `conocimiento.md` (tarifas, requisitos, plazos, pago) y la fecha tentativa calculada con las reglas del Pool (`src/fechas.js`).
- Por WhatsApp solo da estimativos: siempre pide que el texto del aviso se mande por correo a diarioinformacionespy@gmail.com para el presupuesto formal.
- Responde en varios mensajes cortos, con "escribiendo…" entre cada uno.
- Deriva a una persona (avisa a `ADMIN_NUMBER` y pausa el chat) cuando piden hablar con alguien, mandan archivos o comprobantes, piden factura, cooperativas, reclamos o dudas.
- IA: Gemini, plan gratis (`src/ia.js`), con varios modelos de respaldo si uno está saturado. **Pendiente: pasar a Claude**: en el plan gratis Google puede usar las conversaciones para entrenar su IA.
- En `conocimiento.md` los datos bancarios figuran como `COMPLETAR`; la versión real está solo en el servidor.
