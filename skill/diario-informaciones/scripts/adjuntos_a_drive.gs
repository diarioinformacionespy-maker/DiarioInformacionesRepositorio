/**
 * Diario Informaciones - Copia automática de adjuntos de clientes a Drive.
 * Versión 3 (15/11/2026): todo se guarda en "Adjuntos clientes/ORIGINALES/<día>" y también
 *  el TEXTO de un aviso escrito directo en el correo (archivo "… - TEXTO DEL CORREO.txt").
 *  La IA guarda los corregidos en "ORIGINALES/CORREGIDOS".
 * Versión 2 (15/11/2026):
 *  1) NO duplica: recuerda cada mensaje ya procesado (aunque el cliente
 *     vuelva a responder en el mismo hilo, solo copia lo del mensaje nuevo).
 *  2) Copia también los archivos que el cliente comparte como LINK de
 *     Google Drive / Docs (drive.google.com, docs.google.com).
 *     Si el link no está compartido con el diario, el correo queda con la
 *     etiqueta "drive-sin-acceso" para pedirle al cliente que lo comparta.
 *
 * Cada 5 minutos guarda los Word, PDF, imágenes y Excel de los correos nuevos
 * en la carpeta "Adjuntos clientes" (una subcarpeta por día).
 *
 * INSTALAR / ACTUALIZAR: en script.google.com, abrir el proyecto, borrar todo,
 * pegar este código, guardar, elegir la función "instalar" y tocar Ejecutar.
 * Aceptar los permisos. Listo.
 */

var CARPETA = 'Adjuntos clientes';
var SUB = 'ORIGINALES';                   // todo lo que manda el cliente, tal cual (v3, 15/11/2026)
var ETIQUETA = 'adjunto-en-drive';        // hilo con al menos un archivo guardado
var ETIQUETA_SIN_ACCESO = 'drive-sin-acceso';
var TIPOS = ['pdf', 'doc', 'docx', 'odt', 'rtf', 'jpg', 'jpeg', 'png', 'xls', 'xlsx'];
var IGNORAR = ['diarioinformacionespy@gmail.com', 'bancognb.com.py', 'google.com', 'dnit.gov.py', 'set.gov.py'];
var MAX_RECORDADOS = 3000;                 // ids de mensajes ya procesados

function instalar() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('copiarAdjuntos').timeBased().everyMinutes(5).create();
  marcarExistentes_();   // evita volver a copiar lo que la versión 1 ya guardó
  copiarAdjuntos();
}

