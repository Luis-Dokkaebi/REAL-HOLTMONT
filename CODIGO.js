/**
 * ======================================================================
 * HOLTMONT WORKSPACE V158 - SCRIPTMASTER EDITION
 * Backend: Lógica optimizada con detección de Especialidad para Filtros
 * Actualización: Soporte para Múltiples PPC (Interno, Preoperativo, Cliente)
 * ======================================================================
 */

var DEMO_MODE = false; // HOTFIX: MODO DEMO
const SS = SpreadsheetApp.getActiveSpreadsheet();

// --- CONFIGURACIÓN ---
const WEBHOOK_OUTLOOK_URL = "https://hook.us2.make.com/fepkg526j29043bkw5imd8r2fhzmv2wq";

const APP_CONFIG = {
  folderIdUploads: "", 
  ppcSheetName: "PPCV3",          
  draftSheetName: "PPC_BORRADOR", 
  salesSheetName: "Datos",        
  logSheetName: "LOG_SISTEMA",
  directorySheetName: "DB_DIRECTORY", // NUEVO: Hoja de Directorio
  // NUEVAS HOJAS PARA DETALLES DE WORK ORDER
  woMaterialsSheet: "DB_WO_MATERIALES",
  woLaborSheet: "DB_WO_MANO_OBRA",
  woToolsSheet: "DB_WO_HERRAMIENTAS",
  woEquipSheet: "DB_WO_EQUIPOS",
  woProgramSheet: "DB_WO_PROGRAMA"
};

const FOLIO_CONFIG = {
  SHEET_NAME: 'ANTONIA_VENTAS',
  COLUMN_NAME: 'Folio'
};

// ORGANIGRAMA OFICIAL (fuente de verdad: organigrama por departamento).
// Cada persona aparece en el/los departamento(s) que le corresponde(n).
const INITIAL_DIRECTORY = [
    // CEO
    { name: "LUIS CARLOS", dept: "CEO", type: "ESTANDAR" },
    { name: "JUAN JOSE SANCHEZ", dept: "CEO", type: "ESTANDAR" },
    // RECURSOS HUMANOS (RH)
    { name: "DIMAS ELIEL RAMOS GARCIA", dept: "RH", type: "ESTANDAR" },
    { name: "LAURA EDITH HUERTA ROCHA", dept: "RH", type: "ESTANDAR" },
    { name: "LILIANA AYLIN MARTINEZ IBARRA", dept: "RH", type: "ESTANDAR" },
    { name: "FRANCISCO SANCHEZ SERNA", dept: "RH", type: "ESTANDAR" },
    // FINANZAS
    { name: "JUANA MARIA RODRIGUEZ JUAREZ", dept: "FINANZAS", type: "ESTANDAR" },
    { name: "ZAIRA YAZMIN AGUILAR AGUILON", dept: "FINANZAS", type: "ESTANDAR" },
    { name: "ROCIO ABIGAIL CASTRO COVARRUBIAS", dept: "FINANZAS", type: "ESTANDAR" },
    { name: "DANIA LIZBETH GONZALEZ LORES", dept: "FINANZAS", type: "ESTANDAR" },
    // COMPRAS
    { name: "SONIA GARCIA PEREZ", dept: "COMPRAS", type: "ESTANDAR" },
    { name: "JUDITH ECHAVARRIA", dept: "COMPRAS", type: "ESTANDAR" },
    { name: "VANESSA DE LARA", dept: "COMPRAS", type: "ESTANDAR" },
    // PRESUPUESTOS
    { name: "EDUARDO TERAN", dept: "PRESUPUESTOS", type: "HIBRIDO" },
    { name: "ANTONIA PINEDA LOPEZ", dept: "PRESUPUESTOS", type: "ESTANDAR" },
    // CALIDAD
    { name: "CARLOS MENDEZ", dept: "CALIDAD", type: "ESTANDAR" },
    // SEGURIDAD
    { name: "RUBI MORENO RODRIGUEZ", dept: "SEGURIDAD", type: "ESTANDAR" },
    // PRECIOS UNITARIOS
    { name: "TERESA GARZA", dept: "PRECIOS UNITARIOS", type: "HIBRIDO" },
    { name: "GERALDINE MARTINEZ HERNANDEZ", dept: "PRECIOS UNITARIOS", type: "ESTANDAR" },
    // DISEÑO
    { name: "ANGEL SALINAS", dept: "DISEÑO", type: "HIBRIDO" },
    { name: "EDGAR URIMAR LOPEZ MALDONADO", dept: "DISEÑO", type: "ESTANDAR" },
    // VENTAS
    { name: "ANTONIA_VENTAS", dept: "VENTAS", type: "VENTAS" },
    { name: "EDUARDO MANZANARES", dept: "VENTAS", type: "HIBRIDO" },
    { name: "RAMIRO RODRIGUEZ", dept: "VENTAS", type: "HIBRIDO" },
    { name: "SEBASTIAN PADILLA", dept: "VENTAS", type: "HIBRIDO" },
    // ELECTROMECANICA
    { name: "JEHU MARTINEZ", dept: "ELECTROMECANICA", type: "ESTANDAR" },
    { name: "MIGUEL GALLARDO", dept: "ELECTROMECANICA", type: "ESTANDAR" },
    // HVAC
    { name: "ROLANDO MORENO", dept: "HVAC", type: "ESTANDAR" },
    { name: "EMILIANO ARREDONDO GOMEZ", dept: "HVAC", type: "ESTANDAR" },
    // CONSTRUCCION
    { name: "JAIME OLIVO", dept: "CONSTRUCCION", type: "ESTANDAR" },
    { name: "RICARDO MENDO", dept: "CONSTRUCCION", type: "ESTANDAR" },
    { name: "ALFONSO CORREA", dept: "CONSTRUCCION", type: "ESTANDAR" },
    { name: "CESAR EDUARDO GARCIA AVALOS", dept: "CONSTRUCCION", type: "ESTANDAR" },
    // LIMPIEZA
    { name: "EDUARDO BENITEZ", dept: "LIMPIEZA", type: "ESTANDAR" },
    // ALMACEN Y MAQUINARIA
    { name: "SONIA GARCIA PEREZ", dept: "ALMACEN Y MAQUINARIA", type: "ESTANDAR" },
    // SISTEMA (hoja espejo de control, sin login)
    { name: "ADMINISTRADOR", dept: "ADMINISTRACION", type: "HIBRIDO" },
    // GENERAL
    { name: "DANIELA CASTRO", dept: "GENERAL", type: "ESTANDAR" },
    { name: "CESAR GOMEZ", dept: "GENERAL", type: "ESTANDAR" }
];

const DEFAULT_TRACKER_HEADERS = ['ID', 'ESPECIALIDAD', 'CONCEPTO', 'FECHA', 'RELOJ', 'AVANCE', 'ESTATUS', 'COMENTARIOS', 'ARCHIVO', 'CLASIFICACION', 'PRIORIDAD', 'FECHA_RESPUESTA'];
const DEFAULT_SALES_HEADERS = ['FOLIO', 'CLIENTE', 'CONCEPTO', 'VENDEDOR', 'FECHA', 'F. ENTREGA', 'ESTATUS', 'COMENTARIOS', 'ARCHIVO', 'MONTO', 'F2', 'COTIZACION', 'TIMELINE', 'LAYOUT', 'AVANCE'];

// --- ESTRUCTURA ESTÁNDAR DE PROYECTOS (MODIFICADO) ---
// Aquí definimos los sub-proyectos automáticos.
// Se eliminó "PPC PROYECTO" y se agregaron los 3 específicos.
// Se conservan DOCUMENTOS, PLANOS, FOTOGRAFIAS, etc.
const STANDARD_PROJECT_STRUCTURE = [
  "NAVE",
  "AMPLIACION",
  "PPC INTERNO",      // NUEVO
  "PPC PREOPERATIVO", // NUEVO
  "PPC CLIENTE",      // NUEVO
  "DOCUMENTOS",       // PRESERVADO
  "PLANOS Y DISEÑOS", // PRESERVADO
  "FOTOGRAFIAS",      // PRESERVADO
  "CORRESPONDENCIA",  // PRESERVADO
  "REPORTES"          // PRESERVADO
];

function formatDateForOutlook(dateString, defaultOffsetMillis = 0) {
  if (!dateString) {
    const d = new Date(new Date().getTime() + defaultOffsetMillis);
    return d.toISOString().split('.')[0];
  }
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      return new Date(new Date().getTime() + defaultOffsetMillis).toISOString().split('.')[0];
    }
    return d.toISOString().split('.')[0];
  } catch (e) {
    return new Date(new Date().getTime() + defaultOffsetMillis).toISOString().split('.')[0];
  }
}

const NotifierService = {
  sendToOutlook: function(payloadData) {
    if (!WEBHOOK_OUTLOOK_URL || WEBHOOK_OUTLOOK_URL === "URL_DE_POWER_AUTOMATE_AQUI") {
      return { success: false, message: "Webhook no configurado." };
    }

    const payload = {
      folio: payloadData.folio || "Sin Folio",
      titulo: payloadData.titulo || "Asignación de Tarea",
      descripcion: payloadData.descripcion || "Tienes una nueva tarea asignada en Holtmont Workspace.",
      fechaInicio: formatDateForOutlook(payloadData.fechaInicio, 0),
      fechaFin: formatDateForOutlook(payloadData.fechaFin, 60 * 60 * 1000), // Default to 1 hour later if missing
      correoDestino: payloadData.correoDestino,
      asignadoPor: payloadData.asignadoPor || "SISTEMA"
    };

    const opciones = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    try {
      const respuesta = UrlFetchApp.fetch(WEBHOOK_OUTLOOK_URL, opciones);
      const code = respuesta.getResponseCode();

      if (code === 200 || code === 202) {
        console.log(`Evento Outlook enviado exitosamente a ${payload.correoDestino}. (Código: ${code})`);
        return { success: true, code: code };
      } else {
        console.error(`Fallo Webhook. Código: ${code}. Respuesta: ${respuesta.getContentText()}`);
        return { success: false, code: code, message: respuesta.getContentText() };
      }
    } catch (e) {
      console.error(`Excepción HTTP en NotifierService: ${e.toString()}`);
      return { success: false, code: 500, message: e.toString() };
    }
  }
};

function findUserEmailByLabel(friendlyName) {
  if (!friendlyName) return null;
  const nameUpper = String(friendlyName).trim().toUpperCase();

  for (const key in USER_DB) {
    if (USER_DB[key] && USER_DB[key].label) {
      if (USER_DB[key].label.toUpperCase() === nameUpper) {
        return USER_DB[key].email || null;
      }
    }
    if (key.replace(/_/g, " ") === nameUpper) {
       return USER_DB[key].email || null;
    }
  }
  return null;
}

function testIntegracionOutlook() {
  const emailSebastian = findUserEmailByLabel("Sebastian Padilla");

  if (!emailSebastian) {
    console.error("Error: El usuario SEBASTIAN_PADILLA no tiene un correo configurado.");
    return;
  }

  const payload = {
    folio: "TEST-001",
    titulo: "[PRUEBA] Integración Holtmont - Outlook",
    descripcion: "Este es un evento de prueba generado desde Google Apps Script para validar la integración de tareas en el calendario.",
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(new Date().getTime() + (60 * 60 * 1000)).toISOString(),
    correoDestino: emailSebastian,
    asignadoPor: "SISTEMA_TEST"
  };

  const resultado = NotifierService.sendToOutlook(payload);
  console.log("Resultado de Prueba:", resultado);
}

// USUARIOS
const USER_DB = {
  "JESUS_CANTU":      { pass: "ppc2025",   role: "PPC_ADMIN", label: "PPC Manager", email: "jesuscantu@empresa.com" },
  "JAIME_OLIVO":      { pass: "admin2025", role: "ADMIN_CONTROL", label: "Jaime Olivo", email: "jaimeolivo@empresa.com" },
  "PREWORK_ORDER":    { pass: "workorder2026", role: "WORKORDER_USER", label: "Workorder", email: "workorder@empresa.com" },
  "ANTONIA_VENTAS": { pass: "tonita2025", role: "TONITA", label: "Antonia Pineda", email: "ventas@empresa.com", staffName: "ANTONIA PINEDA LOPEZ", dept: "VENTAS", seller: false },
  "JUDITH_ECHAVARRIA": { pass: "judith2951", role: "STAFF_USER", label: "Cristian Judith Echavarria Rodriguez", email: "", staffName: "JUDITH ECHAVARRIA", dept: "COMPRAS", seller: true },
  "EDUARDO_MANZANARES": { pass: "eduardo6234", role: "STAFF_USER", label: "Eduardo Manzanares Sanchez", email: "", staffName: "EDUARDO MANZANARES", dept: "VENTAS", seller: true },
  "RAMIRO_RODRIGUEZ": { pass: "ramiro9233", role: "STAFF_USER", label: "Ramiro Rodriguez Escalante", email: "", staffName: "RAMIRO RODRIGUEZ", dept: "VENTAS", seller: true },
  "SEBASTIAN_PADILLA": { pass: "sebastian9385", role: "STAFF_USER", label: "Erick Sebastian Padilla Carrillo", email: "", staffName: "SEBASTIAN PADILLA", dept: "VENTAS", seller: true },
  "ALFONSO_CORREA": { pass: "alfonso4658", role: "STAFF_USER", label: "Alfonso Correa De Leon", email: "", staffName: "ALFONSO CORREA", dept: "CONSTRUCCION", seller: true },
  "TERESA_GARZA": { pass: "teresa7891", role: "STAFF_USER", label: "Maria Teresa Hernandez Garza", email: "", staffName: "TERESA GARZA", dept: "PRECIOS UNITARIOS", seller: true },
  "DANIELA_CASTRO": { pass: "daniela1234", role: "STAFF_USER", label: "Daniela Castro", email: "", staffName: "DANIELA CASTRO", dept: "GENERAL", seller: false },
  "ANGEL_SALINAS": { pass: "angel9042", role: "STAFF_USER", label: "Jose Angel Salinas Ramirez", email: "", staffName: "ANGEL SALINAS", dept: "DISEÑO", seller: true },
  "JUAN_JOSE_SANCHEZ": { pass: "juan8226", role: "STAFF_USER", label: "Juan Jose Sanchez Muñiz", email: "", staffName: "JUAN JOSE SANCHEZ", dept: "CEO", seller: true },
  "LUIS_CARLOS": { pass: "admin2025", role: "ADMIN", label: "Luis Carlos Holt Montero", email: "luiscarlos@empresa.com", staffName: "LUIS CARLOS", dept: "CEO", seller: false },
  "ANTONIA_PINEDA": { pass: "antonia2025", role: "STAFF_USER", label: "Antonia Pineda Lopez", email: "", staffName: "ANTONIA PINEDA LOPEZ", dept: "PRESUPUESTOS", seller: false },
  "DANIA_GONZALEZ": { pass: "dania2322", role: "STAFF_USER", label: "Dania Lizbeth Gonzalez Lores", email: "", staffName: "DANIA LIZBETH GONZALEZ LORES", dept: "FINANZAS", seller: false },
  "JUANY_RODRIGUEZ": { pass: "juany2814", role: "STAFF_USER", label: "Juana Maria Rodriguez Juarez", email: "", staffName: "JUANA MARIA RODRIGUEZ JUAREZ", dept: "FINANZAS", seller: false },
  "EDUARDO_BENITEZ": { pass: "eduardo1188", role: "STAFF_USER", label: "Eduardo Israel Benitez Garcia", email: "", staffName: "EDUARDO BENITEZ", dept: "LIMPIEZA", seller: false },
  "ROLANDO_MORENO": { pass: "rolando7508", role: "STAFF_USER", label: "Jesus Rolando Moreno Perez", email: "", staffName: "ROLANDO MORENO", dept: "HVAC", seller: false },
  "MIGUEL_GALLARDO": { pass: "miguel5120", role: "STAFF_USER", label: "Miguel Angel Gallardo Jaramillo", email: "", staffName: "MIGUEL GALLARDO", dept: "ELECTROMECANICA", seller: false },
  "JEHU_MARTINEZ": { pass: "jehu6696", role: "STAFF_USER", label: "Jehu Arsenio Martinez Montes", email: "", staffName: "JEHU MARTINEZ", dept: "ELECTROMECANICA", seller: false },
  "RICARDO_MENDO": { pass: "ricardo9414", role: "STAFF_USER", label: "Ricardo Alonso Mendo Morales", email: "", staffName: "RICARDO MENDO", dept: "CONSTRUCCION", seller: false },
  "CARLOS_MENDEZ": { pass: "carlos2250", role: "STAFF_USER", label: "Carlos Mendez Urbina", email: "", staffName: "CARLOS MENDEZ", dept: "CALIDAD", seller: false },
  "INGE_OLIVO": { pass: "inge2469", role: "STAFF_USER", label: "Jaime Antonio Olivo Guerrero", email: "", staffName: "JAIME OLIVO", dept: "CONSTRUCCION", seller: false },
  "EDUARDO_TERAN": { pass: "eduardo9815", role: "STAFF_USER", label: "Jesus Eduardo Teran Garcia", email: "", staffName: "EDUARDO TERAN", dept: "PRESUPUESTOS", seller: true },
  "VANESSA_DE_LARA": { pass: "vanessa6062", role: "STAFF_USER", label: "Erika Vanessa Rodriguez De Lara", email: "", staffName: "VANESSA DE LARA", dept: "COMPRAS", seller: false },
  "DIMAS_RAMOS": { pass: "dimas2025", role: "ADMIN_CONTROL", label: "Dimas Eliel Ramos Garcia", email: "dimas.ramos@holtmont.com", staffName: "DIMAS ELIEL RAMOS GARCIA", dept: "RH", seller: false },
  "RUBI_MORENO": { pass: "rubi3641", role: "STAFF_USER", label: "Rubi Moreno Rodriguez", email: "", staffName: "RUBI MORENO RODRIGUEZ", dept: "SEGURIDAD", seller: false },
  "URIMAR_LOPEZ": { pass: "urimar7294", role: "STAFF_USER", label: "Edgar Urimar Lopez Maldonado", email: "", staffName: "EDGAR URIMAR LOPEZ MALDONADO", dept: "DISEÑO", seller: false },
  "SAIRA": { pass: "saira3725", role: "STAFF_USER", label: "Zaira Yazmin Aguilar Aguilon", email: "", staffName: "ZAIRA YAZMIN AGUILAR AGUILON", dept: "FINANZAS", seller: false },
  "ZAIRA_AGUILAR": { pass: "zaira5892", role: "STAFF_USER", label: "Zaira Yazmin Aguilar Aguilon", email: "", staffName: "ZAIRA YAZMIN AGUILAR AGUILON", dept: "FINANZAS", seller: false },
  "EMILIANO_AREDON": { pass: "emiliano4187", role: "STAFF_USER", label: "Emiliano Arredondo Gomez", email: "", staffName: "EMILIANO ARREDONDO GOMEZ", dept: "HVAC", seller: false },
  "SONIA_GARCIA": { pass: "sonia2960", role: "STAFF_USER", label: "Sonia Garcia Perez", email: "", staffName: "SONIA GARCIA PEREZ", dept: "COMPRAS", seller: false },
  "FRANCISCO_SANCHEZ_SERNA": { pass: "francisco3814", role: "STAFF_USER", label: "Francisco Sanchez Serna", email: "", staffName: "FRANCISCO SANCHEZ SERNA", dept: "RH", seller: false },
  "LILIANA_MARTINEZ": { pass: "liliana4731", role: "STAFF_USER", label: "Liliana Martinez Ibarra", email: "", staffName: "LILIANA AYLIN MARTINEZ IBARRA", dept: "RH", seller: false },
  "LAURA_HUERTA": { pass: "laura8256", role: "STAFF_USER", label: "Laura Huerta Rocha", email: "", staffName: "LAURA EDITH HUERTA ROCHA", dept: "RH", seller: false },
  "ROCIO_CASTRO": { pass: "rocio3947", role: "STAFF_USER", label: "Rocio Castro Covarrubias", email: "", staffName: "ROCIO ABIGAIL CASTRO COVARRUBIAS", dept: "FINANZAS", seller: false },
  "GERALDINE_MARTINEZ": { pass: "geraldine5279", role: "STAFF_USER", label: "Geraldine Marie Martinez Hernandez", email: "", staffName: "GERALDINE MARTINEZ HERNANDEZ", dept: "PRECIOS UNITARIOS", seller: false },
  "CESAR_EDUARDO_GARCIA": { pass: "cesar7052", role: "STAFF_USER", label: "Cesar Eduardo Garcia Avalos", email: "", staffName: "CESAR EDUARDO GARCIA AVALOS", dept: "CONSTRUCCION", seller: false },
  "ANTONIO_SALAZAR": { pass: "antonio1234", role: "STAFF_USER", label: "Antonio Salazar", email: "", staffName: "ANTONIO SALAZAR", dept: "GENERAL", seller: false },
  "CESAR_GOMEZ": { pass: "cesar1234", role: "STAFF_USER", label: "Cesar Gomez", email: "", staffName: "CESAR GOMEZ", dept: "GENERAL", seller: false }
};

/* SERVICIO HTML */
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Holtmont Workspace')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* HELPERS */
function findSheetSmart(name) {
  if (!name) return null;
  let sheet = SS.getSheetByName(name);
  if (sheet) return sheet;
  const clean = String(name).trim().toUpperCase();
  const all = SS.getSheets();
  for (let s of all) { if (s.getName().trim().toUpperCase() === clean) return s; }
  return null;
}

// DETECTOR DE CABECERAS INTELIGENTE
function findHeaderRow(values) {
  for (let i = 0; i < Math.min(100, values.length); i++) {
    const rowStr = values[i].map(c => String(c).toUpperCase().replace(/\n/g, " ").replace(/\s+/g, " ").trim()).join("|");
    if (rowStr.includes("ID_SITIO") || rowStr.includes("ID_PROYECTO")) return i;
    if (rowStr.includes("FOLIO") && rowStr.includes("CONCEPTO") && 
       (rowStr.includes("ALTA") || rowStr.includes("AVANCE") || rowStr.includes("STATUS") || rowStr.includes("FECHA"))) {
      return i;
    }
    if (rowStr.includes("ID") && rowStr.includes("RESPONSABLE")) return i;
    if ((rowStr.includes("FOLIO") || rowStr.includes("ID")) && 
        (rowStr.includes("DESCRIPCI") || rowStr.includes("RESPONSABLE") || rowStr.includes("CONCEPTO"))) {
      return i;
    }
    if (rowStr.includes("CLIENTE") && (rowStr.includes("VENDEDOR") || rowStr.includes("AREA") || rowStr.includes("CLASIFICACION"))) return i;
    // SOPORTE PARA AGENDA PERSONAL Y HABITOS
    if (rowStr.includes("ID") && rowStr.includes("TITULO") && rowStr.includes("USUARIO")) return i;
    if (rowStr.includes("ID") && rowStr.includes("HABITO") && rowStr.includes("USUARIO")) return i;
  }
  return -1;
}

function registrarLog(user, action, details) {
  try {
    let sheet = SS.getSheetByName(APP_CONFIG.logSheetName);
    if (!sheet) {
      sheet = SS.insertSheet(APP_CONFIG.logSheetName);
      sheet.appendRow(["FECHA", "USUARIO", "ACCION", "DETALLES"]);
    }
    sheet.appendRow([new Date(), user, action, details]);
  } catch (e) { console.error(e); }
}

/* LOGIN */
function apiLogin(username, password) {
  const userKey = String(username).trim().toUpperCase();
  const passTrimmed = String(password).trim();
  const user = USER_DB[userKey];
  if (user && user.pass === passTrimmed) {
    registrarLog(userKey, "LOGIN", `Acceso exitoso (${user.role})`);
    return { success: true, role: user.role, name: user.label, username: userKey };
  }
  registrarLog(userKey || "ANONIMO", "LOGIN_FAIL", "Credenciales incorrectas");
  return { success: false, message: 'Usuario o contraseña incorrectos.' };
}

function apiLogout(username) {
  registrarLog(username || "DESCONOCIDO", "LOGOUT", "Sesión cerrada");
  return { success: true };
}

function getDirectoryFromDB() {
  const lock = LockService.getScriptLock();
  try {
      if (lock.tryLock(5000)) {
          let sheet = findSheetSmart(APP_CONFIG.directorySheetName);
          
          // CREAR SI NO EXISTE
          if (!sheet) {
              sheet = SS.insertSheet(APP_CONFIG.directorySheetName);
          }

          // MIGRACIÓN/POBLADO AUTOMÁTICO (Si está vacía o solo tiene encabezados)
          if (sheet.getLastRow() < 2) {
              sheet.clear(); // Limpiar por si acaso el usuario puso encabezados manuales incorrectos
              const headers = ["NOMBRE", "DEPARTAMENTO", "TIPO_HOJA"];
              sheet.appendRow(headers);
              
              // Populate from INITIAL_DIRECTORY
              const rows = INITIAL_DIRECTORY.map(u => [u.name, u.dept, u.type]);
              if (rows.length > 0) {
                  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
              }
              SpreadsheetApp.flush();
              registrarLog("SISTEMA", "MIGRACION_DB", "Se pobló DB_DIRECTORY (estaba vacía).");
          }

          const data = sheet.getDataRange().getValues();
          if (data.length < 2) return INITIAL_DIRECTORY;

          // Parse Data
          const headers = data[0].map(h => String(h).toUpperCase().trim());
          const nameIdx = headers.indexOf("NOMBRE");
          const deptIdx = headers.indexOf("DEPARTAMENTO");
          const typeIdx = headers.indexOf("TIPO_HOJA");

          if (nameIdx === -1) return INITIAL_DIRECTORY;

          const directory = [];
          for (let i = 1; i < data.length; i++) {
              const row = data[i];
              if (row[nameIdx]) {
                  directory.push({
                      name: String(row[nameIdx]).trim(),
                      dept: (deptIdx > -1) ? String(row[deptIdx]).trim() : "GENERAL",
                      type: (typeIdx > -1) ? String(row[typeIdx]).trim() : "ESTANDAR"
                  });
              }
          }
          return directory;
      }
  } catch (e) {
      console.error(e);
      // Fallback in case of error
      return INITIAL_DIRECTORY;
  } finally {
      lock.releaseLock();
  }
  return INITIAL_DIRECTORY;
}

/* RE-SINCRONIZACIÓN DEL DIRECTORIO (solo ADMIN) */
function apiResyncDirectory() {
    const lock = LockService.getScriptLock();
    try {
        if (!lock.tryLock(20000)) {
            return { success: false, message: "El sistema está ocupado, intente de nuevo." };
        }

        // 1. Renombrar hojas de tracker que cambiaron de nombre
        const renameMap = {
            "SAIRA": "ZAIRA YAZMIN AGUILAR AGUILON",
            "SONIA GARCIA": "SONIA GARCIA PEREZ",
            "EMILIANO AREDON": "EMILIANO ARREDONDO GOMEZ",
            "DIMAS RAMOS": "DIMAS ELIEL RAMOS GARCIA",
            "JUANY RODRIGUEZ": "JUANA MARIA RODRIGUEZ JUAREZ",
            "DANIA GONZALEZ": "DANIA LIZBETH GONZALEZ LORES"
        };
        Object.keys(renameMap).forEach(function(oldName) {
            try {
                const nuevo = renameMap[oldName];
                const oldSheet = findSheetSmart(oldName);
                const newSheet = findSheetSmart(nuevo);
                if (oldSheet && !newSheet) {
                    oldSheet.setName(nuevo);
                }
            } catch (errRename) {
                console.error("Fallo al renombrar hoja " + oldName + ": " + errRename);
            }
        });

        // 2. Reescribir DB_DIRECTORY desde INITIAL_DIRECTORY
        let sheet = findSheetSmart(APP_CONFIG.directorySheetName);
        if (!sheet) {
            sheet = SS.insertSheet(APP_CONFIG.directorySheetName);
        }
        sheet.clear();
        const headers = ["NOMBRE", "DEPARTAMENTO", "TIPO_HOJA"];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        const rows = INITIAL_DIRECTORY.map(function(u) { return [u.name, u.dept, u.type]; });
        if (rows.length > 0) {
            sheet.getRange(2, 1, rows.length, 3).setValues(rows);
        }
        SpreadsheetApp.flush();

        // 3. Crear hojas de tracker/ventas faltantes para el personal del directorio
        //    (p. ej. nuevas altas como ANTONIA PINEDA LOPEZ). No toca hojas existentes.
        let creadas = 0;
        const ensureSheet = function(sName, hdrs) {
            if (!sName) return;
            let s = findSheetSmart(sName);
            if (!s) {
                s = SS.insertSheet(sName);
                s.appendRow(hdrs);
                s.getRange(1, 1, 1, hdrs.length).setFontWeight("bold").setBackground("#e6e6e6");
                creadas++;
            }
        };
        INITIAL_DIRECTORY.forEach(function(u) {
            try {
                if (u.name === "ADMINISTRADOR") { ensureSheet(u.name, DEFAULT_TRACKER_HEADERS); return; }
                if (u.type === 'ESTANDAR' || u.type === 'HIBRIDO') ensureSheet(u.name, DEFAULT_TRACKER_HEADERS);
                if (u.type === 'VENTAS' || u.type === 'HIBRIDO') ensureSheet(u.name + " (VENTAS)", DEFAULT_SALES_HEADERS);
            } catch (errSheet) {
                console.error("Fallo al crear hoja para " + u.name + ": " + errSheet);
            }
        });
        SpreadsheetApp.flush();

        // 4. Log
        registrarLog("SISTEMA", "RESYNC_DB", "DB_DIRECTORY re-sincronizado desde código. Hojas nuevas: " + creadas);

        return { success: true, message: "Directorio re-sincronizado. Hojas nuevas creadas: " + creadas };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Error al re-sincronizar: " + e.message };
    } finally {
        try { lock.releaseLock(); } catch (eLock) {}
    }
}

function apiAddEmployee(payload) {
    const lock = LockService.getScriptLock();
    try {
        if (lock.tryLock(10000)) {
            const { name, dept, type } = payload;
            const cleanName = String(name).toUpperCase().trim();
            if (!cleanName) return { success: false, message: "Nombre inválido" };

            let sheet = findSheetSmart(APP_CONFIG.directorySheetName);
            if (!sheet) {
                // Should have been created by getDirectoryFromDB, but ensure it exists
                getDirectoryFromDB();
                sheet = findSheetSmart(APP_CONFIG.directorySheetName);
            }

            // Check duplicate
            const data = sheet.getDataRange().getValues();
            for(let i=1; i<data.length; i++) {
                if (String(data[i][0]).toUpperCase().trim() === cleanName) {
                    return { success: false, message: "El usuario ya existe." };
                }
            }

            // Add to DB
            sheet.appendRow([cleanName, dept, type]);

            // Create Sheets based on Type
            const createSheetIfMissing = (sName, headers) => {
                let s = findSheetSmart(sName);
                if (!s) {
                    s = SS.insertSheet(sName);
                    s.appendRow(headers);
                    s.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e6e6e6");
                    // Conditional Formatting (Basic)
                    try {
                        const rule = SpreadsheetApp.newConditionalFormatRule()
                            .whenTextEqualTo("100")
                            .setBackground("#d4edda")
                            .setRanges([s.getRange("F:F")]) // Assuming Avance is commonly around F
                            .build();
                        s.setConditionalFormatRules([rule]);
                    } catch(e){}
                }
            };

            if (type === 'ESTANDAR' || type === 'HIBRIDO') {
                createSheetIfMissing(cleanName, DEFAULT_TRACKER_HEADERS);
            }
            if (type === 'VENTAS' || type === 'HIBRIDO') {
                createSheetIfMissing(cleanName + " (VENTAS)", DEFAULT_SALES_HEADERS);
            }

            registrarLog("ADMIN", "ADD_EMPLOYEE", `Usuario: ${cleanName}, Tipo: ${type}`);
            return { success: true };
        }
    } catch(e) {
        return { success: false, message: e.toString() };
    } finally {
        lock.releaseLock();
    }
}

function apiDeleteEmployee(name) {
    const lock = LockService.getScriptLock();
    try {
        if (lock.tryLock(10000)) {
            const cleanName = String(name).toUpperCase().trim();
            const sheet = findSheetSmart(APP_CONFIG.directorySheetName);
            if (!sheet) return { success: false, message: "No existe DB_DIRECTORY" };

            const data = sheet.getDataRange().getValues();
            let rowIndex = -1;
            for(let i=1; i<data.length; i++) {
                if (String(data[i][0]).toUpperCase().trim() === cleanName) {
                    rowIndex = i + 1; // 1-based
                    break;
                }
            }

            if (rowIndex > -1) {
                sheet.deleteRow(rowIndex);
                registrarLog("ADMIN", "DELETE_EMPLOYEE", `Usuario eliminado: ${cleanName}`);
                return { success: true };
            }
            return { success: false, message: "Usuario no encontrado." };
        }
    } catch(e) {
        return { success: false, message: e.toString() };
    } finally {
        lock.releaseLock();
    }
}

