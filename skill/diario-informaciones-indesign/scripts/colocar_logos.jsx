// colocar_logos.jsx — DIARIO INFORMACIONES (preset MARCA, Eddy 23/11/2026)
// Reemplaza cada marcador [[LOGO:archivo.png]] del documento activo por la imagen,
// como gráfico anclado en línea, centrado, ajustado al ancho de la columna (máx. 18 mm de alto).
// Los logos los baja el exportador del Pool junto al InDesign_avisos_<fecha>.txt.
// Uso: Ventana > Utilidades > Scripts, o por el puente con ejecutar_extendscript.
#target indesign
(function () {
  if (!app.documents.length) { alert("No hay documento abierto."); return; }
  var doc = app.activeDocument;
  var carpeta = Folder.selectDialog("Carpeta donde están los logos (la misma del .txt)");
  if (!carpeta) return;
  var MAX_ALTO = 18; // mm
  var oldUnits = doc.viewPreferences.horizontalMeasurementUnits;
  doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.MILLIMETERS;
  doc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.MILLIMETERS;
  app.findGrepPreferences = app.changeGrepPreferences = NothingEnum.nothing;
  app.findGrepPreferences.findWhat = "\\[\\[LOGO:([^\\]]+)\\]\\]";
  var hits = doc.findGrep(true); // de atrás hacia adelante
  var ok = 0, faltan = [];
  for (var i = 0; i < hits.length; i++) {
    var t = hits[i], nombre = t.contents.replace(/^\[\[LOGO:/, "").replace(/\]\]$/, "");
    var f = File(carpeta.fsName + "/" + nombre);
    if (!f.exists) { faltan.push(nombre); continue; }
    var ip = t.insertionPoints[0];
    var col = t.parentTextFrames.length ? t.parentTextFrames[0] : null;
    var ancho = 40;
    if (col) { var gb = col.geometricBounds; ancho = (gb[3] - gb[1]) / col.textFramePreferences.textColumnCount - 4; }
    t.contents = "";
    var g = ip.place(f)[0];
    var marco = g.parent;
    marco.fit(FitOptions.FRAME_TO_CONTENT);
    var b = marco.geometricBounds, w = b[3] - b[1], h = b[2] - b[0];
    var esc = Math.min(ancho / w, MAX_ALTO / h, 1) * 100;
    g.horizontalScale = g.verticalScale = esc;
    marco.fit(FitOptions.FRAME_TO_CONTENT);
    try { marco.anchoredObjectSettings.anchoredPosition = AnchorPosition.INLINE_POSITION; } catch (e) {}
    ok++;
  }
  doc.viewPreferences.horizontalMeasurementUnits = oldUnits;
  alert("Logos colocados: " + ok + (faltan.length ? "\nNo encontrados (sacarlos del PDF original):\n" + faltan.join("\n") : ""));
})();
