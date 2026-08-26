# Especificación de Diseño de Software (SDD) - Motor de KPIs de Rendimiento
*Documento de Especificación para el Desarrollo Guiado por Comportamiento/Espectro (Spec-Driven Development)*

## 1. Visión General y Objetivo
El objetivo de este módulo es reemplazar los datos simulados (mocks) que se muestran actualmente en el dashboard de KPIs de Holtmont Workspace. Se extraerán datos reales provenientes de la base de datos (Google Sheets) para evaluar y graficar el rendimiento real de los empleados.

Nos enfocaremos en dos métricas clave solicitadas:
1. **Eficiencia en Cotizaciones (Ventas):** El número de días que tardan en finalizar sus cotizaciones, comparando el historial completo de cotizaciones realizadas contra la fecha de inicio y la fecha de finalización de cada tarea.
2. **Eficiencia en la "Papa Caliente" (Tracker Operativo):** El tiempo que tardan los empleados en terminar las actividades o etapas individuales que les son asignadas a través del timeline dinámico de delegación ("Papa Caliente").

## 2. Fuentes de Datos (Data Sources)
Las métricas se alimentarán de las hojas individuales de cada usuario:
* **Tareas Activas y Finalizadas (Historial):** La función actual de extracción `internalFetchSheetData(sheetName)` devuelve tanto las tareas activas (`res.data`) como las tareas archivadas en la sección "TAREAS REALIZADAS" (`res.history`). Para que los KPIs sean estadísticamente representativos, debemos analizar **ambos** conjuntos de datos.
* **Columnas Relevantes para Cotizaciones:** `FECHA`, `ALTA`, `F. INICIO` (Inicio) y `FECHA TERMINO`, `FECHA FIN`, `FECHA ENTREGA` (Fin).
* **Columnas Relevantes para Papa Caliente:** `PROCESO_LOG` (cadena JSON que contiene el timeline).

## 3. Lógica de Cálculo de KPIs

### 3.1. Eficiencia en Cotizaciones (Días de Finalización)
Este KPI mide cuántos días transcurren desde que un vendedor inicia un proyecto (cotización) hasta que lo marca como completado.

**Algoritmo Propuesto:**
1. **Unificar Datos:** Combinar las tareas activas que ya estén completadas (`ESTATUS` contiene "DONE", "COMPLETED", "TERMINADO") con todas las tareas dentro del arreglo `res.history`.
2. **Extracción de Fechas:**
   * Extraer *Fecha Inicio* (de las posibles columnas de inicio).
   * Extraer *Fecha Fin Real* (de las posibles columnas de fin).
3. **Cálculo:**
   * Validar que ambas fechas puedan ser convertidas a un objeto `Date` válido.
   * Diferencia: `(Fecha Fin - Fecha Inicio)` en milisegundos.
   * Convertir la diferencia a Días (redondeando hacia arriba o con decimales según el formato deseado).
4. **Agregación por Empleado:**
   * `Volumen:` Cantidad total de cotizaciones/tareas completadas válidas.
   * `Eficiencia:` Promedio de días (Suma de Días / Volumen).

### 3.2. Rendimiento en Actividades "Papa Caliente" (Tiempo de Resolución)
La "Papa Caliente" asigna sub-tareas o etapas dentro de un macro-proceso. Este KPI medirá qué tan rápido un trabajador saca su parte del trabajo.

**Algoritmo Propuesto:**
1. **Explorar PROCESO_LOG:** Iterar sobre todas las filas (activas e históricas) y parsear la columna `PROCESO_LOG` (si existe y es un JSON válido).
2. **Analizar Etapas:** El JSON es un arreglo de objetos de etapa. Cada etapa contiene un sub-arreglo de `workers`.
3. **Filtro de Trabajador:**
   * Buscar los trabajadores asignados en la etapa que tengan estatus `DONE` o que cuenten con `timestamp` y `endTimestamp`.
4. **Cálculo de Tiempo:**
   * `timestamp`: Fecha/hora de asignación.
   * `endTimestamp`: Fecha/hora de finalización.
   * Diferencia: `(endTimestamp - timestamp)` convertida a horas (o días).
5. **Agregación por Empleado:**
   * Acumular el tiempo total invertido y el número de etapas (pasos) completados por cada usuario.
   * Obtener el tiempo promedio por tarea de "Papa Caliente" por empleado.

## 4. Modificaciones Técnicas Requeridas

### 4.1. En el Backend (`CODIGO.js`)
* **Refactorizar `apiFetchTeamKPIData(username)`:**
  * Desactivar la inyección forzada de `DEMO_MODE` al llamar desde la interfaz.
  * Modificar `processGroup` para que evalúe `[...res.data, ...res.history]` en lugar de solo `res.data`.
  * **Nuevo Procesador para Papa Caliente:** Implementar una nueva función auxiliar `processHotPotatoKPIs()` que recorra toda la organización (usando el directorio o agrupaciones) y extraiga las métricas de `PROCESO_LOG`.
  * Devolver en la respuesta un objeto estructurado:
    ```json
    {
      "success": true,
      "dashboardVentas": [{ "name": "...", "volumen": 15, "eficiencia": 2.5 }],
      "dashboardTracker": [{ "name": "...", "volumen": 25, "eficiencia": 12.4 /* horas */ }],
      ...
    }
    ```

### 4.2. En el Frontend (`index.html`)
* **Función `loadKPIData()`:**
  * Eliminar el bloque de generación de `MOCK DATA` (`setTimeout` estático).
  * Consumir `google.script.run.withSuccessHandler().apiFetchTeamKPIData()` y enlazar la respuesta a `kpiData.value.dashboardVentas` y `kpiData.value.dashboardTracker`.
* **Gráficas (`renderKPICharts()`):**
  * Asegurarse de que el renderizador mapee la "eficiencia" de manera correcta (ej. si para Ventas son "Días" y para Papa Caliente son "Horas", ajustar los *labels* del Chart.js: "Días Promedio", "Horas Promedio").
  * Si un empleado tiene un valor de eficiencia alto, significa que tardó *más*, por lo que las métricas más bajas son mejores en este caso.

## 5. Prevención de Errores (Edge Cases)
* **Fechas Faltantes:** Ignorar registros donde falta `FECHA INICIO` o `FECHA FIN` para que el promedio no se corrompa por "ceros".
* **`PROCESO_LOG` Malformado:** Envolver el `JSON.parse` en un `try-catch` para evitar caídas si hay datos manuales corruptos en las hojas.
* **Timestamps Ausentes:** Si un registro de "Papa Caliente" se marcó como DONE pero no se generó el `endTimestamp` (por versiones viejas del código), omitir dicho registro del cálculo del promedio de ese empleado.
* **Rendimiento de GAS:** Como se leerán múltiples hojas (historial incluido), el proceso de `apiFetchTeamKPIData` podría tomar varios segundos. El frontend ya cuenta con un `kpiData.isLoading = true` que mostrará el spinner, lo cual es correcto.

---
