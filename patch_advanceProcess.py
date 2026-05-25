import re

def update_index_html():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to add the authorization skip button logic into advanceProcess
    # First, let's inject a new method forceAdvanceProcess
    # But wait, we can just add a "Saltar/Forzar" button in the swal of advanceProcess.
    # Currently advanceProcess shows a select element to assign workers.
    # We can add an extra button "Forzar Avance" in the SweetAlert if the user is Antonia or Admin.

    # Find the Swal.fire call in advanceProcess:
    old_swal = """          const { value: selectedWorkers, isDismissed } = await Swal.fire({
              title: `Asignar etapa: ${getFullProcessName(currentStatus)}`,
              html: `
                  <div class="mb-2 text-start text-muted small">Selecciona una o varias personas para esta etapa (Ctrl/Cmd + Click para múltiples):</div>
                  <select id="swal-multi-select" class="form-select" multiple size="8">
                      ${optionsHtml}
                  </select>
              `,
              showCancelButton: true,
              confirmButtonText: 'Asignar',
              cancelButtonText: 'Cancelar',
              preConfirm: () => {
                  const selectElement = document.getElementById('swal-multi-select');
                  const selectedOptions = Array.from(selectElement.selectedOptions).map(option => option.value);
                  if (selectedOptions.length === 0) {
                      Swal.showValidationMessage('Debes seleccionar al menos una persona');
                      return false;
                  }
                  return selectedOptions;
              }
          });"""

    new_swal = """          const isAdminOrAntonia = currentUsername.value === 'ANTONIA_VENTAS' || ['ADMIN_CONTROL', 'ADMIN', 'PPC_ADMIN'].includes(currentRole.value);
          const { value: result, isDismissed } = await Swal.fire({
              title: `Asignar etapa: ${getFullProcessName(currentStatus)}`,
              html: `
                  <div class="mb-2 text-start text-muted small">Selecciona una o varias personas para esta etapa (Ctrl/Cmd + Click para múltiples):</div>
                  <select id="swal-multi-select" class="form-select" multiple size="8">
                      ${optionsHtml}
                  </select>
              `,
              showCancelButton: true,
              showDenyButton: isAdminOrAntonia,
              confirmButtonText: 'Asignar',
              cancelButtonText: 'Cancelar',
              denyButtonText: 'Saltar/Forzar Avance',
              denyButtonColor: '#ffc107',
              preConfirm: () => {
                  const selectElement = document.getElementById('swal-multi-select');
                  const selectedOptions = Array.from(selectElement.selectedOptions).map(option => option.value);
                  if (selectedOptions.length === 0) {
                      Swal.showValidationMessage('Debes seleccionar al menos una persona');
                      return false;
                  }
                  return { action: 'assign', workers: selectedOptions };
              }
          });

          if (isDismissed && !result && !Swal.getDenyButton().matches(':active') && !document.activeElement.classList.contains('swal2-deny')) return;

          let log = [];
          try { if (row.PROCESO_LOG) log = JSON.parse(row.PROCESO_LOG); } catch(e){}

          if (result && result.action === 'assign') {
              const selectedWorkers = result.workers;
              // Only add entries for workers that are not already in progress or done for this step
              selectedWorkers.forEach(worker => {
                   let existing = log.find(e => (e.step === currentStatus || e.to === currentStatus) && e.assignee === worker);
                   if (existing) {
                        existing.status = 'IN_PROGRESS';
                        if (!existing.timestamp) {
                            existing.timestamp = new Date().getTime();
                            existing.dateStr = new Date().toLocaleString();
                        }
                        if (existing.endTimestamp) delete existing.endTimestamp;
                        if (existing.endDateStr) delete existing.endDateStr;
                   } else {
                        log.push({
                            step: currentStatus,
                            status: 'IN_PROGRESS',
                            assignee: worker,
                            timestamp: new Date().getTime(),
                            dateStr: new Date().toLocaleString()
                        });
                   }
              });
          } else {
              // Forced Advance (Saltar Fase)
              // Create a DONE entry immediately
              log.push({
                  step: currentStatus,
                  status: 'DONE',
                  assignee: "ANTONIA_VENTAS (AUTORIZO)",
                  timestamp: new Date().getTime(),
                  dateStr: new Date().toLocaleString(),
                  endTimestamp: new Date().getTime(),
                  endDateStr: new Date().toLocaleString()
              });
          }"""

    # We need to replace the swal block and the `let log = ...` up to the end of the `selectedWorkers.forEach(...)` block.
    # To do this safely, we will use regex.

    full_old_block = """          const { value: selectedWorkers, isDismissed } = await Swal.fire({
              title: `Asignar etapa: ${getFullProcessName(currentStatus)}`,
              html: `
                  <div class="mb-2 text-start text-muted small">Selecciona una o varias personas para esta etapa (Ctrl/Cmd + Click para múltiples):</div>
                  <select id="swal-multi-select" class="form-select" multiple size="8">
                      ${optionsHtml}
                  </select>
              `,
              showCancelButton: true,
              confirmButtonText: 'Asignar',
              cancelButtonText: 'Cancelar',
              preConfirm: () => {
                  const selectElement = document.getElementById('swal-multi-select');
                  const selectedOptions = Array.from(selectElement.selectedOptions).map(option => option.value);
                  if (selectedOptions.length === 0) {
                      Swal.showValidationMessage('Debes seleccionar al menos una persona');
                      return false;
                  }
                  return selectedOptions;
              }
          });

          if (isDismissed || !selectedWorkers || selectedWorkers.length === 0) return;

          let log = [];
          try { if (row.PROCESO_LOG) log = JSON.parse(row.PROCESO_LOG); } catch(e){}

          // Only add entries for workers that are not already in progress or done for this step
          selectedWorkers.forEach(worker => {
               let existing = log.find(e => (e.step === currentStatus || e.to === currentStatus) && e.assignee === worker);
               if (existing) {
                    existing.status = 'IN_PROGRESS';
                    // Conservamos el inicio original si existe, sino lo creamos. Limpiamos campos de fin por si fue reasignado tras terminar
                    if (!existing.timestamp) {
                        existing.timestamp = new Date().getTime();
                        existing.dateStr = new Date().toLocaleString();
                    }
                    if (existing.endTimestamp) delete existing.endTimestamp;
                    if (existing.endDateStr) delete existing.endDateStr;
               } else {
                    log.push({
                        step: currentStatus,
                        status: 'IN_PROGRESS',
                        assignee: worker,
                        timestamp: new Date().getTime(),
                        dateStr: new Date().toLocaleString()
                    });
               }
          });"""

    if full_old_block in content:
        new_content = content.replace(full_old_block, new_swal)
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully updated advanceProcess in index.html")
    else:
        print("Could not find full_old_block")

update_index_html()
