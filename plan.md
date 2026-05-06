1. **Understand the requirements:**
   - Add a new "Dashboard de KPIs Reales para Administradores" for Jaime Olivo (ADMIN_CONTROL).
   - This should follow `SDD_KPI_ADMIN.md` exactly.
   - It will replace the current mock data logic with real data dynamically calculated in the backend.
   - Top Cards: Vol, Cierres, Pérdidas, Eficiencia. Cierres = % Ganadas (Ganadas / Enviadas).
   - Charts: Embudo (Recibidas, Integradas, A tiempo, Seguimiento, Ganadas), Motivos de Pérdida (Doughnut), Productividad (Weekly line chart).
   - Table: RENDIMIENTO INDIVIDUAL without "Llamar" action column. (COLABORADOR, VOL., GANADAS, % CIERRE (Ganadas / (Ganadas + Canceladas)), EFIC. (D), ESTADO (Eficiente, Riesgo, Cuello botella)).
   - Implement `apiFetchAdminKPIs` in `CODIGO.js`.
   - Implement frontend logic for UI and state. Ensure typography homogeneity.

2. **Backend (`CODIGO.js`) Changes:**
   - Create `apiFetchAdminKPIs()` which extracts real data from all user trackers and Info Bank history if needed, or primarily active trackers, to compute:
     - `globalMetrics`: { totalQuotes, ganadas, ganadasPercentage, perdidasRiesgo, riskAmount, averageEfficiency }
     - `funnelData`: { recibidas, integradas, aTiempo, seguimiento, ganadas }
     - `lossDistribution`: array of { label, value } for "Motivo Perdida"
     - `weeklyProductivity`: array for Monday to Friday.
     - `collaboratorStats`: array of { name, vol, ganadas, cierrePercentage, avgEfic, estado }
   - Add this function to return aggregated KPI stats exactly as SDD requests.

3. **Frontend (`index.html`) Changes:**
   - Update `INSTRUCCIONES_ADMIN_CONTROL` view (or add a separate KPI dashboard view button) for `ADMIN_CONTROL`. Wait, `KPI_DASHBOARD` already exists for `LUIS_CARLOS`. The request is to "implementa la nueva vista del 'Dashboard de KPIs para Administradores' para el usuario Jaime Olivo (ADMIN_CONTROL)".
   - So I should make the "KPI_DASHBOARD" view accessible to `ADMIN_CONTROL` via a new Sidebar navigation button.
   - Or maybe a completely new view `KPI_ADMIN_DASHBOARD` for Jaime Olivo based on the design document.
   - The user asked to "implementa la nueva vista del 'Dashboard de KPIs para Administradores' para el usuario Jaime Olivo (ADMIN_CONTROL)".
   - I'll replace the existing mocked KPI view or create a new dedicated admin one specifically for this purpose, aligning with the 3 sections defined in `SDD_KPI_ADMIN.md` (Top cards, Charts, Individual Performance Table).
   - Sidebar: Add a button for "KPI DASHBOARD" visible to `ADMIN_CONTROL`.
   - Update `kpiData` structure, `loadKPIData` function, and the HTML structure to match the new Top Cards, Charts, and Table.
   - Include UI logic for Chart.js.

4. **Verify changes & pre-commit steps:**
   - `pre_commit_instructions`
   - Test UI with `python3 verify_ui.py`
   - Test backend with `node syntax_check.js`

Let's request a plan review.
