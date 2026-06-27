const fs = require('fs');

function addFunctions() {
  let html = fs.readFileSync('index.html', 'utf8');

  // Add Vue reactive variables & methods
  const methodCode = `
      // ================== TRACKER PRODUCTIVITY AGENT ==================
      const runTrackerProductivityAgent = () => {
          isLoadingTrackerProductivity.value = true;
          trackerProductivityData.value = null;
          const now = new Date();
          google.script.run.withSuccessHandler(res => {
              isLoadingTrackerProductivity.value = false;
              if(res && res.success) {
                  trackerProductivityData.value = res.data;
                  if(res.data.emailSent) {
                      showToast('Reporte generado y enviado por correo a los administradores.', 'success');
                  } else {
                      showToast('Reporte generado, pero no se pudo enviar por correo.', 'warning');
                  }
              } else {
                  showToast('Error al ejecutar el agente: ' + (res?res.message:'Error desconocido'), 'error');
              }
          }).withFailureHandler(err => {
              isLoadingTrackerProductivity.value = false;
              showToast('Falla de conexión al ejecutar agente: ' + err, 'error');
          }).runTrackerProductivityAgent({ month: now.getMonth() + 1, year: now.getFullYear() });
      };
`;

  if (!html.includes("const runTrackerProductivityAgent = () => {")) {
      html = html.replace("const loadPersonalAgenda = () => {", methodCode + "\n      const loadPersonalAgenda = () => {");
  }

  const varCode = "const trackerProductivityData = Vue.ref(null);\n      const isLoadingTrackerProductivity = Vue.ref(false);";
  if(!html.includes("isLoadingTrackerProductivity = Vue.ref(false)")) {
      html = html.replace("const setupFinished = Vue.ref(false);", "const setupFinished = Vue.ref(false);\n      " + varCode);
  }

  if(html.includes("refreshProjectTasks, addNewProjectTask, saveProjectRow, isRecording, toggleDictation,")) {
      html = html.replace("refreshProjectTasks, addNewProjectTask, saveProjectRow, isRecording, toggleDictation,", "refreshProjectTasks, addNewProjectTask, saveProjectRow, isRecording, toggleDictation, runTrackerProductivityAgent, trackerProductivityData, isLoadingTrackerProductivity,");
  }

  fs.writeFileSync('index.html', html, 'utf8');
}

addFunctions();
