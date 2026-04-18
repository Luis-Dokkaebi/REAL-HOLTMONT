# Spec-Driven Development (SDD): Integración de Calendario de Outlook (Microsoft 365)

## 1. Visión General del Negocio
El objetivo de este desarrollo es sincronizar automáticamente las actividades y tareas generadas en Holtmont Workspace (Tracker y Cotizaciones) con el calendario de Outlook (Microsoft 365) de los usuarios asignados.
Esto permite que los trabajadores (como Sebastián Padilla, Ángel Salinas, etc.) no dependan exclusivamente de revisar el sistema web para conocer sus asignaciones, sino que tengan sus tareas programadas directamente en su agenda corporativa, mejorando el cumplimiento de tiempos y la organización personal.

### 1.1 Objetivo del SDD
Este documento define la arquitectura, el flujo de datos, los requisitos previos y el código necesario para integrar Google Apps Script con el ecosistema de Microsoft mediante el uso de un webhook intermediario (Power Automate).

## 2. Actores y Roles
*   **Gestor Principal (ANTONIA_VENTAS):** Quien asigna la tarea o delega una etapa del proceso "Papa Caliente".
*   **Delegado / Trabajador (Ej. SEBASTIAN_PADILLA):** Usuario que recibe la asignación en el Tracker de Holtmont Workspace y, simultáneamente, un evento en su calendario de Outlook.
*   **Administrador de Sistema (IT):** Encargado de configurar el flujo receptor en Power Automate.

## 3. Arquitectura y Estrategia de Integración
Dado que el entorno de Google Apps Script (GAS) opera de forma aislada y la autenticación directa con Microsoft Graph API vía OAuth2.0 dentro de GAS es compleja y frágil en cuanto al manejo de tokens en un entorno multi-usuario, **se adopta una arquitectura basada en Eventos (Push) vía Webhooks hacia Power Automate**.

*   **Emisor:** Google Apps Script (`CODIGO.js`), utilizando el servicio nativo `UrlFetchApp`.
*   **Intermediario / Receptor:** Un flujo de Power Automate configurado con el disparador "Cuando se recibe una solicitud HTTP" (Webhook).
*   **Destino:** Microsoft Exchange / Calendario de Outlook.

## 4. Estructura de Datos (El Payload)
Para que el intermediario pueda crear el evento correctamente, Apps Script debe enviar un JSON estandarizado cada vez que se asigne una tarea.

### 4.1 Definición del Objeto JSON a enviar:
```json
{
  "folio": "AV-1050",
  "titulo": "Asignación Tarea: CD - Cálculo y Diseño",
  "descripcion": "Se te ha asignado la etapa CD para el cliente EMPRESA X. Folio: AV-1050. Por favor, revisa el Tracker.",
  "fechaInicio": "2025-05-01T09:00:00.000Z",
  "fechaFin": "2025-05-01T10:00:00.000Z",
  "correoDestino": "sebastian.padilla@empresa.com",
  "asignadoPor": "ANTONIA_VENTAS"
}
```

## 5. Requisitos Previos y Configuración
Para implementar este flujo, se requieren acciones tanto en el código como en la infraestructura del cliente.

### 5.1 En el Código (Google Apps Script - `CODIGO.js`)
1.  **Actualizar el Catálogo de Usuarios (`USER_DB`):**
    Añadir una nueva propiedad obligatoria llamada `email` (o `outlookEmail`) a cada objeto de usuario para poder rutear el evento.
2.  **Módulo de Envío (`apiEnviarEventoOutlook`):**
    Crear una función centralizada que empaquete los datos y ejecute la petición POST hacia la URL de Power Automate.
3.  **Inyección en el Flujo "Papa Caliente" / Tracker:**
    Identificar el punto exacto en `CODIGO.js` donde se guarda una nueva tarea asignada a un delegado (por ejemplo, en `apiSaveTrackerBatch` o en la función que delega etapas) para disparar la función `apiEnviarEventoOutlook`.

### 5.2 En la Infraestructura del Cliente (Power Automate)
1.  Crear un nuevo flujo automatizado de nube.
2.  **Disparador:** *Request - When an HTTP request is received*.
3.  **Esquema JSON:** Pegar el esquema generado basado en el payload del punto 4.1.
4.  **Acción:** *Office 365 Outlook - Create event (V4)*.
5.  **Mapeo:**
    *   *Calendar id:* Calendar (o el calendario por defecto).
    *   *Subject:* Mapear con la variable `titulo`.
    *   *Start time:* Mapear con la variable `fechaInicio`.
    *   *End time:* Mapear con la variable `fechaFin`.
    *   *Body:* Mapear con la variable `descripcion`.
    *   *Attendees:* Mapear con la variable `correoDestino` (Esto enviará la invitación o lo pondrá en su calendario).

