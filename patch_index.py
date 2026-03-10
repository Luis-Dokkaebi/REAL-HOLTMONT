import re

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. CSS
html = html.replace(".hp-circle.red { background-color: #dc3545; }", ".hp-circle.red { background-color: #dc3545; }\n    .hp-circle.yellow { background-color: #ffc107; color: #000; }")

# 2. Template bindings (avoid syntax errors!)
html = html.replace("<div class=\"hp-circle\" :class=\"step.isDone ? 'green' : 'red'\"", "<div class=\"hp-circle\" :class=\"step.isDone ? 'green' : (step.isInProgress ? 'yellow' : 'red')\"")
html = html.replace("<i v-if=\"step.isDone\" class=\"fas fa-check\"></i>", "<i v-if=\"step.isDone\" class=\"fas fa-check\"></i><i v-else-if=\"step.isInProgress\" class=\"fas fa-user-clock\"></i>")

# 3. getProcessTimeline HTML global helper
old_get_global = r'function getProcessTimeline\(row\) \{\s*let mapCot = row\["MAP COT"\] \|\| row\.PROCESO;\s*if \(\!mapCot\) return "";\s*let log = \[\];\s*try \{\s*if \(row\.PROCESO_LOG\) log = JSON\.parse\(row\.PROCESO_LOG\);\s*\} catch\(e\) \{\}\s*let html = \"\";\s*const parts = mapCot\.split\(\"\|\/\>\|\/\|\"\)\.map\(p \=> p\.trim\(\)\);\s*parts\.forEach\(part \=> \{\s*if \(\!part\) return;\s*const isDone = part\.includes\(\"🟢\"\);\s*const isCurrent = part\.includes\(\"🔴\"\);\s*const abbr = part\.replace\(/\[🟢🔴⚪\]/g, \"\"\)\.trim\(\);\s*let title = getFullProcessName\(abbr\);\s*let foundLog = log\.find\(l \=> l\.to === abbr\);\s*if \(foundLog\) \{\s*title \+\= ` \\n\$foundLog\.dateStr\}`;\s*\}\s*let style = \"background:#e0e0e0; color:#333;\";\s*if \(isDone\) style = \"background:#28a745; color:#fff;\";\s*else if \(isCurrent\) style = \"background:#dc3545; color:#fff;\";\s*html \+\= `<div class=\"process-step\" style=\"\$\{style\}\" title=\"\$\{title\}\">\$\{abbr\}</div>`;\s*\}\);\s*return html;\s*\}'
new_get_global = r"""function getProcessTimeline(row) {
    let mapCot = row["MAP COT"] || row.PROCESO;
    if (!mapCot) return "";
    let log = [];
    try { if (row.PROCESO_LOG) log = JSON.parse(row.PROCESO_LOG); } catch(e) {}
    let html = "";
    const parts = mapCot.split(/\||>|\//).map(p => p.trim());
    parts.forEach((part, index) => {
        if (!part) return;
        const isDone = part.includes("🟢");
        const isCurrent = part.includes("🔴");
        const isInProgress = part.includes("🟡");
        const abbr = part.replace(/[🟢🔴🟡⚪]/g, "").trim();
        let title = getFullProcessName(abbr);
        let foundLog = log.find(l => l.step === abbr || l.to === abbr);
        if (foundLog && foundLog.dateStr) {
            title += ` \n${foundLog.dateStr}`;
            if (foundLog.assignee) title += ` \nAssignee: ${foundLog.assignee}`;
        } else if (foundLog && foundLog.timestamp) {
            title += ` \n${new Date(foundLog.timestamp).toLocaleString()}`;
            if (foundLog.assignee) title += ` \nAssignee: ${foundLog.assignee}`;
        }
        let style = "background:#e0e0e0; color:#333;"; // Pending
        if (isDone) style = "background:#28a745; color:#fff;"; // Done
        else if (isCurrent) style = "background:#dc3545; color:#fff;"; // Current Needs Action
        else if (isInProgress) style = "background:#ffc107; color:#000;"; // In Progress
        html += `<div class="process-step" style="${style}; cursor:pointer;" onclick="assignProcess('${row.FOLIO}', '${abbr}')" title="${title}">${abbr}</div>`;
    });
    return html;
}"""
html = re.sub(old_get_global, new_get_global, html)

