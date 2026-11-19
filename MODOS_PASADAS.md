# Modos de frecuencia de las pasadas (Eddy, 19/11/2026)

Las pasadas de clientes (Gmail, Pool, Tablero, Drive) no se delegan ni se bajan de modelo. Lo único que cambia según tokens disponibles es la frecuencia.

## Modo normal (hoy)
- Pasadas cada 10 minutos, como ahora.

## Modo ahorro
- Pasadas cada 30 minutos en horario de atención (07:00 a 15:00).
- Una pasada a las 19:00 (cierre de la noche).
- Una pasada a las 07:00 del día siguiente (control de la mañana).

## Modo mínimo (cuando se acaben los tokens del día o de la semana)
- Una pasada cada hora.
- Desde las 15:00 (modo automático, envío): pasada final a las 19:00 y control a las 07:00 del día siguiente.

## Pendiente antes de aplicar cualquier modo
- Desactivar las 12 rutinas viejas que siguen disparando en paralelo (ver trigger_id en el skill / notas de sesión). No gasta tokens extra, pero evita duplicados.
- Cambiar el horario de las rutinas actuales solo cuando Eddy lo pida (las rutinas son de su cuenta).
