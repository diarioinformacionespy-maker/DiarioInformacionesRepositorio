# Pasada automática de correo DIARIO INFORMACIONES (PC de la oficina).
# La ejecuta el Programador de tareas de Windows cada 10 min, lun-vie 07:00-15:00.
# Requiere: Claude Code instalado (claude en el PATH) y sesión iniciada con la cuenta del diario.
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
$log = Join-Path $repo "logs\pasadas.log"
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null
$prompt = "Pasada automática de correo DIARIO INFORMACIONES (reglas CLAUDE.md + skill diario-informaciones). Revisar in:inbox newer_than:1d: todo hilo cuyo último mensaje sea del cliente y sin borrador nuestro, contestar. Antes de 15:00 Asunción solo BORRADOR + Label_8 + UNREAD + INBOX. Si el cliente reenvía texto, recalcular precio. Si no hay nada nuevo, terminar."
"=== $(Get-Date -Format 'yyyy-MM-dd HH:mm') ===" | Out-File -Append -Encoding utf8 $log
claude -p $prompt 2>&1 | Out-File -Append -Encoding utf8 $log
