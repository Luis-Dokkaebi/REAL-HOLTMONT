1. **CODIGO.js - Backend Metrics API (`apiFetchTrackerProductivityMetrics`)**:
   - Create a new API function in `CODIGO.js` similar to `apiFetchQuoteAgentMetrics`.
   - Fetch 'TAREAS REALIZADAS' only for `ESTANDAR` and `HIBRIDO` users, excluding `VENTAS` sheets.
   - Calculate KPIs:
     - On-time vs Late (compare estimated vs real end date/timestamps).
     - Volume & Productivity: Total tasks completed per month, per department, per top collaborator.
     - Priorities & Complexity: Breakdown by priority, percentage with restrictions or risks.
   - Return these metrics to the frontend and internal agent function.

2. **CODIGO.js - Gemini Agent Engine (`runTrackerProductivityAgent`)**:
   - Create a function that consumes the metrics from step 1.
   - Add the specific prompt for Gemini:
     - "Eres un Analista de Productividad y Operaciones Senior. Analiza las siguientes métricas del equipo correspondientes al mes. Tu objetivo es redactar un reporte ejecutivo muy conciso (máximo 180 palabras) en español. Debes destacar el porcentaje de tareas entregadas a tiempo, identificar si hay un cuello de botella con las prioridades altas o restricciones, y mencionar al colaborador o departamento más productivo. Termina siempre con UNA recomendación operativa concreta para mejorar los tiempos de entrega."
   - Trigger Gemini using the existing `callGeminiAPI`.
   - Send the report using a variation of `_sendAgentEmail` (e.g. `_sendTrackerProductivityEmail`).

3. **index.html - Sidebar & View**:
   - Add 'PRODUCTIVIDAD ACTIVIDADES' to the left menu (for Admins or all roles depending on requirements, I'll make it visible for ADMIN, ADMIN_CONTROL, PPC_ADMIN).
   - Create the view with 'KPI Cards' (Volume, on-time percentage, averages, alerts).
   - Add a button 'EJECUTAR AGENTE TRACKER' which calls the backend `runTrackerProductivityAgent`.
   - Display the generated Gemini report in the UI.
