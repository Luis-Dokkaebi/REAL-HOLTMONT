# Spec-Driven Development (SDD): Flujo de Trabajo "Papa Caliente"

## 1. Visión General del Negocio
El flujo de trabajo "Papa Caliente" es la columna vertebral operativa para la gestión, delegación y seguimiento de cotizaciones dentro de la plataforma Holtmont Workspace. Su objetivo principal es asegurar que los proyectos fluyan sin cuellos de botella entre los distintos departamentos (Ventas, Ingeniería/Diseño y Presupuestos) garantizando la trazabilidad exacta de los tiempos de respuesta (SLAs).

Este sistema reemplaza la comunicación desorganizada (correos, mensajes) por un modelo visual tipo Kanban o "Línea de Ensamble", donde la responsabilidad del proyecto pasa de un usuario a otro de forma secuencial.

### 1.1 Objetivo del SDD
Este documento define las especificaciones técnicas, las transiciones de estado, la arquitectura de datos subyacente y las pruebas requeridas para mantener o extender la funcionalidad del módulo "Papa Caliente".

## 2. Actores y Roles
*   **Gestor Principal (ANTONIA_VENTAS / Rol: TONITA):** Actúa como el controlador de tráfico aéreo. Es la única persona autorizada para visualizar el panorama completo, crear nuevos folios y delegar etapas a otros usuarios.
*   **Delegado / Trabajador (Personal Técnico / Ventas / Compras):** Recibe la tarea ("La Papa Caliente") en su tablero personal. Solo visualiza la información pertinente para realizar su trabajo. Su responsabilidad se limita a procesar la tarea, subir evidencias (archivos) y marcar su avance al 100%.

## 3. Estados del Proceso (Ruta Crítica)
El ciclo de vida de una cotización se compone de 7 etapas estrictamente secuenciales. Cada etapa se representa visualmente en la interfaz como un círculo interactivo.

| ID | Abreviatura | Etapa | Descripción Funcional |
| :--- | :--- | :--- | :--- |
| 1 | `L` | Levantamiento | Registro inicial de requerimientos técnicos o comerciales. |
| 2 | `CD` | Cálculo y Diseño | El departamento de Ingeniería genera planos, layouts (F2) y cuantifica materiales. |
| 3 | `EP` | Elaboración Presupuesto | Compras o Control de Costos determina el valor real de ejecución. |
| 4 | `CI` | Cotización Interna | Gerencia o Comercial revisa los costos y define el margen de ganancia. |
| 5 | `EV` | Estrategia Ventas | Definición del enfoque de venta y elaboración del documento final (PDF). |
| 6 | `CEC` | Cotización Enviada al Cliente | Seguimiento y confirmación de que la propuesta está en manos del cliente. |
| 7 | `RCC` | Revisión Cotización Cliente | Etapa terminal. El cliente da retroalimentación. Se define el destino de la cotización (Ganada, Perdida, Descuento). |

## 4. Arquitectura de Datos

La persistencia del flujo se sostiene sobre dos columnas clave dentro de la hoja de Google Sheets de `ANTONIA_VENTAS`. Estas columnas son invisibles para el usuario en la interfaz web, pero son el "cerebro" del sistema.

### 4.1 Columna `PROCESO_LOG` (La Bitácora)
Estructura de datos JSON que almacena el historial de eventos. Es crucial para calcular el tiempo de respuesta (SLAs) de cada departamento.
*   **Estructura:** Array de Objetos.
*   **Campos por Objeto:**
    *   `step`: El ID de la etapa (ej. `"CD"`).
    *   `status`: El estado actual de la etapa (`"IN_PROGRESS"` o `"DONE"`).
    *   `assignee`: El nombre normalizado del trabajador asignado (ej. `"ANGEL SALINAS"`).
    *   `timestamp`: Epoch en milisegundos de la última transición de estado (ej. `1700000000000`).
    *   `dateStr`: Representación legible de la fecha (ej. `"14/11/2023, 16:13:20"`).