## 6. Implementación de Código Completa

A continuación se detalla toda la implementación técnica a nivel de código para el archivo `CODIGO.js`, abarcando desde la configuración de usuarios hasta el módulo de envíos y su integración dentro del flujo de `apiSaveTrackerBatch`.

### 6.1 Módulo: Constantes y Catálogo de Usuarios

```javascript
/**
 * URL generada por Power Automate.
 * @constant
 */
const WEBHOOK_OUTLOOK_URL = "URL_DE_POWER_AUTOMATE_AQUI";

/**
 * Catálogo de Usuarios Actualizado (Ejemplo de USER_DB ampliado)
 * Se incorpora el campo "email" para posibilitar el ruteo hacia Outlook.
 */
const USER_DB = {
  "LUIS_CARLOS": { pass: "admin2025", role: "ADMIN", label: "Administrador", email: "luiscarlos@empresa.com" },
  "JESUS_CANTU": { pass: "ppc2025", role: "PPC_ADMIN", label: "PPC Manager", email: "jesuscantu@empresa.com" },
  "ANTONIA_VENTAS": { pass: "tonita2025", role: "TONITA", label: "Ventas", email: "ventas@empresa.com" },
  "JAIME_OLIVO": { pass: "admin2025", role: "ADMIN_CONTROL", label: "Jaime Olivo", email: "jaimeolivo@empresa.com" },
  "ANGEL_SALINAS": { pass: "angel2025", role: "ANGEL_USER", label: "Angel Salinas", email: "angel.salinas@empresa.com" },
  "TERESA_GARZA": { pass: "tere2025", role: "TERESA_USER", label: "Teresa Garza", email: "teresa.garza@empresa.com" },
  "EDUARDO_TERAN": { pass: "lalo2025", role: "EDUARDO_USER", label: "Eduardo Teran", email: "eduardo.teran@empresa.com" },
  "EDUARDO_MANZANARES": { pass: "manzanares2025", role: "MANZANARES_USER", label: "Eduardo Manzanares", email: "eduardo.manzanares@empresa.com" },
  "RAMIRO_RODRIGUEZ": { pass: "ramiro2025", role: "RAMIRO_USER", label: "Ramiro Rodriguez", email: "ramiro.rodriguez@empresa.com" },
  "SEBASTIAN_PADILLA": { pass: "sebastian2025", role: "SEBASTIAN_USER", label: "Sebastian Padilla", email: "sebastian.padilla@empresa.com" },
  "EDGAR_LOPEZ": { pass: "edgar2025", role: "EDGAR_USER", label: "Edgar Lopez", email: "edgar.lopez@empresa.com" }
};
```

### 6.2 Módulo: Core de Comunicación con Webhook

```javascript
/**
 * Clase o Namespace que agrupa las utilidades para el envío a Outlook.
 * Esta abstracción permite añadir en el futuro notificaciones de Slack/Teams.
 */
const NotifierService = {

  /**
   * Envía una notificación HTTP a un Webhook configurado.
   * @param {Object} payloadData Los datos de la tarea a agendar.
   * @returns {Object} Respuesta sobre el éxito o fracaso de la transacción.
   */
  sendToOutlook: function(payloadData) {
    if (!WEBHOOK_OUTLOOK_URL || WEBHOOK_OUTLOOK_URL === "URL_DE_POWER_AUTOMATE_AQUI") {
      return { success: false, message: "Webhook no configurado." };
    }

    const payload = {
      folio: payloadData.folio || "Sin Folio",
      titulo: payloadData.titulo || "Asignación de Tarea",
      descripcion: payloadData.descripcion || "Tienes una nueva tarea asignada en Holtmont Workspace.",
      fechaInicio: payloadData.fechaInicio || new Date().toISOString(),
      fechaFin: payloadData.fechaFin || new Date(new Date().getTime() + (60 * 60 * 1000)).toISOString(),
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
```

### 6.3 Módulo: Utilidad Helper y Pruebas (POC)

