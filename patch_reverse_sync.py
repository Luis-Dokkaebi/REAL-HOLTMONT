import sys

with open("CODIGO.js", "r") as f:
    content = f.read()

# For internalUpdateTask
search1 = """                                     if (currentStep === 'CD') {
                                         // Advance to EP
                                         let log = [];
                                         try {
                                             if (targetRow.PROCESO_LOG) log = JSON.parse(targetRow.PROCESO_LOG);
                                         } catch(e) {}
                                         if (!Array.isArray(log)) log = [];

                                         log.push({
                                             from: 'CD',
                                             to: 'EP',
                                             timestamp: new Date().getTime(),
                                             dateStr: new Date().toLocaleString()
                                         });

                                         syncData['PROCESO_LOG'] = JSON.stringify(log);

                                         // Helper for Emoji Map Cot
                                         const steps = ["L", "CD", "EP", "CI", "EV", "CEC", "RCC"];
                                         const currentIdx = steps.indexOf('EP');
                                         let parts = [];
                                         for (let i = 0; i < steps.length; i++) {
                                             let step = steps[i];
                                             if (i < currentIdx) {
                                                 parts.push('🟢 ' + step);
                                             } else if (i === currentIdx) {
                                                 parts.push('🔴 ' + step);
                                             } else {
                                                 parts.push('⚪ ' + step);
                                             }
                                         }
                                         syncData['MAP COT'] = parts.join(' | ');

                                         // Don't overwrite the overall status and progress from Angel to Antonia unless we want to,
                                         // but since it advances, it's fine. We may delete them to not interfere with Antonia's columns
                                         delete syncData['ESTATUS'];
                                         delete syncData['STATUS'];
                                         delete syncData['AVANCE'];
                                         delete syncData['AVANCE %'];
                                     }"""

replace1 = """                                     if (currentStep === 'CD') {
                                         // Advance to EP
                                         let log = [];
                                         try {
                                             if (targetRow.PROCESO_LOG) log = JSON.parse(targetRow.PROCESO_LOG);
                                         } catch(e) {}
                                         if (!Array.isArray(log)) log = [];

                                         log.push({
                                             from: 'CD',
                                             to: 'EP',
                                             timestamp: new Date().getTime(),
                                             dateStr: new Date().toLocaleString()
                                         });

                                         // Construct a minimalistic syncData for Antonia to avoid overwriting her fields
                                         const cleanSyncData = {
                                             'FOLIO': tFolio,
                                             'PROCESO_LOG': JSON.stringify(log)
                                         };

                                         // Helper for Emoji Map Cot
                                         const steps = ["L", "CD", "EP", "CI", "EV", "CEC", "RCC"];
                                         const currentIdx = steps.indexOf('EP');
                                         let parts = [];
                                         for (let i = 0; i < steps.length; i++) {
                                             let step = steps[i];
                                             if (i < currentIdx) {
                                                 parts.push('🟢 ' + step);
                                             } else if (i === currentIdx) {
                                                 parts.push('🔴 ' + step);
                                             } else {
                                                 parts.push('⚪ ' + step);
                                             }
                                         }
                                         cleanSyncData['MAP COT'] = parts.join(' | ');

                                         // Instead of updating the whole taskData, we only send the minimal fields
                                         Object.assign(syncData, cleanSyncData);

                                         delete syncData['ESTATUS'];
                                         delete syncData['STATUS'];
                                         delete syncData['AVANCE'];
                                         delete syncData['AVANCE %'];

                                         // We also delete other fields that belong to Angel but shouldn't overwrite Antonia's
                                         // like COMENTARIOS, FECHA, unless we specifically want to. To be safe, let's just
                                         // send the cleanSyncData directly to Antonia later. We'll replace syncData entirely.
                                         // So let's re-assign syncData to cleanSyncData, keeping ID if it exists.
                                         for (let key in syncData) {
                                             if (!['FOLIO', 'ID', 'PROCESO_LOG', 'MAP COT'].includes(key)) {
                                                 delete syncData[key];
                                             }
                                         }

                                         registrarLog("SYSTEM", "REVERSE_SYNC", `Angel Salinas completed CD for ${tFolio}. Advancing to EP.`);
                                     }"""

content = content.replace(search1, replace1)

# Now for apiSaveTrackerBatch
search2 = """                                   if (currentStep === 'CD') {
                                       let syncData = JSON.parse(JSON.stringify(t));
                                       let log = [];
                                       try {
                                           if (targetRow.PROCESO_LOG) log = JSON.parse(targetRow.PROCESO_LOG);
                                       } catch(e) {}
                                       if (!Array.isArray(log)) log = [];

                                       log.push({
                                           from: 'CD',
                                           to: 'EP',
                                           timestamp: new Date().getTime(),
                                           dateStr: new Date().toLocaleString()
                                       });

                                       syncData['PROCESO_LOG'] = JSON.stringify(log);

                                       const steps = ["L", "CD", "EP", "CI", "EV", "CEC", "RCC"];
                                       const currentIdx = steps.indexOf('EP');
                                       let parts = [];
                                       for (let i = 0; i < steps.length; i++) {
                                           let step = steps[i];
                                           if (i < currentIdx) {
                                               parts.push('🟢 ' + step);
                                           } else if (i === currentIdx) {
                                               parts.push('🔴 ' + step);
                                           } else {
                                               parts.push('⚪ ' + step);
                                           }
                                       }
                                       syncData['MAP COT'] = parts.join(' | ');

                                       delete syncData['ESTATUS'];
                                       delete syncData['STATUS'];
                                       delete syncData['AVANCE'];
                                       delete syncData['AVANCE %'];

                                       reverseSyncTasks.push(syncData);
                                   }"""

replace2 = """                                   if (currentStep === 'CD') {
                                       let syncData = {
                                           'FOLIO': tFolio,
                                           'ID': t['ID'] || tFolio
                                       };
                                       let log = [];
                                       try {
                                           if (targetRow.PROCESO_LOG) log = JSON.parse(targetRow.PROCESO_LOG);
                                       } catch(e) {}
                                       if (!Array.isArray(log)) log = [];

                                       log.push({
                                           from: 'CD',
                                           to: 'EP',
                                           timestamp: new Date().getTime(),
                                           dateStr: new Date().toLocaleString()
                                       });

                                       syncData['PROCESO_LOG'] = JSON.stringify(log);

                                       const steps = ["L", "CD", "EP", "CI", "EV", "CEC", "RCC"];
                                       const currentIdx = steps.indexOf('EP');
                                       let parts = [];
                                       for (let i = 0; i < steps.length; i++) {
                                           let step = steps[i];
                                           if (i < currentIdx) {
                                               parts.push('🟢 ' + step);
                                           } else if (i === currentIdx) {
                                               parts.push('🔴 ' + step);
                                           } else {
                                               parts.push('⚪ ' + step);
                                           }
                                       }
                                       syncData['MAP COT'] = parts.join(' | ');

                                       registrarLog("SYSTEM", "REVERSE_SYNC_BATCH", `Angel Salinas completed CD for ${tFolio}. Advancing to EP.`);
                                       reverseSyncTasks.push(syncData);
                                   }"""

content = content.replace(search2, replace2)

with open("CODIGO.js", "w") as f:
    f.write(content)
