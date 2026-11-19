# Instalar el bot de Gmail (Windows)

El bot corre en una PC de la oficina. Lee los correos nuevos de
diarioinformacionespy@gmail.com, descarga los adjuntos, cotiza y deja BORRADORES.
Nunca envía nada: una persona revisa cada borrador y lo envía.

## 1. Programas (una sola vez)

1. **Python 3.12 o superior**: https://www.python.org/downloads/
   Al instalar, marcar **"Add python.exe to PATH"**.
2. **LibreOffice** (para leer Word antiguo .doc): https://www.libreoffice.org/download/
3. Abrir una terminal (tecla Windows, escribir `cmd`) en la carpeta `diario-bot` y ejecutar:

       pip install -r requirements.txt

## 2. Permiso de Google para leer el Gmail (una sola vez, ~10 minutos)

1. Entrar a https://console.cloud.google.com con la cuenta diarioinformacionespy@gmail.com.
2. Crear un proyecto: "Bot Diario Informaciones".
3. Menú **APIs y servicios > Biblioteca**: habilitar **Gmail API** y **Google Drive API**.
4. **APIs y servicios > Pantalla de consentimiento de OAuth**: tipo **Externo**, nombre "Bot Diario",
   y en **Usuarios de prueba** agregar diarioinformacionespy@gmail.com.
5. **APIs y servicios > Credenciales > Crear credenciales > ID de cliente de OAuth**,
   tipo **App de escritorio**. Descargar el JSON y guardarlo en la carpeta `diario-bot`
   con el nombre **credentials.json**.

## 3. Clave de Claude (para leer imágenes y PDF escaneados)

Los Word y los PDF con texto se leen sin IA y no tienen costo.
Para fotos, capturas y PDF escaneados o con diseño se usa Claude:

1. Crear una clave en https://console.anthropic.com (Settings > API Keys) y cargar saldo.
2. En la terminal (una sola vez):

       setx ANTHROPIC_API_KEY "la-clave-copiada"

   Cerrar y volver a abrir la terminal.

Costo aproximado: unos 2 a 3 centavos de dólar por archivo escaneado.
Sin la clave el bot igual funciona: esos casos quedan marcados para que los cotice una persona.

## 4. Completar los datos

- `datos_pago.json`: copiar `datos_pago.example.json` y completar banco, cuenta, firma, etc.
- `config.json`: `lugar_desde` (primera fecha con cupo, se actualiza cada día),
  días sin edición, feriados y `criterio_anticipacion` (lo define el asesor jurídico).

## 5. Usarlo

Ensayo (borradores SIN destinatario, con asunto "[ENSAYO BOT]"):

    python gmail_bot.py

La primera vez se abre el navegador para autorizar. Google avisa "app no verificada":
tocar **Avanzado > Ir a Bot Diario**. Queda guardado en `token.json`.

Ensayo con los correos de hoy (aunque ya estén respondidos):

    python gmail_bot.py --consulta "in:inbox -from:me newer_than:1d"

Modo real (borradores como respuesta dentro del hilo de cada cliente):

    python gmail_bot.py --modo real --cada 5

Cada correo procesado queda con la etiqueta **BOT-procesado** (no se marca como leído).
Los casos dudosos llevan **[REVISAR]** en el asunto del borrador: corregir y quitar esa marca antes de enviar.

## Notas

- Mientras la app de Google esté "en prueba", la autorización vence cada 7 días:
  borrar `token.json` y volver a autorizar. Publicar la app en Google Cloud lo evita.
- `credentials.json`, `token.json` y `datos_pago.json` no se comparten ni se suben a ningún lado.
- Links de Drive: el bot solo puede abrirlos si el cliente los compartió ("cualquiera con el enlace").