```javascript
/**
 * Helper que busca un usuario en USER_DB según un nombre amigable o label.
 * Útil cuando el frontend envía nombres como "SEBASTIAN PADILLA".
 * @param {string} friendlyName Nombre que llega desde la UI (ej. "ANGEL SALINAS")
 * @returns {string|null} El email del usuario o null si no se encuentra.
 */
function findUserEmailByLabel(friendlyName) {
  if (!friendlyName) return null;
  const nameUpper = String(friendlyName).trim().toUpperCase();

  for (const key in USER_DB) {
    if (USER_DB[key] && USER_DB[key].label) {
      if (USER_DB[key].label.toUpperCase() === nameUpper) {
        return USER_DB[key].email || null;
      }
    }
    // Fallback: revisar por el key directo
    if (key.replace(/_/g, " ") === nameUpper) {
       return USER_DB[key].email || null;
    }
  }
  return null;
}

/**
 * Función de prueba para verificar la comunicación GAS -> Outlook.
 * Ejecutar manualmente desde el editor de Apps Script.
 */
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
```

### 6.4 Módulo: Integración con la Delegación de Tareas (`apiSaveTrackerBatch`)

El siguiente fragmento muestra cómo integrar `NotifierService` dentro de la función de backend responsable de guardar y delegar tareas del Tracker ("Papa Caliente").

```javascript
/**
 * FRAGMENTO A INSERTAR / MODIFICAR EN apiSaveTrackerBatch
 * Este código debe colocarse justo donde se crea la entrada de "Papa Caliente"
 * para un delegado, o donde se inserta la fila en su Tracker personal.
 */

// Contexto simulado dentro de apiSaveTrackerBatch...
// function apiSaveTrackerBatch(personName, tasks, username) { ...

  tasks.forEach(function(row) {

    // ... Logica existente de validación y extracción de folio ...
    const folioStr = row["FOLIO"] || "SIN-FOLIO";
    const clienteStr = row["CLIENTE"] || "Desconocido";

    // Detectamos si el proceso fue delegado recientemente (Nuevo objeto en PROCESO_LOG)
    // Supongamos que parseamos el nuevo log
    let newAssignee = null;
    let stepTitle = "";

    try {
      if (row["PROCESO_LOG"]) {
        const logData = typeof row["PROCESO_LOG"] === "string" ? JSON.parse(row["PROCESO_LOG"]) : row["PROCESO_LOG"];
        if (Array.isArray(logData) && logData.length > 0) {
          const lastEntry = logData[logData.length - 1];
          // Verificamos si es una tarea en progreso y asignada a un delegado
          if (lastEntry.status === "IN_PROGRESS" && lastEntry.assignee) {
             newAssignee = lastEntry.assignee;
             stepTitle = lastEntry.step || "Desconocido";
          }
        }
      }
    } catch (e) {
      console.warn("No se pudo parsear PROCESO_LOG para notificaciones:", e);
    }

    // SI HAY UN NUEVO ASIGNADO, DISPARAMOS EVENTO DE OUTLOOK
    if (newAssignee) {
       const userEmail = findUserEmailByLabel(newAssignee);

       if (userEmail) {
          // Preparamos fechas (Asumimos inicio ahora, fin en 2 horas por default)
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

          // Invocamos el servicio (puede ser asíncrono o sincrono)
          const resultOutlook = NotifierService.sendToOutlook(payloadOutlook);

          if (resultOutlook.success) {
            console.log(`Notificación Outlook enviada para Folio: ${folioStr}`);
          }
       } else {
          console.warn(`No se encontró email corporativo para delegado: ${newAssignee}`);
       }
    }

    // ... Continua el guardado normal de la fila en las Sheets (internalBatchUpdateTasks) ...
  });
// }
```

## 7. Plan de Ejecución Final
1.  **Aprobación del Cliente:** Revisar este SDD y validar que los campos del Payload correspondan a sus necesidades operativas y visualizar el flujo final en MS 365.
2.  **Configuración Power Automate:** El área de IT creará el Flujo y nos proporcionará el webhook. Reemplazar dicho string en la constante `WEBHOOK_OUTLOOK_URL`.
3.  **Deploy y Testing Unitario:** Desplegar estas funciones de `CODIGO.js` y ejecutar `testIntegracionOutlook` directamente desde el IDE de Google Apps Script.
4.  **Monitoreo:** Vigilar los logs de Apps Script durante la primera semana operativa para detectar correos no configurados o timeouts de red al interactuar con el Webhook de Microsoft.