# 4. generateEmojiTimeline global helper
old_gen = r'function generateEmojiTimeline\(currentStepAbbr\) \{\s*let parts = \[\];\s*let passed = true;\s*PROCESS_STEPS\.forEach\(step \=> \{\s*if \(passed\) \{\s*if \(step\.abbr === currentStepAbbr\) \{\s*parts\.push\(\`🔴 \$\{step\.abbr\}\`\);\s*passed = false;\s*\} else \{\s*parts\.push\(\`🟢 \$\{step\.abbr\}\`\);\s*\}\s*\} else \{\s*parts\.push\(\`⚪ \$\{step\.abbr\}\`\);\s*\}\s*\}\);\s*return parts\.join\(\" \| \"\);\s*\}'
new_gen = r"""function generateEmojiTimeline(logArray) {
    if (!Array.isArray(logArray)) return "";
    let parts = [];
    PROCESS_STEPS.forEach(step => {
        let entry = logArray.find(e => e.step === step.abbr);
        if (entry) {
            if (entry.status === 'DONE') parts.push(`🟢 ${step.abbr}`);
            else if (entry.status === 'IN_PROGRESS') parts.push(`🟡 ${step.abbr}`);
            else if (entry.status === 'PENDING') parts.push(`🔴 ${step.abbr}`);
        } else {
            parts.push(`⚪ ${step.abbr}`);
        }
    });
    return parts.join(" | ");
}"""
html = re.sub(old_gen, new_gen, html)

# 5. Vue getProcessTimeline
old_vue_tl = r"""      const getProcessTimeline = \(row\) => \{.*?return PROCESS_STEPS\.map\(\(stepId, idx\) => \{.*?\};\n          \}\);\n      \};"""
new_vue_tl = r"""      const getProcessTimeline = (row) => {
          let log = [];
          try {
              if (row.PROCESO_LOG) log = JSON.parse(row.PROCESO_LOG);
          } catch(e) {}

          let mapCot = row["MAP COT"] || row.PROCESO || "";
          let parsedParts = mapCot.split(/\||>|\//).map(p => p.trim()).filter(p => p);

          let startDate = new Date();
          const dateKeys = ['FECHA', 'FECHA INICIO', 'ALTA', 'FECHA DE INICIO', 'FECHA VISITA', 'FECHA_ALTA'];
          for (const k of dateKeys) {
              if (row[k]) {
                  const val = row[k];
                  if (val instanceof Date) startDate = val;
                  else if (typeof val === 'string') {
                      const parts = val.split('/');
                      if (parts.length === 3) {
                          let y = parts[2];
                          if (y.length === 2) y = '20' + y;
                          startDate = new Date(y, parts[1]-1, parts[0]);
                      }
                  }
                  break;
              }
          }

          const formatDiff = (diffMs) => {
              const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              if (days > 0) return `${days}d ${hours}h`;
              if (hours > 0) return `${hours}h`;
              return '< 1h';
          };

          return PROCESS_STEPS.map((stepId, idx) => {
              let statusChar = '⚪';
              let matchingPart = parsedParts.find(p => p.includes(stepId));
              if (matchingPart) {
                  if (matchingPart.includes('🟢')) statusChar = '🟢';
                  else if (matchingPart.includes('🔴')) statusChar = '🔴';
                  else if (matchingPart.includes('🟡')) statusChar = '🟡';
              } else {
                  const currentStatus = getProcessStatus(row);
                  const currentIdx = PROCESS_STEPS.indexOf(currentStatus);
                  if (idx < currentIdx) statusChar = '🟢';
                  else if (idx === currentIdx) statusChar = '🔴';
              }

              let isDone = statusChar === '🟢';
              let isCurrent = statusChar === '🔴';
              let isInProgress = statusChar === '🟡';

              let stepEntry = log.find(l => l.step === stepId || l.to === stepId);
              let timeLabel = '';

              if (isDone || isInProgress) {
                  if (stepEntry && stepEntry.timestamp) {
                      const diff = new Date().getTime() - stepEntry.timestamp;
                      timeLabel = (isDone ? 'Hecho ' : '') + 'hace ' + formatDiff(diff);
                  } else {
                      timeLabel = (isDone ? 'Hecho ' : '') + 'hace -';
                  }
              } else if (isCurrent) {
                  let prevTime = startDate.getTime();
                  if (idx > 0) {
                      let prevEntry = log.find(l => l.step === PROCESS_STEPS[idx-1] || l.to === PROCESS_STEPS[idx-1]);
                      if (prevEntry && prevEntry.timestamp) prevTime = prevEntry.timestamp;
                  }
                  const diff = new Date().getTime() - prevTime;
                  timeLabel = 'Pendiente ' + formatDiff(diff);
              } else {
                  timeLabel = 'Pendiente -';
              }

              return {
                  id: stepId,
                  isDone: isDone,
                  isCurrent: isCurrent || isInProgress,
                  isInProgress: isInProgress,
                  subtitle: timeLabel,
                  assignee: stepEntry ? stepEntry.assignee : ""
              };
          });
      };"""
