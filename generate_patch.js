const fs = require('fs');

let indexHtml = fs.readFileSync('index.html', 'utf8');

let replace1 = `
                         <div v-else-if="isCol(h, ['ESTATUS','STATUS'])" style="width:100%; height:100%;">
                             <div v-if="currentUsername === 'ANTONIA_VENTAS' || (staffTracker && staffTracker.name && staffTracker.name.includes('VENTAS'))" class="d-flex flex-column h-100">
                                  <div style="flex: 0 0 auto; display:flex; align-items:center; justify-content:space-between; padding:2px 4px; border-bottom:1px solid #dee2e6;">
                                      <div style="cursor:pointer; font-size:10px; font-weight:bold; text-align:center; white-space:normal; line-height:1.1; flex-grow:1; margin-right:4px;"
                                           :style="getAntoniaStatusStyle(row[h])"
                                           @click="openStatusSelector(row, h)">
                                          {{ row[h] }}
                                      </div>
                                      <div style="cursor:pointer; padding:2px;" @click="openHotPotatoModal(row)" title="Ver Papa Caliente">
                                          <i class="fas fa-fire text-danger fa-lg"></i>
                                      </div>
                                  </div>
                                  <div style="flex: 1 1 auto; display:flex; align-items:center; justify-content:center; background:#f8f9fa; padding: 2px;">
                                      <div class="hp-timeline-container" style="justify-content: center; padding: 0; min-height: 28px;">
                                          <div v-for="(step, sIdx) in getProcessTimeline(row)" :key="sIdx" class="hp-step" @click="step.isCurrent ? advanceProcess(row) : null" style="margin-right: 2px; width: 28px;">
                                              <div class="hp-circle" :class="step.isDone ? 'green' : (step.isInProgress ? 'yellow' : 'red')" :title="getFullProcessName(step.id)" style="width: 20px; height: 20px; font-size: 8px;">
                                                  <i v-if="step.isDone" class="fas fa-check"></i><i v-else-if="step.isInProgress" class="fas fa-user-clock"></i>
                                                  <div class="hp-clock-icon" :class="step.isDone ? 'check-icon' : 'red-icon'" style="width: 8px; height: 8px; font-size: 5px; bottom: -1px; right: -1px;">
                                                      <i class="fas" :class="step.isDone ? 'fa-check-circle' : 'fa-clock'"></i>
                                                  </div>
                                              </div>
                                              <div class="hp-step-label" style="font-size: 7px; margin-top: 1px;">{{ step.id }}</div>
                                          </div>
                                      </div>
                                  </div>
                             </div>
                             <input v-else
                                    v-model="row[h]"
                                    :readonly="!isFieldEditable(h, row)"
                                    style="text-align:center; font-weight:bold; font-size:10px; width:100%; height:100%; border:none; outline:none; padding:6px 1px; background:transparent;"
                                    class="excel-input">
                         </div>
`;

console.log("We need to adjust widths: ESTATUS column for Antonia should be wider, around 200px or 250px to accommodate the timeline. Also we should hide MAP COT column completely.");