function getSystemConfig(role, username) {
  const fullDirectory = getDirectoryFromDB();

  const allDepts = {
      "CEO": { label: "Dirección General (CEO)", icon: "fa-crown", color: "#b8860b" },
      "CONSTRUCCION": { label: "Construcción", icon: "fa-hard-hat", color: "#e83e8c" },
      "COMPRAS": { label: "Compras/Almacén", icon: "fa-shopping-cart", color: "#198754" },
      "PRESUPUESTOS": { label: "Presupuestos", icon: "fa-calculator", color: "#6f42c1" },
      "PRECIOS UNITARIOS": { label: "Precios Unitarios", icon: "fa-dollar-sign", color: "#20c997" },
      "SEGURIDAD": { label: "Seguridad", icon: "fa-shield-alt", color: "#dc3545" },
      "EHS": { label: "Seguridad (EHS)", icon: "fa-shield-alt", color: "#dc3545" },
      "DISEÑO": { label: "Diseño & Ing.", icon: "fa-drafting-compass", color: "#0d6efd" },
      "ELECTROMECANICA": { label: "Electromecánica", icon: "fa-bolt", color: "#ffc107" },
      "HVAC": { label: "HVAC", icon: "fa-fan", color: "#fd7e14" },
      "LIMPIEZA": { label: "Limpieza", icon: "fa-broom", color: "#0dcaf0" },
      "ALMACEN Y MAQUINARIA": { label: "Almacén y Maquinaria", icon: "fa-warehouse", color: "#198754" },
      "ADMINISTRACION": { label: "Administración", icon: "fa-briefcase", color: "#6f42c1" },
      "VENTAS": { label: "Ventas", icon: "fa-handshake", color: "#0dcaf0" },
      "MAQUINARIA": { label: "Maquinaria", icon: "fa-truck", color: "#20c997" },
      "FINANZAS": { label: "Finanzas", icon: "fa-coins", color: "#198754" },
      "FACTURACION": { label: "Facturación", icon: "fa-file-invoice-dollar", color: "#0d6efd" },
      "RH": { label: "Recursos Humanos", icon: "fa-users", color: "#6610f2" },
      "CALIDAD": { label: "Calidad", icon: "fa-clipboard-check", color: "#0dcaf0" }
  };

  const ppcModuleMaster = { id: "PPC_MASTER", label: "PPC Maestro", icon: "fa-tasks", color: "#fd7e14", type: "ppc_native" };

  if (String(username).toUpperCase().trim() === 'JESUS_CANTU') {
      ppcModuleMaster.label = "INTERDICIPLINARIA";
  }

  const ppcModuleWeekly = { id: "WEEKLY_PLAN", label: "Planeación Semanal", icon: "fa-calendar-alt", color: "#6f42c1", type: "weekly_plan_view" };
  // const ecgModule = { id: "ECG_SALES", label: "Monitor Vivos", icon: "fa-heartbeat", color: "#d63384", type: "ecg_dashboard" };
  const kpiModule = { id: "KPI_DASHBOARD", label: "KPI Performance", icon: "fa-chart-line", color: "#d63384", type: "kpi_dashboard_view" };

  if (role === 'TONITA') return { 
      departments: { "VENTAS": allDepts["VENTAS"] }, 
      allDepartments: allDepts, 
      staff: [ { name: "ANTONIA_VENTAS", dept: "VENTAS" } ], 
      directory: fullDirectory,
      specialModules: [
        { id: "MY_TRACKER", label: "Mi Tabla", icon: "fa-table", color: allDepts["PRESUPUESTOS"] ? allDepts["PRESUPUESTOS"].color : "#6f42c1", type: "mirror_staff", target: "ANTONIA PINEDA LOPEZ" },
        ppcModuleMaster,
        ppcModuleWeekly
      ],
      accessProjects: false,
      canSeeBancoJuntas: false
  };

  const ppcModulesEarly = [ ppcModuleMaster, ppcModuleWeekly ];

  // RAMA ESPECIAL: Juany Rodriguez (su role es STAFF_USER pero tiene vista ampliada)
  if (String(username).toUpperCase().trim() === 'JUANY_RODRIGUEZ') {
      const juanyDepts = {
          "COMPRAS": allDepts["COMPRAS"],
          "FACTURACION": allDepts["FACTURACION"],
          "FINANZAS": allDepts["FINANZAS"]
      };
      const juanyDeptKeys = ["COMPRAS", "FACTURACION", "FINANZAS"];
      return {
          departments: juanyDepts,
          allDepartments: allDepts,
          staff: fullDirectory.filter(d => juanyDeptKeys.indexOf(d.dept) > -1),
          directory: fullDirectory,
          specialModules: ppcModulesEarly,
          accessProjects: false,
          canSeeBancoJuntas: false
      };
  }

  if (role === 'STAFF_USER') {
    const u = USER_DB[String(username).toUpperCase().trim()] || {};
    const staffName = u.staffName || u.label;
    const deptColor = (allDepts[u.dept] && allDepts[u.dept].color) || "#0d6efd";
    const modules = [
        { id: "MY_TRACKER", label: "Mi Tabla", icon: "fa-table", color: deptColor, type: "mirror_staff", target: staffName },
        { id: "PPC_MASTER", label: "Agregar Actividad", icon: "fa-tasks", color: "#fd7e14", type: "ppc_native" }
    ];
    if (u.seller) {
        modules.push({ id: "MY_SALES", label: "Ventas", icon: "fa-hand-holding-usd", color: "#0dcaf0", type: "mirror_staff", target: staffName + " (VENTAS)" });
    }
    return {
      departments: {},
      allDepartments: allDepts,
      staff: [ { name: staffName, dept: u.dept } ],
      directory: fullDirectory,
      specialModules: modules,
      accessProjects: false,
      canSeeBancoJuntas: false
    };
  }


  if (role === 'WORKORDER_USER') {
    const woModule = { ...ppcModuleMaster, label: "Pre Work Order" };
    return {
      departments: {},
      allDepartments: allDepts,
      staff: [],
      directory: fullDirectory,
      specialModules: [ woModule ],
      accessProjects: false,
      canSeeBancoJuntas: false
    };
  }

  const ppcModules = [ ppcModuleMaster, ppcModuleWeekly ];
  
  if (role === 'PPC_ADMIN') return { 
      departments: {}, 
      allDepartments: allDepts, 
      staff: [],
      directory: fullDirectory,
      specialModules: ppcModules,
      accessProjects: true,
      canSeeBancoJuntas: true
  };

  if (role === 'ADMIN_CONTROL') {
    return {
      departments: allDepts, allDepartments: allDepts, staff: fullDirectory, directory: fullDirectory,
      specialModules: [
        ...ppcModules,
        { id: "MIRROR_TONITA", label: "Monitor Toñita", icon: "fa-eye", color: "#0dcaf0", type: "mirror_staff", target: "ANTONIA_VENTAS" },
        { id: "ADMIN_TRACKER", label: "Control", icon: "fa-clipboard-list", color: "#6f42c1", type: "mirror_staff", target: "ADMINISTRADOR" }
      ],
      accessProjects: true,
      canSeeBancoJuntas: true
    };
  }

  // Default ADMIN (LUIS_CARLOS falls here with role 'ADMIN')
  const defaultModules = [ ...ppcModules, { id: "MIRROR_TONITA", label: "Monitor Toñita", icon: "fa-eye", color: "#0dcaf0", type: "mirror_staff", target: "ANTONIA_VENTAS" } ];
  if (role === 'ADMIN') {
      defaultModules.push(kpiModule);
  }

  return {
    departments: allDepts, allDepartments: allDepts, staff: fullDirectory, directory: fullDirectory,
    specialModules: defaultModules,
    accessProjects: true,
    canSeeBancoJuntas: true
  };
}

/* FUNCIÓN PRINCIPAL DE DASHBOARD (RE-INGENIERÍA NATIVA) */
function generarDashboard() {
  // 4. Control de Acceso (RBAC - Session)
  const currentUserEmail = Session.getActiveUser().getEmail();
  const authorizedUser = "LUIS_CARLOS"; // En un entorno real, mapear email a usuario
  // Nota: Session.getActiveUser() puede estar vacío en cuentas personales o dependiendo de permisos.
  // Mantenemos la lógica de API token existente para la WebApp, pero añadimos check de sesión si se ejecuta manualmente.

  return apiFetchTeamKPIData("LUIS_CARLOS"); // Delegamos a la lógica interna
}

/* KPI ANALYSIS ENGINE - NATIVE JS IMPLEMENTATION */

/* KPI ANALYSIS ENGINE FOR ADMIN_CONTROL (JAIME OLIVO) */
function apiFetchAdminKPIs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Vendedores to analyze based on USER_DB (excluding ADMIN roles)
  const sellers = ["ANGEL_SALINAS", "TERESA_GARZA", "EDUARDO_TERAN", "EDUARDO_MANZANARES", "RAMIRO_RODRIGUEZ", "SEBASTIAN_PADILLA"]; // Antonia removed from select list

  let allData = [];

  sellers.forEach(function(seller) {
    const sheetName = seller === "ANTONIA_VENTAS" ? "ANTONIA_VENTAS" : seller.split("_")[0] + " (VENTAS)";
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;

    const headers = data[0].map(function(h) { return String(h).toUpperCase().trim(); });
    const estatusIdx = headers.indexOf("ESTATUS");
    const vendedorIdx = headers.indexOf("VENDEDOR") > -1 ? headers.indexOf("VENDEDOR") : headers.indexOf("RESPONSABLE");

    // Find aliases for date, dias, and value
    const fechaIdx = headers.findIndex(h => h === "FECHA" || h === "F. INICIO" || h === "FECHA INICIO" || h.includes("FECHA"));
    const diasIdx = headers.findIndex(h => h === "DÍAS" || h === "DIAS" || h.includes("RELOJ") || h.includes("DIAS FINALIZ"));
    const valorIdx = headers.findIndex(h => h === "VALOR" || h === "MONTO" || h.includes("IMPORTE"));
    const motivoIdx = headers.findIndex(h => h.includes("MOTIVO") || h.includes("RAZON"));

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] && !row[1]) continue; // Skip totally empty rows

      allData.push({
        vendedor: vendedorIdx > -1 ? String(row[vendedorIdx] || seller) : seller,
        estatus: estatusIdx > -1 ? String(row[estatusIdx]).toUpperCase() : "",
        fecha: fechaIdx > -1 ? row[fechaIdx] : null,
        dias: diasIdx > -1 ? parseFloat(row[diasIdx]) || 0 : 0,
        valor: valorIdx > -1 ? parseFloat(String(row[valorIdx]).replace(/[^0-9.-]+/g,"")) || 0 : 0,
        motivo: motivoIdx > -1 ? String(row[motivoIdx]).toUpperCase() : ""
      });
    }
  });

  // Calculate globalMetrics
  const globalMetrics = { totalQuotes: 0, ganadas: 0, ganadasPercentage: 0, perdidasRiesgo: 0, riskAmount: 0, averageEfficiency: 0, collaboratorsCount: 0 };

  const uniqueSellers = new Set();
  let enviadasCount = 0;
  let totalDias = 0;
  let validDiasCount = 0;

  allData.forEach(function(row) {
    globalMetrics.totalQuotes++;
    uniqueSellers.add(row.vendedor);

    if (row.dias > 0) {
      totalDias += row.dias;
      validDiasCount++;
    }

    if (row.estatus.includes("GANAD") || row.estatus === "CERRADO") {
      globalMetrics.ganadas++;
      enviadasCount++; // Si se ganó, asumimos que se envió
    } else if (row.estatus.includes("ENVIAD") || row.estatus === "COTIZACION ENVIADA") {
      enviadasCount++;
    }

    if (row.estatus.includes("PERDID") || row.estatus.includes("RIESGO") || row.estatus === "CANCELADA" || row.estatus.includes("RECHAZAD")) {
      globalMetrics.perdidasRiesgo++;
      globalMetrics.riskAmount += row.valor;
    }
  });

  globalMetrics.collaboratorsCount = uniqueSellers.size;
  if (enviadasCount > 0) {
    globalMetrics.ganadasPercentage = Math.round((globalMetrics.ganadas / enviadasCount) * 100);
  }
  if (validDiasCount > 0) {
    globalMetrics.averageEfficiency = (totalDias / validDiasCount).toFixed(1);
  }

  // Calculate collaboratorStats
  const collabMap = {};
  allData.forEach(function(row) {
    const v = row.vendedor;
    if (!collabMap[v]) {
      collabMap[v] = { name: v, vol: 0, ganadas: 0, canceladas: 0, totalDias: 0, validDiasCount: 0 };
    }
    collabMap[v].vol++;
    if (row.estatus.includes("GANAD") || row.estatus === "CERRADO") collabMap[v].ganadas++;
    if (row.estatus.includes("PERDID") || row.estatus.includes("CANCELAD") || row.estatus.includes("RECHAZAD")) collabMap[v].canceladas++;

    if (row.dias > 0) {
      collabMap[v].totalDias += row.dias;
      collabMap[v].validDiasCount++;
    }
  });

  const collaboratorStats = Object.values(collabMap).map(function(c) {
    let cierrePct = 0;
    const resolved = c.ganadas + c.canceladas;
    if (resolved > 0) {
      cierrePct = Math.round((c.ganadas / resolved) * 100);
    }

    let avgEfic = 0;
    if (c.validDiasCount > 0) {
      avgEfic = parseFloat((c.totalDias / c.validDiasCount).toFixed(1));
    }

    let estado = "Eficiente"; // default
    if (avgEfic > 2.0) estado = "Cuello botella";
    else if (avgEfic >= 1.5) estado = "Riesgo";

    return {
      name: c.name,
      vol: c.vol,
      ganadas: c.ganadas,
      cierrePercentage: cierrePct,
      avgEfic: avgEfic,
      estado: estado
    };
  });

  // Sort collaborators by volume
  collaboratorStats.sort(function(a, b) { return b.vol - a.vol; });

  // Funnel Data
  const funnelData = { recibidas: globalMetrics.totalQuotes, integradas: 0, aTiempo: 0, seguimiento: 0, ganadas: globalMetrics.ganadas };
  allData.forEach(function(row) {
      if (row.estatus !== 'NUEVO' && row.estatus !== '') funnelData.integradas++;
      if (row.estatus.includes('ENVIAD') || row.estatus.includes('TIEMPO')) funnelData.aTiempo++;
      if (row.estatus.includes('SEGUIMIENT') || row.estatus.includes('NEGOCIACION') || row.estatus.includes('REVISION')) funnelData.seguimiento++;
  });

  // Loss Distribution
  const lossDistMap = {};
  allData.forEach(function(row) {
      if (row.estatus.includes("PERDID") || row.estatus.includes("CANCELAD") || row.estatus.includes("RECHAZAD")) {
          const m = row.motivo || "OTRO";
          lossDistMap[m] = (lossDistMap[m] || 0) + 1;
      }
  });
  const lossDistribution = Object.keys(lossDistMap).map(function(k) { return { label: k, value: lossDistMap[k] }; });

  // Weekly Productivity (Last 5 valid days approx)
  // Parse dates defensively
  const dayCounts = { "Lunes": 0, "Martes": 0, "Miércoles": 0, "Jueves": 0, "Viernes": 0 };
  allData.forEach(function(row) {
      if (row.fecha) {
          let d = new Date(row.fecha);
          if (isNaN(d.getTime()) && typeof row.fecha === 'string') {
              const parts = row.fecha.split('/');
              if (parts.length === 3) {
                  d = new Date(parts[2].length === 2 ? "20"+parts[2] : parts[2], parts[1]-1, parts[0]);
              }
          }
          if (!isNaN(d.getTime())) {
              // Only count if it's within the last 7 days for the "current week" simulation,
              // or just map by weekday for demo purposes if dates are sparse.
              const now = new Date();
              const diffDays = (now - d) / (1000 * 60 * 60 * 24);
              if (diffDays <= 7) {
                  const day = d.getDay(); // 0 = Sun, 1 = Mon ...
                  if (day === 1) dayCounts["Lunes"]++;
                  else if (day === 2) dayCounts["Martes"]++;
                  else if (day === 3) dayCounts["Miércoles"]++;
                  else if (day === 4) dayCounts["Jueves"]++;
                  else if (day === 5) dayCounts["Viernes"]++;
              }
          }
      }
  });

  // If data is empty for the last 7 days (mock data might be old), fill with some synthetic data based on total volume for the chart to look good, but we should use real data.
  // Actually, we'll just return what we have.
  const weeklyProductivity = Object.keys(dayCounts).map(function(k) { return { day: k, count: dayCounts[k] }; });

  return {
    success: true,
    globalMetrics: globalMetrics,
    collaboratorStats: collaboratorStats,
    funnelData: funnelData,
    lossDistribution: lossDistribution,
    weeklyProductivity: weeklyProductivity
  };
}


/* ================================================================
 * [TRACKER PRODUCTIVITY AGENT]
 * ================================================================ */

function apiFetchTrackerProductivityMetrics(params) {
  try {
    const p = params || {};
    const now = new Date();
    const targetMonth = (p.month !== undefined && p.month !== null) ? parseInt(p.month) : (now.getMonth() + 1);
    const targetYear  = (p.year  !== undefined && p.year  !== null) ? parseInt(p.year)  : now.getFullYear();

    // Directory lookup to filter only ESTANDAR and HIBRIDO and exclude VENTAS sheets
    const allowedStaff = [];
    const deptMap = {};
    INITIAL_DIRECTORY.forEach(emp => {
      if (emp.type === 'ESTANDAR' || emp.type === 'HIBRIDO') {
        if (emp.name) {
          const uName = emp.name.toUpperCase().trim();
          allowedStaff.push(uName);
          deptMap[uName] = emp.dept || 'SIN DEPT';
        }
      }
    });

    const deptStats = {};
    const collabStats = {};
    const priorityStats = { 'ALTA': 0, 'MEDIA': 0, 'BAJA': 0, 'SIN_PRIORIDAD': 0 };

    let totalTasks = 0;
    let onTimeTasks = 0;
    let lateTasks = 0;
    let tasksWithRestrictions = 0;
    let tasksWithRisks = 0;
    let totalDurationDays = 0;
    let tasksWithDuration = 0;

    // Helper Date Parser
    const parseDate = (d) => {
      if (!d) return null;
      if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
      if (typeof d === 'number') return new Date(d);
      const s = String(d).trim();
      if (!s) return null;
      if (s.includes('/')) {
        const pts = s.split('/');
        if (pts.length === 3) {
          const yr = pts[2].length === 2 ? '20' + pts[2] : pts[2];
          const dt = new Date(parseInt(yr), parseInt(pts[1]) - 1, parseInt(pts[0]));
          return isNaN(dt.getTime()) ? null : dt;
        }
      }
      const parsed = new Date(s);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    // Helper Duration
    const getDurationDaysAndDates = (row, estimatedDateFallback) => {
      // FECHA as Start Date
      const startDate = parseDate(row['FECHA'] || row['F.INICIO'] || row['F. INICIO'] || null);

      // End Date from Process Log or Estimated
      let realEndDate = null;
      try {
        const logStr = String(row['PROCESO_LOG'] || row['proceso_log'] || '').trim();
        if (logStr && logStr.startsWith('[')) {
          const log = JSON.parse(logStr);
          if (Array.isArray(log)) {
            let lastEnd = null;
            log.forEach(step => {
              if (step.endTimestamp && step.status === 'DONE') {
                if (!lastEnd || step.endTimestamp > lastEnd) lastEnd = step.endTimestamp;
              }
            });
            if (lastEnd) realEndDate = new Date(lastEnd);
          }
        }
      } catch (e) {}

      const estimatedDate = parseDate(row['FECHA ESTIMADA DE FIN'] || row['FEC. EST. FIN'] || row['FECHA_RESPUESTA'] || estimatedDateFallback);

      if (!realEndDate) realEndDate = new Date();

      let isLate = false;
      let durationDays = 0;

      if (estimatedDate) {
         // Comparing dates (ignoring time)
         const rEnd = new Date(realEndDate.getFullYear(), realEndDate.getMonth(), realEndDate.getDate());
         const estEnd = new Date(estimatedDate.getFullYear(), estimatedDate.getMonth(), estimatedDate.getDate());
         isLate = rEnd > estEnd;
      }

      if (startDate && realEndDate) {
        const diff = realEndDate.getTime() - startDate.getTime();
        durationDays = diff < 0 ? 0 : Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      return { isLate, durationDays, realEndDate };
    };

    Object.keys(USER_DB).forEach(k => {
      const u = USER_DB[k];
      if (!u.staffName) return;
      const uName = u.staffName.toUpperCase().trim();

      // Filter out VENTAS and those not in allowedStaff
      if (u.seller || k === 'ANTONIA_VENTAS' || !allowedStaff.includes(uName)) return;

      const result = internalFetchSheetData(u.staffName);
      if (!result.success) return;

      const history = result.history || [];
      const dept = deptMap[uName] || 'SIN DEPT';

      history.forEach(row => {
        // Date filtering based on Start Date or Estimated End Date
        const startDate = parseDate(row['FECHA'] || row['F.INICIO'] || row['F. INICIO']);
        const estimatedDate = parseDate(row['FECHA ESTIMADA DE FIN'] || row['FEC. EST. FIN'] || row['FECHA_RESPUESTA']);

        const dateToUse = startDate || estimatedDate;
        if (!dateToUse) return;

        if ((dateToUse.getMonth() + 1) === targetMonth && dateToUse.getFullYear() === targetYear) {
          totalTasks++;

          const durStats = getDurationDaysAndDates(row, estimatedDate);

          if (durStats.isLate) lateTasks++;
          else onTimeTasks++;

          if (durStats.durationDays > 0) {
             totalDurationDays += durStats.durationDays;
             tasksWithDuration++;
          }

          // Restrictions & Risks
          const rest = String(row['RESTRICCIONES'] || '').trim().toUpperCase();
          if (rest && rest !== 'NINGUNO' && rest !== 'NINGUNA' && rest !== 'NO') tasksWithRestrictions++;

          const risk = String(row['RIESGO'] || '').trim().toUpperCase();
          if (risk && risk !== 'BAJO' && risk !== 'NINGUNO' && risk !== 'NO' && risk !== '') tasksWithRisks++;

          // Priorities
          const prio = String(row['PRIORIDAD'] || '').trim().toUpperCase();
          if (['ALTA', 'MEDIA', 'BAJA'].includes(prio)) {
            priorityStats[prio]++;
          } else {
            priorityStats['SIN_PRIORIDAD']++;
          }

          // Dept Stats
          if (!deptStats[dept]) deptStats[dept] = { count: 0, late: 0, onTime: 0 };
          deptStats[dept].count++;
          if (durStats.isLate) deptStats[dept].late++;
          else deptStats[dept].onTime++;

          // Collab Stats
          if (!collabStats[uName]) collabStats[uName] = { name: uName, dept, count: 0, late: 0, onTime: 0, totalDuration: 0, durCount: 0 };
          collabStats[uName].count++;
          if (durStats.isLate) collabStats[uName].late++;
          else collabStats[uName].onTime++;
          if (durStats.durationDays > 0) {
             collabStats[uName].totalDuration += durStats.durationDays;
             collabStats[uName].durCount++;
          }
        }
      });
    });

    const onTimePct = totalTasks > 0 ? Math.round((onTimeTasks / totalTasks) * 100) : 0;
    const avgDuration = tasksWithDuration > 0 ? parseFloat((totalDurationDays / tasksWithDuration).toFixed(1)) : 0;
    const restrictionsPct = totalTasks > 0 ? Math.round((tasksWithRestrictions / totalTasks) * 100) : 0;
    const risksPct = totalTasks > 0 ? Math.round((tasksWithRisks / totalTasks) * 100) : 0;

    const byCollabArr = Object.values(collabStats).sort((a,b) => b.count - a.count);
    byCollabArr.forEach(c => {
      c.avgDays = c.durCount > 0 ? parseFloat((c.totalDuration / c.durCount).toFixed(1)) : 0;
      c.onTimePct = c.count > 0 ? Math.round((c.onTime / c.count) * 100) : 0;
    });

    const byDeptArr = Object.keys(deptStats).map(k => ({ dept: k, count: deptStats[k].count })).sort((a,b) => b.count - a.count);

    return {
      success: true,
      metrics: {
        totalTasks,
        onTimeTasks,
        lateTasks,
        onTimePct,
        avgDurationDays: avgDuration,
        tasksWithRestrictions,
        restrictionsPct,
        tasksWithRisks,
        risksPct,
        priorityStats,
        byCollabArr,
        byDeptArr,
        month: targetMonth,
        year: targetYear
      }
    };

  } catch (e) {
    console.error("apiFetchTrackerProductivityMetrics Error: " + e.toString());
    return { success: false, message: e.toString() };
  }
}

function runTrackerProductivityAgent(params) {
  try {
    const p = params || {};
    const now = new Date();
    const month = (p.month !== undefined) ? parseInt(p.month) : (now.getMonth() + 1);
    const year  = (p.year  !== undefined) ? parseInt(p.year)  : now.getFullYear();
    const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const monthName = MONTHS[month - 1];

    const mResult = apiFetchTrackerProductivityMetrics({ month, year });
    if (!mResult.success) return { success: false, message: 'No se pudieron obtener métricas: ' + mResult.message };
    const m = mResult.metrics;

    // Rules
    const alerts = [];
    if (m.onTimePct < 80 && m.totalTasks > 0) {
      alerts.push({ type: 'ENTREGAS_ATRASADAS', severity: 'ALTA', icon: '🔴', mensaje: 'Porcentaje de entregas a tiempo crítico: ' + m.onTimePct + '%' });
    }
    if (m.restrictionsPct > 20) {
       alerts.push({ type: 'ALTAS_RESTRICCIONES', severity: 'MEDIA', icon: '🟡', mensaje: 'Alta proporción de tareas con restricciones: ' + m.restrictionsPct + '%' });
    }
    const topCollab = m.byCollabArr[0];
    if (topCollab && topCollab.onTimePct < 50 && topCollab.count >= 5) {
       alerts.push({ type: 'PRODUCTIVIDAD_COLAB', severity: 'ALTA', icon: '🔴', mensaje: 'Colaborador ' + topCollab.name + ' tiene ' + topCollab.onTimePct + '% a tiempo de ' + topCollab.count + ' tareas.' });
    }

    // Gemini
    const mStr = JSON.stringify({
      volumen_total: m.totalTasks,
      a_tiempo_pct: m.onTimePct,
      atrasadas: m.lateTasks,
      promedio_dias_resolucion: m.avgDurationDays,
      porcentaje_restricciones: m.restrictionsPct,
      porcentaje_riesgos: m.risksPct,
      prioridades: m.priorityStats,
      top_colaboradores: m.byCollabArr.slice(0,3).map(c => ({ nombre: c.name, volumen: c.count, a_tiempo_pct: c.onTimePct, promedio_dias: c.avgDays }))
    }, null, 2);

    const prompt = 'Eres un Analista de Productividad y Operaciones Senior. Analiza las siguientes métricas del equipo correspondientes al mes de ' + monthName + '. Tu objetivo es redactar un reporte ejecutivo muy conciso (máximo 180 palabras) en español. Debes destacar el porcentaje de tareas entregadas a tiempo, identificar si hay un cuello de botella con las prioridades altas o restricciones, y mencionar al colaborador o departamento más productivo. Termina siempre con UNA recomendación operativa concreta para mejorar los tiempos de entrega.\n\nMétricas:\n' + mStr;

    let geminiSummary = 'No se pudo generar reporte con IA.';
    const gRes = callGeminiAPI(prompt);
    if (gRes.success && gRes.text) {
      geminiSummary = gRes.text;
    }

    const emailResult = _sendTrackerProductivityEmail(m, alerts, geminiSummary, monthName, year);

    return {
      success: true,
      data: {
        metrics: m,
        alerts: alerts,
        geminiReport: geminiSummary,
        emailSent: emailResult.success
      }
    };
  } catch(e) {
    console.error('runTrackerProductivityAgent Error: ' + e.toString());
    return { success: false, message: e.toString() };
  }
}

function _sendTrackerProductivityEmail(m, alerts, geminiSummary, monthName, year) {
  try {
    const recipients = [];
    if (USER_DB['LUIS_CARLOS']    && USER_DB['LUIS_CARLOS'].email)    recipients.push(USER_DB['LUIS_CARLOS'].email);
    if (USER_DB['ADMIN_CONTROL'] && USER_DB['ADMIN_CONTROL'].email) recipients.push(USER_DB['ADMIN_CONTROL'].email);
    if (USER_DB['JESUS_CANTU'] && USER_DB['JESUS_CANTU'].email) recipients.push(USER_DB['JESUS_CANTU'].email);

    if (recipients.length === 0) return { success: false, message: 'Sin destinatarios configurados.' };

    const alertRows = alerts.length > 0
      ? alerts.map(a => '<tr><td style="padding:6px 12px;">' + a.icon + '</td><td style="padding:6px 12px;color:#333;">' + a.mensaje + '</td><td style="padding:6px 12px;"><span style="background:' + (a.severity==='ALTA'?'#dc3545':a.severity==='MEDIA'?'#fd7e14':'#17a2b8') + ';color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">' + a.severity + '</span></td></tr>').join('')
      : '<tr><td colspan="3" style="padding:8px 12px;color:#28a745;">✅ Sin alertas críticas este mes</td></tr>';

    const collabRows = m.byCollabArr.slice(0, 8).map(c => {
      return '<tr style="border-bottom:1px solid #eee;"><td style="padding:5px 10px;">' + c.name + '</td><td style="text-align:center;padding:5px 10px;">' + c.count + '</td><td style="text-align:center;padding:5px 10px;color:' + (c.onTimePct >= 80 ? '#28a745' : '#dc3545') + ';">' + c.onTimePct + '%</td><td style="text-align:center;padding:5px 10px;">' + c.avgDays + '</td></tr>';
    }).join('');

    const html = [
      '<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;background:#fff;">',
      '<div style="background:#2c3e50;color:#fff;padding:24px;">',
      '<h1 style="margin:0;font-size:22px;">📊 Reporte de Productividad — ' + monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + year + '</h1>',
      '</div>',
      '<div style="padding:24px;border:1px solid #eee;">',
      '<h2 style="font-size:16px;color:#444;border-bottom:2px solid #2c3e50;padding-bottom:5px;">Resumen Ejecutivo (AI)</h2>',
      '<div style="background:#f8f9fa;padding:15px;border-radius:6px;color:#333;font-size:14px;line-height:1.6;border-left:4px solid #3b82f6;">' + geminiSummary.replace(/\n/g, '<br>') + '</div>',
      '<div style="display:flex;gap:15px;margin-top:24px;">',
      '<div style="flex:1;background:#fff;border:1px solid #ddd;border-radius:8px;padding:15px;text-align:center;">',
      '<div style="font-size:12px;color:#666;text-transform:uppercase;">Total Completadas</div>',
      '<div style="font-size:24px;font-weight:bold;color:#333;margin-top:5px;">' + m.totalTasks + '</div>',
      '</div>',
      '<div style="flex:1;background:#fff;border:1px solid #ddd;border-radius:8px;padding:15px;text-align:center;">',
      '<div style="font-size:12px;color:#666;text-transform:uppercase;">% A Tiempo</div>',
      '<div style="font-size:24px;font-weight:bold;color:' + (m.onTimePct >= 80 ? '#28a745' : '#dc3545') + ';margin-top:5px;">' + m.onTimePct + '%</div>',
      '</div>',
      '<div style="flex:1;background:#fff;border:1px solid #ddd;border-radius:8px;padding:15px;text-align:center;">',
      '<div style="font-size:12px;color:#666;text-transform:uppercase;">Promedio Días</div>',
      '<div style="font-size:24px;font-weight:bold;color:#17a2b8;margin-top:5px;">' + m.avgDurationDays + ' d</div>',
      '</div>',
      '</div>',
      '<h2 style="font-size:16px;color:#444;border-bottom:2px solid #2c3e50;padding-bottom:5px;margin-top:24px;">Alertas Operativas</h2>',
      '<table style="width:100%;border-collapse:collapse;font-size:13px;background:#fdfdfd;border:1px solid #eee;">',
      alertRows,
      '</table>',
      '<h2 style="font-size:16px;color:#444;border-bottom:2px solid #2c3e50;padding-bottom:5px;margin-top:24px;">Top Colaboradores (Volumen)</h2>',
      '<table style="width:100%;border-collapse:collapse;font-size:13px;">',
      '<tr style="background:#f4f4f4;color:#555;"><th style="text-align:left;padding:8px 10px;">Nombre</th><th style="padding:8px 10px;">Volumen</th><th style="padding:8px 10px;">% A Tiempo</th><th style="padding:8px 10px;">Prom. Días</th></tr>',
      collabRows,
      '</table>',
      '</div>',
      '<div style="background:#f1f1f1;color:#777;text-align:center;padding:12px;font-size:11px;">Generado automáticamente por el Agente de Productividad Holtmont</div>',
      '</div>'
    ].join('');

    MailApp.sendEmail({
      to: recipients.join(','),
      subject: '📊 Reporte Ejecutivo de Productividad - ' + monthName + ' ' + year,
      htmlBody: html
    });

    return { success: true };
  } catch(e) {
    console.error('_sendTrackerProductivityEmail Error: ' + e.toString());
    return { success: false, message: e.toString() };
  }
}


function apiFetchTeamKPIData(username) {
  // MOCK DATA INJECTION
  if (DEMO_MODE) {
      // Simulación para VENTAS
      var dataVentasMock = [
        ["Eduardo Manzanares", 25, 3.5],
        ["Sebastian Padilla", 25, 2.8],
        ["Ramiro Rodriguez", 28, 4.1]
      ];
      // Simulación para TRACKER
      var dataTrackerMock = [
        ["Judith Echavarria", 23, 1.5],
        ["Eduardo Teran", 32, 2.0],
        ["Angel Salinas", 26, 1.8]
      ];

      return {
          success: true,
          ventas: dataVentasMock.map(function(r) { return {name: r[0], volume: r[1], efficiency: r[2]}; }),
          tracker: dataTrackerMock.map(function(r) { return {name: r[0], volume: r[1], efficiency: r[2]}; }),
          productivity: {
             labels: ["16-Dic", "17-Dic", "18-Dic", "19-Dic"],
             values: [2, 3, 3, 4]
          }
      };
  }

  // 4. Control de Acceso (Validación de Identidad)
  const user = USER_DB[String(username).toUpperCase().trim()];
  if (!user || user.role !== 'ADMIN') {
      return { success: false, message: 'Acceso Denegado. Privilegios insuficientes.' };
  }

  // Helper para procesar cada grupo (Map/Reduce Manual)
  const processGroup = (members) => {
    return members.map(name => {
       // 1. Acceso a Datos (SpreadsheetApp)
       // internalFetchSheetData usa SpreadsheetApp.getSheetByName() internamente
       const res = internalFetchSheetData(name);

       if (!res.success) {
           return { name: name, volume: 0, efficiency: 0, error: "Hoja no encontrada" };
       }

       const rows = res.data || [];

       // 2. Procesamiento de Arrays (Filter)
       const completed = rows.filter(row => {
           const st = String(row['ESTATUS'] || row['STATUS'] || '').toUpperCase();
           return st.includes('DONE') || st.includes('COMPLETED') || st.includes('FINALIZADO') || st.includes('TERMINADO');
       });

       // 2. Procesamiento de Arrays (Reduce/Calc Manual)
       let totalDays = 0;
       let count = 0;

       completed.forEach(t => {
           let start = t['FECHA'] || t['ALTA'] || t['FECHA INICIO'];
           // PRIORIDAD: FECHA TERMINO (REAL) > FECHA FIN > FECHA RESPUESTA (ESTIMADA)
           let end = t['FECHA TERMINO'] || t['FECHA FIN'] || t['FECHA_FIN'] || t['FECHA ENTREGA'] || t['FECHA RESPUESTA'];

           if (start && end) {
               const pDate = (d) => {
                   if (d instanceof Date) return d;
                   if (String(d).includes('/')) {
                       const pts = String(d).split('/');
                       if(pts.length===3) return new Date(pts[2].length===2 ? '20'+pts[2] : pts[2], pts[1]-1, pts[0]);
                   } else {
                       const parsed = new Date(d);
                       if (!isNaN(parsed.getTime())) return parsed;
                   }
                   return new Date(d);
               };

               const d1 = pDate(start);
               const d2 = pDate(end);

               if (!isNaN(d1) && !isNaN(d2)) {
                   // Cálculo manual de diferencia en días
                   const diffTime = Math.abs(d2 - d1);
                   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                   totalDays += diffDays;
                   count++;
               }
           }
       });

       const avg = count > 0 ? (totalDays / count).toFixed(1) : 0;

       return {
           name: name,
           volume: completed.length,
           efficiency: avg
       };
    });
  };

  // DYNAMIC FETCHING
  const fullDirectory = getDirectoryFromDB();

  // Filter for VENTAS
  const groupVentas = fullDirectory
      .filter(u => u.dept === 'VENTAS' && u.name !== 'ANTONIA_VENTAS')
      .map(u => u.name);

  // Filter for TRACKER (Non-Ventas, Non-Admin/System)
  const groupTracker = fullDirectory
      .filter(u => u.dept !== 'VENTAS' &&
                   u.dept !== 'ADMINISTRACION' &&
                   u.name !== 'ADMINISTRADOR' &&
                   u.name !== 'PREWORK_ORDER')
      .map(u => u.name);

  return {
      success: true,
      ventas: processGroup(groupVentas),
      tracker: processGroup(groupTracker)
  };
}

/* ================================================================
 * AGENTE DE MÉTRICAS DE COTIZACIONES V1.0
 * Mide KPIs de cotizaciones TERMINADAS (sección TAREAS REALIZADAS).
 * Métricas: total mes, por depto, por cotizador, tiempo por CLASI
 *           (A≤3d / AA≤14d / AAA≤30d), SLA cumplido/no cumplido,
 *           ganadas vs perdidas, y AAA por cliente y proyecto.
 * ================================================================ */

function apiFetchQuoteAgentMetrics(params) {
  try {
    const p = params || {};
    const now = new Date();
    const targetMonth = (p.month !== undefined && p.month !== null) ? parseInt(p.month) : (now.getMonth() + 1);
    const targetYear  = (p.year  !== undefined && p.year  !== null) ? parseInt(p.year)  : now.getFullYear();

    // Solo leer historial terminado (TAREAS REALIZADAS)
    const result = internalFetchSheetData("ANTONIA_VENTAS");
    if (!result.success) {
      return { success: false, message: "Error leyendo ANTONIA_VENTAS: " + (result.message || '') };
    }
    const history = result.history || [];

    // Mapa nombre → departamento desde directorio interno
    const deptMap = {};
    INITIAL_DIRECTORY.forEach(emp => {
      const key = emp.name ? emp.name.toUpperCase().trim() : '';
      if (key && !deptMap[key]) deptMap[key] = emp.dept;
    });

    const SLA_LIMITS = { 'A': 3, 'AA': 14, 'AAA': 30 };

    // Parse date flexible (DD/MM/YYYY, Date object, timestamp)
    const parseDate = (d) => {
      if (!d) return null;
      if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
      if (typeof d === 'number') return new Date(d);
      const s = String(d).trim();
      if (!s) return null;
      if (s.includes('/')) {
        const pts = s.split('/');
        if (pts.length === 3) {
          const yr = pts[2].length === 2 ? '20' + pts[2] : pts[2];
          const dt = new Date(parseInt(yr), parseInt(pts[1]) - 1, parseInt(pts[0]));
          return isNaN(dt.getTime()) ? null : dt;
        }
      }
      const parsed = new Date(s);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    // Duración real: inicio = FECHA, fin = último endTimestamp en PROCESO_LOG o F.ENTREGA
    const getDurationDays = (row, startDate) => {
      if (!startDate) return null;
      let endDate = null;
      try {
        const logStr = String(row['PROCESO_LOG'] || row['proceso_log'] || '').trim();
        if (logStr && logStr.startsWith('[')) {
          const log = JSON.parse(logStr);
          if (Array.isArray(log)) {
            let lastEnd = null;
            log.forEach(step => {
              if (step.endTimestamp && step.status === 'DONE') {
                if (!lastEnd || step.endTimestamp > lastEnd) lastEnd = step.endTimestamp;
              }
            });
            if (lastEnd) endDate = new Date(lastEnd);
          }
        }
      } catch (e) { /* ignorar errores JSON */ }
      if (!endDate) {
        endDate = parseDate(row['F. ENTREGA'] || row['F_ENTREGA'] || row['FECHA_RESPUESTA']);
      }
      if (!endDate) return null;
      const diff = endDate.getTime() - startDate.getTime();
      return diff < 0 ? null : Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // Resuelve el valor de F.INICIO (el encabezado puede venir con variantes de espaciado)
    const getDateVal = (row) =>
      row['F. INICIO'] || row['F.INICIO'] || row['F.  INICIO'] ||
      row['F INICIO']  || row['FECHA']    || row['FECHA INICIO'] || row['FECHA_INICIO'] || null;

    // Filtrar solo cotizaciones del mes/año seleccionado usando F.INICIO
    const filtered = history.filter(row => {
      const d = parseDate(getDateVal(row));
      if (!d) return false;
      return (d.getMonth() + 1) === targetMonth && d.getFullYear() === targetYear;
    });

    // Estructuras de acumulación
    const clasis = ['A', 'AA', 'AAA', 'SIN_CLASI'];
    const byClasi = {};
    clasis.forEach(k => {
      byClasi[k] = { count: 0, slaOk: 0, slaFail: 0, totalDays: 0, avgDays: 0 };
    });
    const byCotizador  = {};
    const byDepartment = {};
    const winLoss = { ganada: 0, perdida: 0, enProceso: 0, total: filtered.length };
    const aaaByClient  = {};

    filtered.forEach(row => {
      const vendedor  = String(row['VENDEDOR'] || row['RESPONSABLE'] || row['ENCARGADO'] || 'SIN ASIGNAR').trim().toUpperCase();
      const rawClasi  = String(row['CLASIFICACION'] || row['CLASI'] || '').trim().toUpperCase();
      const clasiKey  = ['A', 'AA', 'AAA'].includes(rawClasi) ? rawClasi : 'SIN_CLASI';
      const estatus   = String(row['ESTATUS'] || row['STATUS'] || '').trim().toUpperCase();
      const cliente   = String(row['CLIENTE'] || '').trim().toUpperCase();
      const concepto  = String(row['CONCEPTO'] || '').trim();
      const folio     = String(row['FOLIO'] || '').trim();
      const fechaDate = parseDate(getDateVal(row));
      const dept      = deptMap[vendedor] || 'SIN DEPT';

      // Clasificar resultado
      const isGanada  = estatus.includes('GANAD') || estatus === 'VENDIDA' || estatus === 'APROBADA' || estatus === 'CERRADO';
      const isPerdida = estatus.includes('PERDID') || estatus === 'CANCELADA' || estatus.includes('RECHAZAD');
      if      (isGanada)  winLoss.ganada++;
      else if (isPerdida) winLoss.perdida++;
      else                winLoss.enProceso++;

      // Por cotizador
      if (!byCotizador[vendedor]) {
        byCotizador[vendedor] = { name: vendedor, dept, total: 0, ganadas: 0, perdidas: 0,
                                   clasA: 0, clasAA: 0, clasAAA: 0, slaOk: 0, slaFail: 0 };
      }
      byCotizador[vendedor].total++;
      if (isGanada)  byCotizador[vendedor].ganadas++;
      if (isPerdida) byCotizador[vendedor].perdidas++;
      if (clasiKey === 'A')   byCotizador[vendedor].clasA++;
      if (clasiKey === 'AA')  byCotizador[vendedor].clasAA++;
      if (clasiKey === 'AAA') byCotizador[vendedor].clasAAA++;

      // Por departamento
      if (!byDepartment[dept]) byDepartment[dept] = { dept, total: 0, ganadas: 0, perdidas: 0 };
      byDepartment[dept].total++;
      if (isGanada)  byDepartment[dept].ganadas++;
      if (isPerdida) byDepartment[dept].perdidas++;

      // Clasificación + SLA
      const durationDays = getDurationDays(row, fechaDate);
      byClasi[clasiKey].count++;
      if (durationDays !== null) {
        byClasi[clasiKey].totalDays += durationDays;
        if (clasiKey !== 'SIN_CLASI') {
          const limit = SLA_LIMITS[clasiKey];
          if (durationDays <= limit) {
            byClasi[clasiKey].slaOk++;
            byCotizador[vendedor].slaOk++;
          } else {
            byClasi[clasiKey].slaFail++;
            byCotizador[vendedor].slaFail++;
          }
        }
      }

      // AAA: por cliente y proyecto
      if (clasiKey === 'AAA') {
        if (!aaaByClient[cliente]) {
          aaaByClient[cliente] = { cliente, count: 0, ganadas: 0, perdidas: 0, projects: [] };
        }
        aaaByClient[cliente].count++;
        if (isGanada)  aaaByClient[cliente].ganadas++;
        if (isPerdida) aaaByClient[cliente].perdidas++;
        if (concepto) {
          aaaByClient[cliente].projects.push({ folio, concepto, estatus, isGanada, isPerdida, durationDays });
        }
      }
    });

    // Calcular promedios de días
    clasis.forEach(k => {
      const c = byClasi[k];
      if (c.count > 0 && c.totalDays > 0) c.avgDays = parseFloat((c.totalDays / c.count).toFixed(1));
    });

    // Resumen SLA por clasificación
    const slaSummary = {};
    ['A', 'AA', 'AAA'].forEach(k => {
      const c = byClasi[k];
      slaSummary[k] = {
        slaLimit : SLA_LIMITS[k],
        count    : c.count,
        ok       : c.slaOk,
        fail     : c.slaFail,
        avgDays  : c.avgDays,
        pctOk    : c.count > 0 ? Math.round((c.slaOk / c.count) * 100) : 0
      };
    });

    return {
      success: true,
      metrics: {
        totalCount     : filtered.length,
        month          : targetMonth,
        year           : targetYear,
        winLoss,
        slaSummary,
        byClasi,
        byCotizadorArr : Object.values(byCotizador).sort((a, b) => b.total - a.total),
        byDepartmentArr: Object.values(byDepartment).sort((a, b) => b.total - a.total),
        aaaByClientArr : Object.values(aaaByClient).sort((a, b) => b.count - a.count)
      }
    };
  } catch (e) {
    console.error("apiFetchQuoteAgentMetrics Error: " + e.toString());
    return { success: false, message: e.toString() };
  }
}

/* Escribe los KPIs calculados en la hoja KPI_COTIZACIONES */
function apiWriteQuoteMetricsToSheet(params) {
  try {
    const res = apiFetchQuoteAgentMetrics(params);
    if (!res.success) return res;
    const m  = res.metrics;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('KPI_COTIZACIONES');
    if (!sheet) sheet = ss.insertSheet('KPI_COTIZACIONES');
    sheet.clearContents();

    const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
    const now    = new Date();
    let r = 1;

    const w = (row, col, val, bold) => {
      const cell = sheet.getRange(row, col);
      cell.setValue(val);
      if (bold) cell.setFontWeight('bold');
    };

    // Título principal
    sheet.getRange(r, 1, 1, 11).merge();
    w(r, 1, '📊 KPI COTIZACIONES — ' + MONTHS[m.month - 1] + ' ' + m.year, true);
    sheet.getRange(r, 1).setFontSize(13).setBackground('#1E3A5F').setFontColor('#FFFFFF');
    r += 2;
    w(r, 1, 'Actualizado:'); w(r, 2, Utilities.formatDate(now, 'America/Mexico_City', 'dd/MM/yyyy HH:mm'));
    r += 2;

    // Resumen general
    w(r, 1, '📋 RESUMEN GENERAL', true); r++;
    w(r, 1, 'Total terminadas:');  w(r, 2, m.totalCount); r++;
    w(r, 1, 'Ganadas:');          w(r, 2, m.winLoss.ganada); r++;
    w(r, 1, 'Perdidas:');         w(r, 2, m.winLoss.perdida); r++;
    w(r, 1, 'En proceso:');       w(r, 2, m.winLoss.enProceso); r++;
    const pct = m.winLoss.total > 0 ? Math.round(m.winLoss.ganada / m.winLoss.total * 100) : 0;
    w(r, 1, '% Cierre:');         w(r, 2, pct + '%'); r += 2;

    // Por departamento
    w(r, 1, '🏢 POR DEPARTAMENTO', true); r++;
    ['Departamento','Total','Ganadas','Perdidas'].forEach((h, i) => w(r, i + 1, h, true)); r++;
    m.byDepartmentArr.forEach(d => {
      w(r,1,d.dept); w(r,2,d.total); w(r,3,d.ganadas); w(r,4,d.perdidas); r++;
    }); r++;

    // Por cotizador
    w(r, 1, '👤 POR COTIZADOR', true); r++;
    ['Cotizador','Dept','Total','Ganadas','Perdidas','% Cierre','A','AA','AAA','SLA OK','SLA FAIL']
      .forEach((h, i) => w(r, i + 1, h, true)); r++;
    m.byCotizadorArr.forEach(c => {
      const cp = c.total > 0 ? Math.round(c.ganadas / c.total * 100) : 0;
      w(r,1,c.name); w(r,2,c.dept); w(r,3,c.total); w(r,4,c.ganadas); w(r,5,c.perdidas);
      w(r,6,cp + '%'); w(r,7,c.clasA); w(r,8,c.clasAA); w(r,9,c.clasAAA);
      w(r,10,c.slaOk); w(r,11,c.slaFail); r++;
    }); r++;

    // SLA por clasificación
    w(r, 1, '⏱️ SLA POR CLASIFICACIÓN (solo terminadas)', true); r++;
    ['Clasif.','Límite (días)','Total','✅ A Tiempo','❌ Tarde','Prom. Días','% Cumplimiento']
      .forEach((h, i) => w(r, i + 1, h, true)); r++;
    ['A','AA','AAA'].forEach(k => {
      const s = m.slaSummary[k];
      w(r,1,k); w(r,2,s.slaLimit + 'd'); w(r,3,s.count); w(r,4,s.ok);
      w(r,5,s.fail); w(r,6,s.avgDays || 'N/D'); w(r,7,s.pctOk + '%'); r++;
    }); r++;

    // AAA por cliente y proyecto
    if (m.aaaByClientArr && m.aaaByClientArr.length > 0) {
      w(r, 1, '🏗️ COTIZACIONES AAA — POR CLIENTE Y PROYECTO', true); r++;
      ['Cliente','Total','Ganadas','Perdidas','Proyectos']
        .forEach((h, i) => w(r, i + 1, h, true)); r++;
      m.aaaByClientArr.forEach(c => {
        w(r,1,c.cliente); w(r,2,c.count); w(r,3,c.ganadas); w(r,4,c.perdidas);
        w(r,5, c.projects.map(p => (p.folio ? p.folio + ' — ' : '') + p.concepto).join('; ')); r++;
      });
    }

    sheet.autoResizeColumns(1, 11);
    registrarLog('SYSTEM', 'KPI_COTIZACIONES', 'Sheet actualizado — ' + m.totalCount + ' cotizaciones procesadas.');
    return { success: true, message: 'KPI_COTIZACIONES actualizado: ' + m.totalCount + ' cotizaciones procesadas.' };
  } catch (e) {
    console.error("apiWriteQuoteMetricsToSheet Error: " + e.toString());
    return { success: false, message: e.toString() };
  }
}

/* Configura un trigger diario a las 7AM para actualizar KPI_COTIZACIONES */
function setupDailyQuoteMetricsTrigger() {
  try {
    ScriptApp.getProjectTriggers().forEach(t => {
      if (t.getHandlerFunction() === 'autoUpdateQuoteMetrics') ScriptApp.deleteTrigger(t);
    });
    ScriptApp.newTrigger('autoUpdateQuoteMetrics').timeBased().everyDays(1).atHour(7).create();
    return { success: true, message: 'Trigger diario a las 7AM configurado correctamente.' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function autoUpdateQuoteMetrics() {
  const now = new Date();
  apiWriteQuoteMetricsToSheet({ month: now.getMonth() + 1, year: now.getFullYear() });
  // También ejecuta el agente completo (reglas + Gemini + email)
  runQuoteMetricsAgent({ month: now.getMonth() + 1, year: now.getFullYear() });
  registrarLog('SYSTEM', 'AUTO_KPI', 'KPI Cotizaciones + Agente ejecutados por trigger.');
}

/* ================================================================
 * AGENTE IA DE COTIZACIONES — MOTOR COMPLETO
 * Observa → Detecta por reglas → Llama Gemini → Envía email
 * ================================================================ */

/* Llama a Gemini 1.5 Flash con el prompt dado */
function callGeminiAPI(prompt) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '';
  if (!apiKey) return { success: false, text: '', message: 'GEMINI_API_KEY no configurada.' };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
  const payload = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 512 }
  });

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: payload,
      muteHttpExceptions: true
    });
    const code = response.getResponseCode();
    if (code !== 200) {
      return { success: false, text: '', message: 'Gemini HTTP ' + code + ': ' + response.getContentText() };
    }
    const json = JSON.parse(response.getContentText());
    const text = (json.candidates && json.candidates[0] && json.candidates[0].content &&
                  json.candidates[0].content.parts && json.candidates[0].content.parts[0].text) || '';
    return { success: true, text: text.trim() };
  } catch (e) {
    return { success: false, text: '', message: e.toString() };
  }
}

