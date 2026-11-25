# Pasadas de correo en la PC de la oficina (Hugo / Claudio)

Objetivo: que la revisión del correo cada 10 min corra sola en la PC de la oficina,
sin depender de la sesión en la nube.

## Dónde viven las reglas
- `CLAUDE.md` (esta carpeta) → reglas generales: horarios, envío, borradores.
- `skill/diario-informaciones/SKILL.md` → reglas de atención, precios, KV.
Claude las lee solo cuando se ejecuta dentro de esta carpeta. No hay que copiarlas a mano.

## Instalación (una sola vez)
1. Instalar **Claude Code** en la PC (https://claude.com/claude-code) e iniciar sesión con la cuenta del diario.
2. Descargar este repositorio (rama `traspaso-19-11`) y dejarlo en, por ejemplo, `C:\DiarioInformaciones`.
3. Verificar que Claude Code tenga los conectores **Gmail** y **Google Drive** de claude.ai.
4. Abrir una terminal en `C:\DiarioInformaciones`, escribir `claude` y hacer UNA pasada a mano
   (pegar el texto de la pasada). Cuando pida permisos de Gmail (buscar, leer, crear borrador,
   etiquetar) y del Pool, elegir **"Sí, y no volver a preguntar"**. NO permitir "enviar/responder":
   así nunca envía solo, todo queda en borrador para Hugo.

## Programar cada 10 minutos (Programador de tareas de Windows)
1. Inicio → "Programador de tareas" → **Crear tarea**.
2. General: nombre "Pasada correo Diario"; marcar "Ejecutar tanto si el usuario inició sesión como si no".
3. Desencadenadores → Nuevo: **Diariamente** 07:00, "Repetir la tarea cada **10 minutos**" durante **8 horas**.
   (Para lun–vie: usar "Semanalmente" y marcar lunes a viernes.)
4. Acciones → Nuevo: Programa `powershell.exe`,
   argumentos `-ExecutionPolicy Bypass -File "C:\DiarioInformaciones\scripts\pasada_correo.ps1"`.
5. Condiciones: desmarcar "Iniciar solo si el equipo está conectado a la corriente alterna".
6. Configuración de energía: que la PC **no se suspenda** (Configuración → Sistema → Energía → Nunca).

Cada pasada queda registrada en `logs\pasadas.log`.

## Convivencia con la nube
La sesión en la nube queda como respaldo (1 vez por hora) y antes de responder revisa
si ya hay borrador, para que el cliente no reciba dos respuestas.
