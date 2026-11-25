# Pasada automática de correo DIARIO INFORMACIONES (PC de la oficina).
# La ejecuta el Programador de tareas de Windows cada 10 min, lun-vie 07:00-15:00.
# Requiere: Claude Code instalado (claude en el PATH) y sesión iniciada con la cuenta del diario.
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
$log = Join-Path $repo "logs\pasadas.log"
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null
$prompt = "Pasada automática DIARIO INFORMACIONES, CIRCUITO COMPLETO (reglas CLAUDE.md + skill diario-informaciones): 1) CORREO: in:inbox newer_than:1d, contestar todo hilo cuyo último mensaje sea del cliente y sin borrador nuestro; antes de 15:00 Asunción solo BORRADOR KV + Label_8 + UNREAD + INBOX; si el cliente reenvía texto, recalcular precio; estudios solo Recibido + Label_7; pedidos de factura: tarjeta en el Tablero. 2) PAGOS: cruzar avisos GNB/Sudameris con el Pool. 3) ORIGINALES: todo adjunto o texto de cliente en ORIGINALES/<hoy>. 4) POOL: todo original de aviso con su registro. 5) CORREGIDOS: todo aviso sin corregido_bloques -> armar CORREGIDO en CORREGIDOS/<fecha 1ª publicación>. 6) TABLERO: toda duda -> tarjeta. Verificar en Drive/Pool antes de afirmar algo. Si no hay nada nuevo ni pendiente, terminar."
"=== $(Get-Date -Format 'yyyy-MM-dd HH:mm') ===" | Out-File -Append -Encoding utf8 $log
claude -p $prompt 2>&1 | Out-File -Append -Encoding utf8 $log
