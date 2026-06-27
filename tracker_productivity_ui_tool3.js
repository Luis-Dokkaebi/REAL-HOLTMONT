const fs = require('fs');

function addFunctions() {
  let html = fs.readFileSync('index.html', 'utf8');

  // Add Vue reactive variables & methods
  const methodCode = `
            // ================== TRACKER PRODUCTIVITY AGENT ==================
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

  if (!html.includes("runTrackerProductivityAgent() {")) {
      html = html.replace("            loadPersonalAgenda() {", methodCode + "\n            loadPersonalAgenda() {");
  }

  const varCode = "trackerProductivityData: null,\n            isLoadingTrackerProductivity: false,";
  if(!html.includes("isLoadingTrackerProductivity: false")) {
      html = html.replace("setupFinished: false,", "setupFinished: false,\n            " + varCode);
  }

  fs.writeFileSync('index.html', html, 'utf8');
}

addFunctions();