function copiarAdjuntos() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return;
  try {
    var hechos = leerHechos_();
    var raiz = carpeta_(carpeta_(DriveApp.getRootFolder(), CARPETA), SUB);
    var label = GmailApp.getUserLabelByName(ETIQUETA) || GmailApp.createLabel(ETIQUETA);
    var labelSin = GmailApp.getUserLabelByName(ETIQUETA_SIN_ACCESO) || GmailApp.createLabel(ETIQUETA_SIN_ACCESO);
    // Ya no se excluyen los hilos con etiqueta: se filtra por MENSAJE.
    var hilos = GmailApp.search('newer_than:5d -in:sent (has:attachment OR "drive.google.com" OR "docs.google.com" OR convoca OR asamblea OR "orden del día" OR "orden del dia" OR escritura OR edicto)', 0, 80);

    hilos.forEach(function (hilo) {
      var guardo = false, sinAcceso = false;
      hilo.getMessages().forEach(function (msj) {
        var id = msj.getId();
        if (hechos[id]) return;                                   // ya procesado
        var de = msj.getFrom().toLowerCase();
        if (IGNORAR.some(function (x) { return de.indexOf(x) >= 0; })) { hechos[id] = 1; return; }
        if (msj.getFrom().toLowerCase().indexOf('diarioinformacionespy') >= 0) { hechos[id] = 1; return; }

        var dia = Utilities.formatDate(msj.getDate(), 'America/Asuncion', 'yyyy-MM-dd');
        var hora = Utilities.formatDate(msj.getDate(), 'America/Asuncion', 'HHmm');
        var asunto = msj.getSubject().substring(0, 60).replace(/[\\/:*?"<>|]/g, '');
        var desc = 'De: ' + msj.getFrom() + ' | Hilo: ' + hilo.getId() + ' | Msj: ' + id;
        var destino = null;
        var dest = function () { return destino || (destino = carpeta_(raiz, dia)); };

        // 1) Adjuntos reales (y las imágenes pegadas en el cuerpo)
        msj.getAttachments({ includeInlineImages: true }).forEach(function (a) {
          var ext = (a.getName().split('.').pop() || '').toLowerCase();
          if (TIPOS.indexOf(ext) < 0) return;
          if (/^(jpg|jpeg|png)$/.test(ext) && a.getSize() < 20000) return;   // firmas y logos
          dest().createFile(a.copyBlob()).setName(hora + ' - ' + asunto + ' - ' + a.getName()).setDescription(desc);
          guardo = true;
        });

        // 2) Links de Google Drive / Docs en el cuerpo del correo (sin las citas)
        idsDrive_(cuerpoSinCitas_(msj)).forEach(function (fid) {
          try {
            var f = DriveApp.getFileById(fid);
            if (f.getMimeType() === MimeType.FOLDER) return;
            f.makeCopy(hora + ' - ' + asunto + ' - LINK - ' + f.getName(), dest()).setDescription(desc + ' | Link: ' + fid);
            guardo = true;
          } catch (e) {
            sinAcceso = true;   // el cliente no lo compartió con el diario
          }
        });

        // 3) Texto del aviso escrito directo en el correo (copiar y pegar)
        var cuerpo = cuerpoSinCitas_(msj).split('\nhref=')[0];
        var c1 = /convoca/i.test(cuerpo) && /asamblea|orden del d[ií]a/i.test(cuerpo);
        var c2 = /por escritura|e\.\s?p\.\s?n[ºo°]|edicto/i.test(cuerpo);
        if ((c1 || c2) && cuerpo.replace(/\s+/g, ' ').length > 250) {
          dest().createFile(hora + ' - ' + asunto + ' - TEXTO DEL CORREO.txt', cuerpo.trim(), MimeType.PLAIN_TEXT).setDescription(desc + ' | Texto del correo');
          guardo = true;
        }

        hechos[id] = 1;
      });
      if (guardo) hilo.addLabel(label);
      if (sinAcceso) hilo.addLabel(labelSin);
    });
    guardarHechos_(hechos);
  } finally {
    lock.releaseLock();
  }
}

/** Saca los ids de archivos de los links de Drive/Docs/Sheets/Slides. */
function idsDrive_(texto) {
  var ids = {}, m;
  var re = /https?:\/\/(?:drive|docs)\.google\.com\/(?:file\/d\/|document\/d\/|spreadsheets\/d\/|presentation\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([-\w]{20,})/g;
  while ((m = re.exec(texto)) !== null) ids[m[1]] = 1;
  return Object.keys(ids);
}

/** Cuerpo del mensaje sin el texto citado de correos anteriores. */
function cuerpoSinCitas_(msj) {
  var t = msj.getPlainBody() || '';
  var corte = t.search(/\n(?:El .{5,80} escribió:|On .{5,80} wrote:|-----Original Message-----)/);
  t = corte > 0 ? t.substring(0, corte) : t;
  return t + '\n' + (msj.getBody().match(/href="[^"]*(?:drive|docs)\.google\.com[^"]*"/g) || []).join('\n');
}

/** Lista de mensajes ya procesados (guardada en las propiedades del script). */
function leerHechos_() {
  var p = PropertiesService.getScriptProperties().getProperty('hechos');
  var arr = p ? JSON.parse(p) : [], o = {};
  arr.forEach(function (x) { o[x] = 1; });
  return o;
}
function guardarHechos_(o) {
  var arr = Object.keys(o);
  if (arr.length > MAX_RECORDADOS) arr = arr.slice(arr.length - MAX_RECORDADOS);
  PropertiesService.getScriptProperties().setProperty('hechos', JSON.stringify(arr));
}

/** Solo al instalar: marca como procesados los mensajes de hilos que la v1 ya copió. */
function marcarExistentes_() {
  var hechos = leerHechos_();
  GmailApp.search('label:' + ETIQUETA + ' newer_than:10d', 0, 200).forEach(function (h) {
    h.getMessages().forEach(function (m) { hechos[m.getId()] = 1; });
  });
  guardarHechos_(hechos);
}

/** Opcional: borra (a la papelera) los duplicados exactos de una carpeta de día. */
function limpiarDuplicados() {
  var raiz = carpeta_(carpeta_(DriveApp.getRootFolder(), CARPETA), SUB), dias = raiz.getFolders(), n = 0;
  while (dias.hasNext()) {
    var vistos = {}, fs = dias.next().getFiles();
    while (fs.hasNext()) {
      var f = fs.next(), k = f.getName() + '|' + f.getSize() + '|' + (f.getDescription() || '').split(' | Msj:')[0];
      if (vistos[k]) { f.setTrashed(true); n++; } else vistos[k] = 1;
    }
  }
  Logger.log('Duplicados enviados a la papelera: ' + n);
}

function carpeta_(padre, nombre) {
  var it = padre.getFoldersByName(nombre);
  return it.hasNext() ? it.next() : padre.createFolder(nombre);
}
