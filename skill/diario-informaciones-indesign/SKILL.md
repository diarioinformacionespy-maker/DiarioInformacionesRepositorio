---
name: "diario-informaciones-indesign"
description: "Arma y exporta en InDesign la edición diaria de DIARIO INFORMACIONES a partir del EDITABLE y del Word de avisos del día. Usar cuando se pida armar, exportar, corregir o probar el diario del día en InDesign."
---

# Exportador del diario a InDesign — DIARIO INFORMACIONES

Flujo para armar la edición de un día en InDesign con el puente `mcp__remote-devices__indesign__*` (corre en la PC del usuario, Windows, InDesign 2022 v17.4) y exportar el PDF de imprenta.

## Dónde está cada cosa

- **EDITABLE (plantilla en blanco):** `\\COMPARTIDO\Users\Public\Downloads\DOWNLOADS\EDITABLE.indd`.
  - La config (`leer_config` → `carpetas.plantilla`) apunta a `...\Downloads\EDITABLE`, que NO existe. Pasar siempre la ruta de arriba en `preparar_edicion(editable=...)`.
  - Tiene 4 páginas de 290 × 406 mm, enfrentadas, sin sangrado. Cada página tiene una letra de sección ("A"), la cabecera "DIARIO INFORMACIONES … Asunción (Paraguay) <fecha>", una línea y 10 marcos vacíos (5 columnas × 2 filas, 48 × 104 mm).
  - La cabecera de la plantilla trae una fecha vieja ("Martes 31 de Marzo de 2026"): hay que reemplazarla en las 4 páginas.
  - Suele estar abierta por otra persona en la PC COMPARTIDO. Si InDesign se traba con un cuadro de diálogo, pedirle al usuario que lo cierre (abrir copia o solo lectura).
