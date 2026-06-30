const fs = require('fs');
let indexHtml = fs.readFileSync('index.html', 'utf8');

const searchESTATUS = `
                         <div v-else-if="isCol(h, ['ESTATUS','STATUS'])" style="width:100%; height:100%;">
                             <div v-if="currentUsername === 'ANTONIA_VENTAS' || (staffTracker && staffTracker.name && staffTracker.name.includes('VENTAS'))" class="d-flex flex-column h-100">
                                  <div style="flex: 0 0 auto; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:10px; font-weight:bold; padding:4px; text-align:center; white-space:normal; line-height:1.1; min-height: 25px;"
                                       :style="getAntoniaStatusStyle(row[h])"
                                       @click="openStatusSelector(row, h)">
                                      {{ row[h] }}
                                  </div>
                                  <div style="flex: 1 1 auto; display:flex; align-items:center; justify-content:center; background:#f8f9fa; border-top:1px solid #dee2e6; cursor:pointer;" @click="openHotPotatoModal(row)" title="Ver Papa Caliente">
                                      <i class="fas fa-fire text-danger fa-lg py-1"></i>
                                  </div>
                             </div>
                             <input v-else
                                    v-model="row[h]"
                                    :readonly="!isFieldEditable(h, row)"
                                    style="text-align:center; font-weight:bold; font-size:10px; width:100%; height:100%; border:none; outline:none; padding:6px 1px; background:transparent;"
                                    class="excel-input">
                         </div>
`;
console.log(indexHtml.includes(searchESTATUS));

const searchVisibleTracker = `
      const visibleTrackerHeaders = computed(() => {
          if (!staffTracker.value.headers) return [];
          return staffTracker.value.headers.filter(h => {
              const up = String(h).toUpperCase().trim();
              return up !== 'PROCESO_LOG' && up !== 'PROCESO';
          });
      });
`;
console.log(indexHtml.includes(searchVisibleTracker));