### 4.2 Columna `MAP COT` (El Semáforo Visual)
Un string delimitado por `|` que contiene emojis. Su propósito es permitir que la hoja de Google Sheets sea legible nativamente sin la plataforma web. La plataforma web lee este string para pintar la línea de tiempo.
*   **Estados:**
    *   `⚪`: Etapa futura (Pendiente).
    *   `🔴`: Etapa actual (Asignada, corriendo el reloj).
    *   `🟡`: Variante visual en la web para "En Progreso" (mapeada desde `PROCESO_LOG`).
    *   `🟢`: Etapa completada (Cerrada).
*   **Ejemplo:** `🟢 L | 🔴 CD | ⚪ EP | ⚪ CI | ⚪ EV | ⚪ CEC | ⚪ RCC`

## 5. Ciclo de Vida y Reglas de Negocio (Transitions)

### 5.1 Flujo Principal (Happy Path)
1.  **Creación:** `ANTONIA_VENTAS` da de alta un folio. El estado inicial es Pendiente (`⚪`) en todas las etapas, o `🔴 L`.
2.  **Delegación (Frontend -> Backend):**
    *   `ANTONIA_VENTAS` hace clic en un paso (ej. `CD`).
    *   Se muestra un modal para seleccionar un `Delegado`.
    *   El sistema agrega un objeto a `PROCESO_LOG` con `status: "IN_PROGRESS"` y el `timestamp` actual.
    *   `MAP COT` se actualiza para mostrar `🔴 CD` (o `🟡 CD` en la vista web).
    *   El backend copia la fila completa al "Tracker" del `Delegado` con `ESTATUS = "PENDIENTE"` y `AVANCE = "0%"`.
3.  **Ejecución (Trabajo del Delegado):**
    *   El delegado visualiza la tarea en su tabla. Sube archivos (ej. `COTIZACION`, `LAYOUT`).
    *   Al terminar, el delegado cambia su `AVANCE` a `100%` (o Estatus equivalente a `"DONE"`) y presiona "Guardar Todo".
4.  **Sincronización Inversa (Backend -> Master):**
    *   El backend (`CODIGO.js` -> `apiSaveTrackerBatch` / `internalUpdateTask`) detecta el estado `100%`.
    *   El script busca el `FOLIO` en la hoja de `ANTONIA_VENTAS`.
    *   Localiza la entrada en `PROCESO_LOG` donde `assignee` coincide con el trabajador y `status` es `IN_PROGRESS`.
    *   Actualiza el `status` a `"DONE"` y graba el `timestamp` final.
    *   Regenera el `MAP COT` cambiando el emoji de ese paso a `🟢`.
    *   Copia los archivos (`ARCHIVO`, `F2`, `LAYOUT`, `COTIZACION`) desde la hoja del delegado a la hoja maestra.
5.  **Cierre Final (`RCC`):**
    *   Al llegar al paso `RCC`, la delegación dispara un modal especial de "Estado Terminal".
    *   Opciones: `GANADA` (Verde), `PERDIDA X PRECIO` (Rojo), `DESCUENTO` (Azul).
    *   El sistema escribe el estado final en la columna `ESTATUS` general y bloquea la fila.

### 5.2 Reglas de Seguridad (La Lista Blanca)
Para prevenir corrupción de datos en la hoja maestra (`ANTONIA_VENTAS`), todas las actualizaciones que provienen del frontend pasan por un filtro estricto.
Solo las columnas declaradas en la variable `allowedBase` (`CODIGO.js`) son sobrescritas. **Es imperativo que `PROCESO_LOG` y `PROCESO` estén en esta lista para que la delegación y los cálculos de SLA funcionen correctamente.**

## 6. Pruebas de Integración y Validaciones (Test Suite)

Para garantizar la integridad del sistema, se deben ejecutar los siguientes casos de prueba al realizar modificaciones en el módulo.