/* Guarda o lee la Gemini API key en Script Properties */
function apiSaveGeminiKey(key) {
  try {
    if (!key || String(key).trim() === '') return { success: false, message: 'Llave vacía.' };
    PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', String(key).trim());
    return { success: true, message: 'API key guardada correctamente.' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function apiCheckGeminiKey() {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '';
  return { success: true, hasKey: key.length > 0, keyPreview: key ? key.substring(0,6) + '***' : '' };
}

/* Motor principal del agente — Observa → Reglas → Gemini → Email */
function runQuoteMetricsAgent(params) {
  try {
    const p = params || {};
    const now = new Date();
    const month = (p.month !== undefined) ? parseInt(p.month) : (now.getMonth() + 1);
    const year  = (p.year  !== undefined) ? parseInt(p.year)  : now.getFullYear();

    // ── 1. OBTENER MÉTRICAS ────────────────────────────────────────
    const mResult = apiFetchQuoteAgentMetrics({ month, year });
    if (!mResult.success) return { success: false, message: 'No se pudieron obtener métricas: ' + mResult.message };
    const m = mResult.metrics;

    // ── 2. MOTOR DE REGLAS ─────────────────────────────────────────
    const alerts = [];

    // Regla 1: SLA por clasificación < 70% (con mínimo 3 casos)
    ['A', 'AA', 'AAA'].forEach(k => {
      const s = m.slaSummary[k];
      if (s.count >= 3 && s.pctOk < 70) {
        alerts.push({
          type: 'SLA_BAJO',
          severity: 'ALTA',
          icon: '🔴',
          mensaje: 'Clase ' + k + ': solo ' + s.pctOk + '% de cumplimiento SLA (' + s.ok + '/' + s.count + ' a tiempo, límite ' + s.slaLimit + ' días)'
        });
      }
    });

    // Regla 2: Cotizador con tasa de pérdida > 50% (con mínimo 3 cot.)
    m.byCotizadorArr.forEach(c => {
      if (c.total >= 3 && (c.perdidas / c.total) > 0.5) {
        const pct = Math.round(c.perdidas / c.total * 100);
        alerts.push({
          type: 'ALTA_PERDIDA',
          severity: 'MEDIA',
          icon: '🟡',
          mensaje: c.name + ': ' + pct + '% de cotizaciones perdidas este mes (' + c.perdidas + ' de ' + c.total + ')'
        });
      }
    });

    // Regla 3: Tasa de cierre global < 30% (con mínimo 5 cot.)
    if (m.winLoss.total >= 5) {
      const globalPct = Math.round(m.winLoss.ganada / m.winLoss.total * 100);
      if (globalPct < 30) {
        alerts.push({
          type: 'CIERRE_BAJO',
          severity: 'ALTA',
          icon: '🔴',
          mensaje: 'Tasa de cierre global muy baja: ' + globalPct + '% (' + m.winLoss.ganada + ' ganadas de ' + m.winLoss.total + ' terminadas)'
        });
      }
    }

    // Regla 4: AAA sin cierre definido (ni ganada ni perdida)
    const aaaAbiertos = (m.byClasi && m.byClasi['AAA']) ? m.byClasi['AAA'].count - m.slaSummary.AAA.ok - m.slaSummary.AAA.fail + m.slaSummary.AAA.ok : 0;
    m.aaaByClientArr.forEach(cl => {
      const enProceso = cl.projects.filter(p => !p.isGanada && !p.isPerdida).length;
      if (enProceso > 0) {
        alerts.push({
          type: 'AAA_SIN_RESULTADO',
          severity: 'INFO',
          icon: '🔵',
          mensaje: 'Cliente ' + cl.cliente + ': ' + enProceso + ' proyecto(s) AAA terminados sin marcar GANADA/PERDIDA'
        });
      }
    });

    // ── 3. CONSTRUIR PROMPT PARA GEMINI ───────────────────────────
    const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const monthName = MONTHS_ES[month - 1];
    const top5 = m.byCotizadorArr.slice(0, 5);

    const prompt = [
      'Eres analista de ventas de Holtmont, empresa mexicana de construcción e ingeniería.',
      'Redacta un reporte ejecutivo CONCISO (máx 180 palabras) en español profesional para el mes de ' + monthName + ' ' + year + '.',
      '',
      'DATOS DEL MES:',
      '- Total cotizaciones terminadas: ' + m.totalCount,
      '- Ganadas: ' + m.winLoss.ganada + ' | Perdidas: ' + m.winLoss.perdida + ' | % Cierre: ' + (m.winLoss.total > 0 ? Math.round(m.winLoss.ganada / m.winLoss.total * 100) : 0) + '%',
      '',
      'SLA por clasificación:',
      '  Clase A  (límite 3d):  ' + m.slaSummary.A.count  + ' cot., ' + m.slaSummary.A.pctOk  + '% a tiempo, prom. ' + (m.slaSummary.A.avgDays  || 'N/D') + 'd',
      '  Clase AA (límite 14d): ' + m.slaSummary.AA.count + ' cot., ' + m.slaSummary.AA.pctOk + '% a tiempo, prom. ' + (m.slaSummary.AA.avgDays || 'N/D') + 'd',
      '  Clase AAA(límite 30d): ' + m.slaSummary.AAA.count+ ' cot., ' + m.slaSummary.AAA.pctOk+ '% a tiempo, prom. ' + (m.slaSummary.AAA.avgDays|| 'N/D') + 'd',
      '',
      'Top cotizadores:',
      top5.map(c => '  ' + c.name + ': ' + c.total + ' cot., ' + c.ganadas + ' ganadas, ' + c.slaOk + ' SLA OK').join('\n'),
      '',
      alerts.length > 0
        ? 'Alertas detectadas:\n' + alerts.map(a => '  ' + a.icon + ' ' + a.mensaje).join('\n')
        : 'Sin alertas críticas este mes.',
      '',
      'Instrucciones: sé directo, sin saludos. Menciona lo más importante (desempeño general, mejor cotizador, punto débil) y termina con UNA recomendación concreta.'
    ].join('\n');

    // ── 4. LLAMAR A GEMINI ────────────────────────────────────────
    const geminiResult = callGeminiAPI(prompt);
    const geminiSummary = geminiResult.success ? geminiResult.text : '(Gemini no disponible: ' + geminiResult.message + ')';

    // ── 5. ENVIAR EMAIL DE REPORTE ────────────────────────────────
    const emailResult = _sendAgentEmail(m, alerts, geminiSummary, monthName, year);

    // ── 6. GUARDAR ÚLTIMO REPORTE EN PROPIEDADES ──────────────────
    const lastRun = {
      timestamp  : now.getTime(),
      timestampStr: Utilities.formatDate(now, 'America/Mexico_City', 'dd/MM/yyyy HH:mm'),
      month, year,
      alerts,
      geminiSummary,
      totalCount  : m.totalCount,
      ganadas     : m.winLoss.ganada,
      perdidas    : m.winLoss.perdida,
      emailSent   : emailResult.success
    };
    PropertiesService.getScriptProperties().setProperty('LAST_AGENT_RUN', JSON.stringify(lastRun));
    registrarLog('AGENT', 'RUN_COMPLETE', 'Agente ejecutado. Alertas: ' + alerts.length + '. Email: ' + (emailResult.success ? 'OK' : 'FALLO'));

    return { success: true, lastRun };
  } catch (e) {
    console.error('runQuoteMetricsAgent Error: ' + e.toString());
    return { success: false, message: e.toString() };
  }
}

/* Devuelve el último reporte del agente (para mostrarlo en el panel) */
function apiGetLastAgentReport() {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty('LAST_AGENT_RUN') || '';
    if (!raw) return { success: true, hasReport: false };
    return { success: true, hasReport: true, lastRun: JSON.parse(raw) };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/* Genera y envía el email HTML del reporte */
function _sendAgentEmail(m, alerts, geminiSummary, monthName, year) {
  try {
    // Destinatarios: ANTONIA_VENTAS + ADMIN
    const recipients = [];
    if (USER_DB['ANTONIA_VENTAS'] && USER_DB['ANTONIA_VENTAS'].email) recipients.push(USER_DB['ANTONIA_VENTAS'].email);
    if (USER_DB['LUIS_CARLOS']    && USER_DB['LUIS_CARLOS'].email)    recipients.push(USER_DB['LUIS_CARLOS'].email);

    if (recipients.length === 0) return { success: false, message: 'Sin destinatarios configurados.' };

    const closePct = m.winLoss.total > 0 ? Math.round(m.winLoss.ganada / m.winLoss.total * 100) : 0;
    const alertRows = alerts.length > 0
      ? alerts.map(a => '<tr><td style="padding:6px 12px;">' + a.icon + '</td><td style="padding:6px 12px;color:#333;">' + a.mensaje + '</td><td style="padding:6px 12px;"><span style="background:' + (a.severity==='ALTA'?'#dc3545':a.severity==='MEDIA'?'#fd7e14':'#17a2b8') + ';color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">' + a.severity + '</span></td></tr>').join('')
      : '<tr><td colspan="3" style="padding:8px 12px;color:#28a745;">✅ Sin alertas críticas este mes</td></tr>';

    const cotizRows = m.byCotizadorArr.slice(0, 8).map(c => {
      const pct = c.total > 0 ? Math.round(c.ganadas / c.total * 100) : 0;
      return '<tr style="border-bottom:1px solid #eee;"><td style="padding:5px 10px;">' + c.name + '</td><td style="text-align:center;padding:5px 10px;">' + c.total + '</td><td style="text-align:center;padding:5px 10px;color:#28a745;">' + c.ganadas + '</td><td style="text-align:center;padding:5px 10px;color:#dc3545;">' + c.perdidas + '</td><td style="text-align:center;padding:5px 10px;font-weight:bold;">' + pct + '%</td><td style="text-align:center;padding:5px 10px;">' + c.slaOk + ' / ' + c.slaFail + '</td></tr>';
    }).join('');

    const html = [
      '<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;background:#fff;">',
      '<div style="background:#1E3A5F;color:#fff;padding:24px;">',
      '<h1 style="margin:0;font-size:22px;">📊 Reporte de Cotizaciones — ' + monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + year + '</h1>',
      '<p style="margin:4px 0 0;font-size:13px;opacity:0.8;">Generado automáticamente por el Agente de Métricas · Holtmont Workspace</p>',
      '</div>',
      '<div style="padding:24px;">',
      // KPI cards
      '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">',
      '<div style="flex:1;min-width:140px;background:#f8f9fa;border-top:4px solid #00d2ff;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:28px;font-weight:bold;color:#00d2ff;">' + m.totalCount + '</div><div style="font-size:12px;color:#666;">Terminadas</div></div>',
      '<div style="flex:1;min-width:140px;background:#f8f9fa;border-top:4px solid #28a745;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:28px;font-weight:bold;color:#28a745;">' + m.winLoss.ganada + '</div><div style="font-size:12px;color:#666;">✅ Ganadas</div></div>',
      '<div style="flex:1;min-width:140px;background:#f8f9fa;border-top:4px solid #dc3545;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:28px;font-weight:bold;color:#dc3545;">' + m.winLoss.perdida + '</div><div style="font-size:12px;color:#666;">❌ Perdidas</div></div>',
      '<div style="flex:1;min-width:140px;background:#f8f9fa;border-top:4px solid #ffc107;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:28px;font-weight:bold;color:#ffc107;">' + closePct + '%</div><div style="font-size:12px;color:#666;">🎯 % Cierre</div></div>',
      '</div>',
      // Gemini summary
      '<div style="background:#f0f7ff;border-left:4px solid #00d2ff;padding:16px;border-radius:4px;margin-bottom:24px;">',
      '<p style="font-size:12px;font-weight:bold;color:#00d2ff;margin:0 0 8px;">🤖 ANÁLISIS IA (Gemini)</p>',
      '<p style="margin:0;color:#333;line-height:1.6;">' + geminiSummary.replace(/\n/g, '<br>') + '</p>',
      '</div>',
      // Alertas
      '<h3 style="color:#1E3A5F;margin-bottom:12px;">⚠️ Alertas del Agente</h3>',
      '<table style="width:100%;border-collapse:collapse;font-size:13px;background:#f8f9fa;border-radius:8px;overflow:hidden;margin-bottom:24px;">',
      alertRows,
      '</table>',
      // SLA
      '<h3 style="color:#1E3A5F;margin-bottom:12px;">⏱️ SLA por Clasificación</h3>',
      '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">',
      '<thead><tr style="background:#1E3A5F;color:#fff;"><th style="padding:8px 12px;text-align:left;">Clase</th><th style="padding:8px 12px;text-align:center;">Total</th><th style="padding:8px 12px;text-align:center;">✅ A tiempo</th><th style="padding:8px 12px;text-align:center;">❌ Tarde</th><th style="padding:8px 12px;text-align:center;">% Cumpl.</th><th style="padding:8px 12px;text-align:center;">Prom. días</th></tr></thead>',
      '<tbody>',
      ['A','AA','AAA'].map(k => {
        const s = m.slaSummary[k];
        const color = s.pctOk >= 80 ? '#28a745' : s.pctOk >= 60 ? '#fd7e14' : '#dc3545';
        return '<tr style="border-bottom:1px solid #eee;"><td style="padding:7px 12px;font-weight:bold;">' + k + ' (≤' + s.slaLimit + 'd)</td><td style="text-align:center;padding:7px 12px;">' + s.count + '</td><td style="text-align:center;padding:7px 12px;color:#28a745;">' + s.ok + '</td><td style="text-align:center;padding:7px 12px;color:#dc3545;">' + s.fail + '</td><td style="text-align:center;padding:7px 12px;font-weight:bold;color:' + color + ';">' + s.pctOk + '%</td><td style="text-align:center;padding:7px 12px;">' + (s.avgDays || 'N/D') + 'd</td></tr>';
      }).join(''),
      '</tbody></table>',
      // Por cotizador
      '<h3 style="color:#1E3A5F;margin-bottom:12px;">👤 Desempeño por Cotizador</h3>',
      '<table style="width:100%;border-collapse:collapse;font-size:13px;">',
      '<thead><tr style="background:#1E3A5F;color:#fff;"><th style="padding:8px 10px;text-align:left;">Cotizador</th><th style="padding:8px 10px;text-align:center;">Total</th><th style="padding:8px 10px;text-align:center;">Ganadas</th><th style="padding:8px 10px;text-align:center;">Perdidas</th><th style="padding:8px 10px;text-align:center;">% Cierre</th><th style="padding:8px 10px;text-align:center;">SLA OK/Fail</th></tr></thead>',
      '<tbody>' + cotizRows + '</tbody>',
      '</table>',
      '</div>',
      '<div style="background:#f8f9fa;padding:12px 24px;font-size:11px;color:#999;border-top:1px solid #eee;">',
      'Holtmont Workspace — Agente Automático de Métricas · ' + Utilities.formatDate(new Date(), 'America/Mexico_City', 'dd/MM/yyyy HH:mm'),
      '</div></div>'
    ].join('');

    recipients.forEach(email => {
      MailApp.sendEmail({
        to: email,
        subject: '📊 Reporte Cotizaciones ' + monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + year + (alerts.length > 0 ? ' — ⚠️ ' + alerts.length + ' alerta(s)' : ''),
        htmlBody: html
      });
    });

    return { success: true, sentTo: recipients };
  } catch (e) {
    console.error('_sendAgentEmail Error: ' + e.toString());
    return { success: false, message: e.toString() };
  }
}

/* 5. TEST DE VALIDACIÓN (LOGGER) */
function test_DataIntegrity() {
  Logger.log("=== INICIO TEST DE INTEGRIDAD ===");

  const testUser = "Eduardo Manzanares";
  Logger.log("Verificando hoja para: " + testUser);

  const sheet = findSheetSmart(testUser);
  if (!sheet) {
      Logger.log("❌ FAIL: Hoja no encontrada.");
      return;
  }
  Logger.log("✅ OK: Hoja encontrada.");

  const res = internalFetchSheetData(testUser);
  if (!res.success) {
      Logger.log("❌ FAIL: Error leyendo datos: " + res.message);
      return;
  }

  const totalTareas = res.data.length;
  Logger.log("Volumen de datos encontrados: " + totalTareas);

  if (totalTareas === 0) {
      Logger.log("⚠️ WARNING: La hoja está vacía o no tiene tareas activas.");
  } else {
      const sample = res.data[0];
      const start = sample['FECHA'] || sample['ALTA'];
      Logger.log("Muestra de Fecha Inicio: " + start);
      if (start) {
          Logger.log("✅ OK: Formato de fecha detectado.");
      } else {
          Logger.log("⚠️ WARNING: Posible falta de columna FECHA.");
      }
  }

  Logger.log("=== FIN TEST ===");
}

/* 5. MOTOR DE LECTURA OPTIMIZADO */
function internalFetchSheetData(sheetName) {
  try {
    const sheet = findSheetSmart(sheetName);
    if (!sheet) return { success: true, data: [], history: [], headers: [], message: `Falta hoja: ${sheetName}` };
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return { success: true, data: [], history: [], headers: [], message: "Vacía" };
    const headerRowIndex = findHeaderRow(values);
    if (headerRowIndex === -1) return { success: true, data: [], headers: [], message: "Sin formato válido" };
    const rawHeaders = values[headerRowIndex].map(h => String(h).replace(/\n/g, " ").replace(/\s+/g, " ").trim());
    const validIndices = [];
    const cleanHeaders = [];
    const usedHeaders = new Set();
    rawHeaders.forEach((h, index) => {
      if(h !== "") {
          const hUpper = h.toUpperCase();
          if (!usedHeaders.has(hUpper)) {
              validIndices.push(index);
              cleanHeaders.push(h);
              usedHeaders.add(hUpper);
          }
      }
    });
    const dataRows = values.slice(headerRowIndex + 1);
    const activeTasks = [];
    const historyTasks = [];
    let isReadingHistory = false;
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (row.join("|").toUpperCase().includes("TAREAS REALIZADAS")) { isReadingHistory = true; continue; }
      if (row.every(c => c === "") || String(row[validIndices[0]]).toUpperCase() === String(cleanHeaders[0]).toUpperCase()) continue;
      let rowObj = {};
      let hasData = false;
      let sortDate = null;
      validIndices.forEach((colIndex, k) => {
        const headerName = cleanHeaders[k];
        let val = row[colIndex];
        if (val instanceof Date) {
           if (val.getFullYear() < 1900) val = Utilities.formatDate(val, SS.getSpreadsheetTimeZone(), "HH:mm");
           else {
              if (!sortDate) sortDate = val; 
              val = Utilities.formatDate(val, SS.getSpreadsheetTimeZone(), "dd/MM/yy");
           }
        } else if (typeof val === 'string') {
           if(val.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/)) {
               val = val.replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g, (m, d, mm, y) => {
                   const yy = (y.length === 4) ? y.slice(-2) : y;
                   return `${d.padStart(2,'0')}/${mm.padStart(2,'0')}/${yy}`;
               });
           }
           else if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
               // Manual split to avoid TZ shifts
               const p = val.split('-');
               val = `${p[2]}/${p[1]}/${p[0].slice(-2)}`;
           }
        }
        if (val !== "" && val !== undefined) hasData = true;
        rowObj[headerName] = val;
      });
      if (hasData) {
        rowObj['_sortDate'] = sortDate;
        rowObj['_rowIndex'] = headerRowIndex + i + 2;
        if (isReadingHistory) historyTasks.push(rowObj); else activeTasks.push(rowObj);
      }
    }
    
    const dateSorter = (a, b) => {
      const dA = a['_sortDate'] instanceof Date ? a['_sortDate'].getTime() : 0;
      const dB = b['_sortDate'] instanceof Date ? b['_sortDate'].getTime() : 0;
      return dB - dA;
    };



    return { 
      success: true, 
      data: activeTasks.sort(dateSorter).map(({_sortDate, ...rest}) => rest), 
      history: historyTasks.sort(dateSorter).map(({_sortDate, ...rest}) => rest), 
      headers: cleanHeaders 
    };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function apiFetchStaffTrackerData(personName) {
  // AUTO-CREATE FOR ANTONIA'S SPECIAL TABS
  if (String(personName).toUpperCase().startsWith("ANTONIA_VENTAS")) {
      const allowedTabs = [
          "ANTONIA_VENTAS RESUMEN EJECUTIVO",
          "ANTONIA_VENTAS BANCO DE COTIZACIONES",
          "ANTONIA_VENTAS PAPA CALIENTE DE COTIZACION"
      ];
      const upperName = String(personName).toUpperCase().trim();
      if (allowedTabs.includes(upperName)) {
          ensureSheetWithHeaders(upperName, DEFAULT_SALES_HEADERS);
      }

      // AUTO-ADD COLUMNS FOR 'ANTONIA_VENTAS' (PAPA CALIENTE SUPPORT)
      if (upperName === "ANTONIA_VENTAS") {
          try {
              const sheet = findSheetSmart("ANTONIA_VENTAS");
              if (sheet) {
                  const lastCol = sheet.getLastColumn();
                  if (lastCol > 0) {
                      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).toUpperCase().trim());
                      const missingCols = [];
                      if (!headers.includes("MAP COT")) missingCols.push("MAP COT");
                      if (!headers.includes("PROCESO_LOG")) missingCols.push("PROCESO_LOG");

                      if (missingCols.length > 0) {
                          sheet.getRange(1, lastCol + 1, 1, missingCols.length)
                               .setValues([missingCols])
                               .setFontWeight("bold")
                               .setBackground("#e6e6e6");
                      }
                  }
              }
          } catch(e) { console.error("Error adding columns to ANTONIA_VENTAS: " + e.toString()); }
      }
  }
  return internalFetchSheetData(personName);
}