- **Avisos del día (Word):** `\\COMPARTIDO\Users\Public\Downloads\DIARIO <DÍA> DD-MM-AAAA.docx` (Descargas públicas, raíz). Los históricos están en `Downloads\Diarios Work\`.
  - Al renombrar en Windows la fecha de modificación no cambia: buscar por nombre (y por fecha de creación), no solo por "más reciente".
  - El escritorio personal de la PC COMPARTIDO no es accesible por red; solo `Users\Public`.
- **Ediciones exportadas:** `C:\Users\USER\Documents\EXPORTADOS DE IN DESIGN DIARIO DEL DIA\` → `DIARIO_<Dia>_<DD-MM-AAAA>.indd` y `.pdf`.
- **Leer un .docx de una ruta UNC:** `device_stage_files` no acepta rutas UNC. Leerlo desde InDesign con `ejecutar_extendscript`: crear un documento temporal invisible (`app.documents.add(false)`), colocar el .docx en un marco, leer `parentStory.contents` y cerrar sin guardar.
- ExtendScript no tiene `JSON`. Los scripts largos sobre la red pueden pasar de 80 s: limitar la búsqueda a carpetas concretas.

## Pasos

1. `estado` para ver qué hay abierto y si el puente responde.
2. Localizar el Word del día en Descargas públicas y leerlo (ver arriba).
3. `preparar_edicion(fecha=AAAA-MM-DD, editable=<ruta EDITABLE>)` → crea `DIARIO_<Dia>_<DD-MM-AAAA>.indd`.
4. Cargar cada aviso en un marco vacío de la página 1, de izquierda a derecha (fila de arriba primero), con el formato del diseñador:
   - Nombre de la empresa y tipo de asamblea: estilo `MEDIO`, NewCenturySchlbk-Bold 9/10 pt, centrado, 1 mm antes y después.
   - Cuerpo e ítems del orden del día: `[Párrafo básico]`, NewCenturySchlbk-Roman 9/9 pt, justificado a la izquierda.
   - "ORDEN DEL DÍA": estilo `orden`, NewCenturySchlbk-Bold 9/9,5 pt, centrado, 2 mm antes y después.
   - Firma (EL PRESIDENTE / EL DIRECTORIO) y línea "Op NNNN) DD-MES": `Estilo de párrafo 3`, Roman 9/9 pt, alineado a la derecha.
   - Respetar el texto del Word tal cual (incluida la línea Op).
5. Reemplazar la fecha de la cabecera en las 4 páginas por "<Día> DD de <Mes> de AAAA" (Mes con mayúscula inicial, como el diseñador).
6. **Corregir el interletraje roto (obligatorio, ver abajo).**
7. Guardar, `preflight`, `exportar_pdf`, `verificar_pdf`. Las muestras RGB "Gold" y "Rose" son advertencias conocidas de la plantilla, no frenan.
8. Si hay computer use, mirar la página en InDesign (zoom a los títulos) antes de dar por terminado.

## Interletraje roto en NewCenturySchlbk-Bold (nombres superpuestos)

La fuente NewCenturySchlbk-Bold trae en su tabla de interletraje "Métrico" un valor roto para el par **espacio + T**: −3837/1000 em (unos −12 mm). Resultado: en títulos como "MACHAS TRADING S.A.", "TRADING" se dibuja encima de "MACHAS". La Roman no tiene el problema.

Después de cargar los avisos, recorrer los puntos de inserción de cada historia y dejar en 0 cualquier interletraje anormal:

```javascript
var ip = story.insertionPoints;
for (var i = 1; i < ip.length - 1; i++) {
  var kv; try { kv = ip[i].kerningValue; } catch (e) { continue; }
  if (Math.abs(kv) > 200) ip[i].kerningValue = 0;
}
```

Solución de fondo, solo si el usuario la aprueba: pasar el estilo `MEDIO` a interletraje "Óptico" (cambia levemente el aspecto de todos los títulos).

## Preset MARCA (registros y renovaciones de marca) — Eddy 23/11/2026

Tomado del diario impreso del jueves 12/11/2026 (NH, NHOW, DYNASTY, Bioval…). Cada marca se arma SIEMPRE así, en este orden, en una columna, con una línea separadora abajo:

| # | Bloque (`corregido_bloques`) | Contenido | Formato |
|---|---|---|---|
| 1 | `AV_MFecha` | "Asunción, 6 de Noviembre de 2026" (fecha de la orden de DINAPI, mes con mayúscula) | UNA sola línea, justificada a todo el ancho (Hugo 23/11) |
| 2 | `AV_MIntro` | "Publíquese por el término de ley la presente marca constituida por:" | justificado; la sangría son 3 ESPACIOS al inicio, no sangría de párrafo (Hugo 23/11) |
| 3 | `AV_MDenom` | "Denominación:" | izquierda |
| 4 | `AV_MNombre` | NOMBRE de la marca tal cual la orden (ej. NH COLLECTION, Bioval) | negrita, centrado, aire arriba/abajo |
| 5 | `AV_Logo` | `[[LOGO:logo_<código>.png]]` — SOLO si el signo es Mixto o Figurativo. Denominativas (Bioval, Multivag, NIRMIN 5) NO llevan logo | centrado; el script lo reemplaza por la imagen |
| 6 | `AV_MCampoJ` (Fecha de Solicitud, Hora de presentación, Nº de expediente) y `AV_MCampo` (el resto), uno por línea | Fecha de Solicitud: DD/MM/AAAA · Hora de presentación: HH:MM:SS · Nº de expediente: … · Clase que ampara: N · Solicitante: … · Domicilio: … · Tipo de marca: Registro / Renovación | justificado |
| 7 | `AV_MFirma` | "Firma y Sello del Funcionario Autorizado" | justificado, última línea ("Autorizado") centrada |
| 8 | `AV_OP` | "Opas ____) DD-MES" (último día de publicación, mes en romanos) | derecha |

- **Campos (Hugo 23/11):** Fecha de Solicitud, Hora de presentación y Nº de expediente van cada uno en UNA línea justificada a todo el ancho (`AV_MCampoJ`); el resto justificado normal. **Nº de expediente** = Nº de solicitud de DINAPI con formato AAAA-número: los 2 primeros dígitos son el año (26 → 2026) y el resto va después del guion (26101332 → 2026-101332; 2695922 → 2026-95922). El exportador del Pool lo convierte solo.
- NO se publica la descripción de productos/servicios (el diario no la pone). Varias solicitudes en una misma orden (ej. GATO DUMAS 2697345/348/351) = un aviso por expediente, cada uno con su clase.
- **Logo:** se recorta de la orden de DINAPI ("(540) Distintivo"), se pasa a gris, 300 dpi, PNG, SIN fondo gris ni líneas del escaneo (renglones, punteados, sello), y se guarda en el Pool (asset) con `logo_img: {asset_id, url, archivo: "logo_<código>.png", pagina_pdf}`. Si varios expedientes comparten logo, reusan el mismo archivo.
- **Exportar:** el botón "EXPORTAR A INDESIGN" del Pool baja el `InDesign_avisos_<fecha>.txt` y, a continuación, cada logo (`logo_<código>.png`). Guardar todo en la misma carpeta.
- **Colocar logos:** después de colocar el .txt en InDesign (Archivo → Colocar), correr `scripts/colocar_logos.jsx` (repo: `skill/diario-informaciones-indesign/scripts/`). Busca cada `[[LOGO:archivo]]`, pone la imagen como gráfico en línea centrado, ajustado al ancho de la columna y a máx. 18 mm de alto, y avisa cuáles no encontró. Por el puente: `ejecutar_extendscript` con ese código (cambiar `Folder.selectDialog` por la ruta de la carpeta).
- Transferencias de marca (ej. ADAMA): sin logo, texto de la orden de Actos Jurídicos ("Publíquese por el término de Ley la Transferencia de la marca denominada…").

## Reglas

- Nunca modificar el EDITABLE: trabajar siempre sobre la copia de la edición.
- No enviar el PDF a la imprenta sin confirmación del usuario (datos de la imprenta PENDIENTES en la config).
- Si el usuario dice que algo se ve mal, mirar la pantalla o medir posiciones de caracteres (`horizontalOffset`) antes de suponer la causa.