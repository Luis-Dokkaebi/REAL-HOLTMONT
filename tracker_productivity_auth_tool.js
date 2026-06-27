const fs = require('fs');

function addFunctions() {
  let html = fs.readFileSync('index.html', 'utf8');

  const searchStr = `<div class="nav-item" v-if="['ADMIN', 'ADMIN_CONTROL', 'PPC_ADMIN'].includes(currentRole)" :class="{ active: currentView === 'PRODUCTIVIDAD_ACTIVIDADES' }" @click="currentView = 'PRODUCTIVIDAD_ACTIVIDADES'; currentDept = ''; currentModuleId = '';">`;
  const newAuth = `<div class="nav-item" v-if="['ADMIN'].includes(currentRole)" :class="{ active: currentView === 'PRODUCTIVIDAD_ACTIVIDADES' }" @click="currentView = 'PRODUCTIVIDAD_ACTIVIDADES'; currentDept = ''; currentModuleId = '';">`;

  html = html.replace(searchStr, newAuth);

  fs.writeFileSync('index.html', html, 'utf8');
}

addFunctions();