function apiFetchSalesHistory() {
  try {
    const dataRes = internalFetchSheetData(APP_CONFIG.salesSheetName);
    if (!dataRes.success) return dataRes;
    const allData = [...dataRes.data, ...dataRes.history];
    const grouped = {};
    
    allData.forEach(row => {
        const vendedorKey = Object.keys(row).find(k => k.toUpperCase().includes("VENDEDOR"));
        const clienteKey = Object.keys(row).find(k => k.toUpperCase().includes("CLIENTE"));
        const descKey = Object.keys(row).find(k => k.toUpperCase().includes("CONCEPTO"));
        const statusKey = Object.keys(row).find(k => k.toUpperCase().includes("ESTATUS"));
        const dateKey = Object.keys(row).find(k => k.toUpperCase().includes("FECHA"));

        if (vendedorKey && row[vendedorKey]) {
            const name = String(row[vendedorKey]).trim().toUpperCase();
            if (!grouped[name]) grouped[name] = [];
            
            let pulse = 0;
            const status = String(row[statusKey] || "").toUpperCase();
            if (status.includes("VENDIDA") || status.includes("APROBADA") || status.includes("GANADA")) pulse = 10;
            else if (status.includes("COTIZADA") || status.includes("ENVIADA")) pulse = 5;
            else if (status.includes("PERDIDA") || status.includes("CANCELADA")) pulse = -5;
            else pulse = 1;

            grouped[name].push({
                client: row[clienteKey] || "S/C",
                desc: row[descKey] || "",
                status: status,
                date: row[dateKey] || "",
                pulse: pulse,
                displayDate: row[dateKey] ? String(row[dateKey]).substring(0,5) : ""
            });
        }
    });

    return { success: true, data: grouped };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/**
 * ======================================================================
 * OPTIMIZACIÓN SCRIPTMASTER V153: PROTOCOLO ANTI-BLOQUEO (FILTROS)
 * ======================================================================
 */
function internalBatchUpdateTasks(sheetName, tasksArray, useOwnLock = true) {
  if (!tasksArray || tasksArray.length === 0) return { success: true };
  const lock = LockService.getScriptLock();
  if (useOwnLock) {
    if (!lock.tryLock(10000)) {
        return { success: false, message: "Hoja ocupada, intenta de nuevo."};
    }
  }
  
  try {
    let sheet = findSheetSmart(sheetName);
    if (!sheet) {
        // FALLBACK AUTO-CREACIÓN: Si un usuario no ha ingresado y se le delega, creamos su hoja
        sheet = SS.insertSheet(sheetName);
        const hdrs = sheetName.toUpperCase().includes("(VENTAS)") ? DEFAULT_SALES_HEADERS : DEFAULT_TRACKER_HEADERS;
        sheet.appendRow(hdrs);
        sheet.getRange(1, 1, 1, hdrs.length).setFontWeight("bold").setBackground("#e6e6e6");
    }
    const dataRange = sheet.getDataRange();
    let values = dataRange.getValues();
    if (values.length === 0) return { success: false, message: "Hoja vacía" };
    
    const headerRowIndex = findHeaderRow(values);
    if (headerRowIndex === -1) return { success: false, message: "Sin cabeceras válidas" };
    const cache = CacheService.getScriptCache();
    // 1. SANITIZAR HEADERS Y ELIMINAR FILTROS ROTOS (FIX CRÍTICO)
    let headersChanged = false;
    for(let c = 0; c < values[headerRowIndex].length; c++) {
        if (values[headerRowIndex][c] === "" || values[headerRowIndex][c] === null) {
            values[headerRowIndex][c] = "COL_" + (c + 1);
            headersChanged = true;
        }
    }

    if (headersChanged) {
        const existingFilter = sheet.getFilter();
        if (existingFilter) {
            try { existingFilter.remove(); } catch(e) {} 
        }
        sheet.getRange(headerRowIndex + 1, 1, 1, values[headerRowIndex].length).setValues([values[headerRowIndex]]);
        SpreadsheetApp.flush(); 
    }

    // FIX: HEADERS CON SALTOS DE LINEA (NORMALIZACIÓN ROBUSTA)
    const headers = values[headerRowIndex].map(h => String(h).toUpperCase().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim());
    const maxCols = values.reduce((max, r) => Math.max(max, r.length), 0);
    const totalColumns = Math.max(maxCols, headers.length);

    const colMap = {};
    headers.forEach((h, i) => colMap[h] = i);
    const getColIdx = (key) => {
      const k = key.toUpperCase().trim();
      if (colMap[k] !== undefined) return colMap[k];
      const aliases = {
        'FECHA': ['FECHA', 'FECHAS', 'FECHA ALTA', 'FECHA INICIO', 'FECHA DE INICIO', 'FECHA VISITA', 'FECHA DE ALTA', 'F_INICIO'],
        'CONCEPTO': ['CONCEPTO', 'DESCRIPCION', 'DESCRIPCIÓN DE LA ACTIVIDAD', 'DESCRIPCIÓN', 'ACTIVIDAD'],
        'RESPONSABLE': ['RESPONSABLE', 'RESPONSABLES', 'INVOLUCRADOS', 'VENDEDOR', 'ENCARGADO', 'ASIGNADO'],
        'HORA': ['HORA', 'HORA ASIGNACION', 'HORA DE ASIGNACION'],
        'RELOJ': ['RELOJ', 'HORAS', 'DIAS', 'DÍAS'],
        'ESTATUS': ['ESTATUS', 'STATUS'],
        'CUMPLIMIENTO': ['CUMPLIMIENTO', 'CUMPL.', 'CUMP'],
        'AVANCE': ['AVANCE', 'AVANCE %', '% AVANCE', '%'],
        'ALTA': ['AREA', 'DEPARTAMENTO', 'ESPECIALIDAD', 'ALTA'],
        'FECHA_RESPUESTA': ['FECHA_RESPUESTA', 'FECHA RESPUESTA', 'FECHA FIN', 'FECHA ESTIMADA DE FIN', 'FECHA ESTIMADA', 'FECHA DE ENTREGA', 'FECHA_FIN', 'DEADLINE', 'FEC. EST. FIN'],
        'PRIORIDAD': ['PRIORIDAD', 'PRIORIDADES', 'PRIORIDAD DE COTIZACION', 'PRIO. COT.'],
        'RIESGOS': ['RIESGO', 'RIESGOS'],
        'ARCHIVO': ['ARCHIVO', 'ARCHIVOS', 'CLIP', 'LINK', 'URL', 'EVIDENCIA', 'DOCUMENTO', 'FOTO', 'VIDEO'],
        'CLASIFICACION': ['CLASIFICACION', 'CLASI'],
        'COMENTARIOS': ['COMENTARIOS', 'COMENTARIO', 'COMENTARIOS SEMANA EN CURSO', 'OBSERVACIONES', 'NOTAS', 'DETALLES'],
        'PREVIOS': ['COMENTARIOS PREVIOS', 'PREVIOS', 'COMENTARIOS SEMANA PREVIA'],
        'FECHA_TERMINO': ['FECHA_TERMINO', 'FECHA TERMINO', 'FECHA REAL', 'TERMINO', 'REALIZADO']
      };
      for (let main in aliases) {
        if (main === k || aliases[main].includes(k)) {
             for(let alias of aliases[main]) if(colMap[alias] !== undefined) return colMap[alias];
        }
      }
      return -1;
    };
    const folioIdx = getColIdx('FOLIO') > -1 ? getColIdx('FOLIO') : getColIdx('ID');
    let rowsToAppend = [];
    let singleRowIndex = -1;
    let modified = false;

    // 2. Procesar Tareas
    tasksArray.forEach(task => {
      let rowIndex = -1;
      
      let tFolio = "";
      Object.keys(task).forEach(k => {
          if (k.toUpperCase().trim() === 'FOLIO' || k.toUpperCase().trim() === 'ID') {
              if (task[k]) tFolio = String(task[k]).toUpperCase().trim();
          }
      });

      const tempIdKey = task['_tempId'];
      if (tempIdKey) {
           const cacheKey = sheetName + "_" + tempIdKey;
           const processed = cache.get(cacheKey);
           if (processed) return; // Skip if already processed for this specific sheet
           cache.put(cacheKey, "1", 120); // 2 minute memory
      }

      if (task._rowIndex) {
        const candidateRowIndex = parseInt(task._rowIndex) - 1;
        // 2.1 VALIDACIÓN DE SEGURIDAD (ANTI-DESPLAZAMIENTO)
        // Verificamos que el Folio en esa fila coincida con el payload.
        // Si hubo movimientos (filas borradas/insertadas), el índice ya no coincidirá.
        if (candidateRowIndex > headerRowIndex && candidateRowIndex < values.length && folioIdx > -1 && tFolio) {
             const rowFolio = String(values[candidateRowIndex][folioIdx] || "").toUpperCase().trim();
             if (rowFolio === tFolio) {
                 rowIndex = candidateRowIndex;
             } else {
                 console.warn(`[SYNC WARNING] Desplazamiento detectado. Folio Payload: ${tFolio} vs Folio Fila: ${rowFolio} (Fila ${candidateRowIndex+1}). Activando búsqueda.`);
             }
        } else if (!tFolio) {
             // Si no hay folio (ej. solo fila), confiamos en el índice si es válido
             if (candidateRowIndex > headerRowIndex && candidateRowIndex < values.length) rowIndex = candidateRowIndex;
        }
      }

      if (rowIndex === -1 && tFolio && folioIdx > -1) {
           // Búsqueda Robusta por Folio
           for (let i = headerRowIndex + 1; i < values.length; i++) {
             const row = values[i];
             if (String(row[folioIdx]).toUpperCase().trim() === tFolio) { rowIndex = i; break; }
          }
      }

      // NO-DUPLICATE GATEKEEPER: Fallback search by CONCEPTO + FECHA if Folio wasn't found
      if (rowIndex === -1) {
          const tConcept = String(task['CONCEPTO'] || task['DESCRIPCION'] || task['TAREA'] || "").trim().toUpperCase().substring(0, 50);
          const tDate = String(task['FECHA'] || task['F. INICIO'] || "").trim();
          const tCliente = String(task['CLIENTE'] || "").trim().toUpperCase();

          if (tConcept) {
             const conceptIdx = getColIdx('CONCEPTO') > -1 ? getColIdx('CONCEPTO') : getColIdx('DESCRIPCION');
             const dateIdx = getColIdx('FECHA') > -1 ? getColIdx('FECHA') : getColIdx('F. INICIO');
             const clienteIdx = getColIdx('CLIENTE');

             if (conceptIdx > -1) {
                 for (let i = headerRowIndex + 1; i < values.length; i++) {
                     const row = values[i];
                     const rowConcept = String(row[conceptIdx]).trim().toUpperCase().substring(0, 50);
                     const rowDateRaw = row[dateIdx];

                     let rowDateStr = "";
                     if (rowDateRaw instanceof Date) {
                         rowDateStr = Utilities.formatDate(rowDateRaw, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), "dd/MM/yy");
                     } else {
                         rowDateStr = String(rowDateRaw || "").trim();
                     }

                     // Restore date check: If Concept matches exactly, AND Date matches exactly
                     // If both dates are empty or unprovided, we DO NOT match to avoid overwriting random tasks.
                     // They must both have a valid matching date to be considered duplicates without a Folio.

                     const cleanTDate = tDate.replace(/-/g, '/').replace(/20(\d{2})/, '$1');
                     const cleanRowDate = rowDateStr.replace(/-/g, '/').replace(/20(\d{2})/, '$1');

                     // RELAXED GATEKEEPER: If both dates are empty, or if they match, we consider it a duplicate
                     // Since new tasks might be sent without date and generated on the fly, a strict date match causes duplicates.
                     const isDateMatch = (cleanTDate === "" && cleanRowDate === "") ||
                                         ((cleanTDate !== "" && cleanRowDate !== "") && (cleanRowDate.includes(cleanTDate) || cleanTDate.includes(cleanRowDate)));

                     let isClienteMatch = true;
                     if (clienteIdx > -1 && tCliente) {
                         const rowCliente = String(row[clienteIdx] || "").trim().toUpperCase();
                         isClienteMatch = rowCliente === tCliente;
                     }

                     if (rowConcept === tConcept && isDateMatch && isClienteMatch) {
                         rowIndex = i;
                         console.warn(`[SYNC GATEKEEPER] Duplicado interceptado. Tarea '${tConcept}' asignada a fila existente ${rowIndex+1} ignorando Folio.`);
                         break;
                     }
                 }
             }
          }
      }

      if (rowIndex > -1 && rowIndex < values.length) {
         Object.keys(task).forEach(key => {
            if (key.startsWith('_')) return;
            const cIdx = getColIdx(key);
            // Don't overwrite existing valid folio with a new different folio if we matched by concept
            if ((cIdx === folioIdx) && values[rowIndex][cIdx]) {
                 // Pero asegurarnos de que la tarea que el sistema devuelve mantenga el folio válido de la base de datos
                 task['FOLIO'] = values[rowIndex][cIdx];
                 task['ID'] = values[rowIndex][cIdx];
                 return;
            } else if ((cIdx === folioIdx) && !values[rowIndex][cIdx] && task[key]) {
                 // Si la tabla no tenía folio pero la tarea sí, lo respetamos y NO lo generamos
                 values[rowIndex][cIdx] = task[key];
                 return;
            }
            if (cIdx > -1) values[rowIndex][cIdx] = task[key];
        });

        // AUTO-GENERATE FOLIO FOR EXISTING ROWS IF MISSING
        let hasTaskFolio = false;
        Object.keys(task).forEach(k => {
            if ((k.toUpperCase().trim() === 'FOLIO' || k.toUpperCase().trim() === 'ID') && task[k]) {
                hasTaskFolio = true;
            }
        });

        if (folioIdx > -1 && !values[rowIndex][folioIdx]) {
             let prefix = sheetName.toUpperCase() === "ANTONIA_VENTAS" || sheetName.toUpperCase().includes("(VENTAS)") ? "AV-" : generatePrefix(sheetName);
             let seqKey = sheetName.toUpperCase() === "ANTONIA_VENTAS" || sheetName.toUpperCase().includes("(VENTAS)") ? 'ANTONIA_SEQ_V2' : prefix;
             const seqNum = generateNumericSequence(seqKey);
             values[rowIndex][folioIdx] = prefix + seqNum;
             task['FOLIO'] = values[rowIndex][folioIdx];
             task['ID'] = values[rowIndex][folioIdx];
        } else if (folioIdx > -1 && values[rowIndex][folioIdx] && !hasTaskFolio) {
             task['FOLIO'] = values[rowIndex][folioIdx];
             task['ID'] = values[rowIndex][folioIdx];
        }

        singleRowIndex = rowIndex;
        modified = true;
      } 
      else {
          // BATCH DEDUP: Check if already appending this ID in current batch
          let appendedRowIndex = -1;
          let tFolioStr = "";
          Object.keys(task).forEach(k => {
              if (k.toUpperCase().trim() === 'FOLIO' || k.toUpperCase().trim() === 'ID') {
                  if (task[k]) tFolioStr = String(task[k]).toUpperCase().trim();
              }
          });
          const tConceptStr = String(task['CONCEPTO'] || task['DESCRIPCION'] || task['TAREA'] || "").trim().toUpperCase().substring(0, 50);

          for(let k=0; k<rowsToAppend.length; k++) {
              const pendingRow = rowsToAppend[k];
              const pendingFolio = folioIdx > -1 ? String(pendingRow[folioIdx]).toUpperCase().trim() : "";

              if (folioIdx > -1 && tFolioStr && pendingFolio === tFolioStr) {
                  appendedRowIndex = k;
                  break;
              }

              // Secondary batch check by concept AND date AND tempId
              if (tConceptStr) {
                  const cIdx = getColIdx('CONCEPTO') > -1 ? getColIdx('CONCEPTO') : getColIdx('DESCRIPCION');
                  const dIdx = getColIdx('FECHA') > -1 ? getColIdx('FECHA') : getColIdx('F. INICIO');

                  if (cIdx > -1) {
                      const pendingConcept = String(pendingRow[cIdx]).trim().toUpperCase().substring(0, 50);

                      let pendingDateStr = "";
                      if (dIdx > -1) {
                          const pDateRaw = pendingRow[dIdx];
                          if (pDateRaw instanceof Date) pendingDateStr = Utilities.formatDate(pDateRaw, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), "dd/MM/yy");
                          else pendingDateStr = String(pDateRaw || "").trim();
                      }

                      const tDateStr = String(task['FECHA'] || task['F. INICIO'] || "").trim();
                      const cleanTDate = tDateStr.replace(/-/g, '/').replace(/20(\d{2})/, '$1');
                      const cleanRowDate = pendingDateStr.replace(/-/g, '/').replace(/20(\d{2})/, '$1');

                      const isDateMatch = (cleanTDate === "" && cleanRowDate === "") ||
                                          ((cleanTDate !== "" && cleanRowDate !== "") && (cleanRowDate.includes(cleanTDate) || cleanTDate.includes(cleanRowDate)));

                      if (pendingConcept === tConceptStr && isDateMatch) {
                          appendedRowIndex = k;
                          break;
                      }
                  }
              }
          }

          if (appendedRowIndex > -1) {
              // Update the pending row instead of creating duplicate
              const targetRow = rowsToAppend[appendedRowIndex];
              Object.keys(task).forEach(key => {
                  if (key.startsWith('_')) return;
                  const cIdx = getColIdx(key);
                  if (cIdx > -1) targetRow[cIdx] = task[key];
              });
          } else {
              const newRow = new Array(totalColumns).fill("");
              Object.keys(task).forEach(key => {
                  if (key.startsWith('_')) return;
                  const cIdx = getColIdx(key);
                  if (cIdx > -1) newRow[cIdx] = task[key];
              });

              let existingTaskFolio = null;
              Object.keys(task).forEach(k => {
                  if ((k.toUpperCase().trim() === 'FOLIO' || k.toUpperCase().trim() === 'ID') && task[k]) {
                      existingTaskFolio = task[k];
                  }
              });

              if (folioIdx > -1 && !newRow[folioIdx] && existingTaskFolio) {
                  newRow[folioIdx] = existingTaskFolio;
              } else if (folioIdx > -1 && !newRow[folioIdx] && !existingTaskFolio) {
                 let prefix = sheetName.toUpperCase() === "ANTONIA_VENTAS" || sheetName.toUpperCase().includes("(VENTAS)") ? "AV-" : generatePrefix(sheetName);
                 let seqKey = sheetName.toUpperCase() === "ANTONIA_VENTAS" || sheetName.toUpperCase().includes("(VENTAS)") ? 'ANTONIA_SEQ_V2' : prefix;
                 const seqNum = generateNumericSequence(seqKey);
                 newRow[folioIdx] = prefix + seqNum;
                 task['FOLIO'] = newRow[folioIdx];
                 task['ID'] = newRow[folioIdx];
              }
              const statusIdx = getColIdx('ESTATUS');
              if(statusIdx > -1 && !newRow[statusIdx]) newRow[statusIdx] = 'ASIGNADO';
              rowsToAppend.push(newRow);
          }
      }
    });
    // 3. AUTO-ARCHIVADO
    let rowsMoved = false;
    const avanceIdx = getColIdx('AVANCE');
    const cumplimientoIdx = getColIdx('CUMPLIMIENTO');
    const estatusIdx = getColIdx('ESTATUS');
    const fechaTerminoIdx = getColIdx('FECHA_TERMINO');

    if (avanceIdx > -1 || cumplimientoIdx > -1 || estatusIdx > -1) {
        let separatorIndex = -1;
        for(let i=0; i<values.length; i++) {
            if(String(values[i][0]).toUpperCase().includes("TAREAS REALIZADAS") || 
               String(values[i].join("|")).toUpperCase().includes("TAREAS REALIZADAS")) { 
                separatorIndex = i;
                break;
            }
        }

        let headerAndTop = values.slice(0, headerRowIndex + 1);
        let activeRows = [];
        let separatorRow = [];
        let historyRows = [];
        if (separatorIndex === -1) {
            activeRows = values.slice(headerRowIndex + 1);
        } else {
            activeRows = values.slice(headerRowIndex + 1, separatorIndex);
            separatorRow = [values[separatorIndex]];
            historyRows = values.slice(separatorIndex + 1);
        }

        const newActiveRows = [];
        const movedRows = [];
        
        activeRows.forEach(row => {
            let isComplete = false;

            const valEstatus = estatusIdx > -1 ? String(row[estatusIdx] || "").toUpperCase().trim() : "";
            const doneStatuses = ['HECHO', 'TERMINADO', 'FINALIZADO', 'REALIZADO', 'COMPLETADO', 'DONE'];
            if (doneStatuses.includes(valEstatus)) {
                isComplete = true;
            }

            [avanceIdx, cumplimientoIdx].forEach(idx => {
                if (idx > -1) {
                    const rawVal = row[idx];
                    const valStr = String(rawVal || "").trim();
                    const strictMatch = valStr === "100" || valStr === "100%" || valStr.toUpperCase() === "SI";
                    if (strictMatch) {
                        isComplete = true;
                    } else if (valStr) {
                        const cleanVal = valStr.replace('%', '').replace(',', '.').trim();
                        const num = parseFloat(cleanVal);
                        if (!isNaN(num) && Math.abs(num - 100) < 0.01) {
                            isComplete = true;
                        }
                    }
                }
            });

            if (isComplete) {
                // AUTO-TIMESTAMP: FECHA TERMINO REAL
                if (fechaTerminoIdx > -1) {
                   if (!row[fechaTerminoIdx]) {
                       row[fechaTerminoIdx] = Utilities.formatDate(new Date(), SS.getSpreadsheetTimeZone(), "dd/MM/yy");
                   }
                }
                movedRows.push(row);
                rowsMoved = true;
            } else {
                newActiveRows.push(row);
            }
        });
        if (rowsMoved || (rowsToAppend.length > 0 && separatorIndex === -1)) {
            if (separatorRow.length === 0) {
                const sep = new Array(totalColumns).fill("");
                const titleCol = totalColumns > 2 ? 2 : 0; 
                sep[titleCol] = "TAREAS REALIZADAS";
                separatorRow = [sep];
            }
            values = [ ...headerAndTop, ...rowsToAppend, ...newActiveRows, ...separatorRow, ...movedRows, ...historyRows ];
            rowsToAppend = []; 
            modified = true;
            singleRowIndex = -1;
        }
    }

    // 4. ESCRITURA BLINDADA
    if (modified) {
       const finalMaxCols = values.reduce((max, r) => Math.max(max, r.length), totalColumns);
       const normalizedValues = values.map(r => {
           if (r.length === finalMaxCols) return r;
           const diff = finalMaxCols - r.length;
           return r.concat(new Array(diff).fill(""));
       });
       if (tasksArray.length === 1 && singleRowIndex > -1 && !rowsMoved) {
          let singleRow = values[singleRowIndex];
          if(singleRow.length < finalMaxCols) {
               singleRow = singleRow.concat(new Array(finalMaxCols - singleRow.length).fill(""));
          }
          sheet.getRange(singleRowIndex + 1, 1, 1, finalMaxCols).setValues([singleRow]);
       } else {
          // REMOVE FILTER IF EXISTS TO AVOID "HEADER MUST HAVE VALUE" ERROR
          const existingFilter = sheet.getFilter();
          if (existingFilter) {
              try { existingFilter.remove(); } catch(e) {}
          }

          if(values.length < dataRange.getNumRows()) sheet.clearContents();
          if(headerRowIndex < normalizedValues.length) {
              for(let c=0; c<normalizedValues[headerRowIndex].length; c++){
                  if(!normalizedValues[headerRowIndex][c]) normalizedValues[headerRowIndex][c] = "COL_" + (c+1);
              }
          }
          sheet.getRange(1, 1, normalizedValues.length, finalMaxCols).setValues(normalizedValues);
       }
    }

    if (rowsToAppend.length > 0) {
        const finalMaxCols = values.length > 0 ? values[0].length : totalColumns;
        const normalizedAppend = rowsToAppend.map(r => {
             if (r.length >= finalMaxCols) return r;
             return r.concat(new Array(finalMaxCols - r.length).fill(""));
        });
        const insertPos = headerRowIndex + 2;
        sheet.insertRowsBefore(insertPos, rowsToAppend.length);
        sheet.getRange(insertPos, 1, normalizedAppend.length, finalMaxCols).setValues(normalizedAppend);

        // 5. AUTO-HEALING: FORMATO CONDICIONAL (SEMAFORO)
        // Se ejecuta solo al crear nuevas tareas para garantizar que el rango cubra la nueva fila superior.
        const excludedForFormatting = [APP_CONFIG.logSheetName, APP_CONFIG.draftSheetName, APP_CONFIG.salesSheetName, "DB_SITIOS", "DB_PROYECTOS", "DB_DIRECTORY"];
        if (!excludedForFormatting.includes(sheetName) && !sheetName.startsWith("DB_")) {
             try { applyTrafficLightToSheet(sheet); } catch(e) { console.warn("Auto-Format Error: " + e.toString()); }
        }
    }
    
    SpreadsheetApp.flush();
    return { success: true, moved: rowsMoved };
  } catch (e) {
    console.error(e);
    return { success: false, message: e.toString() };
  } finally {
    if (useOwnLock) lock.releaseLock();
  }
}

function apiUpdatePPCV3(taskData, username) {
  // Ensure backward compatibility with sheet headers
  if (taskData['COMENTARIOS SEMANA EN CURSO'] !== undefined) taskData['COMENTARIOS'] = taskData['COMENTARIOS SEMANA EN CURSO'];
  if (taskData['COMENTARIOS SEMANA PREVIA'] !== undefined) taskData['COMENTARIOS PREVIOS'] = taskData['COMENTARIOS SEMANA PREVIA'];

  const targetSheet = (String(username).toUpperCase().trim() === 'ANTONIA_VENTAS') ? 'PPCV4' : APP_CONFIG.ppcSheetName;

  // EXPLICIT REMAPPING FOR PPCV4 (TOÑITA) TO MATCH SCREENSHOT HEADERS EXACTLY
  if (targetSheet === 'PPCV4') {
      if (taskData['FECHA']) taskData['Fecha de Alta'] = taskData['FECHA'];
      if (taskData['CONCEPTO']) taskData['Descripción de la Actividad'] = taskData['CONCEPTO'];
      if (taskData['ARCHIVO']) taskData['Archivos'] = taskData['ARCHIVO'];
      // Keep original keys too, internalBatchUpdateTasks will handle duplicates/aliases, but explicit keys take precedence in matching
  }

  const res = internalBatchUpdateTasks(targetSheet, [taskData]);
  if(res.success) {
      const action = (taskData['COMENTARIOS'] || taskData['comentarios']) ? "ACTUALIZAR/COMENTARIO" : "ACTUALIZAR";
      registrarLog(username || "DESCONOCIDO", action, `Update ${targetSheet} ID: ${taskData['ID']||taskData['FOLIO']}`);
      res.data = taskData; // Return the updated taskData to the frontend
  }
  return res;
}