### 6.1 Pruebas Unitarias (Backend - `CODIGO.js`)

**Test Case 1: Generación Correcta de MAP COT**
*   **Condición Inicial:** Un `PROCESO_LOG` con las etapas `L` (DONE) y `CD` (IN_PROGRESS).
*   **Ejecución:** Simular la función de regeneración de timeline en la sincronización inversa.
*   **Resultado Esperado:** El string retornado debe ser exactamente `🟢 L | 🟡 CD | ⚪ EP | ⚪ CI | ⚪ EV | ⚪ CEC | ⚪ RCC` (o `🔴 CD` dependiendo del fallback).

**Test Case 2: Filtrado de Seguridad (`allowedBase`)**
*   **Condición Inicial:** Enviar un payload simulado para actualizar la hoja `ANTONIA_VENTAS` que incluye la llave `PROCESO_LOG` y una llave intrusa `FORMULA_SECRETA`.
*   **Ejecución:** Llamar a `internalUpdateTask`.
*   **Resultado Esperado:** `PROCESO_LOG` debe persistirse en el objeto que llega a `internalBatchUpdateTasks`, pero `FORMULA_SECRETA` debe ser eliminado.

### 6.2 Pruebas de Integración End-to-End (E2E)

**Test Case 3: Flujo Completo de Delegación y Sincronización**
*   **Paso 1 (Delegar):**
    *   Como `ANTONIA_VENTAS`, hacer clic en la etapa `CD` de un Folio existente. Asignar a `ANGEL SALINAS`.
    *   **Validación:** El frontend muestra el círculo en Amarillo y empieza a contar el tiempo.
*   **Paso 2 (Verificación Backend):**
    *   Leer la celda `PROCESO_LOG` de ese Folio.
    *   **Validación:** Debe contener `{"step":"CD", "status":"IN_PROGRESS", "assignee":"ANGEL SALINAS"}`. La hoja de `ANGEL SALINAS` debe contener la fila.
*   **Paso 3 (Completar Tarea):**
    *   Como `ANGEL_USER`, abrir su Tracker. Cambiar `AVANCE` a `100%` y agregar una URL en `COTIZACION`. Presionar Guardar.
*   **Paso 4 (Verificación Inversa):**
    *   Como `ANTONIA_VENTAS`, refrescar la vista de Papa Caliente.
    *   **Validación:** El círculo `CD` debe ser Verde (`Hecho`). La fecha debajo del círculo debe ser la hora actual. El archivo debe aparecer en la celda correspondiente.

**Test Case 4: Cierre Terminal (`RCC`)**
*   **Paso 1:** Como `ANTONIA_VENTAS`, hacer clic en el círculo de la etapa `RCC`.
*   **Paso 2:** Seleccionar la opción "PERDIDA X PRECIO" en el modal de Alerta.
*   **Paso 3:** Verificar en el tablero de "COTIZACIONES ENVIADAS PERDIDAS" (Historial).
*   **Validación:** La fila debe aparecer en el historial con el estatus `PERDIDA X PRECIO` resaltado en rojo, y el ciclo se considera finalizado.

## 7. Manejo de Errores y Edge Cases

*   **Desincronización de Nombres:** Si el `assignee` en `PROCESO_LOG` tiene espacios extra o carece del sufijo `(VENTAS)`, la función de sincronización inversa utiliza métodos `.includes()` y normalización (`replace(/\s*\(VENTAS\)/g, "")`) para asegurar que el delegado sea reconocido y el paso sea marcado como `DONE` independientemente de pequeñas variaciones de escritura.
*   **Detección de Finalización Flexible:** Un usuario puede marcar la tarea como terminada ingresando `100%`, `1.0`, `1`, escribiendo `HECHO` en el estatus, o contestando `SI` en la columna de cumplimiento. El analizador de expresiones regulares de `apiSaveTrackerBatch` soporta todas estas variaciones para evitar fallos por "Human Error".
