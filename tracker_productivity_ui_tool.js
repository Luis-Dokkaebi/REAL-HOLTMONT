const fs = require('fs');

function addFunctions() {
  let html = fs.readFileSync('index.html', 'utf8');

  const insertBeforeStr = "        <div v-if=\"currentView === 'DIRECTORY_VIEW'\"";

  const uiCode = `
        <!-- VISTA: PRODUCTIVIDAD ACTIVIDADES -->
        <div v-if="currentView === 'PRODUCTIVIDAD_ACTIVIDADES'" class="h-100 d-flex flex-column animate__animated animate__fadeIn" style="background:#f8f9fa; padding:20px; overflow-y:auto;">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded shadow-sm border-start border-primary border-4">
                <div class="d-flex align-items-center">
                    <div class="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-3" style="width:40px;height:40px;">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div>
                        <h4 class="fw-bold m-0 text-dark">Productividad de Tracker (PPC)</h4>
                        <small class="text-muted">Métricas de Actividades Realizadas (Excluye Ventas)</small>
                    </div>
                </div>
                <div>
                    <button class="btn btn-outline-primary shadow-sm" @click="runTrackerProductivityAgent()" :disabled="isLoadingTrackerProductivity">
                        <span v-if="isLoadingTrackerProductivity" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        <i v-else class="fas fa-magic me-2"></i> {{ isLoadingTrackerProductivity ? 'Ejecutando Agente...' : 'EJECUTAR AGENTE TRACKER' }}
                    </button>
                </div>
            </div>

            <!-- Loader -->
            <div v-if="isLoadingTrackerProductivity" class="d-flex flex-column justify-content-center align-items-center my-5">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
                <p class="mt-3 text-muted fw-bold">El Agente IA de Productividad está analizando los datos...</p>
            </div>

            <!-- Dashboard Content -->
            <div v-if="trackerProductivityData && !isLoadingTrackerProductivity" class="container-fluid px-0">

                <!-- GEMINI EXECUTIVE SUMMARY -->
                <div class="card border-0 shadow-sm mb-4" v-if="trackerProductivityData.geminiReport">
                    <div class="card-header bg-white border-bottom border-primary py-3 d-flex align-items-center">
                         <i class="fas fa-robot text-primary me-2"></i>
                         <h6 class="m-0 fw-bold text-dark">Reporte Ejecutivo IA (Gemini)</h6>
                    </div>
                    <div class="card-body p-4" style="background: linear-gradient(to right, #f8faff, #ffffff);">
                         <p class="m-0 text-dark" style="font-size: 1.1rem; line-height: 1.6; white-space: pre-wrap;">{{ trackerProductivityData.geminiReport }}</p>
                    </div>
                </div>

                <!-- ALERTS -->
                <div class="mb-4" v-if="trackerProductivityData.alerts && trackerProductivityData.alerts.length > 0">
                    <h6 class="fw-bold text-dark mb-3"><i class="fas fa-bell text-warning me-2"></i>Alertas Operativas</h6>
                    <div v-for="(alert, index) in trackerProductivityData.alerts" :key="index"
                         class="alert d-flex align-items-center shadow-sm"
                         :class="{ 'alert-danger': alert.severity === 'ALTA', 'alert-warning': alert.severity === 'MEDIA', 'alert-info': alert.severity === 'BAJA' }">
                        <span class="fs-4 me-3">{{ alert.icon }}</span>
                        <div class="flex-grow-1 text-dark fw-bold">{{ alert.mensaje }}</div>
                        <span class="badge ms-3" :class="{ 'bg-danger': alert.severity === 'ALTA', 'bg-warning text-dark': alert.severity === 'MEDIA', 'bg-info': alert.severity === 'BAJA' }">{{ alert.severity }}</span>
                    </div>
                </div>

                <!-- KPI CARDS -->
                <div class="row g-3 mb-4">
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm h-100 p-3" style="border-left: 4px solid #4a90e2 !important;">
                            <div class="text-muted text-uppercase" style="font-size: 0.8rem; font-weight: 600;">Volumen Total</div>
                            <div class="d-flex align-items-baseline mt-2">
                                <h2 class="text-dark fw-bold m-0 me-2">{{ trackerProductivityData.metrics.totalTasks }}</h2>
                                <span class="text-muted" style="font-size: 0.85rem;">tareas realizadas</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm h-100 p-3" :style="{ borderLeft: trackerProductivityData.metrics.onTimePct >= 80 ? '4px solid #28a745 !important' : '4px solid #dc3545 !important' }">
                            <div class="text-muted text-uppercase" style="font-size: 0.8rem; font-weight: 600;">Entregas a Tiempo</div>
                            <div class="d-flex align-items-baseline mt-2">
                                <h2 class="fw-bold m-0 me-2" :class="trackerProductivityData.metrics.onTimePct >= 80 ? 'text-success' : 'text-danger'">{{ trackerProductivityData.metrics.onTimePct }}%</h2>
                                <span class="text-muted" style="font-size: 0.85rem;">({{ trackerProductivityData.metrics.onTimeTasks }} a tiempo)</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm h-100 p-3" style="border-left: 4px solid #17a2b8 !important;">
                            <div class="text-muted text-uppercase" style="font-size: 0.8rem; font-weight: 600;">Promedio de Resolución</div>
                            <div class="d-flex align-items-baseline mt-2">
                                <h2 class="text-info fw-bold m-0 me-2">{{ trackerProductivityData.metrics.avgDurationDays }}</h2>
                                <span class="text-muted" style="font-size: 0.85rem;">días (aprox.)</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm h-100 p-3" style="border-left: 4px solid #6c757d !important;">
                            <div class="text-muted text-uppercase" style="font-size: 0.8rem; font-weight: 600;">Con Restricciones / Riesgos</div>
                            <div class="d-flex align-items-baseline mt-2">
                                <h3 class="text-secondary fw-bold m-0 me-2">{{ trackerProductivityData.metrics.restrictionsPct }}% / {{ trackerProductivityData.metrics.risksPct }}%</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TABLES SECTION -->
                <div class="row g-4">
                    <!-- Top Collabs -->
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm h-100">
                            <div class="card-header bg-white border-0 pt-3 pb-0">
                                <h6 class="fw-bold text-dark m-0"><i class="fas fa-users text-primary me-2"></i>Productividad por Colaborador</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover table-sm align-middle">
                                        <thead class="table-light">
                                            <tr>
                                                <th class="text-muted" style="font-size: 0.8rem; font-weight:600;">COLABORADOR</th>
                                                <th class="text-center text-muted" style="font-size: 0.8rem; font-weight:600;">DEPTO</th>
                                                <th class="text-center text-muted" style="font-size: 0.8rem; font-weight:600;">VOLUMEN</th>
                                                <th class="text-center text-muted" style="font-size: 0.8rem; font-weight:600;">% A TIEMPO</th>
                                                <th class="text-center text-muted" style="font-size: 0.8rem; font-weight:600;">PROM. DÍAS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="c in trackerProductivityData.metrics.byCollabArr" :key="c.name">
                                                <td class="fw-bold text-dark" style="font-size: 0.85rem;">{{ c.name }}</td>
                                                <td class="text-center" style="font-size: 0.8rem;">{{ c.dept }}</td>
                                                <td class="text-center fw-bold" style="font-size: 0.9rem;">{{ c.count }}</td>
                                                <td class="text-center fw-bold" :class="c.onTimePct >= 80 ? 'text-success' : 'text-danger'" style="font-size: 0.9rem;">{{ c.onTimePct }}%</td>
                                                <td class="text-center text-muted" style="font-size: 0.85rem;">{{ c.avgDays }}</td>
                                            </tr>
                                            <tr v-if="!trackerProductivityData.metrics.byCollabArr || trackerProductivityData.metrics.byCollabArr.length === 0">
                                                <td colspan="5" class="text-center text-muted py-3">No hay datos de colaboradores.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Depts & Priorities -->
                    <div class="col-md-6">
                        <div class="row g-4">
                            <!-- Depts -->
                            <div class="col-12">
                                <div class="card border-0 shadow-sm">
                                    <div class="card-header bg-white border-0 pt-3 pb-0">
                                        <h6 class="fw-bold text-dark m-0"><i class="fas fa-building text-primary me-2"></i>Volumen por Departamento</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="table-responsive">
                                            <table class="table table-hover table-sm align-middle">
                                                <thead class="table-light">
                                                    <tr>
                                                        <th class="text-muted" style="font-size: 0.8rem; font-weight:600;">DEPARTAMENTO</th>
                                                        <th class="text-center text-muted" style="font-size: 0.8rem; font-weight:600;">VOLUMEN (TAREAS)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="d in trackerProductivityData.metrics.byDeptArr" :key="d.dept">
                                                        <td class="fw-bold text-dark" style="font-size: 0.85rem;">{{ d.dept }}</td>
                                                        <td class="text-center fw-bold" style="font-size: 0.9rem;">{{ d.count }}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Priorities -->
                            <div class="col-12">
                                <div class="card border-0 shadow-sm">
                                    <div class="card-header bg-white border-0 pt-3 pb-0">
                                        <h6 class="fw-bold text-dark m-0"><i class="fas fa-layer-group text-primary me-2"></i>Distribución de Prioridades</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="d-flex justify-content-around text-center">
                                            <div>
                                                <div class="text-danger fw-bold" style="font-size: 1.5rem;">{{ trackerProductivityData.metrics.priorityStats['ALTA'] }}</div>
                                                <div class="text-muted" style="font-size: 0.8rem;">ALTA</div>
                                            </div>
                                            <div>
                                                <div class="text-warning fw-bold" style="font-size: 1.5rem;">{{ trackerProductivityData.metrics.priorityStats['MEDIA'] }}</div>
                                                <div class="text-muted" style="font-size: 0.8rem;">MEDIA</div>
                                            </div>
                                            <div>
                                                <div class="text-info fw-bold" style="font-size: 1.5rem;">{{ trackerProductivityData.metrics.priorityStats['BAJA'] }}</div>
                                                <div class="text-muted" style="font-size: 0.8rem;">BAJA</div>
                                            </div>
                                            <div>
                                                <div class="text-secondary fw-bold" style="font-size: 1.5rem;">{{ trackerProductivityData.metrics.priorityStats['SIN_PRIORIDAD'] }}</div>
                                                <div class="text-muted" style="font-size: 0.8rem;">SIN PRIORIDAD</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div v-else-if="!isLoadingTrackerProductivity && !trackerProductivityData" class="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
                 <i class="fas fa-chart-bar fs-1 mb-3" style="opacity: 0.3;"></i>
                 <h5>No hay datos cargados</h5>
                 <p>Haz clic en "EJECUTAR AGENTE TRACKER" para obtener el reporte.</p>
            </div>
        </div>

`;

  if (html.includes("PRODUCTIVIDAD_ACTIVIDADES") && html.includes("Volumen Total")) {
     console.log("Already added view");
  } else {
     html = html.replace(insertBeforeStr, uiCode + "\n" + insertBeforeStr);
  }

  // Add Vue reactive variables & methods
  const methodCode = `
            // ================== TRACKER PRODUCTIVITY AGENT ==================
            isLoadingTrackerProductivity: false,
            trackerProductivityData: null,
            runTrackerProductivityAgent() {
                this.isLoadingTrackerProductivity = true;
                this.trackerProductivityData = null;
                const now = new Date();
                google.script.run.withSuccessHandler(res => {
                    this.isLoadingTrackerProductivity = false;
                    if(res && res.success) {
                        this.trackerProductivityData = res.data;
                        if(res.data.emailSent) {
                            this.showToast('Reporte generado y enviado por correo a los administradores.', 'success');
                        } else {
                            this.showToast('Reporte generado, pero no se pudo enviar por correo.', 'warning');
                        }
                    } else {
                        this.showToast('Error al ejecutar el agente: ' + (res?res.message:'Error desconocido'), 'error');
                    }
                }).withFailureHandler(err => {
                    this.isLoadingTrackerProductivity = false;
                    this.showToast('Falla de conexión al ejecutar agente: ' + err, 'error');
                }).runTrackerProductivityAgent({ month: now.getMonth() + 1, year: now.getFullYear() });
            },
`;

  if (!html.includes("runTrackerProductivityAgent()")) {
      html = html.replace("loadPersonalAgenda() {", methodCode + "\n            loadPersonalAgenda() {");
  }

  const varCode = "trackerProductivityData: null,\n            isLoadingTrackerProductivity: false,";
  if(!html.includes("isLoadingTrackerProductivity: false")) {
      html = html.replace("setupFinished: false,", "setupFinished: false,\n            " + varCode);
  }

  fs.writeFileSync('index.html', html, 'utf8');
}

addFunctions();
