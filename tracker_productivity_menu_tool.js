const fs = require('fs');

function addFunctions() {
  let html = fs.readFileSync('index.html', 'utf8');

  const insertBeforeStr = "<!-- BOTÓN DIRECTORIO (Solo ADMIN y ADMIN_CONTROL) -->";

  const menuItemCode = `
        <!-- BOTÓN PRODUCTIVIDAD ACTIVIDADES -->
        <div class="nav-item" v-if="['ADMIN', 'ADMIN_CONTROL', 'PPC_ADMIN'].includes(currentRole)" :class="{ active: currentView === 'PRODUCTIVIDAD_ACTIVIDADES' }" @click="currentView = 'PRODUCTIVIDAD_ACTIVIDADES'; currentDept = ''; currentModuleId = '';">
            <div class="nav-icon-col"><i class="fas fa-chart-line text-primary"></i></div>
            <span class="nav-text text-primary fw-bold">PRODUCTIVIDAD ACTIVIDADES</span>
        </div>
`;

  if (html.includes("PRODUCTIVIDAD_ACTIVIDADES")) {
     console.log("Already added");
     return;
  }

  html = html.replace(insertBeforeStr, menuItemCode + "\n        " + insertBeforeStr);

  fs.writeFileSync('index.html', html, 'utf8');
}

addFunctions();