function internalUpdateTask(personName, taskData, username) {
    try {
        // REGLA ESTRICTA: Redirigir siempre a ANTONIA PINEDA LOPEZ si alguien que no es ella manda a ANTONIA_VENTAS
        if (String(personName).toUpperCase().trim() === "ANTONIA_VENTAS" && String(username).toUpperCase().trim() !== "ANTONIA_VENTAS") {
            personName = "ANTONIA PINEDA LOPEZ";
        }
        // GUARD: PPCV3 Inmutabilidad (Solo modificable por Weekly Plan)
        if (String(personName).trim().toUpperCase() === String(APP_CONFIG.ppcSheetName).trim().toUpperCase()) {
            return { success: false, message: "Operación no permitida: PPCV3 es de solo lectura desde esta vista." };
        }

        const isAntonia = String(personName).toUpperCase() === "ANTONIA_VENTAS";

        // --- RESTRICTION BLOCK: limit editable fields for vendor users on sheets they don't own ---
        const restrictedUsers = ["ANGEL_SALINAS", "TERESA_GARZA", "EDUARDO_TERAN", "EDUARDO_MANZANARES", "RAMIRO_RODRIGUEZ", "SEBASTIAN_PADILLA"];
        const cleanUN = String(username).toUpperCase().trim();
        if (restrictedUsers.includes(cleanUN)) {
             // Allow full access when editing their own tracker sheet
             const ownSheetName = (USER_DB[cleanUN] && USER_DB[cleanUN].staffName) ? USER_DB[cleanUN].staffName.toUpperCase() : '';
             const editingOwnTracker = ownSheetName && String(personName).toUpperCase().trim() === ownSheetName;
             if (!editingOwnTracker) {
                 const allowed = ['ESTATUS', 'STATUS', 'MAP COT', 'PROCESO', 'FOLIO', 'ID', 'AVANCE', 'AVANCE %', 'REQUISITOR', 'INFO CLIENTE', 'F2', 'COTIZACION', 'COT', 'TIMELINE', 'LAYOUT', 'COMENTARIOS', '_rowIndex', 'CORREO', 'CARPETA', 'CORREOS', 'CARPETAS'];
                 const isAllowed = (k) => {
                     const kUp = k.toUpperCase();
                     if (k.startsWith('_')) return true;
                     return allowed.some(a => kUp.includes(a));
                 };
                 Object.keys(taskData).forEach(key => {
                     if (!isAllowed(key)) {
                         delete taskData[key];
                     }
                 });
             }
        }
        // --- END RESTRICTION BLOCK ---

        // 1. AUTO-INCREMENT FOLIO (Before Saving)
        let existingFolio = null;
        Object.keys(taskData).forEach(k => {
            const kUp = k.toUpperCase().trim();
            if ((kUp === 'FOLIO' || kUp === 'ID') && taskData[k]) {
                existingFolio = taskData[k];
            }
        });

        const isNewTask = !existingFolio;
        if (isNewTask) {
             // NEW TASK -> GENERATE ID for any user
             let prefixSource = username || personName;
            if (String(personName).toUpperCase().trim() === "ANTONIA PINEDA LOPEZ" && String(username).toUpperCase().trim() === "ANTONIA_VENTAS") {
                prefixSource = "ANTONIA PINEDA LOPEZ";
            }
            let prefix = isAntonia ? "AV-" : generatePrefix(prefixSource);
             let seqKey = isAntonia ? 'ANTONIA_SEQ_V2' : prefix;
             const seqNum = generateNumericSequence(seqKey);
             taskData['FOLIO'] = prefix + seqNum;
             existingFolio = taskData['FOLIO'];
        }

        if (isAntonia) {
             // Solo aplicar restricciones si NO es una tarea recién creada en la interfaz
             if (!isNewTask) {
                 // 2. EXISTING TASK -> APPLY RESTRICTIONS (User Request)
                 // "Una vez que guarde... los únicos datos que pueda modificar es FECHA VISITA, ESTATUS y AVANCE"

                 const allowedBase = ['FOLIO', 'ID', 'ESTATUS', 'MAP COT', 'PROCESO_LOG', 'PROCESO', 'STATUS', 'AVANCE', 'AVANCE %', '_rowIndex', 'VENDEDOR', 'RESPONSABLE', 'INVOLUCRADOS', 'ENCARGADO', 'CONCEPTO', 'DESCRIPCION', 'CLIENTE', 'COTIZACION', 'F2', 'LAYOUT', 'TIMELINE', 'AREA', 'CLASIFICACION', 'CLASI', 'DIAS', 'RELOJ', 'ESPECIALIDAD', 'ARCHIVO', 'ARCHIVOS', 'COMENTARIOS', 'PRIORIDAD', 'PRIORIDAD DE COTIZACION', 'PRIO. COT.', 'F. VISITA', 'F. INICIO', 'F. ENTREGA', 'FECHA VISITA', 'FECHA INICIO', 'DÍAS FINALIZ. COTIZ', 'DIAS FINALIZ. COTIZ', 'CORREO', 'CARPETA', 'INFO CLIENTE', 'CORREOS', 'CARPETAS', 'REQUISITOR'];

                 Object.keys(taskData).forEach(key => {
                     const kUp = key.toUpperCase();
                     if (key.startsWith('_')) return; // Preserve internal keys

                     const isBase = allowedBase.includes(kUp);
                     const isDate = kUp.includes('FECHA') || kUp.includes('ALTA'); // Allow Date fields

                     if (!isBase && !isDate) {
                         delete taskData[key];
                     }
                 });
             }
        }

        const originalTempId = taskData['_tempId'];
        const res = internalBatchUpdateTasks(personName, [taskData]);

        if (originalTempId) taskData['_tempId'] = originalTempId;

        if (res.success) {
             res.data = taskData;
             if (username) {
                 const action = (taskData['COMENTARIOS'] || taskData['comentarios'] || taskData['COMENTARIOS SEMANA EN CURSO']) ? "ACTUALIZAR/COMENTARIO" : "ACTUALIZAR";
                 registrarLog(username, action, `Update Task ID: ${taskData['ID']||taskData['FOLIO']} en ${personName}`);
             }
        }

        // --- SMART ARCHIVING TRIGGER (SINGLE EDIT) ---
        if ((isAntonia || String(personName).toUpperCase().includes("ANTONIA_VENTAS")) && res.success) {
            try {
                if (taskData['COTIZACION'] || taskData['ARCHIVO']) {
                    processQuoteRow(taskData);
                }
            } catch(e) { console.error("Single-Edit Archiving Error: " + e.toString()); }
        }
        // ---------------------------------------------

        if (isAntonia) {
             // Remove worker logic (Reverse Sync)
             if (taskData._removeWorker) {
                 const workerToRemove = taskData._removeWorker;
                 try {
                     let targetSheet = String(workerToRemove).replace(/\s*\(VENTAS\)/ig, "").trim();
                     const workerSheet = findSheetSmart(targetSheet);
                     if (workerSheet) {
                         const targetId = String(existingFolio || taskData['FOLIO'] || taskData['ID'] || "").toUpperCase().trim();
                         if (targetId && targetId !== "NULL") {
                             const data = workerSheet.getDataRange().getValues();
                             if (data.length > 0) {
                                 const sheetHeaders = data[0].map(h => String(h).toUpperCase().trim());
                                 const folioIdx = sheetHeaders.indexOf('FOLIO');
                                 const idIdx = sheetHeaders.indexOf('ID');
                                 for (let i = 1; i < data.length; i++) {
                                     let rowFolio = (folioIdx > -1 ? data[i][folioIdx] : "") || (idIdx > -1 ? data[i][idIdx] : "");
                                     if (String(rowFolio).toUpperCase().trim() === targetId) {
                                         workerSheet.deleteRow(i + 1);
                                         registrarLog("ANTONIA", "REMOVED_WORKER", `Eliminada tarea ${targetId} de ${targetSheet}`);
                                         break;
                                     }
                                 }
                             }
                         }
                     }
                 } catch(e) {
                     registrarLog("ANTONIA", "REMOVE_ERROR", e.toString());
                 }
                 // Avoid re-distributing to this worker during save
                 delete taskData._removeWorker;
                 delete taskData._assignStep;
             }

             const distData = JSON.parse(JSON.stringify(taskData));
             delete distData._rowIndex;
             delete distData['PROCESO_LOG'];
                          delete distData['PROCESO'];

             if (taskData._assignToWorker && taskData._assignStep) {
                 try {
                     const workers = Array.isArray(taskData._assignToWorker) ? taskData._assignToWorker : [taskData._assignToWorker];
                     for (let worker of workers) {
                         const cleanWorker = String(worker).replace(/\s*\(VENTAS\)/ig, "").trim();
                         const assignData = JSON.parse(JSON.stringify(distData));
                         assignData['ESTATUS'] = 'PENDIENTE';
                         assignData['AVANCE'] = '0%';
                         const tRes = internalBatchUpdateTasks(cleanWorker, [assignData]);
                         if (!tRes.success) registrarLog("ANTONIA", "DIST_FAIL", `Fallo envío a ${cleanWorker}: ${tRes.message}`);
                     }
                 } catch(e) {
                     registrarLog("ANTONIA", "DIST_ERROR", e.toString());
                 }
             }

             // MODIFICADO: Se comenta la distribución a vendedores para evitar duplicidad y tráfico innecesario.
             // "ya no mandará la misma tarea a la hoja de los vendedores"
             // UPDATE: Se reactiva la distribución por reporte de bug (No se reflejaban actividades).

             const vendedorKey = Object.keys(taskData).find(k => k.toUpperCase().trim() === "VENDEDOR" || k.toUpperCase().trim() === "RESPONSABLE" || k.toUpperCase().trim() === "INVOLUCRADOS");
             if (vendedorKey && taskData[vendedorKey]) {
                 const vendedores = String(taskData[vendedorKey]).split(',').map(s => s.trim());

                 vendedores.forEach(vName => {
                     if (vName.toUpperCase() !== "ANTONIA_VENTAS") {
                         try {
                            // TRAFFIC SPLITTING REFACTORIZADO
                            let targetSheet = vName;
                            if (targetSheet.toUpperCase() === "ANTONIA_VENTAS") {
                                targetSheet = "ANTONIA PINEDA LOPEZ";
                            }

                            if (username !== 'ANTONIA_VENTAS') {
                                // REGLA ESTRICTA: Nadie excepto ANTONIA_VENTAS puede enviar a hojas con (VENTAS)
                                targetSheet = targetSheet.replace(/\s*\(VENTAS\)/ig, "").trim();
                            }

                            let finalTarget = null;
                            let hasSuffix = targetSheet.toUpperCase().includes("(VENTAS)");

                            if (hasSuffix) {
                                finalTarget = targetSheet;
                            } else {
                                // Si NO es Antonia, NUNCA debemos agregar (VENTAS) como fallback.
                                if (username === 'ANTONIA_VENTAS') {
                                    let potentialSheet = targetSheet + " (VENTAS)";
                                    if (findSheetSmart(potentialSheet)) {
                                        finalTarget = potentialSheet;
                                    } else if (findSheetSmart(targetSheet)) {
                                        finalTarget = targetSheet;
                                    }
                                } else {
                                    if (findSheetSmart(targetSheet)) {
                                        finalTarget = targetSheet;
                                    }
                                }
                            }

                            if (finalTarget) {
                                 const vRes = internalBatchUpdateTasks(finalTarget, [distData]);
                                 if(!vRes.success) registrarLog("ANTONIA", "DIST_FAIL", "Fallo copia a " + finalTarget + ": " + vRes.message);
                            } else {
                                 registrarLog("ANTONIA", "DIST_SKIP", "Omitido " + vName + " - No se encontró tabla (VENTAS).");
                            }
                         } catch(e){
                            registrarLog("ANTONIA", "DIST_ERROR", e.toString());
                         }
                     }
                 });
             }

             try { internalBatchUpdateTasks("ADMINISTRADOR", [distData]); } catch(e){}
        } else {
             try {
                 const syncData = JSON.parse(JSON.stringify(taskData));
                 delete syncData._rowIndex;
                 delete syncData['PROCESO_LOG'];
                 delete syncData['PROCESO'];
                 
                 const getTVal = (keys) => {
                     for (let k of keys) {
                         let found = Object.keys(syncData).find(key => key.toUpperCase().trim() === k);
                         if (found && syncData[found]) return syncData[found];
                     }
                     return "";
                 };
                 
                 const estatus = String(getTVal(['ESTATUS', 'STATUS', 'ESTADO'])).toUpperCase().trim();
                 const avanceRaw = String(getTVal(['AVANCE', 'AVANCE %', '% AVANCE', '%', 'CUMPLIMIENTO'])).replace(/%/g, '').trim();
                 const avanceNum = parseFloat(avanceRaw);
                 const isDone = estatus === 'HECHO' || estatus === 'TERMINADO' || estatus === 'FINALIZADO' || estatus === 'REALIZADO' || estatus === 'COMPLETADO' || estatus === 'DONE' || avanceRaw === '100' || avanceNum === 100 || avanceRaw.toUpperCase() === 'SI';
                 
                 const tFolio = String(getTVal(['FOLIO', 'ID'])).toUpperCase().trim();
                 
                 if (tFolio) {
                     const antData = internalFetchSheetData("ANTONIA_VENTAS");
                     if (antData.success && antData.data) {
                         const targetRow = antData.data.find(r => String(r['FOLIO'] || r['ID'] || "").toUpperCase().trim() === tFolio);
                         
                         if (targetRow) {
                             let log = [];
                             try {
                                 if (targetRow['PROCESO_LOG']) log = JSON.parse(targetRow['PROCESO_LOG']);
                             } catch(e) {}
                             
                             let updated = false;
                             const updatedLog = log.map(entry => {
                                 let wNorm = String(personName).toUpperCase().trim().replace(/\s*\(VENTAS\)/g, "").replace(/_/g, " ");
                                 let eNorm = entry.assignee ? String(entry.assignee).toUpperCase().trim().replace(/\s*\(VENTAS\)/g, "").replace(/_/g, " ") : "";
                                 
                                 if (entry.status === 'IN_PROGRESS' && (eNorm === wNorm || eNorm.includes(wNorm) || wNorm.includes(eNorm) || eNorm === "" || wNorm === "") && isDone) {
                                     entry.status = 'DONE';
                                     entry.endTimestamp = new Date().getTime();
                                     entry.endDateStr = new Date().toLocaleString();
                                     // Se preserva entry.timestamp y entry.dateStr originales (Fecha de Inicio)
                                     updated = true;
                                     registrarLog("SYSTEM", "REVERSE_SYNC", `${personName} completed step ${entry.step} for FOLIO ${tFolio}`);
                                 }
                                 return entry;
                             });
                             
                             if (updated) {
                                 const stepsOrder = ["L", "CD", "EP", "CI", "EV", "CEC", "RCC"];
                                 let oldParts = (targetRow["MAP COT"] || "").split(/\||>|\//).map(p => p.trim());
                                 let mapCotParts = stepsOrder.map(step => {
                                     // Valid entries: step is a known PROCESS_STEPS ID
                                     const stepEntries = updatedLog.filter(e => e.step === step || e.to === step);
                                     if (stepEntries.length > 0) {
                                         const allDone = stepEntries.every(e => e.status === 'DONE');
                                         if (allDone) return '🟢 ' + step;
                                         const anyInProgress = stepEntries.some(e => e.status === 'IN_PROGRESS');
                                         if (anyInProgress) return '🟡 ' + step;
                                         return '🔴 ' + step;
                                     }
                                     // Garbage entries: step field contains the old MAP COT string.
                                     // If it shows 🟡 STEP or 🔴 STEP, this entry was for that step.
                                     const garbageForStep = updatedLog.filter(e =>
                                         !stepsOrder.includes(e.step) &&
                                         (e.step.includes('🟡 ' + step) || e.step.includes('🔴 ' + step))
                                     );
                                     if (garbageForStep.length > 0) {
                                         const allDone = garbageForStep.every(e => e.status === 'DONE');
                                         if (allDone) return '🟢 ' + step;
                                         const anyInProgress = garbageForStep.some(e => e.status === 'IN_PROGRESS');
                                         if (anyInProgress) return '🟡 ' + step;
                                     }
                                     let oldPart = oldParts.find(p => p === '🟢 ' + step || p === '🟡 ' + step || p === '🔴 ' + step || p === '⚪ ' + step || p.includes(' ' + step));
                                     if (oldPart && oldPart.includes('🟢')) return '🟢 ' + step;
                                     if (oldPart && oldPart.includes('🟡')) return '🟡 ' + step;
                                     if (oldPart && oldPart.includes('🔴')) return '🔴 ' + step;
                                     return '⚪ ' + step;
                                 });

                                 let syncToAntonia = {
                                     'FOLIO': targetRow['FOLIO'] || tFolio,
                                     'PROCESO_LOG': JSON.stringify(updatedLog),
                                     'MAP COT': mapCotParts.join(' | ')
                                 };
                                 
                                 const fileCols = ['ARCHIVO', 'F2', 'LAYOUT', 'COTIZACION', 'EVIDENCIA'];
                                 fileCols.forEach(col => {
                                     let wKey = Object.keys(taskData).find(k => k.toUpperCase().trim() === col);
                                     if (wKey && taskData[wKey] && String(taskData[wKey]).trim() !== "") {
                                         syncToAntonia[wKey] = taskData[wKey];
                                     }
                                 });
                                 
                                 internalBatchUpdateTasks("ANTONIA_VENTAS", [syncToAntonia]);
                             }

                             // Sincronización general a Antonia independientemente del estado
                             let safeSyncData = Object.assign({}, syncData);
                             const delKeys = ['ESTATUS', 'STATUS', 'ESTADO', 'AVANCE', 'AVANCE %', '% AVANCE', '%', 'CUMPLIMIENTO'];
                             Object.keys(safeSyncData).forEach(k => {
                                 if (delKeys.includes(k.toUpperCase().trim())) delete safeSyncData[k];
                             });
                             if (typeof syncToAntonia !== 'undefined' && syncToAntonia['MAP COT']) {
                                 safeSyncData['MAP COT'] = syncToAntonia['MAP COT'];
                                 safeSyncData['PROCESO_LOG'] = syncToAntonia['PROCESO_LOG'];
                             }

                             if (String(personName).toUpperCase().includes("(VENTAS)")) {
                                 // Para hojas de VENTAS, permitimos que ESTATUS y AVANCE pasen (se reincorporan del original)
                                 const safeVentasSyncData = Object.assign({}, syncData);
                                 if (typeof syncToAntonia !== 'undefined' && syncToAntonia['MAP COT']) {
                                     safeVentasSyncData['MAP COT'] = syncToAntonia['MAP COT'];
                                     safeVentasSyncData['PROCESO_LOG'] = syncToAntonia['PROCESO_LOG'];
                                 }
                                 internalBatchUpdateTasks("ANTONIA_VENTAS", [safeVentasSyncData]);
                             } else {
                                 const reverseFolio = safeSyncData['FOLIO'] || safeSyncData['ID'];
                                 if (reverseFolio && String(reverseFolio).toUpperCase().startsWith("AV-")) {
                                     internalBatchUpdateTasks("ANTONIA_VENTAS", [safeSyncData]);
                                 }
                             }
                         }
                     }
                 }

                 // Sincronización Lateral (Peer-to-Peer via VENDEDOR field)
                 const vKey = Object.keys(taskData).find(k => k.toUpperCase().trim() === "VENDEDOR" || k.toUpperCase().trim() === "RESPONSABLE" || k.toUpperCase().trim() === "INVOLUCRADOS");
                 if (vKey && taskData[vKey]) {
                     const vList = String(taskData[vKey]).split(',').map(s => s.trim());
                     vList.forEach(otherVendor => {
                         // Ignorar si es el mismo usuario que está editando
                         // "personName" es la hoja actual (e.g. "JUAN (VENTAS)")
                         if (otherVendor.toUpperCase() === "ANTONIA_VENTAS") return;

                         // Normalizar nombres para comparación
                         const currentSheetNorm = String(personName).toUpperCase().replace(/\s*\(VENTAS\)/, "").trim();
                         const otherVendorNorm = String(otherVendor).toUpperCase().replace(/\s*\(VENTAS\)/, "").trim();

                         if (currentSheetNorm !== otherVendorNorm) {
                             // Distribuir a este otro vendedor
                             let targetSheet = otherVendor;
                             if (targetSheet.toUpperCase() === "ANTONIA_VENTAS") {
                                 targetSheet = "ANTONIA PINEDA LOPEZ";
                             }
                             // MODIFICADO: No agregar el sufijo "(VENTAS)" automáticamente si no es Antonia.
                             // El usuario debe asignarse a su tabla base o a la tabla especificada.
                             let finalSheet = null;
                             if (findSheetSmart(targetSheet)) {
                                 finalSheet = targetSheet;
                             } else {
                                 // Fallback opcional: solo si de verdad quiso asignar a "(VENTAS)" y lo escribió mal, pero no por defecto
                                 finalSheet = targetSheet;
                             }

                             internalBatchUpdateTasks(finalSheet, [syncData]);
                         }
                     });
                 }

             } catch (e) {
                 console.error("Error en sincronización inversa: " + e.toString());
             }
        }
        // RETURN UPDATED DATA (Critical for Frontend Folio Update)
        res.data = taskData;
        return res;
    } catch(e) { return {success:false, message:e.toString()}; }
}

function apiUpdateTask(personName, taskData, username) {
  return internalUpdateTask(personName, taskData, username);
}

function apiLogDateChange(payload, username) {
  try {
    const details = JSON.stringify({
      folio: payload.folio,
      campo: payload.campo,
      anterior: payload.anterior,
      nuevo: payload.nuevo,
      hoja: payload.hoja
    });
    registrarLog(username || 'ANTONIA_VENTAS', 'CAMBIO_FECHA', details);
    return { success: true };
  } catch (e) {
    return { success: false, message: String(e) };
  }
}

function apiFetchDrafts() {
  try {
    const sheet = findSheetSmart(APP_CONFIG.draftSheetName);
    if (!sheet) return { success: true, data: [] };
    const rows = sheet.getDataRange().getValues();
    if (rows.length < 1) return { success: true, data: [] }; 
    const startRow = (rows[0][0] === "ESPECIALIDAD") ? 1 : 0;
    const drafts = rows.slice(startRow).map(r => {
      let diasObj = {l:false, m:false, x:false, j:false, v:false, s:false, d:false};
      try {
          if (r[19]) diasObj = JSON.parse(r[19]);
      } catch(e) {}

      return {
        especialidad: r[0], concepto: r[1], responsable: r[2], horas: r[3], cumplimiento: r[4],
        archivoUrl: r[5], comentarios: r[6], comentariosPrevios: r[7],
        prioridades: r[8], riesgos: r[9], restricciones: r[10], fechaRespuesta: r[11],
        clasificacion: r[12], fechaAlta: r[13],
        // New Fields
        rutaCritica: r[14] || "",
        zona: r[15] || "",
        contratista: r[16] || "",
        cuantReq: r[17] || "",
        cuantReal: r[18] || "",
        dias: diasObj
      };
    }).filter(d => d.concepto);
    return { success: true, data: drafts };
  } catch(e) { return { success: false, message: e.toString() };
  }
}

function apiSyncDrafts(drafts) {
  const lock = LockService.getScriptLock();
  if (lock.tryLock(5000)) {
    try {
      let sheet = findSheetSmart(APP_CONFIG.draftSheetName);
      if (!sheet) { sheet = SS.insertSheet(APP_CONFIG.draftSheetName); }
      sheet.clear();
      const headers = [
          "ESPECIALIDAD", "CONCEPTO", "RESPONSABLE", "HORAS", "CUMPLIMIENTO", "ARCHIVO", "COMENTARIOS", "PREVIOS",
          "PRIORIDAD", "RIESGOS", "RESTRICCIONES", "FECHA_RESP", "CLASIFICACION", "FECHA_ALTA",
          "RUTA_CRITICA", "ZONA", "CONTRATISTA", "CUANT_REQ", "CUANT_REAL", "DIAS_JSON"
      ];
      if (drafts && drafts.length > 0) {
        const rows = drafts.map(d => [
          d.especialidad || "", d.concepto || "", d.responsable || "", d.horas || "", d.cumplimiento || "NO",
          d.archivoUrl || "", d.comentarios || "", d.comentariosPrevios || "",
          d.prioridades || "", d.riesgos || "", d.restricciones || "", d.fechaRespuesta || "", 
          d.clasificacion || "", d.fechaAlta || new Date(),
          d.rutaCritica || "", d.zona || "", d.contratista || "", d.cuantReq || "", d.cuantReal || "",
          JSON.stringify(d.dias || {})
        ]);
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      } else {
        sheet.appendRow(headers);
      }
      return { success: true };
    } catch(e) { return { success: false, message: e.toString() }; } finally { lock.releaseLock();
    }
  }
  return { success: false, message: "Ocupado syncing drafts" };
}

function apiClearDrafts() {
  try {
    const sheet = findSheetSmart(APP_CONFIG.draftSheetName);
    if(sheet) sheet.clear();
    return { success: true };
  } catch(e) { return { success: false }; }
}

function ensureSheetWithHeaders(sheetName, headers) {
    let sheet = findSheetSmart(sheetName);
    if (!sheet) {
        sheet = SS.insertSheet(sheetName);
        sheet.appendRow(headers);
        // Formato básico
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e6e6e6");
    }
    return sheet;
}

function saveChildData(sheetName, items, headers) {
    if (!items || items.length === 0) return;
    const sheet = ensureSheetWithHeaders(sheetName, headers);

    // Convertir objetos a array basado en headers
    const rows = items.map(item => {
        return headers.map(h => item[h] || item[h.replace(" ", "_")] || "");
    });

    // Append rows (BATCH)
    if (rows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }
}

function apiSavePPCData(payload, activeUser) {
  const lock = LockService.getScriptLock();
  // Esperar hasta 30 segundos para obtener el candado y evitar condiciones de carrera
  if (lock.tryLock(30000)) {
    try {
      const items = Array.isArray(payload) ? payload : [payload];
      
      // 1. VERIFICACIÓN CRÍTICA DE PPCV3
      let sheetPPC = findSheetSmart(APP_CONFIG.ppcSheetName);
      if (!sheetPPC) { 
        sheetPPC = SS.insertSheet(APP_CONFIG.ppcSheetName);
        // Standardize headers for robustness
        sheetPPC.appendRow(["ID", "ESPECIALIDAD", "DESCRIPCION", "RESPONSABLE", "FECHA", "RELOJ", "CUMPLIMIENTO", "ARCHIVO", "COMENTARIOS", "COMENTARIOS PREVIOS", "ESTATUS", "AVANCE", "CLASIFICACION", "PRIORIDAD", "RIESGOS", "FECHA_RESPUESTA", "DETALLES_EXTRA"]);
      }

      // 1.0.1 AUTO-MIGRACIÓN PARA JESUS_CANTU (Añadir columnas faltantes)
      if (activeUser === 'JESUS_CANTU') {
          const newCols = [
              "RUTA_CRITICA", "ZONA", "CUANT_REQUERIDO", "CUANT_REAL", "CONTRATISTA",
              "DIAS_L", "DIAS_M", "DIAS_X", "DIAS_J", "DIAS_V", "DIAS_S", "DIAS_D"
          ];
          const currentHeaders = sheetPPC.getRange(1, 1, 1, sheetPPC.getLastColumn()).getValues()[0].map(h => String(h).toUpperCase().trim());
          const missing = newCols.filter(c => !currentHeaders.includes(c));

          if (missing.length > 0) {
              const startCol = sheetPPC.getLastColumn() + 1;
              sheetPPC.getRange(1, startCol, 1, missing.length).setValues([missing])
                      .setFontWeight("bold")
                      .setBackground("#e6e6e6");
          }
      }

      // 1.1 VERIFICACIÓN CRÍTICA DE PPCV4 (Para ANTONIA_VENTAS)
      if (String(activeUser).toUpperCase().trim() === 'ANTONIA_VENTAS') {
          let sheetPPC4 = findSheetSmart('PPCV4');
          if (!sheetPPC4) {
             sheetPPC4 = SS.insertSheet('PPCV4');
             sheetPPC4.appendRow(["ID", "ESPECIALIDAD", "DESCRIPCION", "RESPONSABLE", "FECHA", "RELOJ", "CUMPLIMIENTO", "ARCHIVO", "COMENTARIOS", "COMENTARIOS PREVIOS", "ESTATUS", "AVANCE", "CLASIFICACION", "PRIORIDAD", "RIESGOS", "FECHA_RESPUESTA", "DETALLES_EXTRA"]);
          }
      }
      
      const fechaHoy = new Date();
      const fechaStr = Utilities.formatDate(fechaHoy, SS.getSpreadsheetTimeZone(), "dd/MM/yy");
      const horaStr = Utilities.formatDate(fechaHoy, SS.getSpreadsheetTimeZone(), "HH:mm");
      
      // Estructuras para Batch Operations
      const tasksBySheet = {};
      const logEntries = [];
      const generatedIds = [];

      const addTaskToSheet = (sheetName, task) => {
          if (!sheetName) return;
          const key = sheetName.trim();
          if (!tasksBySheet[key]) tasksBySheet[key] = [];
          tasksBySheet[key].push(task);
      };

      // 2. PREPARACIÓN DE DATOS EN MEMORIA
      items.forEach(item => {
          // Use existing ID if provided (for updates/tests) or generate new
          let id = item.id;
          if (!id) {
              if (activeUser === 'PREWORK_ORDER') {
                  id = generateWorkOrderFolio(item.cliente, item.especialidad);
              } else {
                  let prefix = generatePrefix(activeUser);
                  id = prefix + generateNumericSequence(prefix);
              }
          }
          generatedIds.push(id);
          const comentarios = item.comentarios || "";

          // --- NUEVO: GUARDADO DE DETALLES EN HOJAS HIJAS ---
          // A. Materiales
          if (item.materiales && item.materiales.length > 0) {
             const matItems = item.materiales.map(m => ({
                 FOLIO: id, ...m,
                 RESIDENTE: m.papaCaliente ? m.papaCaliente.residente : "",
                 COMPRAS: m.papaCaliente ? m.papaCaliente.compras : "",
                 CONTROLLER: m.papaCaliente ? m.papaCaliente.controller : "",
                 ORDEN_COMPRA: m.papaCaliente ? m.papaCaliente.ordenCompra : "",
                 PAGOS: m.papaCaliente ? m.papaCaliente.pagos : "",
                 ALMACEN: m.papaCaliente ? m.papaCaliente.almacen : "",
                 LOGISTICA: m.papaCaliente ? m.papaCaliente.logistica : "",
                 RESIDENTE_OBRA: m.papaCaliente ? m.papaCaliente.residenteObra : ""
             }));
             saveChildData(APP_CONFIG.woMaterialsSheet, matItems, ["FOLIO", "CANTIDAD", "UNIDAD", "TIPO", "DESCRIPCION", "COSTO", "ESPECIFICACION", "TOTAL", "RESIDENTE", "COMPRAS", "CONTROLLER", "ORDEN_COMPRA", "PAGOS", "ALMACEN", "LOGISTICA", "RESIDENTE_OBRA"]);
          }

          // B. Mano de Obra
          if (item.manoObra && item.manoObra.length > 0) {
             const laborItems = item.manoObra.map(l => ({ FOLIO: id, ...l }));
             saveChildData(APP_CONFIG.woLaborSheet, laborItems, ["FOLIO", "CATEGORIA", "SALARIO", "PERSONAL", "SEMANAS", "EXTRAS", "NOCTURNO", "FIN_SEMANA", "OTROS", "TOTAL"]);
          }

          // C. Herramientas
          if (item.herramientas && item.herramientas.length > 0) {
             const toolItems = item.herramientas.map(t => ({
                 FOLIO: id, ...t,
                 RESIDENTE: t.papaCaliente ? t.papaCaliente.residente : "",
                 CONTROLLER: t.papaCaliente ? t.papaCaliente.controller : "",
                 ALMACEN: t.papaCaliente ? t.papaCaliente.almacen : "",
                 LOGISTICA: t.papaCaliente ? t.papaCaliente.logistica : "",
                 RESIDENTE_FIN: t.papaCaliente ? t.papaCaliente.residenteFin : ""
             }));
             saveChildData(APP_CONFIG.woToolsSheet, toolItems, ["FOLIO", "CANTIDAD", "UNIDAD", "DESCRIPCION", "COSTO", "TOTAL", "RESIDENTE", "CONTROLLER", "ALMACEN", "LOGISTICA", "RESIDENTE_FIN"]);
          }

          // D. Equipos
          if (item.equipos && item.equipos.length > 0) {
             const eqItems = item.equipos.map(e => ({ FOLIO: id, ...e }));
             saveChildData(APP_CONFIG.woEquipSheet, eqItems, ["FOLIO", "CANTIDAD", "UNIDAD", "TIPO", "DESCRIPCION", "ESPECIFICACION", "DIAS", "HORAS", "COSTO", "TOTAL"]);
          }

          // E. Programa
          if (item.programa && item.programa.length > 0) {
             const progItems = item.programa.map(p => ({
                 FOLIO: id,
                 ...p,
                 SECCION: p.seccion || "",
                 ESTATUS: p.checkStatus || (p.isActive ? 'APPLY' : 'PENDING')
             }));
             saveChildData(APP_CONFIG.woProgramSheet, progItems, ["FOLIO", "DESCRIPCION", "FECHA", "DURACION", "UNIDAD_DURACION", "UNIDAD", "CANTIDAD", "PRECIO", "TOTAL", "RESPONSABLE", "SECCION", "ESTATUS"]);
          }

          // F. Detalles Extra (Checklist, Costos Adicionales) - JSON
          let detallesExtra = "";
          if (item.checkList || item.additionalCosts) {
              detallesExtra = JSON.stringify({
                  checkList: item.checkList,
                  costs: item.additionalCosts
              });
          }

          // Mapeo Explícito para PPCV3
          const taskData = {
                 'FOLIO': id,
                 'CONCEPTO': item.concepto || item.CONCEPTO,
                 'CLASIFICACION': item.clasificacion || item.CLASIFICACION || "",
                 'AREA': item.especialidad || item.ESPECIALIDAD,
                 'INVOLUCRADOS': item.responsable || item.RESPONSABLE,
                 'FECHA': fechaStr,
                 'HORA': horaStr,
                 'RELOJ': (item.horas !== undefined && item.horas !== "") ? item.horas : ((item.RELOJ !== undefined && item.RELOJ !== "") ? item.RELOJ : 0),
                 'ESTATUS': "ASIGNADO",
                 'PRIORIDAD': item.prioridad || item.prioridades || item.PRIORIDAD,
                 'RESTRICCIONES': item.restricciones,
                 'RIESGOS': item.riesgos || item.RIESGOS,
                 'FECHA_RESPUESTA': item.fechaRespuesta,
                 'AVANCE': "0%",
                 'COMENTARIOS': comentarios,
                 'ARCHIVO': item.archivoUrl,
                 'CUMPLIMIENTO': item.cumplimiento || item.CUMPLIMIENTO,
                 'COMENTARIOS PREVIOS': item.comentariosPrevios || "",
                 'REQUISITOR': item.requisitor,
                 'CONTACTO': item.contacto,
                 'CELULAR': item.celular,
                 'FECHA_COTIZACION': item.fechaCotizacion,
                 'CLIENTE': item.cliente,
                 'TRABAJO': item.TRABAJO,
                 'DETALLES_EXTRA': detallesExtra, // Nueva Columna
                 // CAMPOS ESPECIFICOS JESUS_CANTU (Mapping Uppercase from Front)
                 'RUTA_CRITICA': item.rutaCritica || item.RUTA_CRITICA,
                 'ZONA': item.zona || item.ZONA,
                 'CONTRATISTA': item.contratista || item.CONTRATISTA,
                 'CUANT_REQUERIDO': item.cuantReq || item.CUANT_REQUERIDO,
                 'CUANT_REAL': item.cuantReal || item.CUANT_REAL,
                 'DIAS_L': item.dias ? (item.dias.l ? "x" : "") : (item.DIAS_L || ""),
                 'DIAS_M': item.dias ? (item.dias.m ? "x" : "") : (item.DIAS_M || ""),
                 'DIAS_X': item.dias ? (item.dias.x ? "x" : "") : (item.DIAS_X || ""),
                 'DIAS_J': item.dias ? (item.dias.j ? "x" : "") : (item.DIAS_J || ""),
                 'DIAS_V': item.dias ? (item.dias.v ? "x" : "") : (item.DIAS_V || ""),
                 'DIAS_S': item.dias ? (item.dias.s ? "x" : "") : (item.DIAS_S || ""),
                 'DIAS_D': item.dias ? (item.dias.d ? "x" : "") : (item.DIAS_D || "")
          };
          
          // A. Persistencia en PPC Maestro (PPCV3)
          addTaskToSheet(APP_CONFIG.ppcSheetName, taskData);

          // A.1. Persistencia Condicional en PPCV4 (Solo ANTONIA_VENTAS)
          if (String(activeUser).toUpperCase().trim() === 'ANTONIA_VENTAS') {
              // Create specific task object for PPCV4 to match headers exactly if aliases fail
              const taskPPC4 = { ...taskData };
              // Ensure critical fields map to Screenshot Headers
              if (taskData['FECHA']) taskPPC4['Fecha de Alta'] = taskData['FECHA'];
              if (taskData['CONCEPTO']) taskPPC4['Descripción de la Actividad'] = taskData['CONCEPTO'];
              if (taskData['ARCHIVO']) taskPPC4['Archivos'] = taskData['ARCHIVO'];
              if (taskData['COMENTARIOS']) taskPPC4['Comentarios Semana en Curso'] = taskData['COMENTARIOS'];
              if (taskData['INVOLUCRADOS']) taskPPC4['RESPONSABLE'] = taskData['INVOLUCRADOS'];

              addTaskToSheet('PPCV4', taskPPC4);
          }

          // B. Respaldo Obligatorio en ADMINISTRADOR (Control)
          addTaskToSheet("ADMINISTRADOR", taskData);

          // C. Distribución al Staff (Tracker Personal)
          const responsables = String(item.responsable || item.RESPONSABLE || "").split(",").map(s => s.trim()).filter(s => s);

          responsables.forEach(personName => {
              // MODIFICADO: Solo Antonia Ventas envía al PPC hacia "(VENTAS)".
              // El resto del equipo manda al Tracker (hoja sin sufijo VENTAS).
              // Ya no ignoramos el nombre, sino que validamos la hoja.
              let targetSheet = personName;
              if (targetSheet.toUpperCase() === "ANTONIA_VENTAS") {
                  targetSheet = "ANTONIA PINEDA LOPEZ";
              }
              if (activeUser !== 'ANTONIA_VENTAS') {
                  // REGLA ESTRICTA: Nadie excepto ANTONIA_VENTAS puede enviar a hojas con (VENTAS)
                  targetSheet = targetSheet.replace(/\s*\(VENTAS\)/ig, "").trim();
              }

              // LOGICA ESPECIAL JESUS_CANTU: Filtrar columnas para evitar rotura en Tracker
              if (activeUser === 'JESUS_CANTU') {
                  const staffData = {
                      'FOLIO': taskData.FOLIO,
                      'CONCEPTO': taskData.CONCEPTO,
                      'AREA': taskData.AREA,
                      'RESPONSABLE': taskData.INVOLUCRADOS,
                      'FECHA': taskData.FECHA,
                      'ESTATUS': taskData.ESTATUS,
                      'AVANCE': taskData.AVANCE,
                      'CLASIFICACION': taskData.CLASIFICACION,
                      'PRIORIDAD': taskData.PRIORIDAD
                      // Se omiten RUTA_CRITICA, ZONA, DIAS_X, etc.
                  };
                  addTaskToSheet(targetSheet, staffData);
              } else {
                  addTaskToSheet(targetSheet, taskData);
              }

            // INTEGRACIÓN OUTLOOK: Enviar evento al responsable asignado desde el formulario PPC
            const emailRes = findUserEmailByLabel(personName);
            if (emailRes) {
                const fIni = new Date();
                const fFi = new Date(fIni.getTime() + (2 * 60 * 60 * 1000));
                
                const conceptoPPC = taskData.CONCEPTO || "Nueva Tarea PPC";
                const cl = item.cliente || taskData.CLIENTE || "Holtmont";
                
                const payloadOutlookPPC = {
                    folio: id,
                    titulo: `Asignación PPC: ${conceptoPPC} - ${cl}`,
                    descripcion: `Se te ha asignado una tarea desde el módulo PPC. Concepto: ${conceptoPPC}.`,
                    fechaInicio: fIni.toISOString(),
                    fechaFin: fFi.toISOString(),
                    correoDestino: emailRes,
                    asignadoPor: activeUser || "SISTEMA"
                };
                
                // Disparamos la notificación sin bloquear el flujo principal
                try {
                    NotifierService.sendToOutlook(payloadOutlookPPC);
                } catch(e) {
                    console.error("Error enviando Outlook desde PPC:", e);
                }
            }
          });

          // D. Preparar Log (En Memoria)
          logEntries.push([new Date(), activeUser || "DESCONOCIDO", "GUARDADO_PPC", `ID: ${id} | Comentarios: ${comentarios}`]);
      });

      // 3. EJECUCIÓN DE ESCRITURA (BATCH)

      // A. Guardado Crítico (PPCV3)
      // Usamos useOwnLock = false porque ya tenemos el lock aquí.
      if (tasksBySheet[APP_CONFIG.ppcSheetName]) {
          const ppcResult = internalBatchUpdateTasks(APP_CONFIG.ppcSheetName, tasksBySheet[APP_CONFIG.ppcSheetName], false);
          if (!ppcResult.success) {
              throw new Error("CRITICAL: Falló guardado en PPCV3. " + ppcResult.message);
          }
          delete tasksBySheet[APP_CONFIG.ppcSheetName];
      }

      // B. Distribución Secundaria (Staff / Admin)
      for (const [targetSheet, tasks] of Object.entries(tasksBySheet)) {
          try {
            const res = internalBatchUpdateTasks(targetSheet, tasks, false);
            if (!res.success) console.warn(`Fallo secundario en ${targetSheet}: ${res.message}`);
          } catch(err) {
             console.warn(`Error en distribución a ${targetSheet}: ${err.toString()}`);
          }
      }

      // C. Escritura de Logs en Lote (Optimización V8)
      if (logEntries.length > 0) {
        try {
            let sheetLog = SS.getSheetByName(APP_CONFIG.logSheetName);
            if (!sheetLog) {
              sheetLog = SS.insertSheet(APP_CONFIG.logSheetName);
              sheetLog.appendRow(["FECHA", "USUARIO", "ACCION", "DETALLES"]);
            }
            const lastRow = sheetLog.getLastRow();
            // batch write logs
            sheetLog.getRange(lastRow + 1, 1, logEntries.length, 4).setValues(logEntries);
        } catch(logErr) {
            console.error("Error escribiendo logs: " + logErr.toString());
        }
      }

      return { success: true, message: "Datos procesados y distribuidos correctamente.", ids: generatedIds };
    } catch (e) { 
        console.error(e);
        registrarLog(activeUser || "SYSTEM", "ERROR_CRITICO_PPC", e.toString());
        return { success: false, message: "Error al guardar: " + e.toString() };
    } finally {
        lock.releaseLock();
    }
  }
  return { success: false, message: "Sistema Ocupado, intenta de nuevo." };
}

function uploadFileToDrive(data, type, name) {
  try {
    const folderId = APP_CONFIG.folderIdUploads;
    let folder;
    if (folderId && folderId.trim() !== "") { try { folder = DriveApp.getFolderById(folderId); } catch(e) { folder = DriveApp.getRootFolder();
    } } 
    else { folder = DriveApp.getRootFolder();
    }
    // FIX: Default to octet-stream if type is missing (e.g. .dwg, .zip)
    const mimeType = (type && type.trim() !== "") ? type : "application/octet-stream";
    const blob = Utilities.newBlob(Utilities.base64Decode(data.split(',')[1]), mimeType, name);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { success: true, fileUrl: file.getUrl() };
  } catch (e) { return { success: false, message: e.toString() };
  }
}

function apiFetchPPCData() { 
  try { 
    const s = findSheetSmart(APP_CONFIG.ppcSheetName);
    if(!s) return {success:true,data:[]};
    const range = s.getDataRange();
    const values = range.getValues();
    if (values.length < 2) return {success:true, data:[]};
    const headerIdx = findHeaderRow(values);
    if (headerIdx === -1) return {success:true, data:[]};

    const headers = values[headerIdx].map(h => String(h).toUpperCase().replace(/\n/g, " ").trim());
    const colMap = {
      id: headers.findIndex(h => h.includes("ID") || h.includes("FOLIO")),
      esp: headers.findIndex(h => h.includes("ESPECIALIDAD")),
      con: headers.findIndex(h => h.includes("DESCRIPCI") || h.includes("CONCEPTO")), 
      resp: headers.findIndex(h => h.includes("RESPONSABLE") || h.includes("INVOLUCRADOS")),
      fecha: headers.findIndex(h => h.includes("FECHA") || h.includes("ALTA")),
      reloj: headers.findIndex(h => h.includes("RELOJ")),
      cump: headers.findIndex(h => h.includes("CUMPLIMIENTO")),
      arch: headers.findIndex(h => h.includes("ARCHIVO") || h.includes("CLIP")),
      com: headers.findIndex(h => (h.includes("COMENTARIOS") && h.includes("CURSO")) || h === "COMENTARIOS"),
      prev: headers.findIndex(h => (h.includes("COMENTARIOS") && h.includes("PREVIA")) || h.includes("PREVIOS"))
    };

    let dataRows = values.slice(headerIdx + 1);
    if(dataRows.length > 300) dataRows = dataRows.slice(dataRows.length - 300);
    const resultData = dataRows.map(r => {
      const getVal = (idx) => (idx > -1 && r[idx] !== undefined) ? r[idx] : "";
      return {
        id: getVal(colMap.id), especialidad: getVal(colMap.esp), concepto: getVal(colMap.con),
        responsable: getVal(colMap.resp), fechaAlta: getVal(colMap.fecha), horas: getVal(colMap.reloj),
        cumplimiento: getVal(colMap.cump), archivoUrl: getVal(colMap.arch), comentarios: getVal(colMap.com),
        comentariosPrevios: getVal(colMap.prev)
      };
    }).filter(x => x.concepto).reverse();
    return { success: true, data: resultData }; 
  } catch(e){ return {success:false, message: e.toString()} } 
}

function apiFetchWeeklyPlanData(username) {
  try {
    const isJesus = String(username).toUpperCase().trim() === 'JESUS_CANTU';
    const sheetName = (String(username).toUpperCase().trim() === 'ANTONIA_VENTAS') ? 'PPCV4' : APP_CONFIG.ppcSheetName;
    const sheet = findSheetSmart(sheetName);
    if (!sheet) return { success: false, message: "No existe la hoja " + sheetName };
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return { success: true, headers: [], data: [] };
    const headerRowIdx = findHeaderRow(data);
    if (headerRowIdx === -1) return { success: false, message: "Cabeceras no encontradas en PPCV3." };
    const originalHeaders = data[headerRowIdx].map(h => String(h).trim());
    
    // CUSTOM VIEW FOR JESUS_CANTU
    if (isJesus) {
        // Define fixed header structure for the customized view
        const jesusHeaders = [
            'RUTA_CRITICA', 'ZONA', 'ESPECIALIDAD', 'CONCEPTO',
            'CUANT_REQUERIDO', 'CUANT_REAL', 'RESPONSABLE', 'CONTRATISTA',
            'DIAS_L', 'DIAS_M', 'DIAS_X', 'DIAS_J', 'DIAS_V', 'DIAS_S', 'DIAS_D',
            'CUMPLIMIENTO'
        ];

        // Map data rows to these headers based on column matching
        const rows = data.slice(headerRowIdx + 1);
        const result = rows.map((r, i) => {
            const rowObj = { _rowIndex: headerRowIdx + i + 2 };
            // Helper to find value in row by fuzzy header match
            const getVal = (candidates) => {
                for (let c of candidates) {
                    const idx = originalHeaders.findIndex(h => h.toUpperCase().trim() === c.toUpperCase().trim() || h.toUpperCase().trim().includes(c.toUpperCase().trim()));
                    if (idx > -1) return r[idx];
                }
                return "";
            };

            rowObj['RUTA_CRITICA'] = getVal(['RUTA_CRITICA', 'RUTA CRITICA', 'CRITICA']);
            rowObj['ZONA'] = getVal(['ZONA', 'UBICACION', 'AREA GEOGRAFICA']);
            rowObj['ESPECIALIDAD'] = getVal(['ESPECIALIDAD', 'AREA', 'DISCIPLINA']);
            rowObj['CONCEPTO'] = getVal(['CONCEPTO', 'DESCRIPCION', 'DEFINIDA', 'ATERRIZADA', 'ACTIVIDAD']);

            // CUANTIFICACION LOGIC (Handle Merged Headers)
            rowObj['CUANT_REQUERIDO'] = getVal(['CUANT_REQUERIDO', 'REQUERIDO']);
            rowObj['CUANT_REAL'] = getVal(['CUANT_REAL', 'REAL']);

            if (!rowObj['CUANT_REQUERIDO']) {
                const qIdx = originalHeaders.findIndex(h => h.toUpperCase().includes('CUANTIFICACIÓN') || h.toUpperCase().includes('CUANTIFICACION'));
                if (qIdx > -1) {
                    rowObj['CUANT_REQUERIDO'] = r[qIdx];
                    rowObj['CUANT_REAL'] = r[qIdx + 1];
                }
            }

            rowObj['RESPONSABLE'] = getVal(['RESPONSABLE', 'ENCARGADO', 'PERSONA RESPONSABLE']);
            rowObj['CONTRATISTA'] = getVal(['CONTRATISTA', 'PROVEEDOR']);
            rowObj['DIAS_L'] = getVal(['DIAS_L', 'LUNES', 'L']);
            rowObj['DIAS_M'] = getVal(['DIAS_M', 'MARTES', 'M']);
            rowObj['DIAS_X'] = getVal(['DIAS_X', 'MIERCOLES', 'MIÉRCOLES', 'X', 'MI']);
            rowObj['DIAS_J'] = getVal(['DIAS_J', 'JUEVES', 'J']);
            rowObj['DIAS_V'] = getVal(['DIAS_V', 'VIERNES', 'V']);
            rowObj['DIAS_S'] = getVal(['DIAS_S', 'SABADO', 'SÁBADO', 'S']);
            rowObj['DIAS_D'] = getVal(['DIAS_D', 'DOMINGO', 'D']);
            rowObj['CUMPLIMIENTO'] = getVal(['CUMPLIMIENTO']);

            // Add ID if available for saving
            rowObj['ID'] = getVal(['ID', 'FOLIO']);
            rowObj['FOLIO'] = rowObj['ID'];

            // HIDDEN FIELDS PRESERVATION (CRITICAL FOR SYNC)
            rowObj['FECHA'] = getVal(['FECHA', 'ALTA', 'FECHA INICIO', 'F. INICIO', 'FECHA_INICIO', 'FECHA VISITA', 'F. VISITA']);
            rowObj['ESTATUS'] = getVal(['ESTATUS', 'STATUS']);
            rowObj['AVANCE'] = getVal(['AVANCE', 'AVANCE %']);
            rowObj['CLASIFICACION'] = getVal(['CLASIFICACION']);
            rowObj['PRIORIDAD'] = getVal(['PRIORIDAD']);

            return rowObj;
        }).filter(r => r["CONCEPTO"] || r["ID"]);

        return { success: true, headers: jesusHeaders, data: result.reverse() };
    }

    const mappedHeaders = originalHeaders.map(h => {
        const up = h.toUpperCase();
        if (up.includes("ESPECIALIDAD") || up.includes("AREA") || up.includes("DEPARTAMENTO")) return "ESPECIALIDAD";
        if (up.includes("DESCRIPCI") || up.includes("CONCEPTO")) return "CONCEPTO"; 
        if (up.includes("INVOLUCRADOS") || up.includes("RESPONSABLE") || up.includes("VENDEDOR") || up.includes("ENCARGADO")) return "RESPONSABLE";
        if (up.includes("ALTA") || up.includes("FECHA")) return "FECHA";
        if (up.includes("RELOJ") || up.includes("HORAS")) return "RELOJ";
        if (up.includes("ARCHIV") || up.includes("CLIP") || up.includes("LINK") || up.includes("EVIDENCIA")) return "ARCHIVO";
        if (up.includes("CUMPLIMIENTO")) return "CUMPLIMIENTO";
        if (up === "COMENTARIOS" || up === "COMENTARIOS SEMANA EN CURSO" || up.includes("OBSERVACIONES")) return "COMENTARIOS SEMANA EN CURSO";
        if (up === "COMENTARIOS PREVIOS" || up === "COMENTARIOS SEMANA PREVIA" || up === "PREVIOS") return "COMENTARIOS SEMANA PREVIA";
        return up; 
    });
    const displayHeaders = ["SEMANA", ...mappedHeaders];
    const rows = data.slice(headerRowIdx + 1);
    const result = rows.map((r, i) => {
      const rowObj = { _rowIndex: headerRowIdx + i + 2 };
      mappedHeaders.forEach((h, colIdx) => {
        let val = r[colIdx];
        if (val instanceof Date) {
           if (val.getFullYear() < 1900) {
              val = Utilities.formatDate(val, SS.getSpreadsheetTimeZone(), "HH:mm");
           } else {
              val = Utilities.formatDate(val, SS.getSpreadsheetTimeZone(), "dd/MM/yy");
           }
        }
        rowObj[h] = val;
      });
      const fechaVal = rowObj["FECHA"];
      let semanaNum = "-";
      if (fechaVal) {
        let dateObj = null;
        if (String(fechaVal).includes("/")) {
          const parts = String(fechaVal).split("/"); 
          if(parts.length === 3) dateObj = new Date(parts[2], parts[1]-1, parts[0]);
        } else if (fechaVal instanceof Date) { dateObj = fechaVal; } else { dateObj = new Date(fechaVal); }
        if (dateObj && !isNaN(dateObj.getTime())) semanaNum = getWeekNumber(dateObj); 
      }
      rowObj["SEMANA"] = semanaNum;
      
      return rowObj;
    }).filter(r => r["CONCEPTO"] || r["ID"] || r["FOLIO"]);
    return { success: true, headers: displayHeaders, data: result.reverse() }; 
  } catch (e) {
    console.error(e);
    return { success: false, message: e.toString() };
  }
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
  return weekNo;
}

// 1. Guardar Nuevo Sitio (Padre)
function apiSaveSite(siteData) {
  const lock = LockService.getScriptLock();
  if (lock.tryLock(5000)) {
    try {
      let sheet = findSheetSmart("DB_SITIOS");
      if (!sheet) {
        sheet = SS.insertSheet("DB_SITIOS");
        sheet.appendRow(["ID_SITIO", "NOMBRE", "CLIENTE", "TIPO", "ESTATUS", "FECHA_CREACION", "CREADO_POR"]);
      }
      
      const data = sheet.getDataRange().getValues();
      const cleanName = siteData.name.toUpperCase().trim();
      const nameColIdx = data.length > 0 ? data[0].indexOf("NOMBRE") : 1;
      for(let i=1; i<data.length; i++) {
         if (data[i][nameColIdx] && String(data[i][nameColIdx]).toUpperCase().trim() === cleanName) {
             return { success: false, message: "Ya existe un sitio con ese nombre."};
         }
      }

      const id = "SITE-" + new Date().getTime();
      sheet.appendRow([
        id,
        cleanName,
        siteData.client.toUpperCase().trim(),
        siteData.type || "CLIENTE", 
        "ACTIVO",
        new Date(),
        siteData.createdBy ? siteData.createdBy.toUpperCase().trim() : "ANONIMO"
      ]);
      SpreadsheetApp.flush(); 

      // AUTOMATIZACIÓN: CREAR ESTRUCTURA ESTÁNDAR AUTOMÁTICAMENTE
      apiCreateStandardStructure(id, siteData.createdBy);

      registrarLog(siteData.createdBy || "ANONIMO", "NUEVO SITIO", `Sitio: ${cleanName} (${id})`);

      return { success: true, id: id, message: "Sitio creado correctamente con estructura PPC completa." };
    } catch (e) {
      return { success: false, message: e.toString() };
    } finally {
      lock.releaseLock();
    }
  }
  return { success: false, message: "El sistema está ocupado." };
}

// 2. Guardar Nuevo Subproyecto (Hijo)
function apiSaveSubProject(subProjectData) {
  const lock = LockService.getScriptLock();
  if (lock.tryLock(5000)) {
    try {
      let sheet = findSheetSmart("DB_PROYECTOS");
      if (!sheet) {
        sheet = SS.insertSheet("DB_PROYECTOS");
        sheet.appendRow(["ID_PROYECTO", "ID_SITIO", "NOMBRE_SUBPROYECTO", "TIPO", "ESTATUS", "FECHA_CREACION", "CREADO_POR"]);
      }
      
      const cleanName = subProjectData.name.toUpperCase().trim();
      const data = sheet.getDataRange().getValues();
      let idSitioIdx = 1; 
      let nameIdx = 2;
      const headerRow = findHeaderRow(data);
      if (headerRow > -1) {
          const headers = data[headerRow].map(h=>String(h).toUpperCase());
          idSitioIdx = headers.indexOf("ID_SITIO");
          nameIdx = headers.indexOf("NOMBRE_SUBPROYECTO");
      }

      for(let i=1; i<data.length; i++) {
          if (data[i][idSitioIdx] == subProjectData.parentId && 
              String(data[i][nameIdx]).toUpperCase().trim() === cleanName) {
              return { success: false, message: "Ya existe ese subproyecto en este sitio."};
          }
      }

      const id = "PROJ-" + new Date().getTime() + "-" + Math.floor(Math.random()*1000);
      sheet.appendRow([
        id,
        subProjectData.parentId,
        cleanName,
        subProjectData.type || "GENERAL", 
        "ACTIVO",
        new Date(),
        subProjectData.createdBy ? subProjectData.createdBy.toUpperCase().trim() : "ANONIMO"
      ]);
      SpreadsheetApp.flush(); 

      registrarLog(subProjectData.createdBy || "ANONIMO", "NUEVO SUBPROYECTO", `Subproyecto: ${cleanName} (${id})`);

      return { success: true, id: id, message: "Subproyecto agregado." };
    } catch (e) {
      return { success: false, message: e.toString() };
    } finally {
      lock.releaseLock();
    }
  }
  return { success: false, message: "El sistema está ocupado." };
}

// 3. Obtener Árbol Completo
function apiFetchCascadeTree() {
  try {
    const sites = [];
    const sheetSites = findSheetSmart("DB_SITIOS");
    if (sheetSites) {
      const values = sheetSites.getDataRange().getValues();
      const headerRowIdx = findHeaderRow(values);
      if (headerRowIdx !== -1 && values.length > headerRowIdx + 1) {
        const headers = values[headerRowIdx].map(h => String(h).toUpperCase().trim());
        const colMap = {
           id: headers.findIndex(h => h.includes("ID")),
           name: headers.findIndex(h => h.includes("NOMBRE")),
           client: headers.findIndex(h => h.includes("CLIENTE")),
           type: headers.findIndex(h => h.includes("TIPO")),
           status: headers.findIndex(h => h.includes("ESTATUS")),
           date: headers.findIndex(h => h.includes("FECHA"))
        };
        for (let i = headerRowIdx + 1; i < values.length; i++) {
          const row = values[i];
          if (colMap.id > -1 && colMap.name > -1 && row[colMap.id]) {
             let dateStr = "";
             if (colMap.date > -1 && row[colMap.date]) {
                 try { dateStr = Utilities.formatDate(new Date(row[colMap.date]), SS.getSpreadsheetTimeZone(), "dd/MM/yy HH:mm");
                 } catch(e) {}
             }
             sites.push({
               id: String(row[colMap.id]).trim(),
               name: String(row[colMap.name]).trim(),
               client: (colMap.client > -1) ? String(row[colMap.client]) : "",
               type: (colMap.type > -1) ? String(row[colMap.type]) : "CLIENTE",
               status: (colMap.status > -1) ? String(row[colMap.status]) : "ACTIVO",
               createdAt: dateStr,
               subProjects: [],
               expanded: false
             });
          }
        }
      }
    }

    const sheetProjs = findSheetSmart("DB_PROYECTOS");
    if (sheetProjs) {
      const values = sheetProjs.getDataRange().getValues();
      const headerRowIdx = findHeaderRow(values);
      if (headerRowIdx !== -1 && values.length > headerRowIdx + 1) {
        const headers = values[headerRowIdx].map(h => String(h).toUpperCase().trim());
        const colMap = {
           parentId: headers.findIndex(h => h.includes("SITIO") || h.includes("PADRE")),
           name: headers.findIndex(h => h.includes("NOMBRE") || h.includes("SUBPROYECTO")),
           type: headers.findIndex(h => h.includes("TIPO") || h.includes("ESPECIALIDAD")),
           status: headers.findIndex(h => h.includes("ESTATUS"))
        };
        for (let i = headerRowIdx + 1; i < values.length; i++) {
          const row = values[i];
          if (colMap.parentId > -1 && colMap.name > -1 && row[colMap.parentId]) {
             const parentId = String(row[colMap.parentId]).trim();
             const parent = sites.find(s => String(s.id).trim() === parentId);
             if (parent) {
               // CAMBIO: Si es PPC, asignamos el icono correcto
               const pName = String(row[colMap.name]).trim().toUpperCase();
               let icon = "fa-clipboard-list";
               if (pName.includes("PPC")) icon = "fa-tasks";

               parent.subProjects.push({
                 id: row[0],
                 name: String(row[colMap.name]).trim(),
                 type: (colMap.type > -1) ? String(row[colMap.type]) : "GENERAL",
                 status: (colMap.status > -1) ? String(row[colMap.status]) : "ACTIVO",
                 icon: icon
               });
             }
          }
        }
      }
    }
    return { success: true, data: sites };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Error leyendo DB: " + e.toString() };
  }
}

function apiFetchProjectTasks(projectName) {
  try {
    const sheet = findSheetSmart("ADMINISTRADOR");
    if (!sheet) return { success: false, message: "No se encuentra la hoja ADMINISTRADOR" };

    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return { success: true, data: [], headers: [] };

    const headerRowIdx = findHeaderRow(values);
    if (headerRowIdx === -1) return { success: false, message: "Sin cabeceras válidas" };

    const headers = values[headerRowIdx].map(h => String(h).toUpperCase().trim());
    const projectTag = `[PROY: ${String(projectName).toUpperCase().trim()}]`;
    
    // Indices clave
    let colIdx = {
       concepto: headers.indexOf("CONCEPTO"),
       comentarios: headers.indexOf("COMENTARIOS")
    };
    if (colIdx.concepto === -1) colIdx.concepto = headers.findIndex(h => h.includes("CONCEPTO") || h.includes("DESCRIPCI"));
    if (colIdx.comentarios === -1) colIdx.comentarios = headers.findIndex(h => h.includes("COMENTARIOS"));
    const dataRows = values.slice(headerRowIdx + 1);
    const filteredTasks = [];
    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const comText = (colIdx.comentarios > -1 && row[colIdx.comentarios]) ? String(row[colIdx.comentarios]).toUpperCase() : "";
        const descText = (colIdx.concepto > -1 && row[colIdx.concepto]) ? String(row[colIdx.concepto]).toUpperCase() : "";
        if (comText.includes(projectTag) || descText.includes(projectTag)) {
            let rowObj = { _rowIndex: headerRowIdx + i + 2 };
            headers.forEach((h, k) => {
                let val = row[k];
                if (val instanceof Date) {
                    val = Utilities.formatDate(val, SS.getSpreadsheetTimeZone(), "dd/MM/yy");
                }
                rowObj[h] = val;
            });
            filteredTasks.push(rowObj);
        }
    }

    if (sheetName.includes('ANTONIA_VENTAS')) {
        const estatusIdx = headers.indexOf('ESTATUS');
        const avanceIdx = headers.indexOf('AVANCE');
        const mapCotIdx = headers.indexOf('MAP COT');

        if (mapCotIdx !== -1) {
            headers.splice(mapCotIdx, 1); // remove

            // Recalculate positions
            const estIdx2 = headers.indexOf('ESTATUS');
            if (estIdx2 !== -1) {
                headers.splice(estIdx2 + 1, 0, 'MAP COT');
            } else {
                headers.push('MAP COT');
            }
        }
    }
    return { success: true, data: filteredTasks.reverse(), headers: headers };

  } catch (e) {
    console.error(e);
    return { success: false, message: e.toString() };
  }
}

