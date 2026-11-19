# Diario Informaciones — reparto de trabajo entre modelos (Eddy, 17/11/2026)

Objetivo: ahorrar tokens. Eddy autoriza de forma permanente a delegar en estos dos agentes sin preguntar.

- **Leer el proyecto → agente `Explore` (Haiku).** Toda pasada de lectura del proyecto (buscar dónde está algo, revisar cómo funciona, leer más de 2-3 archivos, juntar contexto) se delega a Explore. La conversación principal no lee archivos grandes por su cuenta.
- **Crear o modificar → agente `programador` (Sonnet).** Todo cambio de código, scripts, SKILL.md o agentes se delega al programador, pasándole el contexto que devolvió Explore para que no vuelva a leer.
- **Flujo típico:** Explore ubica y resume → programador cambia y prueba → la conversación principal le informa a Eddy en 2-3 líneas.
- **No se delega NUNCA:** la atención de clientes (pasadas de Gmail, Pool, Tablero, Drive). Sigue en la conversación principal, con el modelo principal y las reglas del skill diario-informaciones. **Decisión de Eddy (17/11/2026): no se ahorra tokens en las pasadas de clientes; no se arriesgan errores con el cliente.** No proponer bajar de modelo ni delegar esas pasadas.
- Consultas chicas (un archivo, una línea) se pueden resolver directo sin delegar.
