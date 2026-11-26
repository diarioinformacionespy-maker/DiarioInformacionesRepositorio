// Autoriza al bot a LEER el Gmail del diario (solo lectura). Se corre una sola vez:
//   node src/autorizar-gmail.js
// 1) Muestra un enlace. Se abre en el navegador de la PC, con la cuenta del diario, y se acepta.
// 2) Google redirige a una página "localhost" que no carga: se copia la dirección completa de esa página
//    y se pega acá. Queda guardado google/token.json.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { join } from 'node:path'
import { SCOPES } from './gmail.js'

const DIR = process.env.GOOGLE_DIR || './google'
mkdirSync(DIR, { recursive: true })
let cred
try { cred = JSON.parse(readFileSync(join(DIR, 'credentials.json'), 'utf8')) } catch {
  console.log('Falta google/credentials.json. Cárguelo primero.'); process.exit(1)
}
const { client_id, client_secret } = cred.installed || cred.web
const redirect = 'http://localhost:8765'
const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id, redirect_uri: redirect, response_type: 'code', access_type: 'offline', prompt: 'consent', scope: SCOPES.join(' '),
})
console.log('\n1) Abra este enlace en el navegador de su PC (con la cuenta del diario) y acepte:\n')
console.log(url + '\n')
console.log('2) Al final el navegador muestra un error de "localhost": es normal.')
console.log('   Copie la dirección COMPLETA de esa página (empieza con http://localhost:8765/?...) y péguela acá.\n')
const rl = createInterface({ input: process.stdin, output: process.stdout })
const pegado = (await rl.question('Dirección: ')).trim()
rl.close()
const code = new URL(pegado.replace(/^.*?(http:\/\/localhost)/, '$1')).searchParams.get('code')
if (!code) { console.log('No encontré el código en esa dirección. Pruebe de nuevo.'); process.exit(1) }
const res = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ code, client_id, client_secret, redirect_uri: redirect, grant_type: 'authorization_code' }),
})
const j = await res.json()
if (!res.ok || !j.refresh_token) { console.log('Google rechazó la autorización:', j.error_description || j.error || 'sin refresh_token'); process.exit(1) }
writeFileSync(join(DIR, 'token.json'), JSON.stringify({ refresh_token: j.refresh_token, scope: j.scope }, null, 2), { mode: 0o600 })
console.log('\n✅ Listo: el bot ya puede leer el Gmail (solo lectura). Reinicie con: pm2 restart whatsapp-bot')