html = re.sub(old_vue_tl, new_vue_tl, html, flags=re.DOTALL)

# 6. advanceProcess replacement
old_advance = r'const advanceProcess = \(row\) => \{.*?\};\n\n      const getLastUpdate = \(row\) => \{'
new_advance = r"""const advanceProcess = async (row) => {
          if (!row) return;
          const currentStatus = getProcessStatus(row);
          if (!currentStatus) return;

          let title = "Avanzar a " + currentStatus + "?";

          if (currentStatus === 'Revision de Cotizacion Cliente' || currentStatus === 'RCC') {
              const termRes = await Swal.fire({
                  title: 'Finalizar Cotización',
                  text: 'Selecciona el estatus final de esta cotización',
                  icon: 'question',
                  showDenyButton: true,
                  showCancelButton: true,
                  confirmButtonText: 'Ganada',
                  confirmButtonColor: '#28a745',
                  denyButtonText: 'Perdida x Precio',
                  denyButtonColor: '#dc3545',
                  cancelButtonText: 'Descuento',
                  cancelButtonColor: '#007bff'
              });

              if (termRes.isConfirmed) {
                  row.ESTATUS = 'GANADA';
              } else if (termRes.isDenied) {
                  row.ESTATUS = 'PERDIDA X PRECIO';
              } else if (termRes.dismiss === Swal.DismissReason.cancel) {
                  row.ESTATUS = 'DESCUENTO';
              } else {
                  return; // Escaped
              }

              let mapCot = row["MAP COT"] || row.PROCESO || "";
              if (!mapCot.includes('🟢')) {
                   const parts = PROCESS_STEPS.map(p => '🟢 ' + p);
                   row["MAP COT"] = parts.join(' | ');
              }
              if (row._assignToWorker) delete row._assignToWorker;
              if (row._assignStep) delete row._assignStep;

              Swal.fire({
                  title: 'Guardando...',
                  text: 'Finalizando cotización y actualizando estado...',
                  allowOutsideClick: false,
                  didOpen: () => { Swal.showLoading(); }
              });
              try {
                  const res = await new Promise((resolve) => {
                      google.script.run.withSuccessHandler(resolve).withFailureHandler(resolve).apiUpdateTask("ANTONIA_VENTAS", row, currentUsername.value);
                  });
                  if (res && res.success) {
                      Swal.fire({ title: 'Éxito', text: 'Cotización finalizada correctamente.', icon: 'success', timer: 1500 });
                      if (res.data) Object.assign(row, res.data);
                  } else {
                      throw new Error(res?.message || 'Error desconocido');
                  }
              } catch(err) {
                  Swal.fire('Error', 'No se pudo guardar: ' + err.toString(), 'error');
              }
              return;
          }

          const staffOptions = {};
          if (config.value && Array.isArray(config.value.directory)) {
              config.value.directory.forEach(p => {
                  if (p.name !== 'ANTONIA_VENTAS') {
                      staffOptions[p.name] = p.name;
                  }
              });
          }

          const { value: selectedWorker, isDismissed } = await Swal.fire({
              title: `Asignar etapa: ${getFullProcessName(currentStatus)}`,
              text: `¿A quién se le asignará esta tarea?`,
              input: 'select',
              inputOptions: staffOptions,
              inputPlaceholder: 'Selecciona un responsable...',
              showCancelButton: true,
              confirmButtonText: 'Asignar',
              cancelButtonText: 'Cancelar'
          });

          if (isDismissed || !selectedWorker) return;

          let log = [];
          try { if (row.PROCESO_LOG) log = JSON.parse(row.PROCESO_LOG); } catch(e){}

          let existing = log.find(e => e.step === currentStatus || e.to === currentStatus);
          if (existing) {
               existing.status = 'IN_PROGRESS';
               existing.assignee = selectedWorker;
               existing.timestamp = new Date().getTime();
               existing.dateStr = new Date().toLocaleString();
          } else {
               log.push({
                   step: currentStatus,
                   status: 'IN_PROGRESS',
                   assignee: selectedWorker,
                   timestamp: new Date().getTime(),
                   dateStr: new Date().toLocaleString()
               });
          }

          row.PROCESO_LOG = JSON.stringify(log);

          let newParts = PROCESS_STEPS.map(step => {
              let entry = log.find(l => l.step === step || l.to === step);
              if (entry) {
                  if (entry.status === 'DONE') return '🟢 ' + step;
                  if (entry.status === 'IN_PROGRESS') return '🟡 ' + step;
              }
              if (step === currentStatus) return '🔴 ' + step;
              let idx = PROCESS_STEPS.indexOf(step);
              let currIdx = PROCESS_STEPS.indexOf(currentStatus);
              if (idx < currIdx) return '🟢 ' + step;
              return '⚪ ' + step;
          });
          row["MAP COT"] = newParts.join(' | ');

          row._assignToWorker = selectedWorker;
          row._assignStep = currentStatus;

          Swal.fire({
              title: 'Procesando...',
              text: 'Delegando tarea y actualizando estado. Espera un momento...',
              allowOutsideClick: false,
              didOpen: () => { Swal.showLoading(); }
          });

          try {
              const res = await new Promise((resolve) => {
                  google.script.run.withSuccessHandler(resolve).withFailureHandler(resolve).apiUpdateTask("ANTONIA_VENTAS", row, currentUsername.value);
              });

              delete row._assignToWorker;
              delete row._assignStep;

              if (res && res.success) {
                  Swal.fire({ title: 'Éxito', text: 'La tarea se asignó y actualizó correctamente.', icon: 'success', timer: 1500 });
                  if (res.data) Object.assign(row, res.data);
              } else {
                  throw new Error(res?.message || 'Error desconocido');
              }
          } catch(err) {
              Swal.fire('Error', 'No se pudo guardar: ' + err.toString(), 'error');
          }
      };

      const getLastUpdate = (row) => {"""
