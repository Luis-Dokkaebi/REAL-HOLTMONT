# Especificación de Diseño de Software (SDD): Dashboard de KPIs Reales para Administradores

## 1. Visión General y Objetivo
El objetivo de esta especificación es definir la arquitectura, el flujo de datos y la interfaz de usuario para la nueva sección de **Dashboard de KPIs para Administradores**. Esta vista reemplazará los datos estáticos (mocks) actuales por métricas calculadas dinámicamente a partir de los datos reales alojados en las hojas de Google Sheets (trackers y Banco de Información).

El diseño se compondrá de tres grandes bloques visuales correspondientes a la referencia aportada:
1. **Tarjetas de Métricas Principales (Top Cards):** Un resumen ejecutivo superior de volumen, cierres, pérdidas y eficiencia.
2. **Visualizaciones Gráficas (Charts):** Un análisis profundo del flujo de ventas, incluyendo el embudo de cotizaciones, los motivos de pérdida y una curva de productividad semanal.
3. **Tabla de Rendimiento Individual:** Un desglose granular de las métricas por cada colaborador, identificando cuellos de botella mediante semaforización visual. *(Nota: Por requerimiento explícito, la columna con el botón de "Llamar" ha sido removida del diseño y requerimientos).*

---

## 2. Arquitectura de Extracción de Datos (Backend - `CODIGO.js`)

Dado que el sistema utiliza Google Sheets como base de datos, iterar sobre miles de filas o histórico en el frontend (Vue) puede generar problemas de rendimiento. Por lo tanto, la agregación pesada de datos se delegará al backend.

### 2.1 Origen de la Información
El backend utilizará las funciones de lectura existentes (o una variante especializada) para recopilar las filas de los trackers. Analizará las columnas estandarizadas del sistema:
*   `VENDEDOR` / `RESPONSABLE`: Para agrupar los datos del rendimiento por colaborador.
*   `ESTATUS`: Para categorizar la etapa del embudo y si la cotización está ganada, perdida o en seguimiento.
*   `FECHA` / `FECHA INICIO`: Para ubicar la cotización temporalmente (requerido para la gráfica de Productividad Semanal).
*   `DÍAS` / `DÍAS FINALIZ. COTIZ`: Para calcular la eficiencia promedio en días y determinar la semaforización.
*   `VALOR` / `MONTO`: (O su equivalente) Para calcular la cifra económica del "riesgo".
*   `MOTIVO PÉRDIDA`: Para clasificar y poblar la gráfica de distribución de pérdidas.

### 2.2 Transformación y Payload (Endpoint)
Se implementará un endpoint dedicado en el backend (ej. `apiFetchAdminKPIs`) que ejecutará una operación Map-Reduce sobre los datos. Retornará un único payload JSON ligero estructurado en las siguientes entidades:
*   `globalMetrics`: Objeto con valores numéricos para las tarjetas superiores.
*   `funnelData`: Arreglo estructurado con las cantidades absolutas y relativas por fase del embudo.
*   `lossDistribution`: Arreglo estructurado para renderizar la gráfica de dona.
*   `weeklyProductivity`: Arreglo de los 5 días de la semana con sus respectivos valores de rendimiento.
*   `collaboratorStats`: Arreglo de objetos (uno por vendedor) conteniendo sus métricas individuales resumidas.

---

## 3. Lógica de Negocio y Mapeo de Métricas

### 3.1 Tarjetas Superiores (Resumen Ejecutivo)
*   **Cotizaciones Totales:** Conteo total de operaciones registradas. Se acompaña de un subtítulo "X colaboradores" calculado a partir de los valores únicos encontrados en la columna `VENDEDOR`.
*   **Ganadas:** Conteo de filas cuyo `ESTATUS` coincida con un cierre exitoso.
    *   **Cálculo de "% de Ganadas" (Subtítulo verde):** A diferencia de un ratio de volumen crudo, esta métrica se calculará tomando como universo base **exclusivamente** el historial de cotizaciones que alcanzaron el estatus de **"Enviadas"**. La fórmula será: `(Total Ganadas / Total de cotizaciones con estatus histórico "Enviadas") * 100`. Esto permite medir la efectividad real del cierre descartando aquellas solicitudes que nunca llegaron a presentarse al cliente.
*   **Perdidas / Riesgo:** Conteo de filas con estatus de estancamiento severo o perdidas. El monto monetario inferior ("$XXXk en riesgo") será la sumatoria simple de la columna representativa de valor para esas filas.
*   **Eficiencia Promedio:** Promedio aritmético de la columna temporal de `DÍAS` (o `RELOJ`) evaluada a nivel global.

