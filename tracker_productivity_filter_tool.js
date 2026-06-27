const fs = require('fs');

function addFunctions() {
  let html = fs.readFileSync('index.html', 'utf8');

  // Find the button area to replace with selects
  const searchStr = `                <div>
                    <button class="btn btn-outline-primary shadow-sm" @click="runTrackerProductivityAgent()" :disabled="isLoadingTrackerProductivity">
                        <span v-if="isLoadingTrackerProductivity" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        <i v-else class="fas fa-magic me-2"></i> {{ isLoadingTrackerProductivity ? 'Ejecutando Agente...' : 'EJECUTAR AGENTE TRACKER' }}
                    </button>
                </div>`;

  const newUI = `                <div class="d-flex align-items-center gap-2 flex-wrap">
                    <select class="form-select form-select-sm" v-model="tpFilters.month" style="width:120px;">
                        <option v-for="(mn, idx) in qmMonthNames" :key="idx" :value="idx+1">{{ mn }}</option>
                    </select>
                    <select class="form-select form-select-sm" v-model="tpFilters.year" style="width:100px;">
                        <option v-for="yr in qmYears" :key="yr" :value="yr">{{ yr }}</option>
                    </select>
                    <button class="btn btn-outline-primary shadow-sm btn-sm" @click="runTrackerProductivityAgent()" :disabled="isLoadingTrackerProductivity">
                        <span v-if="isLoadingTrackerProductivity" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        <i v-else class="fas fa-magic me-2"></i> {{ isLoadingTrackerProductivity ? 'Ejecutando Agente...' : 'EJECUTAR AGENTE' }}
                    </button>
                </div>`;

  html = html.replace(searchStr, newUI);

  // Update vue state
  const searchStr2 = `const trackerProductivityData = ref(null);
      const isLoadingTrackerProductivity = ref(false);`;

  const newState = `const trackerProductivityData = ref(null);
      const isLoadingTrackerProductivity = ref(false);
      const tpFilters = ref({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });`;

  html = html.replace(searchStr2, newState);

  // Update function call
  const searchStr3 = `}).runTrackerProductivityAgent({ month: now.getMonth() + 1, year: now.getFullYear() });`;
  const newCall = `}).runTrackerProductivityAgent({ month: tpFilters.value.month, year: tpFilters.value.year });`;
  html = html.replace(searchStr3, newCall);

  // Add tpFilters to returned variables
  const searchStr4 = `runTrackerProductivityAgent, trackerProductivityData, isLoadingTrackerProductivity,`;
  const newReturn = `runTrackerProductivityAgent, trackerProductivityData, isLoadingTrackerProductivity, tpFilters,`;
  if(!html.includes('tpFilters,')) {
    html = html.replace(searchStr4, newReturn);
  }

  fs.writeFileSync('index.html', html, 'utf8');
}

addFunctions();