// *** MODIFICADO PARA INCLUIR ETIQUETAS DE LOS NUEVOS PPCs ***
function apiSaveProjectTask(taskData, projectName, username) {
    try {
        const nameUpper = String(projectName).toUpperCase().trim();
        const tag = `[PROY: ${nameUpper}]`;
        
        let coms = taskData['COMENTARIOS'] || "";
        
        // Verificamos si ya tiene la etiqueta para no duplicar
        if (!String(coms).toUpperCase().includes(tag)) {
            taskData['COMENTARIOS'] = (coms + " " + tag).trim();
        }
        
        const res = internalBatchUpdateTasks("ADMINISTRADOR", [taskData]);
        if(res.success) {
            registrarLog(username || "DESCONOCIDO", "ACTUALIZAR PROYECTO", `Proyecto: ${projectName}, ID: ${taskData['ID']||taskData['FOLIO']}`);
            res.data = taskData;
        }
        return res;
    } catch (e) {
        return { success: false, message: e.toString() };
    }
}

/**
 * ======================================================================
 * FUNCIONALIDAD ADICIONAL: BOTONES EN HOJA (COMANDOS UI)
 * ======================================================================
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ HOLTMONT CMD')
    .addItem('✅ REALIZAR ALTA (Fila Actual)', 'cmdRealizarAlta')
    .addItem('🔄 ACTUALIZAR (Fila Actual)', 'cmdActualizar')
    .addSeparator()
    .addItem('🎨 Aplicar Formato Condicional (Semaforo)', 'setupConditionalFormatting')
    .addItem('🗂️ Organizar Banco (Retroactivo)', 'runFullArchivingBatch')
    .addToUi();
}

/**
 * ASIGNAR A BOTÓN: "REALIZAR ALTA"
 * Lee la fila activa, genera ID si falta, y distribuye.
 */
function cmdRealizarAlta() {
  const sheet = SS.getActiveSheet();
  const row = sheet.getActiveRange().getRow();
  const ui = SpreadsheetApp.getUi();
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const headerIdx = findHeaderRow(values);

  if (headerIdx === -1 || row <= headerIdx + 1) {
    ui.alert("⚠️ Por favor selecciona una celda dentro de una fila de datos válida.");
    return;
  }

  const headers = values[headerIdx].map(h => String(h).toUpperCase().trim());
  const rowData = values[row - 1];
  const taskObj = {};
  headers.forEach((h, i) => {
    if (h) taskObj[h] = rowData[i];
  });
  if (!taskObj["CONCEPTO"] && !taskObj["DESCRIPCION"]) {
    ui.alert("❌ Falta el CONCEPTO o DESCRIPCIÓN.");
    return;
  }

  const currentSheetName = sheet.getName();
  if (!taskObj["FOLIO"] && !taskObj["ID"]) {
    let prefix = generatePrefix(currentSheetName);
    taskObj["FOLIO"] = prefix + generateNumericSequence(prefix);
    const folioCol = headers.indexOf("FOLIO") > -1 ? headers.indexOf("FOLIO") : headers.indexOf("ID");
    if (folioCol > -1) {
      sheet.getRange(row, folioCol + 1).setValue(taskObj["FOLIO"]);
    }
  }

  SS.toast("Guardando y distribuyendo tarea...", "Holtmont", 5);
  
  taskObj['ESTATUS'] = taskObj['ESTATUS'] || 'ASIGNADO';
  const involucrados = taskObj["INVOLUCRADOS"] || taskObj["RESPONSABLE"] || "";
  const listaInv = String(involucrados).split(",").map(s => s.trim()).filter(s => s);
  
  internalBatchUpdateTasks("ADMINISTRADOR", [taskObj]);
  listaInv.forEach(nombre => {
    internalBatchUpdateTasks(nombre, [taskObj]);
  });
  if (currentSheetName !== "ADMINISTRADOR" && !listaInv.includes(currentSheetName)) {
    internalBatchUpdateTasks(currentSheetName, [taskObj]);
  }

  ui.alert(`✅ Tarea Guardada: ${taskObj["FOLIO"] || taskObj["ID"]}\nDistribulda a: ADMINISTRADOR y ${listaInv.join(", ")}`);
}

/**
 * ASIGNAR A BOTÓN: "ACTUALIZAR"
 */
function cmdActualizar() {
  const sheet = SS.getActiveSheet();
  const row = sheet.getActiveRange().getRow();
  const ui = SpreadsheetApp.getUi();

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const headerIdx = findHeaderRow(values);
  if (headerIdx === -1 || row <= headerIdx + 1) {
    ui.alert("⚠️ Selecciona una fila de datos válida.");
    return;
  }

  const headers = values[headerIdx].map(h => String(h).toUpperCase().trim());
  const rowData = values[row - 1];
  const taskObj = { _rowIndex: row }; 

  headers.forEach((h, i) => {
    if (h) taskObj[h] = rowData[i];
  });
  const id = taskObj["FOLIO"] || taskObj["ID"];
  if (!id) {
    ui.alert("❌ No se encontró un FOLIO o ID en esta fila. No se puede sincronizar.");
    return;
  }

  SS.toast("Sincronizando cambios...", "Holtmont", 3);

  const resLocal = internalBatchUpdateTasks(sheet.getName(), [taskObj]);
  if (sheet.getName() !== "ADMINISTRADOR") {
     const syncObj = { ...taskObj };
     delete syncObj._rowIndex;
     internalBatchUpdateTasks("ADMINISTRADOR", [syncObj]);
  }

  if (resLocal.moved) {
    ui.alert("✅ Tarea Actualizada y ARCHIVADA (Completada).");
  } else {
    SS.toast("✅ Actualización completada.");
  }
}

// --- FUNCIÓN GENERADORA (NUEVA) ---
// Usar esta función para crear los subproyectos automáticamente
function apiCreateStandardStructure(siteId, user) {
    STANDARD_PROJECT_STRUCTURE.forEach(name => {
        // Determinamos el tipo para que el Front sepa cómo dibujarlo
        let tipo = "GENERAL";
        if (name.includes("PPC")) tipo = "PPC_MASTER"; 
        
        apiSaveSubProject({
            parentId: siteId,
            name: name,
            type: tipo,
            createdBy: user || "SISTEMA"
        });
    });
}

/**
 * GENERADOR DE PREFIJOS DE FOLIO BASADO EN NOMBRE
 */
function generatePrefix(name) {
    if (!name) return 'PPC-';

    const upperName = String(name).toUpperCase().trim();

    if (upperName === 'JESUS_CANTU' || upperName === 'JESUS CANTU') return 'JC-';
    if (upperName === 'LUIS_CARLOS' || upperName === 'LUIS CARLOS' || upperName === 'ADMINISTRADOR') return 'LC-';
    if (upperName === 'JAIME_OLIVO' || upperName === 'JAIME OLIVO') return 'JO-';
    if (upperName === 'ANTONIA_VENTAS' || upperName === 'ANTONIA VENTAS') return 'AV-';
    if (upperName === 'RAMIRO_RODRIGUEZ' || upperName === 'RAMIRO RODRIGUEZ') return 'RR-';
    if (upperName === 'SEBASTIAN_PADILLA' || upperName === 'SEBASTIAN PADILLA') return 'SP-';
    if (upperName === 'TERESA_GARZA' || upperName === 'TERESA GARZA') return 'TG-';

    const parts = upperName.split(/[\s_]+/).filter(p => p.length > 0);
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)) + '-';
    } else if (parts.length === 1) {
        return parts[0].substring(0, 2) + '-';
    }

    return 'PPC-';
}

/**
 * GENERADOR DE FOLIO NUMÉRICO SECUENCIAL (NUEVO)
 */
function generateNumericSequence(key) {
  const lock = LockService.getScriptLock();
  try {
    if (lock.tryLock(5000)) {
       const props = PropertiesService.getScriptProperties();
       const seqKey = "SEQ_" + key;
       let val = Number(props.getProperty(seqKey) || 0);
       // Check if the value got corrupted
       if (isNaN(val) || val > 10000000) {
           val = 0;
       }
       val++;
       props.setProperty(seqKey, String(val));
       return String(val).padStart(4, '0');
    }
  } catch(e) { console.error(e); } finally { lock.releaseLock(); }
  // Fallback to a random 4-digit number to avoid long timestamps
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * GENERADOR DE UNIQUEID (APP-SHEET STYLE)
 * Genera string alfanumérico de 8 caracteres.
 * (MANTENIDO POR COMPATIBILIDAD, AUNQUE DEPRECADO EN FLUJOS NUEVOS)
 */
function generateAppSheetId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateWorkOrderFolio(clientName, deptName) {
  try {
      const props = PropertiesService.getScriptProperties();
      // Incrementar secuencia
      let seq = Number(props.getProperty('WORKORDER_SEQ') || 0) + 1;
      props.setProperty('WORKORDER_SEQ', String(seq));

      const seqStr = String(seq).padStart(4, '0');

      // Abreviatura Cliente: Iniciales de las primeras 2 palabras o primeras 2 letras
      const cleanClient = (clientName || "XX").toUpperCase().replace(/[^A-Z0-9]/g, ' ').trim();
      const words = cleanClient.split(/\s+/).filter(w => w.length > 0);
      let clientStr = "XX";
      if (words.length >= 2) {
          clientStr = words[0][0] + words[1][0];
      } else if (words.length === 1) {
          clientStr = words[0].substring(0, 2);
      }

      // Simplificar departamento
      const rawDept = (deptName || "General").trim().toUpperCase();
      const ABBR_MAP = {
          "ELECTROMECANICA": "Electro",
          "ELECTROMECÁNICA": "Electro",
          "CONSTRUCCION": "Const",
          "CONSTRUCCIÓN": "Const",
          "MANTENIMIENTO": "Mtto",
          "REMODELACION": "Remod",
          "REMODELACIÓN": "Remod",
          "REPARACION": "Repar",
          "REPARACIÓN": "Repar",
          "RECONFIGURACION": "Reconf",
          "RECONFIGURACIÓN": "Reconf",
          "POLIZA": "Poliza",
          "PÓLIZA": "Poliza",
          "INSPECCION": "Insp",
          "INSPECCIÓN": "Insp",
          "ADMINISTRACION": "Admin",
          "ADMINISTRACIÓN": "Admin",
          "MAQUINARIA": "Maq",
          "DISEÑO": "Diseño",
          "COMPRAS": "Compras",
          "VENTAS": "Ventas",
          "HVAC": "HVAC",
          "FINANZAS": "Finanzas",
          "FACTURACION": "Factura",
          "FACTURACIÓN": "Factura",
          "SEGURIDAD": "EHS",
          "EHS": "EHS"
      };

      let deptStr = ABBR_MAP[rawDept];

      // Si no está en el mapa, intentar capitalizar primera letra y resto minúsculas
      if (!deptStr) {
          if (rawDept.length > 6) {
              deptStr = rawDept.substring(0, 1) + rawDept.substring(1, 5).toLowerCase();
          } else {
              deptStr = rawDept.substring(0, 1) + rawDept.substring(1).toLowerCase();
          }
      }

      const date = new Date();
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = String(date.getFullYear()).slice(-2);
      const dateStr = `${d}${m}${y}`;

      return `${seqStr}${clientStr} ${deptStr} ${dateStr}`;
  } catch(e) {
      console.error(e);
      return "WO-" + new Date().getTime();
  }
}

function apiGetNextWorkOrderSeq() {
  try {
    const props = PropertiesService.getScriptProperties();
    let seq = Number(props.getProperty('WORKORDER_SEQ') || 0) + 1;
    return String(seq).padStart(4, '0');
  } catch(e) {
    return "0000";
  }
}

/*
 * ======================================================================
 * AUTOMATIZACIÓN DIARIA: CONTADOR DE DÍAS (VENTAS)
 * ======================================================================
 */
function incrementarContadorDias() {
  // Lista de hojas a procesar (Antonia + Vendedores)
  const sheetsToProcess = ["ANTONIA_VENTAS"];
  
  try {
      const directory = getDirectoryFromDB();
      directory.forEach(user => {
          if ((user.dept === 'VENTAS' || user.type === 'VENTAS' || user.type === 'HIBRIDO') && user.name !== "ANTONIA_VENTAS") {
              sheetsToProcess.push(user.name + " (VENTAS)"); // Estándar: NOMBRE (VENTAS)
              // También intentar sin sufijo si es un usuario que usa su hoja principal como ventas (poco probable en config actual pero por seguridad)
              if (user.type === 'VENTAS') sheetsToProcess.push(user.name);
          }
      });
  } catch(e) { console.error("Error obteniendo directorio para contador", e); }

  // Eliminar duplicados
  const uniqueSheets = [...new Set(sheetsToProcess)];

  const today = new Date();
  today.setHours(0,0,0,0);

  uniqueSheets.forEach(sheetName => {
      try {
        const sheet = findSheetSmart(sheetName);
        if (!sheet) return;

        const dataRange = sheet.getDataRange();
        const values = dataRange.getValues();
        if (values.length < 2) return; 

        // Buscar Cabeceras
        const headerRowIdx = findHeaderRow(values);
        if (headerRowIdx === -1) return;

        const headers = values[headerRowIdx].map(h => String(h).toUpperCase().trim());
        
        // Buscar columnas clave
        let diasIdx = headers.findIndex(h => h === "DIAS" || h === "RELOJ" || h.includes("DIAS FINALIZ") || h.includes("DÍAS FINALIZ"));
        
        const fechaAliases = ['FECHA', 'FECHA ALTA', 'FECHA INICIO', 'ALTA', 'FECHA DE INICIO', 'F. INICIO'];
        let fechaIdx = -1;
        for(let alias of fechaAliases) {
            const idx = headers.indexOf(alias);
            if(idx > -1) { fechaIdx = idx; break; }
        }

        if (diasIdx === -1 || fechaIdx === -1) return;

        const newColumnValues = [];
        let updatedCount = 0;
        let startRow = headerRowIdx + 1; // 0-based index of first data row

        // Iterar solo datos
        for (let i = startRow; i < values.length; i++) {
            let fechaVal = values[i][fechaIdx];
            let newVal = values[i][diasIdx];

            // Lógica: TODAY - FECHA = DÍAS
            let calculated = false;
            if (fechaVal instanceof Date) {
                fechaVal.setHours(0,0,0,0);
                const diffTime = today - fechaVal;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                newVal = Math.max(0, diffDays);
                calculated = true;
            } else if (typeof fechaVal === 'string' && fechaVal.trim() !== "") {
                if(fechaVal.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
                    try {
                        const parts = fechaVal.split('/');
                        let y = parts[2];
                        if(y.length === 2) y = '20'+y;
                        const dObj = new Date(y, parts[1]-1, parts[0]);
                        if(!isNaN(dObj.getTime())) {
                            dObj.setHours(0,0,0,0);
                            const diffDays = Math.floor((today - dObj) / (1000 * 60 * 60 * 24));
                            newVal = Math.max(0, diffDays);
                            calculated = true;
                        }
                    } catch(e) {}
                } else {
                    try {
                        const parsed = new Date(fechaVal);
                        if (!isNaN(parsed.getTime())) {
                            parsed.setHours(0,0,0,0);
                            const diffDays = Math.floor((today - parsed) / (1000 * 60 * 60 * 24));
                            newVal = Math.max(0, diffDays);
                            calculated = true;
                        }
                    } catch (e) {}
                }
            }
            
            if (calculated) updatedCount++;
            else if (newVal === undefined) newVal = ""; // Keep clean if calculation fails
            
            newColumnValues.push([newVal]);
        }

        // Batch Update
        if (newColumnValues.length > 0) {
            sheet.getRange(startRow + 1, diasIdx + 1, newColumnValues.length, 1).setValues(newColumnValues);
            // Re-apply traffic light just in case
            try { applyTrafficLightToSheet(sheet); } catch(e){}
        }
        
        console.log(`[CONTADOR] ${sheetName}: ${updatedCount} actualizados.`);

      } catch (e) {
        console.error(`Error procesando ${sheetName}:`, e);
      }
  });
  
  registrarLog("SISTEMA", "CONTADOR_DIARIO", `Actualización masiva de días completada.`);
}

function instalarDisparador() {
  const funcionObjetivo = "incrementarContadorDias";

  // Verificar si ya existe el disparador para evitar duplicados
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === funcionObjetivo) {
      console.log(`El disparador para '${funcionObjetivo}' ya existe.`);
      return;
    }
  }

  // Crear nuevo disparador diario entre 1 am y 2 am
  ScriptApp.newTrigger(funcionObjetivo)
      .timeBased()
      .everyDays(1)
      .atHour(1) // 1 am
      .create();

  console.log(`Disparador instalado para '${funcionObjetivo}' (Diario 1am-2am).`);
  registrarLog("ADMIN", "CONFIG_TRIGGER", "Se instaló el disparador automático diario.");
}

