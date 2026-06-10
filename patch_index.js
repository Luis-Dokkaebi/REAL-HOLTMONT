const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Update openPpcForm to load drafts based on type
code = code.replace(
  /const openPpcForm \= \(tipo\) \=\> \{([\s\S]*?)google\.script\.run\.withSuccessHandler\(res \=\> \{ if\(res\.success\) ppcExistingData\.value \= res\.data; \}\)\.apiFetchPPCData\(\);/,
  `const openPpcForm = (tipo) => {
          ppcMenuTipo.value = tipo || '';
          currentView.value = 'PPC_FORM';
          google.script.run.withSuccessHandler(res => {
              if(res.success && res.data.length > 0) { activityQueue.value = res.data; }
              else { activityQueue.value = []; fillEmptyQueueRows(); }
          }).apiFetchDrafts(tipo);
          google.script.run.withSuccessHandler(res => { if(res.success) ppcExistingData.value = res.data; }).apiFetchPPCData();`
);

// Update clearQueue and syncQueueToBackend to pass ppcMenuTipo.value
code = code.replace(
  /const syncQueueToBackend \= \(\) \=\> \{ google\.script\.run\.apiSyncDrafts\(JSON\.parse\(JSON\.stringify\(activityQueue\.value\)\)\); \};/,
  `const syncQueueToBackend = () => { google.script.run.apiSyncDrafts(JSON.parse(JSON.stringify(activityQueue.value)), ppcMenuTipo.value); };`
);

code = code.replace(
  /const clearQueue \= \(\) \=\> \{ Swal\.fire\(\{ title: '¿Limpiar tabla\?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' \}\)\.then\(\(result\) \=\> \{ if \(result\.isConfirmed\) \{ activityQueue\.value \= \[\]; google\.script\.run\.apiClearDrafts\(\); \} \}\); \};/,
  `const clearQueue = () => { Swal.fire({ title: '¿Limpiar tabla?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' }).then((result) => { if (result.isConfirmed) { activityQueue.value = []; google.script.run.apiClearDrafts(ppcMenuTipo.value); fillEmptyQueueRows(); } }); };`
);


// Modificar el botón Atrás
code = code.replace(
  /<div><button class="btn btn-outline-secondary btn-sm me-2" @click="currentView='PPC_MENU'"><i class="fas fa-arrow-left me-1"><\/i> Menú<\/button><button class="btn btn-success fw-bold btn-sm me-2 shadow-sm" @click="openPpcProjectSelector"><i class="fas fa-plus-circle me-1"><\/i> PPC NUEVO<\/button><button class="btn btn-light border btn-sm" @click="goHome">Cerrar<\/button><\/div>/,
  `<div><button class="btn btn-outline-secondary btn-sm me-2" @click="currentView='PPC_MENU'"><i class="fas fa-arrow-left me-1"></i> Atrás</button><button class="btn btn-outline-secondary btn-sm me-2" @click="currentView='PPC_MENU'"><i class="fas fa-bars me-1"></i> Menú</button><button class="btn btn-success fw-bold btn-sm me-2 shadow-sm" @click="openPpcProjectSelector"><i class="fas fa-plus-circle me-1"></i> PPC NUEVO</button><button class="btn btn-light border btn-sm" @click="goHome">Cerrar</button></div>`
);


fs.writeFileSync('index.html', code);