### 3.2 Sección Intermedia (Visualizaciones Gráficas)
Para mantener la armonía de la plataforma web moderna, se integrará una librería de gráficos compatible (ej. Chart.js o gráficas nativas en Vue), inyectando los datos del backend:

*   **Embudo de Cotizaciones (Barras + Resumen Numérico):**
    *   *Recibidas (Azul):* Volumen base (100%).
    *   *Integradas (Menta):* Cotizaciones que avanzaron la fase inicial.
    *   *A tiempo (Amarillo):* Operaciones enviadas dentro del límite de tiempo.
    *   *Seguimiento (Verde Claro):* Cotizaciones bajo negociación.
    *   *Ganadas (Verde Oscuro):* Fase de cierre exitoso.
*   **Distribución de Pérdidas (Gráfica de Dona):** Agrupa las filas con estatus "PERDIDO" basándose en su motivo de rechazo (Lentitud, Precio, Sin seguimiento, Integración).
*   **Productividad Diaria del Equipo (Línea):** Analiza el histórico de la semana actual utilizando la columna `FECHA` (parseando de manera defensiva strings ISO o fechas DD/MM/YY locales), contando el volumen de actividad por cada día (Lunes a Viernes).

### 3.3 Tabla Inferior (Rendimiento Individual)
El frontend iterará sobre el arreglo `collaboratorStats` renderizando una lista en formato de tabla de solo lectura:

*   **Colaborador:** Aplicará la regla corporativa de UI existente utilizando la función `toInitials()` para renderizar un círculo de avatar a la izquierda del nombre del vendedor.
*   **Vol. (Volumen) y Ganadas:** Numeralia extraída directamente de la agrupación del backend.
*   **% Cierre (Individual):** Para reflejar el ratio de eficiencia individual de ventas de manera precisa, no se tomará el volumen total en crudo. La fórmula específica a implementar será la comparativa directa entre victorias y derrotas definitivas: **`Ganadas / (Ganadas + Canceladas)`**. Esto aísla el rendimiento de las cotizaciones que aún se encuentran en progreso o seguimiento ("en el aire"), brindando una métrica de cierre definitiva ("Win Rate" neto).
*   **Efic. (D):** Reflejará el promedio de tiempo individual de cada vendedor.
*   **Estado (Semaforización):** Se implementará una lógica similar a la de `getTrafficStyle` existente en la plataforma, pero enfocada a eficiencia:
    *   `Eficiente` (Píldora contorno verde): Si la eficiencia promedio es excelente (ej. < 1.5d).
    *   `Riesgo` (Píldora contorno amarillo/naranja): Si la eficiencia está en un rango de alerta (ej. 1.5d - 2.0d).
    *   `Cuello botella` (Píldora contorno rojo): Si la eficiencia rebasa la tolerancia aceptable (ej. > 2.0d).

*(Nota Arquitectónica: Al remover el botón "Llamar", la última columna en la vista será "ESTADO", la cual se ajustará hacia la derecha en la cuadrícula).*

---

## 4. Renderizado en el Frontend (Vue 3 / `index.html`)

### 4.1 Tipografía y "Design Tokens"
El módulo de KPIs se adherirá a las reglas de "homogeneidad tipográfica" de la aplicación:
*   Se usará la regla base de `font-size: 11px !important;` y `font-family: 'Arial', sans-serif !important;` para los textos y datos numéricos dentro de la tabla de rendimiento.
*   Los encabezados (TH) de la tabla de rendimiento (vol., ganadas, % cierre, etc.) serán transformados a minúsculas (`text-transform: lowercase !important;`).
*   Los colores de las métricas semaforizadas usarán las variables CSS ya inyectadas en la aplicación base o códigos equivalentes exactos del diseño proporcionado.

### 4.2 Reactividad y Ciclo de Vida
*   Se declararán variables reactivas (ej. `adminDashboardKpis`) y banderas de carga (`isLoadingKpis`).
*   Durante la llamada `mounted()`, y tras verificar el rol `ADMIN` del usuario, se ejecutará la invocación asíncrona a `google.script.run` para obtener los datos desde el servidor. Se desplegará un *Skeleton Loader* o estado de carga minimalista en la UI mientras la promesa se resuelve.

### 4.3 Prevención de Regresiones
Todo parseo de fechas en la capa de gráficas o el backend incluirá un esquema mixto para prevenir fallos originados por diferencias de formato (ej. strings de "DD/MM/YY" de la captura humana vs estampas de tiempo ISO), garantizando el flujo de trabajo estable y constante que caracteriza la plataforma.