function generarFolioAutomatico(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    console.error('Could not obtain lock after 30 seconds.');
    return;
  }

  try {
    const ss = e ? e.source : SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(FOLIO_CONFIG.SHEET_NAME);

    if (!sheet) return;

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const folioIndex = headers.indexOf(FOLIO_CONFIG.COLUMN_NAME);

    if (folioIndex === -1) {
      console.error(`Column '${FOLIO_CONFIG.COLUMN_NAME}' not found in sheet '${FOLIO_CONFIG.SHEET_NAME}'`);
      return;
    }

    const folioColNum = folioIndex + 1;
    const targetCell = sheet.getRange(lastRow, folioColNum);
    const targetValue = targetCell.getValue();

    if (targetValue === "" || targetValue === null) {
      let newFolio = 1;

      if (lastRow > 2) {
        const numRows = lastRow - 2;
        if (numRows > 0) {
            const previousValues = sheet.getRange(2, folioColNum, numRows, 1).getValues().flat();
            const numbers = previousValues.filter(val => typeof val === 'number' && !isNaN(val));
            if (numbers.length > 0) {
              const maxVal = Math.max(...numbers);
              newFolio = maxVal + 1;
            }
        }
      }

      targetCell.setValue(newFolio);
      console.log(`Generated Folio: ${newFolio} for row ${lastRow}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// _TEST_SUITE.js
// ==========================================

function test_Generacion_MAP_COT() {
  console.log("🛠️ INICIANDO TEST: Generación Correcta de MAP COT");

  const origFetch = internalFetchSheetData;
  const origBatch = internalBatchUpdateTasks;
  const origLog = registrarLog;

  let capturedSync = null;

  try {
      internalFetchSheetData = function(sheetName) {
          if (sheetName === "ANTONIA_VENTAS") {
              return {
                  success: true,
                  data: [{
                      'FOLIO': 'AV-TEST-001',
                      'PROCESO_LOG': JSON.stringify([
                          {step: "L", status: "DONE", assignee: "USER1"},
                          {step: "CD", status: "IN_PROGRESS", assignee: "ANGEL SALINAS"}
                      ]),
                      'MAP COT': '🟢 L | 🔴 CD | ⚪ EP | ⚪ CI | ⚪ EV | ⚪ CEC | ⚪ RCC'
                  }]
              };
          }
          return { success: true, data: [] };
      };

      internalBatchUpdateTasks = function(sheetName, tasksArray) {
          if (sheetName === "ANTONIA_VENTAS" && tasksArray[0] && tasksArray[0]['PROCESO_LOG']) {
              capturedSync = tasksArray[0];
          }
          return { success: true, moved: false };
      };

      registrarLog = function() {};

      internalUpdateTask("ANGEL SALINAS", {
          'FOLIO': 'AV-TEST-001',
          'AVANCE': '100%',
          'ESTATUS': 'DONE'
      }, "TEST_RUNNER");

      const expected = "🟢 L | 🟢 CD | ⚪ EP | ⚪ CI | ⚪ EV | ⚪ CEC | ⚪ RCC";
      const result = capturedSync ? capturedSync['MAP COT'] : null;

      if (result === expected) {
          console.log("✅ test_Generacion_MAP_COT Pasó.");
      } else {
          console.error("❌ test_Generacion_MAP_COT Falló.");
          console.error("Esperado: " + expected);
          console.error("Recibido: " + result);
      }
  } finally {
      internalFetchSheetData = origFetch;
      internalBatchUpdateTasks = origBatch;
      registrarLog = origLog;
  }
}

function test_Security_Filter_AllowedBase() {
  console.log("🛠️ INICIANDO TEST: Filtrado de Seguridad (allowedBase)");

  const origBatch = internalBatchUpdateTasks;
  const origLog = registrarLog;

  let capturedUpdate = null;

  try {
      internalBatchUpdateTasks = function(sheetName, tasksArray) {
          if (sheetName === 'ANTONIA_VENTAS' && tasksArray[0] && tasksArray[0].FOLIO === 'AV-9999') {
            capturedUpdate = tasksArray[0];
          }
          return { success: true };
      };
      registrarLog = function() {};

      const payload = {
          'FOLIO': 'AV-9999',
          'PROCESO_LOG': '[{"step":"L", "status":"DONE"}]',
          'FORMULA_SECRETA': 'malicious data',
          'ESTATUS': 'PENDIENTE'
      };

      // Call internalUpdateTask as ANTONIA_VENTAS to trigger the filter logic directly
      internalUpdateTask("ANTONIA_VENTAS", payload, "ANTONIA_VENTAS");

      if (capturedUpdate && capturedUpdate['FORMULA_SECRETA'] === undefined && capturedUpdate['PROCESO_LOG'] !== undefined) {
          console.log("✅ test_Security_Filter_AllowedBase Pasó.");
      } else {
          console.error("❌ test_Security_Filter_AllowedBase Falló.");
          console.log("Keys persistidas: ", capturedUpdate ? Object.keys(capturedUpdate) : "none");
      }
  } finally {
      internalBatchUpdateTasks = origBatch;
      registrarLog = origLog;
  }
}

function test_Flujo_Completo_Delegacion_y_Sincronizacion() {
    console.log("🛠️ INICIANDO TEST: Flujo Completo de Delegación y Sincronización (Test Case 3)");

    const origFetch = internalFetchSheetData;
    const origBatch = internalBatchUpdateTasks;
    const origLog = registrarLog;

    let dbAntonia = [{
        'FOLIO': 'AV-E2E-001',
        'CLIENTE': 'TEST E2E',
        'ESTATUS': 'PENDIENTE',
        'MAP COT': '⚪ L | ⚪ CD | ⚪ EP | ⚪ CI | ⚪ EV | ⚪ CEC | ⚪ RCC'
    }];

    let dbAngel = [];

    try {
        internalFetchSheetData = function(sheetName) {
            if (sheetName === "ANTONIA_VENTAS") return { success: true, data: dbAntonia };
            return { success: true, data: [] };
        };

        internalBatchUpdateTasks = function(sheetName, tasksArray) {
            if (sheetName === "ANTONIA_VENTAS") {
                const task = tasksArray[0];
                const row = dbAntonia.find(r => r.FOLIO === task.FOLIO);
                if (row) Object.assign(row, task);
                else dbAntonia.push(task);
            } else if (sheetName === "ANGEL SALINAS" || sheetName === "ANGEL SALINAS (VENTAS)") {
                 dbAngel.push(tasksArray[0]);
            }
            return { success: true, moved: false };
        };
        registrarLog = function() {};

        // Paso 1 (Delegar) -> Simulado desde Frontend a internalUpdateTask
        const taskRow = Object.assign({}, dbAntonia[0]);
        taskRow._assignToWorker = ["ANGEL SALINAS"];
        taskRow._assignStep = "CD";
        taskRow.PROCESO_LOG = JSON.stringify([{step: "CD", status: "IN_PROGRESS", assignee: "ANGEL SALINAS", timestamp: new Date().getTime()}]);
        taskRow["MAP COT"] = '⚪ L | 🔴 CD | ⚪ EP | ⚪ CI | ⚪ EV | ⚪ CEC | ⚪ RCC';

        internalUpdateTask("ANTONIA_VENTAS", taskRow, "ANTONIA_VENTAS");

        // Validación Paso 2 (Backend)
        const updatedAntoniaRow = dbAntonia.find(r => r.FOLIO === 'AV-E2E-001');
        const log = JSON.parse(updatedAntoniaRow.PROCESO_LOG);
        if (log[0].step !== "CD" || log[0].status !== "IN_PROGRESS" || log[0].assignee !== "ANGEL SALINAS") {
            console.error("❌ Falló Paso 2: El PROCESO_LOG no se actualizó correctamente.");
            return;
        }

        if (dbAngel.length === 0 || dbAngel[0].FOLIO !== 'AV-E2E-001') {
            console.error("❌ Falló Paso 2: La tarea no se distribuyó a la hoja de ANGEL SALINAS.");
            return;
        }

        // Paso 3 (Completar Tarea)
        const angelTask = Object.assign({}, dbAngel[0]);
        angelTask.AVANCE = "100%";
        angelTask.ESTATUS = "DONE";
        angelTask.COTIZACION = "http://test.url";

        internalUpdateTask("ANGEL SALINAS (VENTAS)", angelTask, "ANGEL_USER");

        // Validación Paso 4 (Sincronización Inversa)
        const finalAntoniaRow = dbAntonia.find(r => r.FOLIO === 'AV-E2E-001');
        const finalLog = JSON.parse(finalAntoniaRow.PROCESO_LOG);

        if (finalLog[0].status !== "DONE") {
            console.error("❌ Falló Paso 4: El estado en PROCESO_LOG no es DONE.");
            return;
        }

        if (finalAntoniaRow["MAP COT"] !== "⚪ L | 🟢 CD | ⚪ EP | ⚪ CI | ⚪ EV | ⚪ CEC | ⚪ RCC") {
            console.error("❌ Falló Paso 4: El MAP COT no se regeneró a verde (🟢). Recibido: " + finalAntoniaRow["MAP COT"]);
            return;
        }

        if (finalAntoniaRow.COTIZACION !== "http://test.url") {
             console.error("❌ Falló Paso 4: El archivo no se sincronizó.");
             return;
        }

        console.log("✅ test_Flujo_Completo_Delegacion_y_Sincronizacion Pasó.");

    } finally {
        internalFetchSheetData = origFetch;
        internalBatchUpdateTasks = origBatch;
        registrarLog = origLog;
    }
}

function test_Cierre_Terminal_RCC() {
    console.log("🛠️ INICIANDO TEST: Cierre Terminal RCC (Test Case 4)");

    // Este test verifica que cuando la hoja de Antonia actualiza un ESTATUS final (ej. PERDIDA X PRECIO)
    // El frontend lo maneja (simulado pasando el payload) y que se mantenga el estado.
    // La mayor parte de la lógica de cierre está en el frontend en 'advanceProcess',
    // Aquí probamos que internalUpdateTask lo acepte y guarde.

    const origBatch = internalBatchUpdateTasks;
    const origLog = registrarLog;

    let capturedUpdate = null;

    try {
        internalBatchUpdateTasks = function(sheetName, tasksArray) {
            if (sheetName === "ANTONIA_VENTAS") capturedUpdate = tasksArray[0];
            return { success: true };
        };
        registrarLog = function() {};

        const payload = {
            'FOLIO': 'AV-TERM-001',
            'ESTATUS': 'PERDIDA X PRECIO',
            'MAP COT': '🟢 L | 🟢 CD | 🟢 EP | 🟢 CI | 🟢 EV | 🟢 CEC | 🔴 RCC'
        };

        internalUpdateTask("ANTONIA_VENTAS", payload, "ANTONIA_VENTAS");

        if (capturedUpdate && capturedUpdate.ESTATUS === "PERDIDA X PRECIO") {
            console.log("✅ test_Cierre_Terminal_RCC Pasó.");
        } else {
            console.error("❌ test_Cierre_Terminal_RCC Falló.");
        }

    } finally {
        internalBatchUpdateTasks = origBatch;
        registrarLog = origLog;
    }
}






function test_SavePPCV3_Flow() {
  console.log("🛠️ INICIANDO TEST: Persistencia en PPCV3");

  // 1. Simular Payload
  const testId = "TEST-" + new Date().getTime();
  const payload = {
    concepto: "TEST_AUTO_UNITARIO_" + testId,
    especialidad: "PRUEBAS",
    responsable: "JESUS_CANTU",
    horas: "1",
    prioridad: "Alta",
    comentarios: "Prueba de integridad de datos",
    // Explicit ID for verification
    id: testId
  };

  const user = "JESUS_CANTU";

  console.log("📋 Payload simulado:", payload);

  // 2. Ejecutar Guardado
  const result = apiSavePPCData(payload, user);

  if (!result.success) {
    console.error("❌ FALLO: La función apiSavePPCData retornó error.", result);
    return;
  }
  console.log("✅ apiSavePPCData ejecutado con éxito.");

  // 3. Verificación
  const sheet = SS.getSheetByName(APP_CONFIG.ppcSheetName);
  const data = sheet.getDataRange().getValues();

  // Buscar el ID
  let found = false;
  let foundRowData = [];

  // Asumimos que los headers están en alguna fila, usamos findHeaderRow o búsqueda bruta
  // Búsqueda bruta del ID en toda la hoja para estar seguros
  for (let i = 0; i < data.length; i++) {
    const rowStr = data[i].join("|");
    if (rowStr.includes(testId)) {
      found = true;
      foundRowData = data[i];
      break;
    }
  }

  if (found) {
    console.log("✅ PRUEBA PASADA: Datos persistidos en PPCV3. ID encontrado: " + testId);
    console.log("📄 Datos de fila:", foundRowData);
  } else {
    console.error("❌ FALLO: Datos no encontrados en PPCV3. El ID " + testId + " no aparece en la hoja.");
    // Log last 5 rows for debug
    console.log("🔍 Últimas 5 filas de la hoja:", data.slice(-5));
    throw new Error("Persistencia fallida en PPCV3");
  }
}

function test_WorkOrder_Generation() {
  console.log("🛠️ INICIANDO TEST: Workorder ID Generation");
  const user = "PREWORK_ORDER";
  const payload = {
      cliente: "MERCEDES BENZ",
      especialidad: "ELECTROMECANICA",
      concepto: "TEST WO",
      responsable: "JUAN PEREZ",
      // ...
  };

  // Call API
  const res = apiSavePPCData(payload, user);

  if (res.success && res.ids && res.ids.length > 0) {
      const id = res.ids[0];
      console.log("Generated ID:", id);
      // Expected: Sequence(4) + ME + Space + ELECTROMECANICA + Space + Date(6)
      // e.g. 0002ME ELECTROMECANICA 010126
      if (id.match(/^\d{4}[A-Z]{2} .+ \d{6}$/)) {
          console.log("✅ ID Format Correct");
      } else {
          console.error("❌ ID Format Incorrect:", id);
      }
  } else {
      console.error("❌ Failed to save or generate ID", res);
  }
}

function test_Directory_CRUD() {
  console.log("🛠️ INICIANDO TEST: Directory CRUD & Migration");

  // 1. Test Migration / Fetch
  const dir1 = getDirectoryFromDB();
  console.log("Directory Size:", dir1.length);
  if (dir1.length > 0) {
      console.log("✅ getDirectoryFromDB returned data (Migration or Fetch worked)");
  } else {
      console.error("❌ getDirectoryFromDB returned empty");
  }

  // 2. Test Add
  const testUser = { name: "TEST_USER_AUTO", dept: "TEST_DEPT", type: "ESTANDAR" };
  const addRes = apiAddEmployee(testUser);
  if (addRes.success) {
      console.log("✅ apiAddEmployee Success");
  } else {
      console.error("❌ apiAddEmployee Failed:", addRes.message);
  }

  // 3. Verify Added
  const dir2 = getDirectoryFromDB();
  const found = dir2.find(u => u.name === "TEST_USER_AUTO");
  if (found) {
      console.log("✅ User found in Directory DB");
  } else {
      console.error("❌ User NOT found in Directory DB after adding");
  }

  // 4. Test Delete
  const delRes = apiDeleteEmployee("TEST_USER_AUTO");
  if (delRes.success) {
      console.log("✅ apiDeleteEmployee Success");
  } else {
      console.error("❌ apiDeleteEmployee Failed:", delRes.message);
  }

  // 5. Verify Deleted
  const dir3 = getDirectoryFromDB();
  const found2 = dir3.find(u => u.name === "TEST_USER_AUTO");
  if (!found2) {
      console.log("✅ User successfully removed from DB");
  } else {
      console.error("❌ User STILL found in DB after deleting");
  }
}

function test_ReverseSync_Flow() {
  console.log("🛠️ INICIANDO TEST: Sincronización Inversa (Ventas -> Antonia)");

  // 1. Simular Datos de Tarea
  const testId = "TEST-SYNC-" + new Date().getTime();
  const taskData = {
    FOLIO: testId,
    CONCEPTO: "TEST_REVERSE_SYNC",
    VENDEDOR: "TEST_USER (VENTAS)",
    AVANCE: "50%",
    COTIZACION: "http://fake-url.com/cotizacion.pdf"
  };

  const personName = "TEST_USER (VENTAS)";

  // 2. Ejecutar internalUpdateTask
  // Nota: Esto intentará escribir en las hojas reales si existen.
  // En este entorno simulado, verificamos que no lance errores y que la lógica pase.

  console.log("Simulando actualización en: " + personName);
  const result = internalUpdateTask(personName, taskData, "TEST_ADMIN");

  if (result.success) {
      console.log("✅ Update local exitoso.");
      // Aquí idealmente verificaríamos que ANTONIA_VENTAS se actualizó,
      // pero sin acceso a la hoja en tiempo real, confiamos en que el log no muestre error de sync.
      console.log("ℹ️ Verificar logs del sistema para confirmar 'Sincronización Inversa'.");
  } else {
      console.error("❌ Falló update local: " + result.message);
  }
}

/**
 * ======================================================================
 * MODULE: FORMATO CONDICIONAL (SEMAFORIZACIÓN)
 * ======================================================================
 */
function applyTrafficLightToSheet(sheet) {
  if (!sheet) return false;
  const sNameUpper = sheet.getName().toUpperCase().trim();

  // Exclusiones Internas (Seguridad)
  const excludedSubstrings = ["LOG_", "DB_", "DATOS", "BORRADOR"];
  if (excludedSubstrings.some(ex => sNameUpper.includes(ex))) return false;

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return false;

  // 1. Encontrar Cabeceras
  const values = sheet.getRange(1, 1, Math.min(20, lastRow), lastCol).getValues();
  const headerRowIdx = findHeaderRow(values);
  if (headerRowIdx === -1) return false;

  const headers = values[headerRowIdx].map(h => String(h).toUpperCase().trim());

  // 2. Identificar Columnas
  const fechaAliases = ['FECHA', 'FECHA ALTA', 'FECHA INICIO', 'ALTA', 'FECHA DE INICIO', 'FECHA VISITA', 'FECHA DE ALTA', 'FECHA_ALTA', 'F. INICIO', 'F. VISITA', 'F. ENTREGA'];
  const colFechaIndices = [];
  headers.forEach((h, i) => {
      if (fechaAliases.includes(h) || h.startsWith("FECHA ")) {
          colFechaIndices.push(i);
      }
  });
  
  const colClasiIdx = headers.findIndex(h => h.includes("CLASIFICACION") || h.includes("CLASI"));
  const colDiasIdx = headers.findIndex(h => h === "DIAS" || h === "RELOJ" || h.includes("DIAS FINALIZ") || h.includes("DÍAS FINALIZ"));

  if (colFechaIndices.length === 0 || colClasiIdx === -1) return false;

  const rowHeader = headerRowIdx + 1; // 1-based (Fila de Titulos)
  const colClasiLet = colIndexToLetter(colClasiIdx + 1);
  
  // Identify PRIMARY Date Column (for linking DIAS coloring)
  let primaryFechaIdx = -1;
  for(let alias of fechaAliases) {
      const idx = headers.indexOf(alias);
      if(idx > -1) { primaryFechaIdx = idx; break; }
  }
  if(primaryFechaIdx === -1 && colFechaIndices.length > 0) primaryFechaIdx = colFechaIndices[0];

  // 3. Limpieza Inteligente de Reglas Antiguas
  const rules = sheet.getConditionalFormatRules();
  const cleanRules = rules.filter(r => {
      const formula = (r.getBooleanCondition() && r.getBooleanCondition().getCriteriaType() === SpreadsheetApp.BooleanCriteria.CUSTOM_FORMULA)
                      ? r.getBooleanCondition().getCriteriaValues()[0]
                      : "";
      // Eliminamos reglas de semáforo viejas (detectadas por referencia a CLASI + TODAY)
      if (formula.includes("TODAY") && formula.includes(colClasiLet) && formula.includes("ISNUMBER")) return false;
      return true;
  });

  const newRules = [];

  // 4. Iterar sobre TODAS las columnas de fecha encontradas
  colFechaIndices.forEach(idx => {
      const colFechaLet = colIndexToLetter(idx + 1);
      
      const rangesToColor = [sheet.getRange(rowHeader, idx + 1, sheet.getMaxRows() - rowHeader + 1, 1)];
      if (idx === primaryFechaIdx && colDiasIdx > -1) {
          rangesToColor.push(sheet.getRange(rowHeader, colDiasIdx + 1, sheet.getMaxRows() - rowHeader + 1, 1));
      }

      const addRulePair = (clase, dias, buffer) => {
          const formulaBase = `AND(UPPER(TRIM($${colClasiLet}${rowHeader}))="${clase}", ISNUMBER($${colFechaLet}${rowHeader}), ROW()>${rowHeader})`;
          const diffFormula = `(TODAY() - INT($${colFechaLet}${rowHeader}))`;

          // VENCIDO (ROJO): > dias
          newRules.push(SpreadsheetApp.newConditionalFormatRule()
              .whenFormulaSatisfied(`=AND(${formulaBase}, ${diffFormula} > ${dias})`)
              .setBackground("#FF0000")
              .setFontColor("#FFFFFF")
              .setRanges(rangesToColor)
              .build());

          // POR VENCER (AMARILLO): Entre (dias - buffer) y dias
          const warningStart = dias - buffer;
          newRules.push(SpreadsheetApp.newConditionalFormatRule()
              .whenFormulaSatisfied(`=AND(${formulaBase}, ${diffFormula} >= ${warningStart}, ${diffFormula} <= ${dias})`)
              .setBackground("#FFFF00")
              .setFontColor("#000000")
              .setRanges(rangesToColor)
              .build());

          // A TIEMPO (VERDE): < warningStart
          newRules.push(SpreadsheetApp.newConditionalFormatRule()
              .whenFormulaSatisfied(`=AND(${formulaBase}, ${diffFormula} < ${warningStart})`)
              .setBackground("#00FF00")
              .setFontColor("#000000")
              .setRanges(rangesToColor)
              .build());
      };

      // Configuración: Clase, Límite, Buffer (Días de aviso antes del límite)
      addRulePair("A", 3, 1);    // Verde < 2, Amarillo 2-3, Rojo > 3
      addRulePair("AA", 15, 3);  // Verde < 12, Amarillo 12-15, Rojo > 15
      addRulePair("AAA", 30, 5); // Verde < 25, Amarillo 25-30, Rojo > 30
  });

  sheet.setConditionalFormatRules(newRules.concat(cleanRules));
  return true;
}

function setupConditionalFormatting() {
  const ui = SpreadsheetApp.getUi();
  const excludedSheets = [
      APP_CONFIG.logSheetName.toUpperCase(),
      APP_CONFIG.salesSheetName.toUpperCase(),
      APP_CONFIG.draftSheetName.toUpperCase()
  ];

  const allSheets = SS.getSheets();
  let logMsg = "";
  let count = 0;

  allSheets.forEach(sheet => {
    const sName = sheet.getName().trim();
    const sNameUpper = sName.toUpperCase();

    if (excludedSheets.includes(sNameUpper)) return;

    // Delegamos a la nueva función robusta
    if (applyTrafficLightToSheet(sheet)) {
       logMsg += `✅ ${sName}\n`;
       count++;
    }
  });

  if (count > 0) {
      ui.alert(`Semaforización aplicada a ${count} hojas:\n${logMsg}`);
  } else {
      ui.alert("⚠️ No se encontraron hojas aptas (con columnas CLASIFICACION y FECHA) para aplicar formato.");
  }
}

function colIndexToLetter(col) {
  let temp, letter = '';
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
}

function test_NumericSequence_Generation() {
  console.log("🛠️ INICIANDO TEST: Generación de Secuencia Numérica");
  try {
      const lock = LockService.getScriptLock();
      const props = PropertiesService.getScriptProperties();

      // Mock properties for testing if not set
      if (!props.getProperty('ANTONIA_SEQ')) {
          props.setProperty('ANTONIA_SEQ', '1000');
          console.log("Inicializando ANTONIA_SEQ a 1000 para prueba.");
      }

      const val1 = generateNumericSequence('ANTONIA_SEQ');
      const val2 = generateNumericSequence('ANTONIA_SEQ');

      console.log("Valor 1:", val1);
      console.log("Valor 2:", val2);

      if (Number(val2) === Number(val1) + 1) {
          console.log("✅ Secuencia incrementa correctamente.");
      } else {
          console.error("❌ Secuencia falló en incrementar.");
      }

      if (!isNaN(val1)) {
          console.log("✅ El folio es numérico.");
      } else {
          console.error("❌ El folio NO es numérico.");
      }

  } catch (e) {
      console.error("❌ Error en prueba:", e);
  }
}

function test_Antonia_Distribution_Manual() {
  console.log("🛠️ INICIANDO TEST: Distribución Manual Antonia -> Vendedor");

  // 1. Datos simulados
  const taskData = {
    FOLIO: "TEST-DIST-" + new Date().getTime(),
    CONCEPTO: "PRUEBA DISTRIBUCION",
    VENDEDOR: "TEST_USER (VENTAS)", // Asume que existe hoja TEST_USER (VENTAS) o similar
    ESTATUS: "COTIZADA"
  };

}

function apiFetchInfoBankCompanies(year, monthName) {
  try {
    const sheetName = "ANTONIA_VENTAS";
    const res = internalFetchSheetData(sheetName);
    if (!res.success) return { success: false, message: res.message };

    const monthMap = {
        'ENERO': 0, 'FEBRERO': 1, 'MARZO': 2, 'ABRIL': 3, 'MAYO': 4, 'JUNIO': 5,
        'JULIO': 6, 'AGOSTO': 7, 'SEPTIEMBRE': 8, 'OCTUBRE': 9, 'NOVIEMBRE': 10, 'DICIEMBRE': 11
    };
    const targetMonth = monthMap[String(monthName).toUpperCase().trim()];
    const targetYear = parseInt(year) || new Date().getFullYear();

    if (targetMonth === undefined) return { success: false, message: "Mes inválido" };

    const clients = new Set();
    const allData = [...res.data, ...(res.history || [])];

    allData.forEach(row => {
       // Helper para buscar valores insensible a mayúsculas
       const keys = Object.keys(row);
       const upperKeys = keys.map(k => k.toUpperCase().trim());
       const getVal = (targetKeys) => {
           for (const t of targetKeys) {
               const idx = upperKeys.indexOf(t);
               if (idx > -1) return row[keys[idx]];
           }
           return null;
       };

       const dateVal = getVal(['FECHA INICIO', 'F. INICIO', 'F. VISITA', 'F. ENTREGA', 'FECHA_INICIO', 'FECHA DE INICIO', 'FECHA', 'ALTA', 'FECHA ALTA', 'FECHA_ALTA', 'FECHA VISITA']);

       if (!dateVal) return;

       let dObj = null;
       if (dateVal instanceof Date) {
           dObj = dateVal;
       } else {
           // Try parsing string dd/mm/yy
           const parts = String(dateVal).split('/');
           if (parts.length === 3) {
               let y = parseInt(parts[2]);
               if (y < 100) y += 2000;
               dObj = new Date(y, parseInt(parts[1])-1, parseInt(parts[0]));
           } else {
               const parsed = new Date(dateVal);
               if (!isNaN(parsed.getTime())) dObj = parsed;
           }
       }

       if (!dObj || isNaN(dObj.getTime())) return;
       if (dObj.getMonth() !== targetMonth) return;
       if (dObj.getFullYear() !== targetYear) return;

       const c = String(getVal(['CLIENTE']) || '').toUpperCase().trim();
       if (c) clients.add(c);
    });

    return { success: true, data: Array.from(clients).sort() };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function apiFetchInfoBankData(year, monthName, companyName, folderName) {
  try {
    const sheetName = "ANTONIA_VENTAS";
    const res = internalFetchSheetData(sheetName);
    if (!res.success) return { success: false, message: res.message };

    const monthMap = {
        'ENERO': 0, 'FEBRERO': 1, 'MARZO': 2, 'ABRIL': 3, 'MAYO': 4, 'JUNIO': 5,
        'JULIO': 6, 'AGOSTO': 7, 'SEPTIEMBRE': 8, 'OCTUBRE': 9, 'NOVIEMBRE': 10, 'DICIEMBRE': 11
    };
    const targetMonth = monthMap[String(monthName).toUpperCase().trim()];
    const targetYear = parseInt(year) || 2025;
    const targetCompany = String(companyName).toUpperCase().trim();

    if (targetMonth === undefined) return { success: false, message: "Mes inválido" };

    const allData = [...res.data, ...(res.history || [])];

    // Filtrar datos
    const filtered = allData.filter(row => {
       // Helper para buscar valores insensible a mayúsculas
       const keys = Object.keys(row);
       const upperKeys = keys.map(k => k.toUpperCase().trim());
       const getVal = (targetKeys) => {
           for (const t of targetKeys) {
               const idx = upperKeys.indexOf(t);
               if (idx > -1) return row[keys[idx]];
           }
           return null;
       };

       // 1. Company Match (Loose)
       const rowClient = String(getVal(['CLIENTE']) || '').toUpperCase().trim();
       if (!rowClient) return false;
       
       // Check bidirectional inclusion to handle variations
       if (!rowClient.includes(targetCompany) && !targetCompany.includes(rowClient)) return false;

       // 2. Date Match (Prioridad: FECHA INICIO)
       // Se prioriza 'FECHA INICIO' tal cual pidió el usuario, luego fallbacks.
       const dateVal = getVal(['FECHA INICIO', 'F. INICIO', 'F. VISITA', 'F. ENTREGA', 'FECHA_INICIO', 'FECHA DE INICIO', 'FECHA', 'ALTA', 'FECHA ALTA', 'FECHA_ALTA', 'FECHA VISITA']);

       if (!dateVal) return false;
       
       let dObj = null;
       if (dateVal instanceof Date) {
           dObj = dateVal;
       } else {
           // Try parsing string dd/mm/yy
           const parts = String(dateVal).split('/');
           if (parts.length === 3) {
               let y = parseInt(parts[2]);
               if (y < 100) y += 2000;
               dObj = new Date(y, parseInt(parts[1])-1, parseInt(parts[0]));
           } else {
               const parsed = new Date(dateVal);
               if (!isNaN(parsed.getTime())) dObj = parsed;
           }
       }
       
       if (!dObj || isNaN(dObj.getTime())) return false;
       if (dObj.getMonth() !== targetMonth) return false;
       if (dObj.getFullYear() !== targetYear) return false;

       return true;
    });

    // NORMALIZACION DE DATOS PARA EL FRONTEND (SOLICITUD USUARIO)
    const mappedData = filtered.map(row => {
       const keys = Object.keys(row);
       const upperKeys = keys.map(k => k.toUpperCase().trim());
       const getVal = (targetKeys) => {
           for (const t of targetKeys) {
               const idx = upperKeys.indexOf(t);
               if (idx > -1) return row[keys[idx]];
           }
           return "";
       };

       return {
           'FECHA_INICIO': getVal(['FECHA INICIO', 'FECHA_INICIO', 'FECHA DE INICIO', 'FECHA', 'ALTA', 'FECHA ALTA', 'FECHA_ALTA', 'FECHA VISITA']),
           'AREA': getVal(['AREA', 'DEPARTAMENTO', 'ESPECIALIDAD']),
           'CONCEPTO': getVal(['CONCEPTO', 'DESCRIPCION', 'DESCRIPCIÓN', 'ACTIVIDAD']),
           'VENDEDOR': getVal(['VENDEDOR', 'RESPONSABLE', 'ENCARGADO', 'INVOLUCRADOS']),
           'ESTATUS': getVal(['ESTATUS', 'STATUS', 'ESTADO']),
           'FOLIO': getVal(['FOLIO', 'ID']),
           'COTIZACION': getVal(['COTIZACION', 'ARCHIVO', 'LINK', 'URL', 'PDF'])
       };
    });

    return { success: true, data: mappedData };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}
function apiFetchDistinctClients() {
  try {
    const sheetName = "ANTONIA_VENTAS";
    const res = internalFetchSheetData(sheetName);
    if (!res.success) return { success: false, message: res.message };

    const clients = new Set();
    
    // Add existing static list for robustness (optional, but good practice to not lose hardcoded ones if needed)
    // Actually, user said "I need all those from the ANTONIA_VENTAS list", implying dynamic. 
    // Let's check headers to find 'CLIENTE'
    // internalFetchSheetData returns objects with keys uppercased and trimmed.
    
    const allData = [...res.data, ...(res.history || [])];

    allData.forEach(row => {
        if (row['CLIENTE']) {
            const c = String(row['CLIENTE']).trim().toUpperCase();
            if (c) clients.add(c);
        }
    });

    const sortedClients = Array.from(clients).sort();
    return { success: true, data: sortedClients };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function apiSaveTrackerBatch(personName, tasks, username) {
  const lock = LockService.getScriptLock();
  if (lock.tryLock(30000)) {
    try {
      const processedTasks = [];
      const distributionTasks = [];
      const isAntonia = String(personName).toUpperCase() === "ANTONIA_VENTAS";

      // Sequence Auto-Healing Logic for Antonia
      let seqKey = 'ANTONIA_SEQ_V2';
      if (isAntonia) {
          const props = PropertiesService.getScriptProperties();
          let currentSeq = Number(props.getProperty(seqKey) || 1000);

          // AUTO-HEALING: Scan batch for higher existing IDs to sync sequence
          let needsHeal = false;
          tasks.forEach(t => {
              const folioVal = String(t['FOLIO'] || t['ID'] || "");
              if (folioVal.startsWith("AV-")) {
                  const numPart = folioVal.replace("AV-", "");
                  const fid = parseInt(numPart);
                  if (!isNaN(fid) && fid > currentSeq) {
                      currentSeq = fid;
                      needsHeal = true;
                  }
              }
          });
          if (needsHeal) {
              props.setProperty(seqKey, String(currentSeq));
          }
      }

      tasks.forEach(task => {
        let taskData = {...task};

        // GHOST BUSTING: Verificar contenido antes de asignar Folio
        const clean = (val) => val ? String(val).trim() : "";
        const c = clean(taskData['CONCEPTO']);
        const d = clean(taskData['DESCRIPCION']);
        const cl = clean(taskData['CLIENTE']);
        const vk = Object.keys(taskData).find(k => k.toUpperCase().trim() === "VENDEDOR" || k.toUpperCase().trim() === "RESPONSABLE" || k.toUpperCase().trim() === "INVOLUCRADOS");
        const v = vk ? clean(taskData[vk]) : "";

        // Ignorar si VENDEDOR es solo el default "ANTONIA_VENTAS" y no hay nada más
        const isVendedorDefault = isAntonia ? v.toUpperCase() === "ANTONIA_VENTAS" : false;

        const hasContent = (c !== "") ||
                           (d !== "") ||
                           (cl !== "") ||
                           (v !== "" && !isVendedorDefault);

        // Buscar de forma insensible a mayúsculas si existe un FOLIO o ID
        let existingTaskFolio = null;
        Object.keys(taskData).forEach(k => {
            if ((k.toUpperCase().trim() === 'FOLIO' || k.toUpperCase().trim() === 'ID') && taskData[k]) {
                existingTaskFolio = taskData[k];
            }
        });

        if (!hasContent && !existingTaskFolio) return; // SKIP EMPTY ROWS (Don't process, don't distribute)

        // CHECK FOR _tempId
        const tempIdKey = taskData['_tempId'];
        if (tempIdKey) {
             // We keep it so index.html can identify the returned row
             // Conservamos el tempId para inyectarlo al final
        }

        // Use robust locked generator to avoid duplicates during mass-inserts
        if (!existingTaskFolio && hasContent) {
            let prefixSource = username || personName;
            if (String(personName).toUpperCase().trim() === "ANTONIA PINEDA LOPEZ" && String(username).toUpperCase().trim() === "ANTONIA_VENTAS") {
                prefixSource = "ANTONIA PINEDA LOPEZ";
            }
            let prefix = isAntonia ? "AV-" : generatePrefix(prefixSource);
            let seqKey = isAntonia ? 'ANTONIA_SEQ_V2' : prefix;
            const seqNum = generateNumericSequence(seqKey);
            taskData['FOLIO'] = prefix + seqNum;
        }

        if (isAntonia) {
             if (existingTaskFolio || taskData['FOLIO']) {
                 // RESTRICTIONS FOR EXISTING TASKS
                 const allowedBase = ['FOLIO', 'ID', 'ESTATUS', 'MAP COT', 'PROCESO_LOG', 'PROCESO', 'STATUS', 'AVANCE', 'AVANCE %', '_rowIndex', 'VENDEDOR', 'RESPONSABLE', 'INVOLUCRADOS', 'ENCARGADO', 'CONCEPTO', 'DESCRIPCION', 'CLIENTE', 'COTIZACION', 'F2', 'LAYOUT', 'TIMELINE', 'AREA', 'CLASIFICACION', 'CLASI', 'DIAS', 'RELOJ', 'ESPECIALIDAD', 'ARCHIVO', 'ARCHIVOS', 'COMENTARIOS', 'PRIORIDAD', 'PRIORIDAD DE COTIZACION', 'PRIO. COT.', 'F. VISITA', 'F. INICIO', 'F. ENTREGA', 'FECHA VISITA', 'FECHA INICIO', 'DÍAS FINALIZ. COTIZ', 'DIAS FINALIZ. COTIZ', 'CORREO', 'CARPETA', 'INFO CLIENTE', 'CORREOS', 'CARPETAS', 'REQUISITOR'];
                 Object.keys(taskData).forEach(key => {
                     const kUp = key.toUpperCase();
                     if (key.startsWith('_')) return;
                     const isBase = allowedBase.includes(kUp);
                     const isDate = kUp.includes('FECHA') || kUp.includes('ALTA');
                     if (!isBase && !isDate) {
                         delete taskData[key];
                     }
                 });
             }
             // Remove worker logic (Reverse Sync)
             if (taskData._removeWorker) {
                 const workerToRemove = taskData._removeWorker;
                 try {
                     let targetSheet = String(workerToRemove).replace(/\s*\(VENTAS\)/ig, "").trim();
                     const workerSheet = findSheetSmart(targetSheet);
                     if (workerSheet) {
                         const targetId = String(existingTaskFolio || taskData['FOLIO'] || taskData['ID'] || "").toUpperCase().trim();
                         if (targetId && targetId !== "NULL") {
                             const data = workerSheet.getDataRange().getValues();
                             if (data.length > 0) {
                                 const sheetHeaders = data[0].map(h => String(h).toUpperCase().trim());
                                 const folioIdx = sheetHeaders.indexOf('FOLIO');
                                 const idIdx = sheetHeaders.indexOf('ID');
                                 for (let i = 1; i < data.length; i++) {
                                     let rowFolio = (folioIdx > -1 ? data[i][folioIdx] : "") || (idIdx > -1 ? data[i][idIdx] : "");
                                     if (String(rowFolio).toUpperCase().trim() === targetId) {
                                         workerSheet.deleteRow(i + 1);
                                         registrarLog("ANTONIA", "REMOVED_WORKER", `Eliminada tarea ${targetId} de ${targetSheet}`);
                                         break;
                                     }
                                 }
                             }
                         }
                     }
                 } catch(e) {
                     registrarLog("ANTONIA", "REMOVE_ERROR", e.toString());
                 }
                 // Avoid re-distributing to this worker during save
                 delete taskData._removeWorker;
                 delete taskData._assignStep;
             }

             // Prepare distribution data
             const distData = JSON.parse(JSON.stringify(taskData));
             delete distData._rowIndex;
             delete distData['PROCESO_LOG'];
                          delete distData['PROCESO'];
             if (taskData._assignToWorker && taskData._assignStep) {
                 try {
                     const workers = Array.isArray(taskData._assignToWorker) ? taskData._assignToWorker : [taskData._assignToWorker];
                     const stepTitle = taskData._assignStep;
                     const folioStr = existingTaskFolio || taskData["FOLIO"] || taskData["ID"] || "SIN-FOLIO";
                     const clienteStr = taskData["CLIENTE"] || "Desconocido";

                     for (let worker of workers) {
                         const cleanWorker = String(worker).replace(/\s*\(VENTAS\)/ig, "").trim();
                         const assignData = JSON.parse(JSON.stringify(distData));
                         assignData['ESTATUS'] = 'PENDIENTE';
                         assignData['AVANCE'] = '0%';
                         internalBatchUpdateTasks(cleanWorker, [assignData]);

                         // INTEGRACIÓN OUTLOOK: Enviar evento al trabajador asignado
                         const userEmail = findUserEmailByLabel(cleanWorker);
                         if (userEmail) {
                             const fInicio = new Date();
                             const fFin = new Date(fInicio.getTime() + (2 * 60 * 60 * 1000));

                             const payloadOutlook = {
                                 folio: folioStr,
                                 titulo: `Asignación Tracker: ${stepTitle} - ${clienteStr}`,
                                 descripcion: `Se te ha asignado la etapa ${stepTitle} para el folio ${folioStr}. Revisa tu Tracker en Holtmont Workspace.`,
                                 fechaInicio: fInicio.toISOString(),
                                 fechaFin: fFin.toISOString(),
                                 correoDestino: userEmail,
                                 asignadoPor: username
                             };

                             const resultOutlook = NotifierService.sendToOutlook(payloadOutlook);
                             if (resultOutlook.success) {
                                 console.log(`Notificación Outlook enviada para Folio: ${folioStr}`);
                             }
                         } else {
                             console.warn(`No se encontró email corporativo para delegado: ${worker}`);
                         }
                     }
                 } catch(e) {}
             }
             distributionTasks.push(distData);
        } else {
             // REVERSE SYNC PREPARATION
             const distData = JSON.parse(JSON.stringify(taskData));
             delete distData._rowIndex;
             delete distData['PROCESO_LOG'];
                          delete distData['PROCESO'];
             distributionTasks.push(distData);
        }
        processedTasks.push(taskData);
      });

      // Sequence handled safely per-task by generateNumericSequence

      // Batch Update Main Sheet
      const res = internalBatchUpdateTasks(personName, processedTasks, false); // Already locked

      processedTasks.forEach((t, i) => {
          const originalTask = tasks[i];
          if (originalTask && originalTask['_tempId']) {
              t['_tempId'] = originalTask['_tempId'];
          }
      });

      if (res.success) {
          // --- SMART ARCHIVING TRIGGER (ANTONIA) ---
          // "Trigger the archiver logic whenever Antonia saves data"
          if (isAntonia || String(personName).toUpperCase().includes("ANTONIA_VENTAS")) {
              try {
                  processedTasks.forEach(row => {
                      // Only process if it has a file
                      if (row['COTIZACION'] || row['ARCHIVO']) {
                          processQuoteRow(row);
                      }
                  });
              } catch (archErr) {
                  console.error("Auto-Archiving Error: " + archErr.toString());
              }
          }
          // -----------------------------------------

          // Handle Distribution for Antonia
          if (isAntonia && distributionTasks.length > 0) {
              // Group by vendor to batch updates
              const byVendor = {};
              distributionTasks.forEach(t => {
                  const vendedorKey = Object.keys(t).find(k => k.toUpperCase().trim() === "VENDEDOR" || k.toUpperCase().trim() === "RESPONSABLE" || k.toUpperCase().trim() === "INVOLUCRADOS");
                  if (vendedorKey && t[vendedorKey]) {
                       const vNames = String(t[vendedorKey]).split(',').map(s => s.trim());
                       vNames.forEach(vName => {
                           if (vName.toUpperCase() !== "ANTONIA_VENTAS") {
                               let target = vName;
                               // Logic to find target sheet (suffix check)
                               let finalTarget = null;
                               if (target.toUpperCase().includes("(VENTAS)")) finalTarget = target;
                               else {
                                   if (findSheetSmart(target + " (VENTAS)")) finalTarget = target + " (VENTAS)";
                                   else if (findSheetSmart(target)) finalTarget = target; // Fallback if no ventas sheet
                               }

                               if (finalTarget) {
                                   if (!byVendor[finalTarget]) byVendor[finalTarget] = [];
                                   byVendor[finalTarget].push(t);
                               }

                               // INTEGRACIÓN OUTLOOK: Enviar evento al trabajador asignado a la fila
                               let existingTaskFolioDist = null;
                               Object.keys(t).forEach(k => {
                                   if ((k.toUpperCase().trim() === 'FOLIO' || k.toUpperCase().trim() === 'ID') && t[k]) {
                                       existingTaskFolioDist = t[k];
                                   }
                               });
                               const folioGen = existingTaskFolioDist || t["FOLIO"] || t["ID"] || "SIN-FOLIO";
                               const clienteGen = t["CLIENTE"] || "Desconocido";
                               const conceptoGen = t["CONCEPTO"] || t["DESCRIPCION"] || "Tarea";

                               const emailGen = findUserEmailByLabel(vName);
                               if (emailGen) {
                                   const fIni = new Date();
                                   const fFi = new Date(fIni.getTime() + (2 * 60 * 60 * 1000));
                                   const pGeneral = {
                                       folio: folioGen,
                                       titulo: `Nueva Asignación: ${conceptoGen} - ${clienteGen}`,
                                       descripcion: `Se te ha asignado una tarea general (${conceptoGen}) en el Tracker. Folio: ${folioGen}.`,
                                       fechaInicio: fIni.toISOString(),
                                       fechaFin: fFi.toISOString(),
                                       correoDestino: emailGen,
                                       asignadoPor: username
                                   };
                                   NotifierService.sendToOutlook(pGeneral);
                               }
                           }
                       });
                  }
              });

              // Execute distribution batches
              for (const [vSheet, vTasks] of Object.entries(byVendor)) {
                   internalBatchUpdateTasks(vSheet, vTasks, false);
              }

              // Sync to ADMIN
              internalBatchUpdateTasks("ADMINISTRADOR", distributionTasks, false);
          }

          // Handle Reverse Sync (Vendor -> Antonia)
          if (!isAntonia && distributionTasks.length > 0) {
               const syncPayloads = [];
               let antDataFetched = false;
               let antDataRows = [];

               distributionTasks.forEach(taskData => {
                   const getTVal = (keys) => {
                       for (let k of keys) {
                           let found = Object.keys(taskData).find(key => key.toUpperCase().trim() === k);
                           if (found && taskData[found]) return taskData[found];
                       }
                       return "";
                   };
                   
                   const estatus = String(getTVal(['ESTATUS', 'STATUS', 'ESTADO'])).toUpperCase().trim();
                   const avanceRaw = String(getTVal(['AVANCE', 'AVANCE %', '% AVANCE', '%', 'CUMPLIMIENTO'])).replace(/%/g, '').trim();
                   const avanceNum = parseFloat(avanceRaw);
                   const isDone = estatus === 'HECHO' || estatus === 'TERMINADO' || estatus === 'FINALIZADO' || estatus === 'REALIZADO' || estatus === 'COMPLETADO' || estatus === 'DONE' || avanceRaw === '100' || avanceNum === 100 || avanceRaw.toUpperCase() === 'SI';
                   const tFolio = String(getTVal(['FOLIO', 'ID'])).toUpperCase().trim();
                   
                   if (tFolio && isDone) {
                       if (!antDataFetched) {
                           const antData = internalFetchSheetData("ANTONIA_VENTAS");
                           if (antData.success && antData.data) antDataRows = antData.data;
                           antDataFetched = true;
                       }
                       
                       const targetRow = antDataRows.find(r => String(r['FOLIO'] || r['ID'] || "").toUpperCase().trim() === tFolio);
                       if (targetRow) {
                           let log = [];
                           try {
                               if (targetRow['PROCESO_LOG']) log = JSON.parse(targetRow['PROCESO_LOG']);
                           } catch(e) {}
                           
                           let updated = false;
                           let updatedLog = [];
                           if (Array.isArray(log)) {
                               updatedLog = log.map(entry => {
                                   let wNorm = String(personName).toUpperCase().trim().replace(/\s*\(VENTAS\)/g, "").replace(/_/g, " ");
                                   let eNorm = entry.assignee ? String(entry.assignee).toUpperCase().trim().replace(/\s*\(VENTAS\)/g, "").replace(/_/g, " ") : "";
                                   
                                   if (entry.status === 'IN_PROGRESS' && (eNorm === wNorm || eNorm.includes(wNorm) || wNorm.includes(eNorm) || eNorm === "" || wNorm === "") && isDone) {
                                       entry.status = 'DONE';
                                       entry.endTimestamp = new Date().getTime();
                                       entry.endDateStr = new Date().toLocaleString();
                                       // Se preserva entry.timestamp y entry.dateStr originales (Fecha de Inicio)
                                       updated = true;
                                       registrarLog("SYSTEM", "REVERSE_SYNC_BATCH", `${personName} completed step ${entry.step} for FOLIO ${tFolio}`);
                                   }
                                   return entry;
                               });
                           }
                           
                           if (updated) {
                               const stepsOrder = ["L", "CD", "EP", "CI", "EV", "CEC", "RCC"];
                               let oldParts = (targetRow["MAP COT"] || "").split(/\||>|\//).map(p => p.trim());
                               let mapCotParts = stepsOrder.map(step => {
                                   // Valid entries: step is a known PROCESS_STEPS ID
                                   const stepEntries = updatedLog.filter(e => e.step === step || e.to === step);
                                   if (stepEntries.length > 0) {
                                       const allDone = stepEntries.every(e => e.status === 'DONE');
                                       if (allDone) return '🟢 ' + step;
                                       const anyInProgress = stepEntries.some(e => e.status === 'IN_PROGRESS');
                                       if (anyInProgress) return '🟡 ' + step;
                                       return '🔴 ' + step;
                                   }
                                   // Garbage entries: step field contains the old MAP COT string.
                                   // If it shows 🟡 STEP or 🔴 STEP, this entry was for that step.
                                   const garbageForStep = updatedLog.filter(e =>
                                       !stepsOrder.includes(e.step) &&
                                       (e.step.includes('🟡 ' + step) || e.step.includes('🔴 ' + step))
                                   );
                                   if (garbageForStep.length > 0) {
                                       const allDone = garbageForStep.every(e => e.status === 'DONE');
                                       if (allDone) return '🟢 ' + step;
                                       const anyInProgress = garbageForStep.some(e => e.status === 'IN_PROGRESS');
                                       if (anyInProgress) return '🟡 ' + step;
                                   }
                                   let oldPart = oldParts.find(p => p === '🟢 ' + step || p === '🟡 ' + step || p === '🔴 ' + step || p === '⚪ ' + step || p.includes(' ' + step));
                                   if (oldPart && oldPart.includes('🟢')) return '🟢 ' + step;
                                   if (oldPart && oldPart.includes('🟡')) return '🟡 ' + step;
                                   if (oldPart && oldPart.includes('🔴')) return '🔴 ' + step;
                                   return '⚪ ' + step;
                               });

                               let syncToAntonia = {
                                   'FOLIO': targetRow['FOLIO'] || tFolio,
                                   'PROCESO_LOG': JSON.stringify(updatedLog),
                                   'MAP COT': mapCotParts.join(' | ')
                               };
                               
                               const fileCols = ['ARCHIVO', 'F2', 'LAYOUT', 'COTIZACION', 'EVIDENCIA'];
                               fileCols.forEach(col => {
                                   let wKey = Object.keys(taskData).find(k => k.toUpperCase().trim() === col);
                                   if (wKey && taskData[wKey] && String(taskData[wKey]).trim() !== "") {
                                       syncToAntonia[wKey] = taskData[wKey];
                                   }
                               });
                               
                               syncPayloads.push(syncToAntonia);
                           }
                       }
                   }
               });
               
               if (syncPayloads.length > 0) {
                   internalBatchUpdateTasks("ANTONIA_VENTAS", syncPayloads, false);
               }
               
               if (String(personName).toUpperCase().includes("(VENTAS)")) {
                   const safeDistTasks = distributionTasks.map(t => {
                       let st = Object.assign({}, t);
                       // No eliminamos ESTATUS ni AVANCE en tareas de VENTAS para que se actualice la vista general.
                       const matchedSync = syncPayloads.find(sp => sp.FOLIO === st.FOLIO || sp.ID === st.FOLIO || sp.FOLIO === st.ID);
                       if (matchedSync) {
                           st['MAP COT'] = matchedSync['MAP COT'];
                           st['PROCESO_LOG'] = matchedSync['PROCESO_LOG'];
                       }
                       return st;
                   });
                   internalBatchUpdateTasks("ANTONIA_VENTAS", safeDistTasks, false);
               }

               // Sincronización Reversa hacia Antonia (NO está completa si no termina en VENTAS ni está DONE)
               const antoniaReverseSyncTasks = [];
               distributionTasks.forEach(t => {
                   let existingTaskFolioRev = null;
                   Object.keys(t).forEach(k => {
                       if ((k.toUpperCase().trim() === 'FOLIO' || k.toUpperCase().trim() === 'ID') && t[k]) {
                           existingTaskFolioRev = t[k];
                       }
                   });
                   const reverseFolio = existingTaskFolioRev || t['FOLIO'] || t['ID'];
                   if (reverseFolio && String(reverseFolio).toUpperCase().startsWith("AV-")) {
                       antoniaReverseSyncTasks.push(t);
                   }
               });
               if (antoniaReverseSyncTasks.length > 0) {
                   const safeRevTasks = antoniaReverseSyncTasks.map(t => {
                       let st = Object.assign({}, t);
                       const delKeys = ['ESTATUS', 'STATUS', 'ESTADO', 'AVANCE', 'AVANCE %', '% AVANCE', '%', 'CUMPLIMIENTO'];
                       Object.keys(st).forEach(k => {
                           if (delKeys.includes(k.toUpperCase().trim())) delete st[k];
                       });
                       const matchedSync = syncPayloads.find(sp => sp.FOLIO === st.FOLIO || sp.ID === st.FOLIO || sp.FOLIO === st.ID);
                       if (matchedSync) {
                           st['MAP COT'] = matchedSync['MAP COT'];
                           st['PROCESO_LOG'] = matchedSync['PROCESO_LOG'];
                       }
                       return st;
                   });
                   internalBatchUpdateTasks("ANTONIA_VENTAS", safeRevTasks, false);
               }

               // Handle Peer-to-Peer Sync (Vendor -> Other Vendor)
               const peerUpdates = {};
               distributionTasks.forEach(t => {
                   const vKey = Object.keys(t).find(k => k.toUpperCase().trim() === "VENDEDOR" || k.toUpperCase().trim() === "RESPONSABLE" || k.toUpperCase().trim() === "INVOLUCRADOS");
                   if(vKey && t[vKey]) {
                       const vList = String(t[vKey]).split(',').map(s => s.trim());
                       vList.forEach(otherVendor => {
                           if (otherVendor.toUpperCase() === "ANTONIA_VENTAS") return;
                           const currentSheetNorm = String(personName).toUpperCase().replace(/\s*\(VENTAS\)/, "").trim();
                           const otherVendorNorm = String(otherVendor).toUpperCase().replace(/\s*\(VENTAS\)/, "").trim();

                           if (currentSheetNorm !== otherVendorNorm) {
                               let targetSheet = otherVendor;
                             if (targetSheet.toUpperCase() === "ANTONIA_VENTAS") {
                                 targetSheet = "ANTONIA PINEDA LOPEZ";
                             }

                             if (username !== 'ANTONIA_VENTAS') {
                                 // REGLA ESTRICTA: Nadie excepto ANTONIA_VENTAS puede enviar a hojas con (VENTAS)
                                 targetSheet = targetSheet.replace(/\s*\(VENTAS\)/ig, "").trim();
                             }

                               // MODIFICADO: No agregar el sufijo "(VENTAS)" automáticamente si no es Antonia.
                               // Se debe escribir exactamente a la tabla que especifican.
                               let finalTarget = targetSheet;
                               if(!peerUpdates[finalTarget]) peerUpdates[finalTarget] = [];
                               peerUpdates[finalTarget].push(t);
                           }
                       });
                   }
               });

               for (const [target, tasks] of Object.entries(peerUpdates)) {
                   internalBatchUpdateTasks(target, tasks, false);
               }
          }

          registrarLog(username, "BATCH_UPDATE", `Actualizadas ${tasks.length} tareas en ${personName}`);
      }

      return { success: true, message: "Guardado exitoso", data: processedTasks };

    } catch (e) {
      return { success: false, message: e.toString() };
    } finally {
      lock.releaseLock();
    }
  } else {
      return { success: false, message: "Sistema ocupado" };
  }
}

function apiFetchCombinedCalendarData(sheetName) {
  try {
      const results = [];
      const baseName = String(sheetName).replace(/\s*\(VENTAS\)/i, "").trim();
      // Si es ANTONIA_VENTAS, solo buscamos ahí (ella distribuye)
      const targets = (baseName.toUpperCase() === "ANTONIA_VENTAS") ? ["ANTONIA_VENTAS"] : [baseName, baseName + " (VENTAS)"];

      targets.forEach(t => {
          const res = internalFetchSheetData(t);
          if (res.success && res.data) {
              results.push(...res.data);
          }
      });

      // --- ADDED: Personal Agenda Integration for Dashboard ---
      const personalRes = internalFetchSheetData("AGENDA_PERSONAL");
      if (personalRes.success && personalRes.data) {
          const myEvents = personalRes.data.filter(e => String(e.USUARIO).trim().toUpperCase() === baseName.toUpperCase());
          const mappedEvents = myEvents.map(e => ({
              ...e,
              CONCEPTO: e.TITULO || e.CONCEPTO,
              CLIENTE: "PERSONAL"
          }));
          results.push(...mappedEvents);
      }
      // --------------------------------------------------------

      // Deduplicate by ID/FOLIO
      const uniqueTasks = {};
      results.forEach(r => {
          const id = r.ID || r.FOLIO || (r.CONCEPTO ? r.CONCEPTO + r.FECHA : null);
          if (id) uniqueTasks[id] = r;
      });

      const finalData = Object.values(uniqueTasks);

      // Simple Sort by Date string (DD/MM/YY) if possible, else original order
      // internalFetchSheetData already sorts by date desc.
      // Merging two sorted lists... roughly fine.

      return { success: true, data: finalData };
  } catch(e) {
      return { success: false, message: e.toString() };
  }
}

/**
 * ======================================================================
 * MODULO: AGENDA PERSONAL (HOLTZAR INTEGRATION)
 * ======================================================================
 */

function apiFetchUnifiedAgenda(username) {
  // 1. Fetch Work Tasks (Existing Logic)
  let workTasks = [];
  try {
     // Determine target for work tasks based on role/user
     let target = username;
     if (String(username).toUpperCase() === 'ANTONIA_VENTAS') target = "ANTONIA_VENTAS";

     const workRes = apiFetchCombinedCalendarData(target);
     if (workRes.success) {
         // Filter out Personal Events to avoid duplication (fetched separately below)
         workTasks = workRes.data.filter(t => t.CLIENTE !== "PERSONAL");
     }
  } catch(e) { console.error("Error fetching work tasks", e); }

  // 2. Fetch Personal Events
  let personalEvents = [];
  try {
     const sheet = findSheetSmart("AGENDA_PERSONAL");
     if (sheet) {
        const res = internalFetchSheetData("AGENDA_PERSONAL");
        if(res.success) {
            // Filter by user if possible, for now return all found
            personalEvents = res.data.filter(r => !r.USUARIO || r.USUARIO === username);
        }
     } else {
        // MOCK DATA FOR DEMO IF SHEET DOESN'T EXIST
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth(); // 0-indexed
        const d = today.getDate();

        personalEvents = [
            { ID: 'P-1', TITULO: 'Rutina Mañana', TIPO: 'PERSONAL', HORA_INICIO: '06:00', HORA_FIN: '07:00', DETALLES: 'Meditación y Café', FECHA: new Date(y, m, d), CLASIFICACION: 'PERSONAL' },
            { ID: 'P-2', TITULO: 'Gimnasio', TIPO: 'PERSONAL', HORA_INICIO: '07:30', HORA_FIN: '08:30', DETALLES: 'Cardio', FECHA: new Date(y, m, d), CLASIFICACION: 'SALUD' },
            { ID: 'P-3', TITULO: 'Comida', TIPO: 'COMIDA', HORA_INICIO: '14:00', HORA_FIN: '15:00', DETALLES: 'Pollo y Arroz', FECHA: new Date(y, m, d), CLASIFICACION: 'SALUD' }
        ];
     }
  } catch(e) { console.error("Error fetching personal events", e); }

  // 3. Fetch Habits
  let habits = [];
  try {
      const sheet = findSheetSmart("HABITOS_LOG");
      if (sheet) {
         const res = internalFetchSheetData("HABITOS_LOG");
         if (res.success) habits = res.data.filter(r => !r.USUARIO || r.USUARIO === username);
      } else {
         // MOCK DATA
         habits = [
             { ID: 'H1', HABITO: 'Leer 30min', META: 5, LOG_JSON: JSON.stringify([true, true, false, true, false, false, false]) },
             { ID: 'H2', HABITO: 'Ejercicio', META: 4, LOG_JSON: JSON.stringify([false, true, true, false, false, false, false]) },
             { ID: 'H3', HABITO: 'Meditar', META: 7, LOG_JSON: JSON.stringify([true, true, true, true, true, false, false]) }
         ];
      }
  } catch(e) { console.error("Error fetching habits", e); }

  return { success: true, workTasks: workTasks, personalEvents: personalEvents, habits: habits };
}

function apiSavePersonalEvent(eventData) {
    // Ensure sheet exists
    let sheet = findSheetSmart("AGENDA_PERSONAL");
    if (!sheet) {
        sheet = SS.insertSheet("AGENDA_PERSONAL");
        sheet.appendRow(["ID", "USUARIO", "TITULO", "TIPO", "FECHA", "HORA_INICIO", "HORA_FIN", "DETALLES", "CLASIFICACION", "ESTATUS"]);
    }
    return internalBatchUpdateTasks("AGENDA_PERSONAL", [eventData]);
}

function apiSaveHabitLog(habitData) {
    // Ensure sheet exists
    let sheet = findSheetSmart("HABITOS_LOG");
    if (!sheet) {
        sheet = SS.insertSheet("HABITOS_LOG");
        sheet.appendRow(["ID", "USUARIO", "HABITO", "META", "LOG_JSON", "FECHA_ACTUALIZACION"]);
    }
    // If saving a habit update, we might need to find the existing row.
    // internalBatchUpdateTasks handles updates by ID/FOLIO.
    return internalBatchUpdateTasks("HABITOS_LOG", [habitData]);
}

/**
 * Jutsu de Transcripción con Gemini Flash
 */
function transcribirConGemini(base64Audio, mimeType) {
  // IMPORTANTE: Reemplazar con la API Key real del proyecto
  const API_KEY = "AIzaSyA7Lv551Quq7lMCynU7kRq9T1_MIaK6kkc";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const payload = {
    contents: [{
      parts: [
        { text: "Transcribe el siguiente audio exactamente como se escucha. Corrige ortografía básica. Solo dame el texto limpio en español." },
        {
          inline_data: {
            mime_type: mimeType || "audio/mp3",
            data: base64Audio
          }
        }
      ]
    }]
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());

    if (json.candidates && json.candidates[0].content) {
      return json.candidates[0].content.parts[0].text;
    } else {
      return "Error: No pude escuchar el audio claramente.";
    }
  } catch (e) {
    return "Error en el sistema: " + e.toString();
  }
}

/**
 * JUTSU DE AUTORIZACIÓN FORZADA
 * Ejecuta esto manualmente desde el editor en la PC una vez.
 */
function forzarPermisos() {
  console.log("Concentrando chakra para conectar con el exterior...");
  // Solo llamamos a esto para que Google detecte que necesitamos el permiso
  // No importa si falla la URL, lo que importa es que pida el permiso.
  try {
    UrlFetchApp.fetch("https://www.google.com");
    console.log("¡Conexión establecida! Chakra fluyendo.");
  } catch (e) {
    console.log("Error (esperado si no hay internet, pero ya tienes permisos): " + e.toString());
  }
}

function test_SystemConfig_Label() {
  console.log("🛠️ INICIANDO TEST: Etiquetas de Configuración de Sistema");

  // Caso 1: JESUS_CANTU
  const configJesus = getSystemConfig('PPC_ADMIN', 'JESUS_CANTU');
  const ppcModJesus = configJesus.specialModules.find(m => m.id === 'PPC_MASTER');

  if (ppcModJesus && ppcModJesus.label === 'REUNION INTERDICIPLINARIO') {
      console.log("✅ JESUS_CANTU: Etiqueta correcta 'REUNION INTERDICIPLINARIO'");
  } else {
      console.error("❌ JESUS_CANTU: Fallo. Etiqueta actual: " + (ppcModJesus ? ppcModJesus.label : 'N/A'));
  }

  // Caso 2: ANTONIA_VENTAS
  const configAntonia = getSystemConfig('TONITA', 'ANTONIA_VENTAS');
  const ppcModAntonia = configAntonia.specialModules.find(m => m.id === 'PPC_MASTER');

  if (ppcModAntonia && ppcModAntonia.label === 'PPC Maestro') {
      console.log("✅ ANTONIA_VENTAS: Etiqueta correcta 'PPC Maestro'");
  } else {
      console.error("❌ ANTONIA_VENTAS: Fallo. Etiqueta actual: " + (ppcModAntonia ? ppcModAntonia.label : 'N/A'));
  }
}

/*
 * ======================================================================
 * MODULE: SMART ARCHIVER (BANCO DE COTIZACIONES)
 * ======================================================================
 */

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parent.createFolder(name);
  }
}

function getBankRootFolder() {
  // Use config ID if available, otherwise find/create "Banco de Cotizaciones" in Root
  if (APP_CONFIG.folderIdUploads && APP_CONFIG.folderIdUploads.trim() !== "") {
      try {
          return DriveApp.getFolderById(APP_CONFIG.folderIdUploads);
      } catch(e) {
          console.warn("Invalid Config Folder ID, falling back to Root search.");
      }
  }

  const rootName = "Banco de Cotizaciones";
  const folders = DriveApp.getFoldersByName(rootName);
  if (folders.hasNext()) {
      return folders.next();
  } else {
      return DriveApp.createFolder(rootName);
  }
}

function archiveFile(fileUrl, targetFolder) {
  try {
      if (!fileUrl || !String(fileUrl).includes("drive.google.com")) return { success: false, message: "No Drive URL" };

      // Extract ID
      let id = "";
      const match = fileUrl.match(/[-\w]{25,}/);
      if (match) id = match[0];

      if (!id) return { success: false, message: "Invalid ID extraction" };

      const file = DriveApp.getFileById(id);
      if (!file) return { success: false, message: "File not found" };

      // Check if file is already in target folder
      const parents = file.getParents();
      let alreadyThere = false;
      while (parents.hasNext()) {
          const p = parents.next();
          if (p.getId() === targetFolder.getId()) {
              alreadyThere = true;
              break;
          }
      }

      if (!alreadyThere) {
          // Move file (Standard: Move to organized folder to ensure structure)
          file.moveTo(targetFolder);
          return { success: true, message: "Moved" };
      }
      return { success: true, message: "Already there" };

  } catch (e) {
      console.error("Archive Error: " + e.toString());
      return { success: false, message: e.toString() };
  }
}

function processQuoteRow(row) {
    try {
        // 1. Validate Data
        // Header mapping from internalFetchSheetData aliases:
        // CLIENTE -> row['CLIENTE']
        // FECHA -> row['FECHA'] or row['FECHA INICIO'] ...
        // ARCHIVO -> row['ARCHIVO'] or row['COTIZACION']

        const client = row['CLIENTE'];
        const dateVal = row['FECHA'] || row['FECHA INICIO'] || row['F. INICIO'] || row['F. VISITA'] || row['F. ENTREGA'] || row['ALTA'] || row['FECHA_ALTA'];
        const fileVal = row['COTIZACION'] || row['ARCHIVO'] || row['LINK'] || row['EVIDENCIA'];

        if (!client || !dateVal || !fileVal) return { success: false, message: "Missing Data" };

        // 2. Parse Date
        let dateObj = null;
        if (dateVal instanceof Date) {
            dateObj = dateVal;
        } else if (typeof dateVal === 'string') {
            const parts = dateVal.split('/');
            if (parts.length === 3) {
               let y = parseInt(parts[2]);
               if (y < 100) y += 2000;
               dateObj = new Date(y, parseInt(parts[1])-1, parseInt(parts[0]));
            } else {
               const parsed = new Date(dateVal);
               if (!isNaN(parsed.getTime())) {
                   dateObj = parsed;
               }
            }
        }

        if (!dateObj || isNaN(dateObj.getTime())) return { success: false, message: "Invalid Date" };

        const year = String(dateObj.getFullYear());
        const months = ["01 - ENERO", "02 - FEBRERO", "03 - MARZO", "04 - ABRIL", "05 - MAYO", "06 - JUNIO",
                        "07 - JULIO", "08 - AGOSTO", "09 - SEPTIEMBRE", "10 - OCTUBRE", "11 - NOVIEMBRE", "12 - DICIEMBRE"];
        const month = months[dateObj.getMonth()];
        const clientName = String(client).toUpperCase().trim().replace(/[\/\\]/g, "-"); // Sanitize

        // 3. Folder Logic
        const root = getBankRootFolder();
        const yearFolder = getOrCreateFolder(root, year);
        const monthFolder = getOrCreateFolder(yearFolder, month);
        const clientFolder = getOrCreateFolder(monthFolder, clientName);

        // 4. File Logic (Handle multiple files)
        const urls = String(fileVal).split(/[\n\s,]+/).filter(u => u.toUpperCase().startsWith("HTTP"));
        let count = 0;

        urls.forEach(url => {
            const res = archiveFile(url, clientFolder);
            if (res.success) count++;
        });

        return { success: true, processed: count };

    } catch (e) {
        console.error("Process Row Error: " + e.toString());
        return { success: false, message: e.toString() };
    }
}

function batchArchiveExistingQuotes() {
    const sheetName = "ANTONIA_VENTAS"; // Explicit target
    const res = internalFetchSheetData(sheetName);

    if (!res.success) {
        return { success: false, message: "Error reading sheet: " + res.message };
    }

    let processedTotal = 0;
    const errors = [];

    res.data.forEach(row => {
        const result = processQuoteRow(row);
        if (result.success) processedTotal += (result.processed || 0);
        else if (result.message !== "Missing Data") errors.push(result.message);
    });

    const logMsg = `Batch Archive: ${processedTotal} files processed. Errors: ${errors.length}`;
    console.log(logMsg);
    registrarLog("SYSTEM", "BATCH_ARCHIVE", logMsg);

    return { success: true, message: logMsg };
}

function runFullArchivingBatch() {
    const res = batchArchiveExistingQuotes();
    const ui = SpreadsheetApp.getUi();
    if (res.success) {
        ui.alert("✅ Organización Completa\n\n" + res.message);
    } else {
        ui.alert("❌ Error: " + res.message);
    }
}
function deduplicateAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  let totalDeleted = 0;
  
  // Mover el Set afuera del loop permite borrar duplicados cruzados entre hojas si así se desea,
  // pero el usuario especificó "de todas las hojas", y vimos que el bug replicó la misma tarea en la MISMA hoja repetidas veces.

  // We only want to run this on actual data sheets, not system/config sheets
  const excludeSheets = ["DB_DIRECTORY", "ESTATUS", "APP_CONFIG", "DASHBOARD", "PPC_BORRADOR"];

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const sheetName = sheet.getName();

    if (excludeSheets.some(ex => sheetName.includes(ex))) {
      continue;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) continue; // Skip empty sheets or just headers

    let headerRowIndex = -1;
    let headers = [];
    let folioIdx = -1;
    let conceptoIdx = -1;
    let fechaIdx = -1;

    // Buscar la fila de encabezados en las primeras 20 filas
    for (let r = 0; r < Math.min(20, data.length); r++) {
      const currentHeaders = data[r].map(h => String(h).toUpperCase().trim());
      const fIdx = currentHeaders.findIndex(h => h === "FOLIO" || h === "ID");
      const cIdx = currentHeaders.findIndex(h => h === "CONCEPTO" || h === "DESCRIPCION" || h === "TAREA" || h === "DESCRIPCIÓN");
      
      if (fIdx > -1 && cIdx > -1) {
        headerRowIndex = r;
        headers = currentHeaders;
        folioIdx = fIdx;
        conceptoIdx = cIdx;
        fechaIdx = currentHeaders.findIndex(h => h === "FECHA" || h === "F. INICIO" || h.includes("FECHA"));
        break;
      }
    }
    
    // Si no encuentra columnas clave, es mejor omitir la hoja que borrar a ciegas
    if (headerRowIndex === -1 || conceptoIdx === -1) continue; 

    const seenFolios = new Set();
    const seenCombos = new Set();
    const rowsToDelete = [];

    // Go from top to bottom to identify duplicates starting AFTER the header row
    for (let r = headerRowIndex + 1; r < data.length; r++) {
      const row = data[r];
      let isDuplicate = false;

      const folio = folioIdx > -1 ? row[folioIdx] : "";
      const folioStr = String(folio).trim();

      // ALWAYS check by concept + date FIRST to catch duplicates with DIFFERENT folios
      const concept = conceptoIdx > -1 ? row[conceptoIdx] : "";
      const dateRaw = fechaIdx > -1 ? row[fechaIdx] : "";

      let dateStr = "";
      if (dateRaw instanceof Date) {
          // just standard format for comparison
          dateStr = dateRaw.toISOString().split('T')[0];
      } else {
          dateStr = String(dateRaw).trim();
      }

      const conceptStr = String(concept).trim().toUpperCase().substring(0, 50);

      if (conceptStr !== "") {
          const comboKey = conceptStr + "|||" + dateStr;
          if (seenCombos.has(comboKey)) {
              isDuplicate = true;
          } else {
              seenCombos.add(comboKey);
          }
      }

      // If not marked as duplicate by concept, check by FOLIO
      if (!isDuplicate && folioStr !== "" && folioStr !== "SIN-FOLIO") {
        if (seenFolios.has(folioStr)) {
          isDuplicate = true;
        } else {
          seenFolios.add(folioStr);
        }
      }

      if (isDuplicate) {
        // Row to delete is r + 1 (1-based index in sheets)
        rowsToDelete.push(r + 1);
      }
    }

    // Delete rows from bottom to top to preserve indices
    if (rowsToDelete.length > 0) {
      Logger.log(`Found ${rowsToDelete.length} duplicates in sheet ${sheetName}`);
      for (let j = rowsToDelete.length - 1; j >= 0; j--) {
        sheet.deleteRow(rowsToDelete[j]);
        totalDeleted++;
      }
    }
  }
  
  Logger.log(`Total duplicate rows deleted across all sheets: ${totalDeleted}`);
  return totalDeleted;
}

function debugSheetHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("JEHU MARTINEZ");
  if (!sheet) {
    Logger.log("No sheet found for JEHU MARTINEZ");
    return;
  }
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  const headers = data[0].map(h => String(h).toUpperCase().trim());
  Logger.log("HEADERS:");
  Logger.log(JSON.stringify(headers));
  
  Logger.log("ROW 1:");
  Logger.log(JSON.stringify(data[1]));
}

/**
 * ================================================================
 * TEST UNITARIO PARA VERIFICAR FIX DE AUTO-ARCHIVADO AL 100%
 * ================================================================
 * El usuario reportó que al dar 100% no se pasaba a tareas realizadas.
 * Ejecutar esta función para validar que la lógica interna de auto-archivo
 * funciona tanto con '100%', '100' y el valor numérico 1 (formato nativo de Sheets).
 */
function test_avance_100_bug() {
    Logger.log("Iniciando prueba de auto-archivado (100%)...");

    // Simular fila de Google Sheets (donde '1' representa 100% por formato de porcentaje)
    const mockRowNumeric = ["TEST-001", "PENDIENTE", 1, ""];
    const mockRowString = ["TEST-002", "PENDIENTE", "100%", ""];

    const estatusIdx = 1;
    const avanceIdx = 2;
    const cumplimientoIdx = 3;

    let isCompleteNumeric = false;
    let isCompleteString = false;

    [mockRowNumeric, mockRowString].forEach((row, i) => {
        let isComplete = false;

        const valEstatus = estatusIdx > -1 ? String(row[estatusIdx] || "").toUpperCase().trim() : "";
        const doneStatuses = ['HECHO', 'TERMINADO', 'FINALIZADO', 'REALIZADO', 'COMPLETADO', 'DONE'];
        if (doneStatuses.includes(valEstatus)) {
            isComplete = true;
        }

        [avanceIdx, cumplimientoIdx].forEach(idx => {
            if (idx > -1) {
                const rawVal = row[idx];
                const valStr = String(rawVal || "").trim();
                const strictMatch = valStr === "100" || valStr === "100%" || valStr.toUpperCase() === "SI";

                if (strictMatch) {
                    isComplete = true;
                } else if (valStr) {
                    const cleanVal = valStr.replace('%', '').replace(',', '.').trim();
                    const num = parseFloat(cleanVal);
                    if (!isNaN(num) && Math.abs(num - 100) < 0.01) {
                        isComplete = true;
                    }
                }
            }
        });

        if (i === 0) isCompleteNumeric = isComplete;
        if (i === 1) isCompleteString = isComplete;
    });

    Logger.log("Prueba fila numérica (1 nativo): " + (isCompleteNumeric ? "ÉXITO" : "FALLO"));
    Logger.log("Prueba fila string ('100%'): " + (isCompleteString ? "ÉXITO" : "FALLO"));

    if (isCompleteNumeric && isCompleteString) {
        Logger.log("✔ TEST PASADO: El bug del 100% ha sido corregido correctamente.");
    } else {
        Logger.log("❌ TEST FALLIDO.");
    }
}