html = re.sub(old_advance, new_advance, html, flags=re.DOTALL)

# 7. Auto refresh mechanism
old_open_staff = r"""      const openStaffTracker = \(person\) => \{
          currentStaffName\.value = person\.name;
          activeTrackerTab\.value = 'OPERATIVO';
          staffTracker\.value\.previousView = currentView\.value;
          currentView\.value = 'STAFF_TRACKER';
          loadTrackerData\(\);
      \};"""
new_open_staff = r"""      let trackerRefreshInterval = null;
      const openStaffTracker = (person) => {
          currentStaffName.value = person.name;
          activeTrackerTab.value = 'OPERATIVO';
          staffTracker.value.previousView = currentView.value;
          currentView.value = 'STAFF_TRACKER';
          loadTrackerData();

          if (trackerRefreshInterval) clearInterval(trackerRefreshInterval);
          trackerRefreshInterval = setInterval(() => {
              if (currentView.value === 'STAFF_TRACKER') {
                  loadTrackerData(true);
              } else {
                  clearInterval(trackerRefreshInterval);
                  trackerRefreshInterval = null;
              }
          }, 15000);
      };"""
html = re.sub(old_open_staff, new_open_staff, html)

old_open_hp = r"""      const openHotPotatoView = \(\) => \{
          activeTrackerTab\.value = 'PAPA_CALIENTE';
          trackerSubView\.value = 'HOT_POTATO';
          loadTrackerData\(\);
      \};"""
new_open_hp = r"""      const openHotPotatoView = () => {
          activeTrackerTab.value = 'PAPA_CALIENTE';
          trackerSubView.value = 'HOT_POTATO';
          loadTrackerData();

          if (!trackerRefreshInterval) {
              trackerRefreshInterval = setInterval(() => {
                  if (currentView.value === 'STAFF_TRACKER') {
                      loadTrackerData(true);
                  } else {
                      clearInterval(trackerRefreshInterval);
                      trackerRefreshInterval = null;
                  }
              }, 15000);
          }
      };"""
html = re.sub(old_open_hp, new_open_hp, html)

old_load_sig = r"const loadTrackerData = \(\) => \{"
new_load_sig = r"const loadTrackerData = (silent = false) => {"
html = html.replace(old_load_sig, new_load_sig)

old_load_1 = r"staffTrackerFilters\.value = \{\};"
new_load_1 = r"if (!silent) staffTrackerFilters.value = {};"
html = html.replace(old_load_1, new_load_1)

old_load_2 = r"Swal\.fire\(\{ title: 'Cargando\.\.\.', text: 'Obteniendo datos de la tabla\.\.\.', allowOutsideClick: false, didOpen: \(\) => \{ Swal\.showLoading\(\); \} \}\);"
new_load_2 = r"if (!silent) Swal.fire({ title: 'Cargando...', text: 'Obteniendo datos de la tabla...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });"
html = re.sub(old_load_2, new_load_2, html)

old_load_3 = r"""                  app\.staffTrackerData = res\.data;
                  applyStaffTrackerFilters\(\);
                  Swal\.close\(\);
              \} else \{
                  Swal\.fire\('Error', res\.message, 'error'\);"""
new_load_3 = r"""                  app.staffTrackerData = res.data;
                  applyStaffTrackerFilters();
                  if (!silent) Swal.close();
              } else {
                  if (!silent) Swal.fire('Error', res.message, 'error');"""
html = re.sub(old_load_3, new_load_3, html)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
