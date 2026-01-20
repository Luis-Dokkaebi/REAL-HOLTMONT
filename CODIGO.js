  window.onerror = function(msg, url, line, col, error) { if(String(msg).toLowerCase().includes("script error")) return; Swal.fire({ icon: 'error', title: 'Error de Renderizado', text: 'Ocurrió un error visual: ' + (error ? error.message : msg) }); };

  const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;
  const app = createApp({
    setup() {
      // ESTADO GLOBAL
      const isLoggedIn = ref(false); const loginPass = ref(''); const loginUser = ref(''); const loggingIn = ref(false); const currentUser = ref(''); const currentUsername = ref('');
      const currentRole = ref(''); // NUEVO: Estado para el rol del usuario
      const currentView = ref('DASHBOARD'); const currentDept = ref('');
      const config = ref({ departments: {}, staff: [], directory: [], specialModules: [] });
      const staffTracker = ref({ name: '', data: [], history: [], headers: [], isLoading: false, previousView: 'DEPT' });
      const activeTrackerTab = ref('OPERATIVO');
      const trackerSubView = ref('TASKS');
      const currentStaffName = ref('');
      const weeklyPlanData = ref({ headers: [], data: [], isLoading: false });
      const searchQuery = ref(''); const isCompact = ref(false);
      const showPassword = ref(false); // NUEVA VARIABLE PARA TOGGLE PASSWORD
      const currentTheme = ref('light');

      // INFO BANK STATE (LUIS_CARLOS 2025)
      const infoBankState = ref({ view: 'YEARS', selectedYear: '', selectedMonth: '', selectedCompany: '', selectedFolder: '', files: [], isLoading: false });
      const ibYears = ['2025', '2026'];
      const ibMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const ibCompanies = [
          'ALCOM', 'BSC', 'CHULA BRAND', 'COMERCIAL TREVIÑO', 'CONVATEC', 'CORNING 1', 'DANFOSS 2', 'DANFOSS 4', 'DANFOSS MTY', 'DANHIL', 'DANHIL MTY',
          'DEL BRAVO', 'DEL BRAVO STORAGE', 'EATON 1', 'EATON 3', 'EATON 5', 'ESSITY', 'J&E COMPANIES', 'LG', 'MAIZ MIER', 'MARMON',
          'MASTERBRAND MISION', 'MASTERBRAND WESLACO', 'MEGATECH', 'MEGATECH 2', 'NETAFIM', 'NIDEC', 'PANASONIC', 'PANASONIC MTY', 'PANASONIC NORTE',
          'PENTAIR', 'REXNORD 1', 'REXNORD 1 MTY', 'REXNORD 2', 'REXNORD USA', 'SEASON GROUP', 'UNIFORM GROUP', 'VERTIV', 'WC RB', 'WC RY', 'WESLACO', 'XB SOLUCIONES'
      ].sort();
      const ibFolders = [
          { name: 'SCOPE', icon: 'fa-crosshairs', color: '#007bff' },
          { name: 'CORREOS', icon: 'fa-envelope', color: '#ffc107' },
          { name: 'DISEÑOS Y PLANOS', icon: 'fa-drafting-compass', color: '#6610f2' },
          { name: 'ANALISIS Y MERCADEO', icon: 'fa-chart-line', color: '#28a745' },
          { name: 'COTIZACIÓN ENVIADA AL CLIENTE', icon: 'fa-file-invoice-dollar', color: '#17a2b8' },
          { name: 'CRONOGRAMA', icon: 'fa-calendar-alt', color: '#dc3545' },
          { name: 'TRACKER', icon: 'fa-tasks', color: '#e83e8c' },
          { name: 'COTIZACIONES', icon: 'fa-calculator', color: '#20c997' },
          { name: 'PREOPERATIVA', icon: 'fa-hard-hat', color: '#fd7e14' }
      ];

      const filteredIbCompanies = computed(() => {
          const y = infoBankState.value.selectedYear;
          const m = infoBankState.value.selectedMonth;

          if (y === '2025') {
              if (m === 'Octubre') return ['DANFOSS 4'];
              if (m === 'Noviembre') return ['PANASONIC MTY', 'PANASONIC NORTE', 'ALCOM'];
              if (m === 'Diciembre') return ['VERTIV', 'CORNING 1', 'PANASONIC MTY', 'PANASONIC'];
          }
          if (y === '2026') {
              if (m === 'Enero') return ['EATON 3', 'WC RY', 'CORNING 1'];
          }

          return ibCompanies;
      });

      const selectIbYear = (y) => { infoBankState.value.selectedYear = y; infoBankState.value.view = 'MONTHS'; };
      const selectIbMonth = (m) => { infoBankState.value.selectedMonth = m; infoBankState.value.view = 'COMPANIES'; };
      const selectIbCompany = (c) => { infoBankState.value.selectedCompany = c; infoBankState.value.view = 'FOLDERS'; };

      const openIbFolder = (f) => {
          infoBankState.value.selectedFolder = f.name;
          infoBankState.value.view = 'FILES';
          fetchInfoBankFiles();
      };

      const animateInfoBankRows = () => {
          anime({
              targets: '.info-bank-row',
              translateY: [20, 0],
              opacity: [0, 1],
              delay: anime.stagger(50),
              easing: 'easeOutQuad',
              duration: 800
          });
      };

      const fetchInfoBankFiles = () => {
          infoBankState.value.isLoading = true;
          infoBankState.value.files = [];
          google.script.run.withSuccessHandler(res => {
              infoBankState.value.isLoading = false;
              if (res.success) {
                  infoBankState.value.files = res.data;
                  nextTick(() => { animateInfoBankRows(); });
              } else {
                  Swal.fire('Error', res.message, 'error');
              }
          }).apiFetchInfoBankData(infoBankState.value.selectedYear || '2025', infoBankState.value.selectedMonth, infoBankState.value.selectedCompany, infoBankState.value.selectedFolder);
      };

      const getBadgeClass = (status) => {
          if (!status) return 'bg-light text-dark border';
          const s = String(status).toUpperCase();
          if (s.includes('VENDIDA') || s.includes('GANADA') || s.includes('APROBADA')) return 'bg-success text-white';
          if (s.includes('COTIZADA') || s.includes('ENVIADA')) return 'bg-info text-dark';
          if (s.includes('PERDIDA') || s.includes('CANCELADA')) return 'bg-danger text-white';
          if (s.includes('PENDIENTE')) return 'bg-warning text-dark';
          return 'bg-light text-dark border';
      };

      const goBackInfoBank = () => {
          if (infoBankState.value.view === 'FOLDERS') { infoBankState.value.view = 'COMPANIES'; infoBankState.value.selectedCompany = ''; }
          else if (infoBankState.value.view === 'COMPANIES') { infoBankState.value.view = 'MONTHS'; infoBankState.value.selectedMonth = ''; }
          else if (infoBankState.value.view === 'MONTHS') { infoBankState.value.view = 'YEARS'; infoBankState.value.selectedYear = ''; }
          else if (infoBankState.value.view === 'FILES') { infoBankState.value.view = 'FOLDERS'; infoBankState.value.selectedFolder = ''; infoBankState.value.files = []; }
      };
      const resetInfoBank = () => { infoBankState.value = { view: 'YEARS', selectedYear: '', selectedMonth: '', selectedCompany: '', selectedFolder: '', files: [], isLoading: false }; };

      // REFS FOR TABLES (Pulse Effect)
      const trackerTable = ref(null);
      const projectTable = ref(null);
      const ppcDraftTable = ref(null);

      const pulseNewRow = (refName, position = 'first') => {
          nextTick(() => {
              let container = null;
              if (refName === 'trackerTable') container = trackerTable.value;
              if (refName === 'projectTable') container = projectTable.value;
              if (refName === 'ppcDraftTable') container = ppcDraftTable.value;

              if (!container) return;

              let row;
              if (position === 'first') {
                  row = container.querySelector('tbody tr:first-child');
              } else {
                  row = container.querySelector('tbody tr:last-child');
              }

              if (!row) return;

              anime({
                  targets: row,
                  backgroundColor: ['#00ff9d', 'rgba(0,0,0,0)'],
                  boxShadow: ['0 0 15px rgba(0, 255, 157, 0.5)', '0 0 0 rgba(0,0,0,0)'],
                  easing: 'easeOutQuad',
                  duration: 2000
              });
          });
      };

      const triggerConfetti = (x, y) => {
          const container = document.createElement('div');
          Object.assign(container.style, { position: 'fixed', left: x + 'px', top: y + 'px', width: '0', height: '0', pointerEvents: 'none', zIndex: '9999' });
          document.body.appendChild(container);
          const colors = ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c', '#9b59b6'];
          if (currentTheme.value === 'cyberpunk') colors.push('#00ff9d', '#ff0099');
          for (let i = 0; i < 30; i++) {
              const p = document.createElement('div');
              Object.assign(p.style, { position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: colors[Math.floor(Math.random() * colors.length)] });
              container.appendChild(p);
          }
          anime({
              targets: container.children,
              translateX: () => anime.random(-100, 100),
              translateY: () => anime.random(-100, 100),
              scale: [1, 0],
              rotate: () => anime.random(0, 360),
              opacity: [1, 0],
              duration: () => anime.random(800, 1000),
              easing: 'easeOutCirc',
              complete: () => { if (container.parentNode) container.parentNode.removeChild(container); }
          });
      };

      const ppcData = ref({ cumplimiento: 'NO', cliente: '', comentarios:'', comentariosPrevios:'' });

      const isSubmitting = ref(false);
      const selectedResponsables = ref([]); const staffSearch = ref(''); const activityQueue = ref([]);
      const ppcExistingData = ref([]);

      const cotizadorSearch = ref('');
      const filteredCotizadores = computed(() => (config.value.directory || config.value.staff).filter(p => p.name.toLowerCase().includes(cotizadorSearch.value.toLowerCase()) && !workorderData.value.cotizador.includes(p.name)).slice(0,5));
      const addCotizador = (name) => { workorderData.value.cotizador.push(name); cotizadorSearch.value = ''; };
      const removeCotizador = (idx) => { workorderData.value.cotizador.splice(idx, 1); };

      // WORKORDER STATE
      const workorderData = ref({
          cliente: '', planta: '', requisitor: '', newRequisitor: '', contactName: '', contacto: '', celular: '', fechaCotizacion: '', proyecto: '',
          cotizador: [], departamento: '', tipoTrabajo: '', fechaEntrega: '', tiempoEstimado: '', items: [],
          prioridad: 'AAA - Alta Prioridad', conceptoDesc: '', comentarios: '',
          checkList: { libreta: false, cinta: false, bernier: false, chaleco: false, laser: false, epp: false, casco: false, credencial: false, zapato: false, sua: false, lentes: false },
          restricciones: { produccion: '', seguridad: '', dificultad: '', horarios: '', especificidad: '' },
          files: [],
          designValidation: { items: [{ diseno: [], maquinados: [], dibujos: [] }] }
      });
      const workorderTypes = ['Construcción', 'Remodelación', 'Reparación', 'Mantenimiento', 'Reconfiguración', 'Póliza', 'Inspección'];
      const currentWorkorderId = ref(null);
      const nextSequence = ref('0000');

      // DICTATION LOGIC
      const isRecording = ref(false);
      let recognition = null;

      const toggleDictation = async () => {
          if (isRecording.value) {
              if (recognition) recognition.stop();
              isRecording.value = false;
              return;
          }

          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SpeechRecognition) {
              Swal.fire('No soportado', 'Tu navegador no soporta reconocimiento de voz. Intenta con Chrome.', 'error');
              return;
          }

          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  stream.getTracks().forEach(track => track.stop());
              } catch (err) {
                  console.error("Microphone permission denied via getUserMedia:", err);
                  Swal.fire('Permiso Denegado', 'No se pudo acceder al micrófono. Por favor verifique los permisos del sitio.', 'error');
                  return;
              }
          }

          recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
          recognition.lang = 'es-MX'; // Optimized for Mexican Spanish
          recognition.continuous = true;
          recognition.interimResults = false;

          recognition.onstart = () => {
              isRecording.value = true;
          };

          recognition.onend = () => {
              isRecording.value = false;
          };

          recognition.onresult = (event) => {
              let newTranscript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  if (event.results[i].isFinal) {
                      newTranscript += event.results[i][0].transcript;
                  }
              }

              if (newTranscript) {
                  const currentText = workorderData.value.comentarios || '';
                  const needsSpace = currentText.length > 0 && !currentText.match(/\s$/);
                  workorderData.value.comentarios = currentText + (needsSpace ? ' ' : '') + newTranscript;
              }
          };

          recognition.onerror = (event) => {
              console.error("Speech Error:", event.error);
              if (event.error === 'not-allowed') {
                  isRecording.value = false;
                  Swal.fire('Permiso Denegado', 'Por favor habilita el acceso al micrófono.', 'warning');
                  return;
              }
              if (event.error === 'no-speech') {
                  return;
              }
              isRecording.value = false;
              if (event.error !== 'aborted') {
                  Swal.fire('Error', 'Error en dictado: ' + event.error, 'error');
              }
          };

          recognition.start();
      };

      watch(currentView, () => {
         if (isRecording.value && recognition) {
             recognition.stop();
             isRecording.value = false;
         }
      });

      const fetchNextSequence = () => {
          google.script.run.withSuccessHandler(seq => {
              if (seq) nextSequence.value = seq;
          }).apiGetNextWorkOrderSeq();
      };

      const generatedFolio = computed(() => {
          // Secuencia
          const seqStr = nextSequence.value;

          // Cliente: Iniciales de primeras 2 palabras
          const cleanClient = (workorderData.value.cliente || "XX").toUpperCase().replace(/[^A-Z0-9]/g, ' ').trim();
          const words = cleanClient.split(/\s+/).filter(w => w.length > 0);
          let clientStr = "XX";
          if (words.length >= 2) {
              clientStr = words[0][0] + words[1][0];
          } else if (words.length === 1) {
              clientStr = words[0].substring(0, 2);
          }

          // Departamento
          const rawDept = (workorderData.value.departamento || workorderData.value.tipoTrabajo || "General").trim().toUpperCase();
          let deptStr = ABBR_MAP[rawDept];
          if (!deptStr) {
              if (rawDept.length > 6) {
                  deptStr = rawDept.substring(0, 1) + rawDept.substring(1, 5).toLowerCase();
              } else {
                  deptStr = rawDept.substring(0, 1) + rawDept.substring(1).toLowerCase();
              }
          }

          // Fecha: ddMMyy
          const date = new Date();
          const d = String(date.getDate()).padStart(2, '0');
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const y = String(date.getFullYear()).slice(-2);
          const dateStr = `${d}${m}${y}`;

          return `${seqStr}${clientStr} ${deptStr} ${dateStr}`;
      });

      const addWorkorderItem = () => {
          workorderData.value.items.push({ unidad: '', cantidad: 0, precio: 0, utilidad: 0 });
      };
      const removeWorkorderItem = (idx) => {
          workorderData.value.items.splice(idx, 1);
      };
      const formatCurrency = (val) => {
          return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
      };

      const isUploadingFile = ref(false); const uploadSuccess = ref(false); const fileInput = ref(null);
      const currentUploadType = ref('');
      const currentIframeUrl = ref(''); const iframeTitle = ref('');
      const showExtraModal = ref(false);
      const showTimePopup = ref(false);
      const timePopupValue = ref('');
      const timePopupTarget = ref(null);
      const openTimePopup = (targetObj, key) => {
          timePopupTarget.value = { target: targetObj, key: key };
          const now = new Date();
          const hh = String(now.getHours()).padStart(2,'0');
          const mm = String(now.getMinutes()).padStart(2,'0');
          timePopupValue.value = `${hh}:${mm}`;
          showTimePopup.value = true;
      };
      const saveTimePopup = () => {
          if(timePopupTarget.value) {
              timePopupTarget.value.target[timePopupTarget.value.key] = timePopupValue.value;
          }
          showTimePopup.value = false;
      };
      const extraData = ref({ restricciones: '', prioridades: '', riesgos: '', fechaRespuesta: '', clasificacion: '' });
      const priorityOpts = ['URGENTE', 'MEDIA', 'BAJA']; const riskOpts = ['ALTO', 'BAJO', 'CATASTROFICO'];
      const cellFileInput = ref(null); const uploadingCell = ref({row:null, col:null});
      const dynamicPpc = ref({ especialidad: '', clasificacion: 'A', concepto: '', riesgos: 'BAJO', prioridad: 'MEDIA', fechaFin: '', comentarios: '', archivoUrl: '' });
      const vehicleData = ref({});
      const vehicleControlData = ref({}); // Decoupled data for duplicated section
      const vehicleControlData2 = ref({}); // Second independent vehicle control
      const showWorkOrderLogic = ref(true); // Logic display state

      // New Logic Toggles State
      const showLogic = ref({
          workType: false,
          restrictions: false,
          docs: false,
          vehicle: false,
          labor: false,
          design: false
      });

      // INSTRUCTIONS TOGGLES
      const showInstr = ref({
          client: false,
          rfq: false,
          date: false,
          dept: false,
          resp: false,
          chatgpt: false,
          neural: false
      });

      // PROTOTYPES STATE
      const projectProgram = ref({
          timeEstimated: 1,
          timeUnit: 'dias',
          visita: [{ description: '', date: '', duration: '', durationUnit: 'dias', unit: '', quantity: '', price: '', total: 0, responsable: [] }],
          reqCotizacion: [],
          cotPreconstruccion: [],
          cotTrabajo: []
      });
      const addProjectItem = (section) => {
          if (!projectProgram.value[section]) projectProgram.value[section] = [];
          projectProgram.value[section].push({ description: '', date: '', duration: '', durationUnit: 'dias', unit: '', quantity: '', price: '', total: 0, responsable: [] });
      };
      const removeProjectItem = (section, idx) => projectProgram.value[section].splice(idx, 1);

      const projectRespDropdownOpen = ref(null);
      const openRespDropdown = (idx, item) => {
          if (projectRespDropdownOpen.value === idx) {
              projectRespDropdownOpen.value = null;
          } else {
              projectRespDropdownOpen.value = idx;
              if (!Array.isArray(item.responsable)) {
                 item.responsable = item.responsable ? String(item.responsable).split(',').map(s=>s.trim()) : [];
              }
          }
      };
      const toggleProjectResponsable = (item, name) => {
          if (!Array.isArray(item.responsable)) {
             item.responsable = item.responsable ? String(item.responsable).split(',').map(s=>s.trim()) : [];
          }
          const idx = item.responsable.indexOf(name);
          if (idx > -1) item.responsable.splice(idx, 1);
          else item.responsable.push(name);
      };
      const updateProjectRowTotal = (item) => { item.total = (parseFloat(item.quantity)||0) * (parseFloat(item.price)||0); };

      // MANO DE OBRA STATE
      const laborTable = ref({ items: [{ category: 'Albañil', salary: '1200', personnel: '1', weeks: '1', overtime: '0', night: '0', weekend: '0', others: '0', total: 1200 }] });
      const addLaborItem = () => laborTable.value.items.push({ category: '', salary: '', personnel: '', weeks: '', overtime: '0', night: '0', weekend: '0', others: '0', total: 0 });
      const removeLaborItem = (idx) => laborTable.value.items.splice(idx, 1);
      const updateLaborRowTotal = (item) => {
           const salary = parseFloat(item.salary) || 0;
           const personnel = parseFloat(item.personnel) || 0;
           const weeks = parseFloat(item.weeks) || 0;
           const overtime = parseFloat(item.overtime) || 0; // Hours
           const night = parseFloat(item.night) || 0; // Hours
           const weekend = parseFloat(item.weekend) || 0; // Hours
           const others = parseFloat(item.others) || 0; // Money

           const base = salary * personnel * weeks;
           // New factors: Overtime 2x, Night 1.35x, Weekend 2x
           const hourlyRate = salary / 48; // Assuming 48 hours per week (standard in MX) or user wants 40?
           // Usually 48 in Mexico for operational. The previous code had 40.
           // Let's check calculation. 2800 salary / 48 = 58.33.
           // The image shows Costo por Hora $602.88 which seems high for $2800 salary.
           // Maybe Costo por Hora is sum of all?
           // Let's stick to simple logic first.
           // If user wants specific calc, I'll update.
           // User image shows factor 2x, 1.35x, 2x.
           const hRate = salary / 48;
           const extraCost = (overtime * hRate * 2) + (night * hRate * 1.35) + (weekend * hRate * 2);
           item.total = base + extraCost + others;
      };
      // Initial calculation for default item
      updateLaborRowTotal(laborTable.value.items[0]);

      const laborTableTotal = computed(() => laborTable.value.items.reduce((acc, item) => acc + (parseFloat(item.total)||0), 0));
      const totalPersonnel = computed(() => laborTable.value.items.reduce((acc, item) => acc + (parseFloat(item.personnel)||0), 0));
      const costPerWeekCrew = computed(() => laborTable.value.items.reduce((acc, item) => acc + ((parseFloat(item.salary)||0) * (parseFloat(item.personnel)||0)), 0));
      const weeksRequired = computed(() => {
          const max = Math.max(...laborTable.value.items.map(i => parseFloat(i.weeks)||0));
          return max === -Infinity ? 0 : max;
      });
      // New Computed Properties
      const eppCost = computed(() => costPerWeekCrew.value * 0.06);
      const netCostPerWeek = computed(() => costPerWeekCrew.value + eppCost.value);

      const hoursRequired = computed(() => {
          // Sum of all hours? Or logic.
          // Image shows 144 hours. 3 weeks.
          // Maybe 48 * weeks?
          // Or sum of (weeks * 48 * personnel)?
          // Let's assume standard week is 48 hrs.
          return weeksRequired.value * 48;
      });

      const costPerHour = computed(() => {
          return hoursRequired.value > 0 ? (laborTableTotal.value / hoursRequired.value) : 0;
      });

      const totalOvertime = computed(() => laborTable.value.items.reduce((acc, item) => acc + (parseFloat(item.overtime)||0), 0));
      const totalNight = computed(() => laborTable.value.items.reduce((acc, item) => acc + (parseFloat(item.night)||0), 0));
      const totalWeekend = computed(() => laborTable.value.items.reduce((acc, item) => acc + (parseFloat(item.weekend)||0), 0));

      const requiredMaterials = ref({ items: [{
          quantity: '', unit: '', type: '', description: '', cost: '', spec: '', total: 0,
          papaCaliente: { residente: '', compras: '', controller: '', ordenCompra: '', pagos: '', almacen: '', logistica: '', residenteObra: '' }
      }] });
      const addMaterialItem = () => requiredMaterials.value.items.push({
          quantity: '', unit: '', type: '', description: '', cost: '', spec: '', total: 0,
          papaCaliente: { residente: '', compras: '', controller: '', ordenCompra: '', pagos: '', almacen: '', logistica: '', residenteObra: '' }
      });
      const removeMaterialItem = (idx) => requiredMaterials.value.items.splice(idx, 1);
      const updateMaterialRowTotal = (item) => { item.total = (parseFloat(item.quantity)||0) * (parseFloat(item.cost)||0); };
      const materialsTotal = computed(() => requiredMaterials.value.items.reduce((acc, item) => acc + (parseFloat(item.total)||0), 0));

      // NEW TABLES & DASHBOARD LOGIC
      const toolsRequired = ref({ items: [{
          quantity: '', unit: '', description: '', cost: '', total: 0,
          papaCaliente: { residente: '', controller: '', almacen: '', logistica: '', residenteFin: '' }
      }] });
      const addToolItem = () => toolsRequired.value.items.push({
          quantity: '', unit: '', description: '', cost: '', total: 0,
          papaCaliente: { residente: '', controller: '', almacen: '', logistica: '', residenteFin: '' }
      });
      const removeToolItem = (idx) => toolsRequired.value.items.splice(idx, 1);
      const updateToolRowTotal = (item) => { item.total = (parseFloat(item.quantity)||0) * (parseFloat(item.cost)||0); };
      const toolsTotal = computed(() => toolsRequired.value.items.reduce((acc, item) => acc + (parseFloat(item.total)||0), 0));

      // DESIGN VALIDATION LOGIC
      const designUploadContext = ref({ row: null, col: '', type: '' });
      const designFileInput = ref(null);
      const addDesignRow = () => {
          if(!workorderData.value.designValidation) workorderData.value.designValidation = { items: [] };
          workorderData.value.designValidation.items.push({ diseno: [], maquinados: [], dibujos: [] });
      };
      const removeDesignRow = (idx) => workorderData.value.designValidation.items.splice(idx, 1);
      const triggerDesignUpload = (idx, col, type) => {
          designUploadContext.value = { row: idx, col: col, type: type };
          designFileInput.value.click();
      };
      const handleDesignFileSelect = (e) => {
          const file = e.target.files[0];
          if(!file) return;
          isUploadingFile.value = true;
          const r = new FileReader();
          r.onload = (ev) => {
              google.script.run.withSuccessHandler(res => {
                  isUploadingFile.value = false;
                  if(res.success){
                      const ctx = designUploadContext.value;
                      if (workorderData.value.designValidation.items[ctx.row]) {
                          workorderData.value.designValidation.items[ctx.row][ctx.col].push({
                              url: res.fileUrl,
                              type: ctx.type,
                              name: file.name
                          });
                      }
                      Swal.fire('Archivo Subido', '', 'success');
                  } else {
                      Swal.fire('Error', res.message, 'error');
                  }
                  e.target.value = null;
              }).uploadFileToDrive(ev.target.result, file.type, file.name);
          };
          r.readAsDataURL(file);
      };

      const specialEquipment = ref({ items: [{ quantity: '1', unit: 'unidad', type: '', description: '', spec: '', days: '1', hours: '0', cost: '', total: 0 }] });
      const addSpecialEquipItem = () => specialEquipment.value.items.push({ quantity: '1', unit: 'unidad', type: '', description: '', spec: '', days: '1', hours: '0', cost: '', total: 0 });
      const removeSpecialEquipItem = (idx) => specialEquipment.value.items.splice(idx, 1);
      const updateSpecialEquipRowTotal = (item) => { item.total = (parseFloat(item.quantity)||0) * (parseFloat(item.days)||0) * (parseFloat(item.cost)||0); };
      const specialEquipTotal = computed(() => specialEquipment.value.items.reduce((acc, item) => acc + (parseFloat(item.total)||0), 0));

      const additionalCosts = ref({ insumos: 0, viaticos: 0, transporte: 0 });

      // const laborTotal = computed(() => projectProgram.value.items.reduce((acc, item) => acc + (parseFloat(item.total)||0), 0));
      const laborTotal = computed(() => laborTableTotal.value); // Use new Labor Table
      const dashboardSubtotal = computed(() => {
          return materialsTotal.value + laborTotal.value + toolsTotal.value + specialEquipTotal.value +
                 (parseFloat(additionalCosts.value.insumos)||0) + (parseFloat(additionalCosts.value.viaticos)||0) + (parseFloat(additionalCosts.value.transporte)||0);
      });
      const dashboardUtility = computed(() => dashboardSubtotal.value * 0.15);
      const dashboardTotal = computed(() => dashboardSubtotal.value + dashboardUtility.value);

      // ANIME.JS ANIMATION LOGIC
      const animatedTotals = Vue.reactive({ subtotal: 0, utility: 0, total: 0 });

      watch([dashboardSubtotal, dashboardUtility, dashboardTotal], ([newSub, newUtil, newTot]) => {
          anime({
              targets: animatedTotals,
              subtotal: newSub,
              utility: newUtil,
              total: newTot,
              round: 1,
              easing: 'easeOutExpo',
              duration: 1500
          });
      }, { immediate: true });

      const selectedFinancing = ref(null); // Financing toggle state
      const selectedWeek = ref('');
      const currentModuleId = ref('');

      const ABBR_MAP = {
          "ELECTROMECANICA": "Electro",
          "ELECTROMECÁNICA": "Electro",
          "CONSTRUCCION": "Const",
          "CONSTRUCCIÓN": "Const",
          "MANTENIMIENTO": "Mtto",
          "REMODELACION": "Remod",
          "REMODELACIÓN": "Remod",
          "REPARACION": "Repar",
          "REPARACIÓN": "Repar",
          "RECONFIGURACION": "Reconf",
          "RECONFIGURACIÓN": "Reconf",
          "POLIZA": "Poliza",
          "PÓLIZA": "Poliza",
          "INSPECCION": "Insp",
          "INSPECCIÓN": "Insp",
          "ADMINISTRACION": "Admin",
          "ADMINISTRACIÓN": "Admin",
          "MAQUINARIA": "Maq",
          "DISEÑO": "Diseño",
          "COMPRAS": "Compras",
          "VENTAS": "Ventas",
          "HVAC": "HVAC",
          "SEGURIDAD": "EHS",
          "EHS": "EHS"
      };

      const AVATAR_MAP = {
        "ANTONIA_VENTAS": "https://lh3.googleusercontent.com/d/1y6o5FyEGpkHPTPoYHJ5a3IJEpgeAdOMB",
        "EDUARDO TERAN": "https://lh3.googleusercontent.com/d/1RlUv7Z2LFeiaAqkm859Khg0gfIWWipJq",
        "RAMIRO RODRIGUEZ": "https://lh3.googleusercontent.com/d/1EjsGgw5c7efDgr76f3ZJ_GBgfpiBe71F",
        "JUDITH ECHAVARRIA": "https://lh3.googleusercontent.com/d/1FOAsKoz3jzi1Fl5-Agh1OcmdB_NjxN2l",
        "SEBASTIAN PADILLA": "https://lh3.googleusercontent.com/d/15je2SNtrYP32WPLD7uxUFIcrhdv4owyO"
      };

      const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

      const getAvatarUrl = (nombre) => {
          if (!nombre) return DEFAULT_AVATAR;
          const key = String(nombre).toUpperCase().trim();
          return AVATAR_MAP[key] ? AVATAR_MAP[key] : DEFAULT_AVATAR;
      };

      // NUEVOS FILTROS PPC SEMANAL
      const filterSpecialty = ref('');
      const filterCompliance = ref('');

      // ECG (Electrocardiograma) STATE
      const ecgData = ref({});
      const ecgChartInstances = {};

      // KPI STATE
      const kpiData = ref({ ventas: [], tracker: [], productivity: null, isLoading: false });
      const kpiChartInstances = { ventas: null, tracker: null, productivity: null };

      // --- GESTIÓN DE PROYECTOS (V138 - CASCADA) ---
      const showPpcSelectorModal = ref(false);
      const ppcMode = ref('SELECT');
      const currentPpcProject = ref(null);
      const newProject = ref({ name: '', client: '', type: 'OBRA CIVIL', creationMode: 'SUB', parentId: '', createdBy: '' });
      watch(() => newProject.value.creationMode, (newVal) => {
          if (newVal === 'SITE') { newProject.value.type = 'CLIENTE'; } else { newProject.value.type = 'OBRA CIVIL'; }
      });
      const activeProjectsList = ref([]);
      const showSubProjectModal = ref(false);
      const currentTargetSite = ref({});
      const newSubProject = ref({ name: '', type: 'OBRA CIVIL', createdBy: '' });

      // EMPLEADOS MANAGEMENT
      const showEmployeeModal = ref(false);
      const newEmployee = ref({ name: '', dept: '', type: 'ESTANDAR' });

      const openNewEmployeeModal = () => {
          newEmployee.value = { name: '', dept: '', type: 'ESTANDAR' };
          showEmployeeModal.value = true;
      };

      const saveNewEmployee = () => {
          if(!newEmployee.value.name || !newEmployee.value.dept) return;
          isSubmitting.value = true;
          google.script.run.withSuccessHandler(res => {
              isSubmitting.value = false;
              if (res.success) {
                  Swal.fire({ icon: 'success', title: 'Empleado Creado', text: 'Se han generado las hojas correspondientes.', timer: 2000, showConfirmButton: false });
                  showEmployeeModal.value = false;
                  // Reload config to update directory list
                  loadConfig(currentRole.value);
              } else {
                  Swal.fire('Error', res.message, 'error');
              }
          }).apiAddEmployee(JSON.parse(JSON.stringify(newEmployee.value)));
      };

      const deleteEmployee = (name) => {
          Swal.fire({
              title: '¿Eliminar del Directorio?',
              text: `Se eliminará a "${name}" de las listas. Sus hojas de Excel NO se borrarán.`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#d33',
              confirmButtonText: 'Sí, eliminar'
          }).then((result) => {
              if (result.isConfirmed) {
                  Swal.showLoading();
                  google.script.run.withSuccessHandler(res => {
                      Swal.close();
                      if (res.success) {
                          Swal.fire('Eliminado', '', 'success');
                          loadConfig(currentRole.value);
                      } else {
                          Swal.fire('Error', res.message, 'error');
                      }
                  }).apiDeleteEmployee(name);
              }
          });
      };

      // *** MODIFICADO: ESTRUCTURA DE CARPETAS CON NUEVOS PPCs ***
      const projectSubFolders = ref([
          { name: "PPC INTERNO", icon: "fa-tasks", color: "#fd7e14", bg: "#fff4de" },
          { name: "PPC PREOPERATIVO", icon: "fa-tasks", color: "#fd7e14", bg: "#fff4de" },
          { name: "PPC CLIENTE", icon: "fa-tasks", color: "#fd7e14", bg: "#fff4de" },
          { name: "DOCUMENTOS", icon: "fa-file-alt", color: "#3699ff", bg: "#e1f0ff" },
          { name: "PLANOS Y DISEÑOS", icon: "fa-drafting-compass", color: "#6610f2", bg: "#eee5ff" },
          { name: "FOTOGRAFIAS", icon: "fa-images", color: "#e83e8c", bg: "#ffe2e5" },
          { name: "CORRESPONDENCIA", icon: "fa-envelope-open-text", color: "#ffc107", bg: "#fff4de" },
          { name: "REPORTES", icon: "fa-chart-pie", color: "#198754", bg: "#c9f7f5" }
      ]);
      const projectCards = ref([]);
      const projectTasks = ref({ data: [], headers: [], isLoading: false });

      const toggleExpand = (item) => { item.expanded = !item.expanded; };

      // *** MODIFICADO: ABRIR CONTENIDO CON ETIQUETADO DINÁMICO ***
      const openFolderContent = (folder, projectName) => {
          if (folder.name.includes("PPC")) {
             // ETIQUETA DINÁMICA: "NAVE PPC INTERNO", "AMPLIACION PPC CLIENTE", etc.
             const compoundName = `${projectName} ${folder.name}`;
             currentPpcProject.value = { name: compoundName };
             currentView.value = 'PROJECT_TASKS_VIEW';
             loadProjectTasks(compoundName);
          } else {
             Swal.fire({ title: `${folder.name} (${projectName})`, text: 'Carpeta vacía por el momento.', icon: 'info', iconColor: folder.color, confirmButtonColor: folder.color });
          }
      };

      const loadProjectTasks = (projectName) => {
          projectTasks.value.isLoading = true;
          google.script.run.withSuccessHandler(res => {
              projectTasks.value.isLoading = false;
              if (res.success) { projectTasks.value.data = res.data; projectTasks.value.headers = res.headers; }
              else { Swal.fire('Error', res.message, 'error'); }
          }).apiFetchProjectTasks(projectName);
      };

      const refreshProjectTasks = () => { if(currentPpcProject.value) loadProjectTasks(currentPpcProject.value.name); };
      const addNewProjectTask = () => {
          if (!projectTasks.value.headers.length) return;
          const row = { _isNew: true };
          projectTasks.value.headers.forEach(h => row[h] = "");
          row['ESTATUS'] = 'PENDIENTE';
          projectTasks.value.data.unshift(row);
          pulseNewRow('projectTable', 'first');
      };
      const saveProjectRow = (row) => {
          if(!currentPpcProject.value) return;
          if (row._isSaving) return;
          row._isSaving = true;

          Swal.showLoading();
          google.script.run.withSuccessHandler(res => {
              row._isSaving = false;
              Swal.close();
              if (res.success) { row._isNew = false; if(res.moved) { refreshProjectTasks(); Swal.fire({ icon: 'success', title: 'Archivado', timer: 1000, showConfirmButton: false }); } else { Swal.fire({ icon: 'success', title: 'Guardado', timer: 1000, showConfirmButton: false }); refreshProjectTasks(); } }
              else { Swal.fire('Error', res.message, 'error'); }
          }).withFailureHandler(err => { row._isSaving = false; handleErr(err); }).apiSaveProjectTask(JSON.parse(JSON.stringify(row)), currentPpcProject.value.name, currentUsername.value);
      };

      const loadCascadeTree = () => {
          google.script.run.withSuccessHandler(res => {
              if (res.success && res.data.length > 0) {
                  const oldState = {}; activeProjectsList.value.forEach(p => oldState[p.id] = p.expanded);
                  activeProjectsList.value = res.data.map(site => ({ ...site, expanded: oldState[site.id] || false }));
              }
          }).apiFetchCascadeTree();
      };

      const openPpcProjectSelector = () => { showPpcSelectorModal.value = true; ppcMode.value = 'SELECT'; newProject.value = { name: '', client: '', type: 'OBRA CIVIL', creationMode: 'SUB', parentId: '', createdBy: '' }; };
      const selectPpcProject = (proj) => { currentPpcProject.value = proj; showPpcSelectorModal.value = false; if (currentView.value === 'PROJECTS') { openModule({ id: 'PPC_MASTER', type: 'ppc_native' }); } };
      const createNewProject = () => {
          if (!newProject.value.name || !newProject.value.createdBy) return;
          isSubmitting.value = true;
          if (newProject.value.creationMode === 'SUB') {
              google.script.run.withSuccessHandler(res => {
                  if (res.success) {
                      Swal.fire({ icon: 'success', title: '¡Creado!', text: 'Se ha guardado en la base de datos.', timer: 1500, showConfirmButton: false });
                      google.script.run.withSuccessHandler(treeRes => { isSubmitting.value = false; if (treeRes.success) { activeProjectsList.value = treeRes.data; const parent = activeProjectsList.value.find(p => String(p.id) === String(newProject.value.parentId)); if (parent) { const createdSub = parent.subProjects.find(s => s.name === newProject.value.name.toUpperCase().trim()); if (createdSub) selectPpcProject(createdSub); } newProject.value = { name: '', client: '', type: 'OBRA CIVIL', creationMode: 'SUB', parentId: '', createdBy: '' }; } }).apiFetchCascadeTree();
                  } else { isSubmitting.value = false; Swal.fire('Error', res.message, 'error'); }
              }).apiSaveSubProject({ parentId: newProject.value.parentId, name: newProject.value.name, type: newProject.value.type, createdBy: newProject.value.createdBy });
          } else {
              google.script.run.withSuccessHandler(res => {
                  if (res.success) {
                      Swal.fire({ icon: 'success', title: 'Sitio Creado', text: 'Ahora agrega subproyectos.', timer: 2000, showConfirmButton: false });
                      google.script.run.withSuccessHandler(treeRes => { isSubmitting.value = false; if(treeRes.success) { activeProjectsList.value = treeRes.data; newProject.value.creationMode = 'SUB'; newProject.value.parentId = res.id; newProject.value.name = ''; } }).apiFetchCascadeTree();
                  } else { isSubmitting.value = false; Swal.fire('Error', res.message, 'error'); }
              }).apiSaveSite({ name: newProject.value.name, client: newProject.value.client, type: newProject.value.type, createdBy: newProject.value.createdBy });
          }
      };

      const openAddSubProject = (site) => { currentTargetSite.value = site; newSubProject.value = { name: '', type: 'OBRA CIVIL', createdBy: '' }; showSubProjectModal.value = true; };
      const createSubProject = () => {
          if (!newSubProject.value.name || !newSubProject.value.createdBy) return;
          isSubmitting.value = true;
          google.script.run.withSuccessHandler(res => {
              if (res.success) {
                  Swal.fire({ icon: 'success', title: 'Subproyecto Agregado', timer: 1500, showConfirmButton: false });
                  showSubProjectModal.value = false;
                  google.script.run.withSuccessHandler(treeRes => { isSubmitting.value = false; if(treeRes.success) { activeProjectsList.value = treeRes.data; const updatedSite = activeProjectsList.value.find(s => s.id === currentTargetSite.value.id); if(updatedSite) updatedSite.expanded = true; } }).apiFetchCascadeTree();
              } else { isSubmitting.value = false; Swal.fire('Error', res.message, 'error'); }
          }).apiSaveSubProject({ parentId: currentTargetSite.value.id, name: newSubProject.value.name, type: newSubProject.value.type, createdBy: newSubProject.value.createdBy });
      };
      const openProjectTask = (sub) => { currentPpcProject.value = sub; openModule({ id: "PPC_DINAMICO", type: "ppc_dynamic_view" }); };

      // --- LOGICA GENERAL Y COMPUTED ---
      const salesStaff = computed(() => (config.value.directory || []).filter(p => p.dept === 'VENTAS' && p.name !== 'ANTONIA_VENTAS').map(p => p.name));
      const filteredStaff = computed(() => config.value.staff.filter(p => p.dept === currentDept.value && p.name.toLowerCase().includes(searchQuery.value.toLowerCase())));
      const filteredDirectory = computed(() => (config.value.directory || config.value.staff).filter(p => p.name.toLowerCase().includes(staffSearch.value.toLowerCase()) && !selectedResponsables.value.includes(p.name)).slice(0,5));
      const pageTitle = computed(() => currentView.value);
      const currentDeptData = computed(() => config.value.departments[currentDept.value] || {});

      const deptStats = computed(() => {
          const stats = []; let totalActual=0; let totalCumplidas=0; let totalGlobalDB=0;
          const deptsToIterate = config.value.allDepartments || config.value.departments;
          for (const key in deptsToIterate) {
              const deptLabel = deptsToIterate[key].label;
              const actual = activityQueue.value.filter(i => i.especialidad === key).length;
              const totalDB = ppcExistingData.value.filter(i => i.especialidad === key || i.especialidad === deptLabel);
              const cumplidas = totalDB.filter(i => String(i.cumplimiento).toUpperCase() === 'SI').length;
              let prom = 0; if (totalDB.length > 0) prom = Math.round((cumplidas / totalDB.length) * 100);
              totalActual += actual; totalCumplidas += cumplidas; totalGlobalDB += totalDB.length;
              stats.push({ key: key, label: deptLabel.toUpperCase(), actual: actual, cumplidas: cumplidas, promedio: prom + '%', anterior: '0%' });
          }
          let totalProm = 0; if (totalGlobalDB > 0) totalProm = Math.round((totalCumplidas / totalGlobalDB) * 100);
          stats.push({ key: 'TOTAL', label: 'TOTAL', actual: totalActual, cumplidas: totalCumplidas, promedio: totalProm + '%', anterior: '0%' });
          return stats;
      });

      const availableWeeks = computed(() => { const allWeeks = weeklyPlanData.value.data.map(i => i.SEMANA).filter(w => w && w !== '-'); return [...new Set(allWeeks)].sort((a,b) => b - a); });
      const availableSpecialties = computed(() => [...new Set(weeklyPlanData.value.data.map(r => r.ESPECIALIDAD).filter(x => x))].sort());

      const filteredWeeklyData = computed(() => {
          let data = weeklyPlanData.value.data;
          if (selectedWeek.value) { data = data.filter(r => String(r.SEMANA) == String(selectedWeek.value)); }
          if (filterSpecialty.value) { data = data.filter(r => String(r.ESPECIALIDAD).trim() === String(filterSpecialty.value).trim()); }
          if (filterCompliance.value) { data = data.filter(r => String(r.CUMPLIMIENTO).toUpperCase().trim() === String(filterCompliance.value).toUpperCase().trim()); }
          return data;
      });

      const weeklyStats = computed(() => {
           const data = filteredWeeklyData.value || []; const stats = []; let grandTotal = 0; let grandSi = 0;
           const depts = config.value.allDepartments || config.value.departments || {}; const norm = s => String(s||'').toUpperCase().trim();
           for (const key in depts) {
               const label = depts[key].label.toUpperCase();
               const items = data.filter(r => { const s = norm(r['ESPECIALIDAD'] || r['AREA']); return s === key || s === norm(depts[key].label); });
               const t = items.length; const s = items.filter(r => norm(r['CUMPLIMIENTO']) === 'SI').length; const n = t - s; const p = t > 0 ? Math.round((s/t)*100) : 0;
               stats.push({ label: label, total: t, si: s, no: n, avg: p + '%' }); grandTotal += t; grandSi += s;
           }
           const grandNo = grandTotal - grandSi; const grandAvg = grandTotal > 0 ? Math.round((grandSi/grandTotal)*100) : 0;
           stats.push({ label: 'TOTAL GLOBAL', total: grandTotal, si: grandSi, no: grandNo, avg: grandAvg + '%', isTotal: true }); return stats;
      });

      const isCol = (h, list) => list.includes(String(h).toUpperCase().trim());

      const isFieldEditable = (h, row) => {
          const restrictedRoles = ['ANGEL_USER', 'TERESA_USER', 'EDUARDO_USER', 'MANZANARES_USER', 'RAMIRO_USER', 'SEBASTIAN_USER', 'EDGAR_USER'];
          if (restrictedRoles.includes(currentRole.value)) {
              const hUp = String(h).toUpperCase();
              const allowed = ['AVANCE', 'REQUISITOR', 'INFO CLIENTE', 'F2', 'COTIZACION', 'COT', 'TIMELINE', 'LAYOUT'];
              return allowed.some(a => hUp.includes(a));
          }

          if (currentRole.value === 'TONITA') {
              if (row._isNew) return true;
              if (!row['FOLIO'] && !row['ID']) return true;

              const hUp = String(h).toUpperCase();
              const allowed = ['FECHA', 'FECHA VISITA', 'FECHA ALTA', 'FECHA INICIO', 'ALTA', 'ESTATUS', 'STATUS', 'AVANCE', 'AVANCE %'];
              return allowed.some(a => hUp.includes(a));
          }
          return true;
      };

      const calculateDiasCounter = (row) => {
          // Permite ejecutar en cualquier hoja que tenga las columnas
          // if (!staffTracker.value.name.toUpperCase().includes('ANTONIA_VENTAS')) return;

          const hDias = staffTracker.value.headers.find(h => isCol(h, ['DIAS','RELOJ']));
          if (!hDias) return;

          const hFecha = staffTracker.value.headers.find(h => isCol(h, ['FECHA','FECHA ALTA','ALTA','FECHA DE ALTA','FECHA INICIO','FECHA DE INICIO']));
          if (!hFecha || !row[hFecha]) return;

          let dObj = null;
          const val = row[hFecha];
          if (val instanceof Date) dObj = val;
          else if (typeof val === 'string') {
              const parts = val.split('/');
              if (parts.length === 3) {
                   let y = parts[2];
                   if (y.length === 2) y = '20' + y;
                   dObj = new Date(`${y}-${parts[1]}-${parts[0]}`);
              }
          }
          if (dObj && !isNaN(dObj.getTime())) {
              const now = new Date();
              dObj.setHours(0,0,0,0);
              now.setHours(0,0,0,0);
              const diffTime = now - dObj;
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              row[hDias] = Math.max(0, diffDays);
          }
      };

      const getColumnStyle = (h) => {
          const up = String(h).toUpperCase().trim(); let w = '120px'; let fs = '12px'; let pad = '8px 4px'; let align = 'left';
          if (up === 'CONCEPTO' || up.includes('DESCRIP')) { w = (staffTracker.value.name === 'ANTONIA_VENTAS') ? '600px' : '380px'; }
          else if (isCol(h, ['ESPECIALIDAD', 'AREA', 'DEPTO'])) { w = '50px'; fs = '11px'; }
          else if (isCol(h, ['ID', 'FOLIO'])) { w = '40px'; fs = '10px'; align = 'center'; }
          else if (up.includes('CUMPLIMIENTO')) { w = '50px'; align = 'center'; fs = '11px'; }
          else if (up.includes('ARCHIVO') || up.includes('CLIP')) { w = '40px'; align = 'center'; }
          else if (up === 'SEMANA') { w = '50px'; align = 'center'; }
          else if (up === 'HORA') { w = '50px'; fs = '10px'; }
          else if (up === 'FECHA ESTIMADA DE FIN' || up === 'FECHA DE ENTREGA') { w = '75px'; fs = '10px'; }
          else if (up === 'HORA ESTIMADA DE FIN') { w = '60px'; fs = '10px'; }
          else if (up.includes('PRIORIDAD')) { w = '70px'; fs = '10px'; }
          else if (up.includes('RIESGO')) { w = '70px'; fs = '10px'; }
          else if (up === 'REQUISITOR') { w = '90px'; fs = '11px'; }
          else if (up === 'INFO CLIENTE') { w = '70px'; fs = '10px'; align='center'; }
          else if (isCol(h, ['DIAS','RELOJ','CLASIFICACION'])) { w = '40px'; fs = '10px'; pad = '8px 1px'; }
          else if (up.includes('AVANCE')) { w = '40px'; fs = '10px'; pad = '8px 1px'; }
          else if (isCol(h, ['ESTATUS','STATUS'])) { w = '65px'; fs = '10px'; pad = '8px 1px'; }
          else if (up.includes('FECHA') || up.includes('RESPUESTA')) { w = '65px'; fs = '10px'; }
          else if (up === 'F2') { w = '35px'; fs = '10px'; align='center'; }
          else if (up.includes('COTIZACION') || up.includes('COT')) { w = '70px'; fs = '10px'; align='center'; }
          else if (up.includes('TIMEOUT') || up.includes('TIME OUT')) { w = '70px'; fs = '10px'; align='center'; }
          else if (up.includes('LAYOUT') || up.includes('TIMELINE')) { w = '70px'; fs = '10px'; align='center'; }
          else if (up.includes('VENDEDOR')) { w = '50px'; fs = '10px'; align='center'; }
          else if (up === 'CLIENTE') w = '100px';
          return { width: w, fontSize: fs, padding: pad, textAlign: align, overflow: 'hidden', textOverflow: 'ellipsis' };
      };

      const getHeaderLabel = (h) => { const up = String(h).toUpperCase().trim(); if (up === 'CLASIFICACION') return 'CLASI'; if (up === 'FECHA ESTIMADA DE FIN') return 'FEC. EST. FIN'; if (up === 'HORA ESTIMADA DE FIN') return 'HR. EST. FIN'; return h; };
      const isMediaColumn = (h) => ['F2','COTIZACION','COT','COTIZACIÓN','TIMEOUT','TIME OUT','LAYOUT','TIMELINE','INFO CLIENTE'].includes(String(h).toUpperCase());
      const getTrafficStyle = (row) => {
          const t = String(row['CLASIFICACION']||'').trim().toUpperCase();
          const d = parseInt(row['DIAS']||row['RELOJ']||0);
          if (isNaN(d)) return {};

          let limit = 0, buffer = 0;
          if(t==='A') { limit=3; buffer=1; }
          else if(t==='AA') { limit=15; buffer=3; }
          else if(t==='AAA') { limit=30; buffer=5; }
          else return {};

          if(d > limit) return {backgroundColor:'#e74c3c', color:'white'}; // Rojo
          if(d >= (limit - buffer)) return {backgroundColor:'#ffff00', color:'black', fontWeight:'bold'}; // Amarillo
          return {backgroundColor:'#2ecc71', color:'white'}; // Verde
      };

      const getFechaInicioTrafficStyle = (row) => {
          const startKey = Object.keys(row).find(k => ['FECHA','FECHA INICIO','FECHA DE INICIO','ALTA'].includes(String(k).toUpperCase().trim()));
          if (!startKey) return {};
          const val = row[startKey];
          if (!val) return {};
          let dObj = null;
          if (val instanceof Date) dObj = val;
          else if (typeof val === 'string') {
              const p = val.split('/');
              if (p.length === 3) dObj = new Date(p[2].length===2?'20'+p[2]:p[2], p[1]-1, p[0]);
          }
          if (!dObj || isNaN(dObj.getTime())) return {};

          // Calculate elapsed days
          const now = new Date();
          now.setHours(0,0,0,0);
          dObj.setHours(0,0,0,0);
          const diff = now - dObj;
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));

          const t = String(row['CLASIFICACION']||'').trim().toUpperCase();
          let limit = 0, buffer = 0;
          if(t==='A') { limit=3; buffer=1; }
          else if(t==='AA') { limit=15; buffer=3; }
          else if(t==='AAA') { limit=30; buffer=5; }
          else return {};

          if(days > limit) return {backgroundColor:'#e74c3c', color:'white'};
          if(days >= (limit - buffer)) return {backgroundColor:'#ffff00', color:'black', fontWeight:'bold'};
          return {backgroundColor:'#2ecc71', color:'white'};
      };
      const getFechaRespuestaStyle = (row) => { const startKey = Object.keys(row).find(k => ['FECHA','FECHA INICIO','FECHA DE INICIO'].includes(String(k).toUpperCase().trim())); const startDateVal = startKey ? row[startKey] : null; const style = { backgroundColor: '#ffc107', color: 'black' }; if (!startDateVal) return style; let startDate = null; if (typeof startDateVal === 'string') { const parts = startDateVal.split('/'); if (parts.length === 3) { let y = parts[2].length === 2 ? '20' + parts[2] : parts[2]; startDate = new Date(`${y}-${parts[1]}-${parts[0]}`); } } else if (startDateVal instanceof Date) { startDate = startDateVal; } if (startDate && !isNaN(startDate.getTime())) { const diff = new Date() - startDate; if (Math.floor(diff / (1000 * 60 * 60 * 24)) > 3) { style.backgroundColor = '#dc3545'; style.color = 'white'; } } return style; };

      const toInitials = (name) => {
        if (!name) return '';
        // Convierte "Judith Echavarria" en "JE", o "Maria Del Carmen" en "MC"
        return String(name).trim().split(/\s+/).map(p => p[0]).join('').toUpperCase().substring(0, 3);
      };

      const handleErr = (e) => { loggingIn.value=false; isSubmitting.value=false; Swal.fire('Error',e.message,'error'); };
      const doLogin = () => { if(!loginPass.value || !loginUser.value) return; loggingIn.value=true; google.script.run.withSuccessHandler(res => { loggingIn.value=false; if(res.success){ isLoggedIn.value=true; currentUser.value=res.name; currentUsername.value = res.username; currentRole.value = res.role; loadConfig(res.role); loadCascadeTree(); } else Swal.fire('Error',res.message,'error'); }).withFailureHandler(handleErr).apiLogin(loginUser.value, loginPass.value); };
      const loadConfig = (r) => { google.script.run.withSuccessHandler(d => { config.value=d; if(r === 'PPC_ADMIN' || r === 'ADMIN_CONTROL' || r === 'ADMIN') { google.script.run.withSuccessHandler(res => { if(res.success && res.data.length > 0) { activityQueue.value = res.data; } }).apiFetchDrafts(); } }).getSystemConfig(r); };
      const toggleSidebar = () => { isCompact.value = !isCompact.value; };
      const animateCyberpunkLogo = () => {
          anime({
              targets: '.cp-path',
              strokeDashoffset: [anime.setDashoffset, 0],
              easing: 'easeInOutSine',
              duration: 2000,
              direction: 'alternate',
              loop: true
          });
      };

      const toggleTheme = () => {
          if (currentTheme.value === 'light') currentTheme.value = 'dark';
          else if (currentTheme.value === 'dark') currentTheme.value = 'cyberpunk';
          else currentTheme.value = 'light';
      };
      watch(currentTheme, (val) => {
          document.body.classList.remove('theme-light', 'theme-dark', 'theme-cyberpunk');
          document.body.classList.add('theme-' + val);
          if (val === 'cyberpunk') {
              nextTick(() => animateCyberpunkLogo());
          }
      }, { immediate: true });

      const logout = () => { google.script.run.apiLogout(currentUsername.value); isLoggedIn.value=false; loginPass.value=''; loginUser.value=''; currentView.value='DASHBOARD'; };
      const goHome = () => { currentView.value='DASHBOARD'; currentDept.value=''; currentModuleId.value=''; };
      const selectDept = (k) => { currentDept.value=k; currentView.value='DEPT'; searchQuery.value=''; currentModuleId.value=''; };
      const goBackToDept = () => currentView.value=staffTracker.value.previousView;

      const loadWeeklyPlan = () => { weeklyPlanData.value.isLoading = true; google.script.run.withSuccessHandler(res => { weeklyPlanData.value.isLoading = false; if(res.success){ weeklyPlanData.value.headers = res.headers; weeklyPlanData.value.data = res.data; selectedWeek.value = ''; } else Swal.fire('Error', res.message, 'error'); }).apiFetchWeeklyPlanData(currentUsername.value); };
      const savePPCV3Row = (row, event) => {
          if (row._isSaving) return;
          row._isSaving = true;

          if (event && event.clientX) {
             const isCompleted = Object.entries(row).some(([k, v]) => (String(k).toUpperCase().includes('AVANCE') && String(v) === '100') || (String(k).toUpperCase().includes('CUMPLIMIENTO') && String(v).toUpperCase() === 'SI'));
             if (isCompleted) triggerConfetti(event.clientX, event.clientY);
          }
          const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
          Toast.fire({ icon: 'info', title: 'Guardando...' });
          google.script.run.withSuccessHandler(res => {
              row._isSaving = false;
              if(res.success) Toast.fire({ icon: 'success', title: 'Actualizado' });
              else Swal.fire('Error', res.message, 'error');
          }).withFailureHandler(err => { row._isSaving = false; handleErr(err); }).apiUpdatePPCV3(JSON.parse(JSON.stringify(row)), currentUsername.value);
      };

      // ECG LOGIC
      const loadEcgData = () => {
          if(currentView.value !== 'ECG_VIEW') return;
          Swal.showLoading();
          google.script.run.withSuccessHandler(res => {
              Swal.close();
              if (res.success) {
                  ecgData.value = res.data;
                  nextTick(() => { renderEcgCharts(); });
              } else {
                  Swal.fire('Error', res.message, 'error');
              }
          }).apiFetchSalesHistory();
      };

      const renderEcgCharts = () => {
          Object.keys(ecgData.value).forEach(personName => {
              const canvasId = 'chart-' + personName.replace(/\s+/g, '');
              const ctx = document.getElementById(canvasId);
              if (!ctx) return;

              if (ecgChartInstances[personName]) {
                  ecgChartInstances[personName].destroy();
              }

              const dataPoints = ecgData.value[personName];
              const labels = dataPoints.map(d => d.displayDate);
              const values = dataPoints.map(d => d.pulse);

              let borderColor = '#00ff00';
              if(personName.includes("SEBASTIAN")) borderColor = '#00ccff';
              if(personName.includes("EDUARDO")) borderColor = '#ff9900';

              ecgChartInstances[personName] = new Chart(ctx, {
                  type: 'line',
                  data: {
                      labels: labels,
                      datasets: [{
                          label: 'Señal de Ventas',
                          data: values,
                          borderColor: borderColor,
                          borderWidth: 2,
                          tension: 0.1,
                          pointRadius: 3,
                          pointBackgroundColor: '#fff'
                      }]
                  },
                  options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                          x: { display: false },
                          y: {
                              display: true,
                              grid: { color: '#222' },
                              ticks: { color: '#555', callback: (v) => v > 5 ? 'VENDIDA' : (v < 0 ? 'PERDIDA' : '') }
                          }
                      },
                      plugins: {
                          legend: { display: false },
                          tooltip: {
                              callbacks: {
                                  label: (ctx) => {
                                      const idx = ctx.dataIndex;
                                      const item = dataPoints[idx];
                                      return `${item.status}: ${item.desc} (${item.client})`;
                                  }
                              }
                          }
                      },
                      animation: { duration: 1500, easing: 'easeOutQuart' }
                  }
              });
          });
      };

      const openModule = (m) => {
          currentModuleId.value = m.id; currentDept.value = '';
          if(m.type==='mirror_staff') { openStaffTracker({name:m.target}); }
          else if(m.type==='ppc_native') {
              if (currentRole.value === 'WORKORDER_USER') {
                  currentView.value = 'WORKORDER_FORM';
                  fetchNextSequence();
                  workorderData.value = {
                      cliente: '', planta: '', requisitor: '', newRequisitor: '', contactName: '', contacto: '', celular: '', fechaCotizacion: '', proyecto: '',
                      cotizador: [], departamento: '', tipoTrabajo: '', fechaEntrega: '', tiempoEstimado: '', items: [],
                      prioridad: 'AAA - Alta Prioridad', conceptoDesc: '',
                      checkList: { libreta: false, cinta: false, bernier: false, chaleco: false, laser: false, epp: false, casco: false, credencial: false, zapato: false, sua: false, lentes: false },
                      restricciones: { produccion: '', seguridad: '', dificultad: '', horarios: '', especificidad: '' },
                      files: [],
                      designValidation: { items: [{ diseno: [], maquinados: [], dibujos: [] }] }
                  };
                      projectProgram.value = {
                          timeEstimated: 1,
                          timeUnit: 'dias',
                          visita: [{ description: '', date: '', duration: '', durationUnit: 'dias', unit: '', quantity: '', price: '', total: 0, responsable: [] }],
                          reqCotizacion: [],
                          cotPreconstruccion: [],
                          cotTrabajo: []
                      };
              } else {
                  currentView.value='PPC_FORM';
                  google.script.run.withSuccessHandler(res => { if(res.success) ppcExistingData.value = res.data; }).apiFetchPPCData();
              }
          }
          else if(m.type==='ppc_dynamic_view') { currentView.value='PPC_DINAMICO'; dynamicPpc.value = { especialidad: '', clasificacion: 'A', concepto: '', riesgos: 'BAJO', prioridad: 'MEDIA', fechaFin: '', comentarios: '', archivoUrl: '' }; selectedResponsables.value = []; uploadSuccess.value = false; }
          else if(m.type==='weekly_plan_view') { currentView.value='WEEKLY_PLAN'; loadWeeklyPlan(); }
          else if(m.type === 'ecg_dashboard') {
              currentView.value = 'ECG_VIEW';
              loadEcgData();
          }
          else if(m.type === 'kpi_dashboard_view') {
              // Permitir acceso a LUIS_CARLOS y ANTONIA_VENTAS (o rol TONITA)
              // if (currentUsername.value !== 'LUIS_CARLOS') { ... } // Comentado para permitir acceso demo
              currentView.value = 'KPI_DASHBOARD';
              loadKPIData();
          }
      };

      const loadKPIData = () => {
          kpiData.value.isLoading = true;
          google.script.run.withSuccessHandler(res => {
              kpiData.value.isLoading = false;
              if (res.success) {
                  kpiData.value.ventas = res.ventas;
                  kpiData.value.tracker = res.tracker;
                  if (res.productivity) kpiData.value.productivity = res.productivity;
                  nextTick(() => { renderKPICharts(); });
              } else {
                  Swal.fire('Error', res.message || 'No se pudieron cargar los KPIs.', 'error');
              }
          }).apiFetchTeamKPIData(currentUsername.value);
      };

      const renderKPICharts = () => {
          // VENTAS CHART
          const ctxVentas = document.getElementById('kpiChartVentas');
          if (ctxVentas && kpiData.value.ventas.length) {
               if (kpiChartInstances.ventas) kpiChartInstances.ventas.destroy();
               const labels = kpiData.value.ventas.map(u => u.name.split(' ')[0]); // First name only
               const dataEff = kpiData.value.ventas.map(u => u.efficiency);
               const dataVol = kpiData.value.ventas.map(u => u.volume);

               kpiChartInstances.ventas = new Chart(ctxVentas, {
                   type: 'bar',
                   data: {
                       labels: labels,
                       datasets: [
                           { label: 'Eficiencia (Días)', data: dataEff, backgroundColor: '#2c3e50', yAxisID: 'y' },
                           { label: 'Volumen', data: dataVol, type: 'line', borderColor: '#e67e22', tension: 0.1, yAxisID: 'y1' }
                       ]
                   },
                   options: {
                       responsive: true, maintainAspectRatio: false,
                       scales: {
                           y: { type: 'linear', display: true, position: 'left', title: { display:true, text: 'Días Promedio' } },
                           y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display:true, text: 'Tareas' } }
                       }
                   }
               });
          }

          // TRACKER CHART
          const ctxTracker = document.getElementById('kpiChartTracker');
          if (ctxTracker && kpiData.value.tracker.length) {
               if (kpiChartInstances.tracker) kpiChartInstances.tracker.destroy();
               const labels = kpiData.value.tracker.map(u => u.name.split(' ')[0]);
               const dataEff = kpiData.value.tracker.map(u => u.efficiency);
               const dataVol = kpiData.value.tracker.map(u => u.volume);

               kpiChartInstances.tracker = new Chart(ctxTracker, {
                   type: 'bar',
                   data: {
                       labels: labels,
                       datasets: [
                           { label: 'Eficiencia (Días)', data: dataEff, backgroundColor: '#e74c3c', yAxisID: 'y' },
                           { label: 'Volumen', data: dataVol, type: 'line', borderColor: '#8e44ad', tension: 0.1, yAxisID: 'y1' }
                       ]
                   },
                   options: {
                       responsive: true, maintainAspectRatio: false,
                       scales: {
                           y: { type: 'linear', display: true, position: 'left', title: { display:true, text: 'Días Promedio' } },
                           y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display:true, text: 'Tareas' } }
                       }
                   }
               });
          }

          // PRODUCTIVITY CHART (ANTONIA)
          const ctxProd = document.getElementById('kpiChartProductivity');
          if (ctxProd && kpiData.value.productivity) {
               if (kpiChartInstances.productivity) kpiChartInstances.productivity.destroy();

               kpiChartInstances.productivity = new Chart(ctxProd, {
                   type: 'bar',
                   data: {
                       labels: kpiData.value.productivity.labels,
                       datasets: [
                           {
                               label: 'Ingresos',
                               data: kpiData.value.productivity.values,
                               backgroundColor: '#107c41',
                               borderColor: '#0b5d2f',
                               borderWidth: 1
                           }
                       ]
                   },
                   options: {
                       responsive: true, maintainAspectRatio: false,
                       scales: {
                           y: {
                               beginAtZero: true,
                               ticks: { stepSize: 1 },
                               title: { display: true, text: 'Cantidad de Ingresos' }
                           }
                       },
                       plugins: {
                           legend: { display: false },
                           title: { display: true, text: 'Frecuencia de Ingreso (Diciembre)' }
                       }
                   }
               });
          }
      };

      const closeIframe = () => currentView.value='DASHBOARD';

      const openStaffTracker = (p) => {
          currentStaffName.value = p.name;
          activeTrackerTab.value = 'OPERATIVO';
          staffTracker.value.previousView = currentView.value;
          currentView.value = 'STAFF_TRACKER';
          loadTrackerData();
      };

      const switchTrackerTab = (tab) => {
          if (activeTrackerTab.value === tab) return;
          activeTrackerTab.value = tab;
          loadTrackerData();
      };

      const loadTrackerData = () => {
          let sheetName = currentStaffName.value;
          if (activeTrackerTab.value === 'VENTAS') {
              sheetName = sheetName + " VENTAS";
          }
          staffTracker.value.name = sheetName;
          staffTracker.value.isLoading = true;

          google.script.run.withSuccessHandler(res => {
              staffTracker.value.isLoading = false;
              if (res.success) {
                  staffTracker.value.data = res.data;
                  staffTracker.value.history = res.history;
                  staffTracker.value.headers = res.headers;
                  // Recalcular Días (Contador) para todas las hojas (si tienen las columnas)
                  // Se ejecuta siempre, la función calculateDiasCounter valida si existen las columnas
                  staffTracker.value.data.forEach(row => calculateDiasCounter(row));
              } else {
                  if (res.message && res.message.includes("Falta hoja")) {
                      staffTracker.value.data = [];
                      staffTracker.value.history = [];
                      staffTracker.value.headers = [];
                      Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Vista vacía (Sin hoja)', showConfirmButton: false, timer: 2000 });
                  } else {
                      Swal.fire('Error', res.message, 'error');
                  }
              }
          }).withFailureHandler(handleErr).apiFetchStaffTrackerData(sheetName);
      };

      const reloadStaffTracker = () => loadTrackerData();

      const saveAllTrackerRows = () => {
          if (staffTracker.value.data.length === 0) return;
          Swal.fire({
              title: '¿Guardar Todo?',
              text: `Se guardarán ${staffTracker.value.data.length} filas.`,
              icon: 'question',
              showCancelButton: true,
              confirmButtonText: 'Sí, Guardar'
          }).then((result) => {
              if (result.isConfirmed) {
                  Swal.showLoading();
                  google.script.run.withSuccessHandler(res => {
                      Swal.close();
                      if (res.success) {
                          Swal.fire('Guardado', 'Todas las tareas han sido actualizadas.', 'success');
                          loadTrackerData(); // Reload to get updated IDs/States
                      } else {
                          Swal.fire('Error', res.message, 'error');
                      }
                  }).apiSaveTrackerBatch(staffTracker.value.name, JSON.parse(JSON.stringify(staffTracker.value.data)), currentUsername.value);
              }
          });
      };

      const addNewRow = () => {
          if(!staffTracker.value.headers.length) return;
          const row={_isNew:true};
          staffTracker.value.headers.forEach(h => { if(isCol(h, ['DIAS','RELOJ'])) row[h]=0; else row[h]=""; });
          staffTracker.value.data.unshift(row);
          pulseNewRow('trackerTable', 'first');
      };
      const saveRow = (row, event) => {
          if (row._isSaving) return;
          row._isSaving = true;

          if (event && event.clientX) {
             const isCompleted = Object.entries(row).some(([k, v]) => (String(k).toUpperCase().includes('AVANCE') && String(v) === '100') || (String(k).toUpperCase().includes('CUMPLIMIENTO') && String(v).toUpperCase() === 'SI'));
             if (isCompleted) triggerConfetti(event.clientX, event.clientY);
          }
          Swal.showLoading();
          google.script.run.withSuccessHandler(res => {
              row._isSaving = false;
              Swal.close();
              if(res.success){
                  row._isNew=false;
                  if (res.data && (res.data.FOLIO || res.data.ID)) {
                      row.FOLIO = res.data.FOLIO || res.data.ID;
                      if (row.ID === undefined) row.ID = row.FOLIO;
                  }
                  if(res.moved){
                      reloadStaffTracker();
                      Swal.fire({icon: 'success', title: 'Archivado', text: 'Tarea movida a Realizadas (100%)', timer: 1500, showConfirmButton: false});
                  } else {
                      Swal.fire({icon: 'success', title: 'Guardado', timer: 1000, showConfirmButton: false});
                  }
              } else {
                  Swal.fire('Error', res.message, 'error');
              }
          }).withFailureHandler(err => { row._isSaving = false; handleErr(err); }).apiUpdateTask(staffTracker.value.name, JSON.parse(JSON.stringify(row)), currentUsername.value);
      };

      const deleteFile = (row, h, urlToDelete) => {
          if (!isFieldEditable(h, row)) return;
          Swal.fire({
              title: '¿Eliminar archivo?',
              text: "Se quitará este archivo de la celda.",
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#d33',
              cancelButtonColor: '#3085d6',
              confirmButtonText: 'Sí, eliminar',
              cancelButtonText: 'Cancelar'
          }).then((result) => {
              if (result.isConfirmed) {
                  let urls = String(row[h]).split(/[\n\s]+/).filter(u => u.startsWith('http'));
                  urls = urls.filter(u => u !== urlToDelete);
                  row[h] = urls.join('\n');
                  saveRow(row);
              }
          });
      };

      const openCellUpload = (row, col) => { uploadingCell.value = {row, col}; cellFileInput.value.click(); };
      const handleCellFile = (e) => { const file = e.target.files[0]; if(!file || !uploadingCell.value.row) return; Swal.showLoading(); const r = new FileReader(); r.onload = (ev) => { google.script.run.withSuccessHandler(res => { if(res.success){ const colName = String(uploadingCell.value.col).toUpperCase(); if (colName === 'INFO CLIENTE' || colName === 'REQUISITOR') { const currentVal = uploadingCell.value.row[uploadingCell.value.col] || ''; uploadingCell.value.row[uploadingCell.value.col] = currentVal ? currentVal + '\n' + res.fileUrl : res.fileUrl; } else { uploadingCell.value.row[uploadingCell.value.col] = res.fileUrl; } saveRow(uploadingCell.value.row); } else Swal.fire('Error', res.message, 'error'); e.target.value = null; }).uploadFileToDrive(ev.target.result, file.type, file.name); }; r.readAsDataURL(file); };
      const addResponsable = (n) => { selectedResponsables.value.push(n); staffSearch.value=''; };
      const openFileDialog = () => fileInput.value.click();
      const handleFileSelect = (e) => {
          const file = e.target.files[0];
          if(!file) return;
          isUploadingFile.value=true;
          const r = new FileReader();
          r.onload=(ev)=>google.script.run.withSuccessHandler(res=>{
              isUploadingFile.value=false;
              if(res.success){
                  uploadSuccess.value=true;
                  if(currentView.value === 'PPC_DINAMICO') {
                      dynamicPpc.value.archivoUrl=res.fileUrl;
                  } else if (currentView.value === 'WORKORDER_FORM') {
                      const tag = currentUploadType.value ? `[${currentUploadType.value}] ` : '';
                      workorderData.value.files.push(tag + res.fileUrl);
                      Swal.fire('Archivo Subido', '', 'success');
                  } else {
                      ppcData.value.archivoUrl=res.fileUrl;
                  }
                  if (currentView.value !== 'WORKORDER_FORM') Swal.fire('Archivo Subido','','success');
              }
          }).uploadFileToDrive(ev.target.result,file.type,file.name);
          r.readAsDataURL(file);
      };
      const triggerUpload = (type) => { currentUploadType.value = type; fileInput.value.click(); };
      const promptExtraData = () => { if(!ppcData.value.concepto || !selectedResponsables.value.length) return Swal.fire('Faltan datos básicos','','warning'); extraData.value = { restricciones: '', prioridades: '', riesgos: '', fechaRespuesta: '', clasificacion: '' }; showExtraModal.value = true; };
      const confirmAddToQueue = () => {
          // WORKORDER FLOW
          if (currentView.value === 'WORKORDER_FORM') {
             if (!currentWorkorderId.value) return;
             isSubmitting.value = true;
             let fResp = extraData.value.fechaRespuesta;
             if(fResp) { const parts = fResp.split('-'); if(parts.length === 3) fResp = `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`; }
             const updatePayload = {
                 FOLIO: currentWorkorderId.value,
                 CLASIFICACION: extraData.value.clasificacion,
                 PRIORIDAD: extraData.value.prioridades,
                 RIESGOS: extraData.value.riesgos,
                 RESTRICCIONES: extraData.value.restricciones,
                 FECHA_RESPUESTA: fResp
             };
             google.script.run.withSuccessHandler(res => {
                 isSubmitting.value = false;
                 if(res.success) {
                     Swal.fire({ icon:'success', title: 'Workorder Completa', text: `Folio: ${currentWorkorderId.value} actualizado con detalles.`, timer: 2000, showConfirmButton: false });
                     showExtraModal.value = false;
                     workorderData.value = {
                         cliente: '', planta: '', requisitor: '', newRequisitor: '', contactName: '', contacto: '', celular: '', fechaCotizacion: '', proyecto: '',
                         cotizador: '', departamento: '', tipoTrabajo: '', fechaEntrega: '', tiempoEstimado: '', items: [],
                         prioridad: 'AAA - Alta Prioridad', conceptoDesc: ''
                     };
                     currentWorkorderId.value = null;
                 } else {
                     Swal.fire('Error', res.message, 'error');
                 }
             }).apiUpdatePPCV3(updatePayload, currentUsername.value);
             return;
          }

          const item = JSON.parse(JSON.stringify(ppcData.value)); item.responsable = selectedResponsables.value.join(','); item.restricciones = extraData.value.restricciones; item.prioridades = extraData.value.prioridades; item.riesgos = extraData.value.riesgos; item.clasificacion = extraData.value.clasificacion; if(currentPpcProject.value) { const tag = `[PROY: ${currentPpcProject.value.name}]`; item.comentarios = (item.comentarios ? item.comentarios + ' ' : '') + tag; } let fResp = extraData.value.fechaRespuesta; if(fResp) { const parts = fResp.split('-'); if(parts.length === 3) fResp = `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`; } item.fechaRespuesta = fResp; item.fechaAlta = new Date().toISOString(); activityQueue.value.push(item); ppcData.value.concepto=''; ppcData.value.horas=''; ppcData.value.comentarios=''; ppcData.value.comentariosPrevios=''; selectedResponsables.value=[]; uploadSuccess.value=false; showExtraModal.value = false; syncQueueToBackend(); pulseNewRow('ppcDraftTable', 'last');
      };
      const syncQueueToBackend = () => { google.script.run.apiSyncDrafts(JSON.parse(JSON.stringify(activityQueue.value))); };

      const saveWorkOrder = () => {
        if(!workorderData.value.cliente || !workorderData.value.tipoTrabajo || !workorderData.value.cotizador.length) {
            return Swal.fire('Faltan datos obligatorios', 'Cliente, Tipo de Trabajo y quien Elaboró son requeridos.', 'warning');
        }
        isSubmitting.value = true;

        let fEnt = workorderData.value.fechaEntrega;
        if(fEnt) { const parts = fEnt.split('-'); if(parts.length === 3) fEnt = `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`; }

        // Construct Rich Description (CONCEPTO)
        let conceptoStr = workorderData.value.conceptoDesc || '';
        conceptoStr += `\n[TIPO: ${workorderData.value.tipoTrabajo || 'N/A'}]`;
        if (workorderData.value.tiempoEstimado) conceptoStr += ` [TIEMPO: ${workorderData.value.tiempoEstimado}]`;

        // Serialize Vehicle Control Data
        const vCtrl = vehicleControlData.value;
        if (Object.keys(vCtrl).length > 0) {
            conceptoStr += `\n\n[CONTROL VEHICULO]`;
            if (vCtrl.cotizacion) conceptoStr += `\nCotización: ${vCtrl.cotizacion}`;
            if (vCtrl.chofer) conceptoStr += `\nChofer: ${vCtrl.chofer}`;
            if (vCtrl.vehiculo) conceptoStr += `\nVehiculo: ${vCtrl.vehiculo}`;
            if (vCtrl.gasolina) conceptoStr += `\nGasolina: ${vCtrl.gasolina}`;
            if (vCtrl.horaSalida) conceptoStr += `\nHora Salida: ${vCtrl.horaSalida}`;
            if (vCtrl.evaluacion) conceptoStr += `\nEvaluación: ${vCtrl.evaluacion}`;
            if (vCtrl.multas) conceptoStr += `\nMultas: ${vCtrl.multas}`;
            if (vCtrl.horaLlegada) conceptoStr += `\nHora Llegada: ${vCtrl.horaLlegada}`;
            if (vCtrl.ruta) conceptoStr += `\nRuta: ${vCtrl.ruta}`;
            if (vCtrl.verifVehiculo) conceptoStr += `\nVerificación: ${vCtrl.verifVehiculo}`;
        }

        // Serialize Vehicle Control Data 2 (Final)
        const vCtrl2 = vehicleControlData2.value;
        if (Object.keys(vCtrl2).length > 0) {
            conceptoStr += `\n\n[CONTROL VEHICULO FINAL]`;
            if (vCtrl2.cotizacion) conceptoStr += `\nCotización: ${vCtrl2.cotizacion}`;
            if (vCtrl2.chofer) conceptoStr += `\nChofer: ${vCtrl2.chofer}`;
            if (vCtrl2.vehiculo) conceptoStr += `\nVehiculo: ${vCtrl2.vehiculo}`;
            if (vCtrl2.gasolina) conceptoStr += `\nGasolina: ${vCtrl2.gasolina}`;
            if (vCtrl2.horaSalida) conceptoStr += `\nHora Salida: ${vCtrl2.horaSalida}`;
            if (vCtrl2.evaluacion) conceptoStr += `\nEvaluación: ${vCtrl2.evaluacion}`;
            if (vCtrl2.multas) conceptoStr += `\nMultas: ${vCtrl2.multas}`;
            if (vCtrl2.horaLlegada) conceptoStr += `\nHora Llegada: ${vCtrl2.horaLlegada}`;
            if (vCtrl2.ruta) conceptoStr += `\nRuta: ${vCtrl2.ruta}`;
            if (vCtrl2.verifVehiculo) conceptoStr += `\nVerificación: ${vCtrl2.verifVehiculo}`;
        }

        const fullClientName = workorderData.value.cliente;

        const fullRequisitor = workorderData.value.newRequisitor
            ? `${workorderData.value.newRequisitor} (${workorderData.value.contactName || ''})`
            : (workorderData.value.contactName || '');

        // Use selected Department for Especialidad (Folio generation), fallback to Tipo if missing
        const spec = workorderData.value.departamento || workorderData.value.tipoTrabajo;

        // Collect Design Files
        const designFiles = [];
        if (workorderData.value.designValidation && workorderData.value.designValidation.items) {
            workorderData.value.designValidation.items.forEach(item => {
                ['diseno', 'maquinados', 'dibujos'].forEach(col => {
                    if (item[col]) {
                        item[col].forEach(f => {
                             designFiles.push(`[${col.toUpperCase()}-${f.type}] ${f.url}`);
                        });
                    }
                });
            });
        }

        const payload = {
            cliente: fullClientName,
            especialidad: spec, // Mapping Department to Area/Especialidad for Folio
            concepto: conceptoStr,
            responsable: workorderData.value.cotizador.join(', '),
            requisitor: fullRequisitor,
            contacto: workorderData.value.contacto,
            celular: workorderData.value.celular,
            prioridad: workorderData.value.prioridad,
            fechaRespuesta: fEnt, // Mapped to Fecha Entrega
            comentarios: '',
            restricciones: Object.entries(workorderData.value.restricciones)
                .filter(([k, v]) => v)
                .map(([k, v]) => `[${k.toUpperCase()}: ${v}]`)
                .join(' '),
            archivoUrl: [...workorderData.value.files, ...designFiles].join('\n'),
            horas: 0,
            cumplimiento: 'NO',
            TRABAJO: workorderData.value.tipoTrabajo,
            // CAMPOS DE DETALLE (NUEVO)
            materiales: JSON.parse(JSON.stringify(requiredMaterials.value.items)),
            manoObra: JSON.parse(JSON.stringify(laborTable.value.items)),
            herramientas: JSON.parse(JSON.stringify(toolsRequired.value.items)),
            equipos: JSON.parse(JSON.stringify(specialEquipment.value.items)),
            programa: [
                ...projectProgram.value.visita.map(i => ({...i, seccion: 'VISITA'})),
                ...projectProgram.value.reqCotizacion.map(i => ({...i, seccion: 'REQUERIMIENTO'})),
                ...projectProgram.value.cotPreconstruccion.map(i => ({...i, seccion: 'PRECONSTRUCCION'})),
                ...projectProgram.value.cotTrabajo.map(i => ({...i, seccion: 'TRABAJO'}))
            ].map(i => ({
                ...i,
                responsable: Array.isArray(i.responsable) ? i.responsable.join(', ') : i.responsable
            })),
            checkList: JSON.parse(JSON.stringify(workorderData.value.checkList)),
            additionalCosts: JSON.parse(JSON.stringify(additionalCosts.value))
        };

        google.script.run.withSuccessHandler(res => {
            isSubmitting.value = false;
            if(res.success) {
                if (res.ids && res.ids.length > 0) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Pre Work Order Guardada',
                        text: `Folio Generado: ${res.ids[0]}`,
                        confirmButtonText: 'Aceptar'
                    }).then(() => {
                        // Reset Form
                        workorderData.value = {
                            cliente: '', planta: '', requisitor: '', newRequisitor: '', contactName: '', contacto: '', celular: '', fechaCotizacion: '', proyecto: '',
                            cotizador: [], departamento: '', tipoTrabajo: '', fechaEntrega: '', tiempoEstimado: '', items: [],
                            prioridad: 'AAA - Alta Prioridad', conceptoDesc: '',
                      checkList: { libreta: false, cinta: false, bernier: false, chaleco: false, laser: false, epp: false, casco: false, credencial: false, zapato: false, sua: false, lentes: false },
                      restricciones: { produccion: '', seguridad: '', dificultad: '', horarios: '', especificidad: '' },
                      files: [],
                      designValidation: { items: [{ diseno: [], maquinados: [], dibujos: [] }] }
                        };
                        currentWorkorderId.value = null;
                    });
                } else {
                    Swal.fire('Guardado', 'Pre Work Order guardada.', 'success');
                }
            } else {
                Swal.fire('Error', res.message, 'error');
            }
        }).apiSavePPCData([payload], currentUsername.value);
      };
      const saveDynamicPPC = () => { if(!dynamicPpc.value.especialidad || !dynamicPpc.value.concepto || !selectedResponsables.value.length) return Swal.fire('Faltan datos','','warning'); isSubmitting.value = true; let fResp = dynamicPpc.value.fechaFin; if(fResp) { const parts = fResp.split('-'); if(parts.length === 3) fResp = `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`; } let finalComs = dynamicPpc.value.comentarios || ''; if(currentPpcProject.value) { finalComs = (finalComs ? finalComs + ' ' : '') + `[PROY: ${currentPpcProject.value.name}]`; } const payload = { especialidad: dynamicPpc.value.especialidad, concepto: dynamicPpc.value.concepto, responsable: selectedResponsables.value.join(','), clasificacion: dynamicPpc.value.clasificacion, riesgos: dynamicPpc.value.riesgos, prioridad: dynamicPpc.value.prioridad, fechaRespuesta: fResp, archivoUrl: dynamicPpc.value.archivoUrl, comentarios: finalComs, horas: '', cumplimiento: 'NO' }; google.script.run.withSuccessHandler(res => { isSubmitting.value = false; if(res.success){ Swal.fire('Registro Guardado','Enviado a PPC y Tracker','success'); dynamicPpc.value = { especialidad: '', clasificacion: 'A', concepto: '', riesgos: 'BAJO', prioridad: 'MEDIA', fechaFin: '', comentarios: '', archivoUrl: '' }; selectedResponsables.value = []; uploadSuccess.value = false; } else { Swal.fire('Error', res.message, 'error'); } }).withFailureHandler(handleErr).apiSavePPCData([payload], currentUsername.value); };
      const submitBatch = () => { isSubmitting.value=true; google.script.run.withSuccessHandler(res => { isSubmitting.value=false; if(res.success){ Swal.fire('Guardado','','success'); google.script.run.withSuccessHandler(r => { if(r.success) ppcExistingData.value = r.data; }).apiFetchPPCData(); } else Swal.fire('Error',res.message,'error'); }).withFailureHandler(handleErr).apiSavePPCData(JSON.parse(JSON.stringify(activityQueue.value)), currentUsername.value); };
      const clearQueue = () => { Swal.fire({ title: '¿Limpiar tabla?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' }).then((result) => { if (result.isConfirmed) { activityQueue.value = []; google.script.run.apiClearDrafts(); } }); };
      const toIsoDate = (val) => { if (!val) return ''; const parts = String(val).split('/'); if (parts.length === 3) { let y = parts[2]; if (y.length === 2) y = '20' + y; return `${y}-${parts[1]}-${parts[0]}`; } return ''; };
      const formatDisplayDate = (val) => { if(!val) return ''; if(String(val).match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)) return val; if(String(val).match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) return val.replace(/\/(\d{4})$/, (m, y) => "/" + y.slice(-2)); return val; };
      const updateDateFromPicker = (e, row, h) => {
          const val = e.target.value;
          if (!val) { row[h] = ''; return; }
          const parts = val.split('-');
          if (parts.length === 3) row[h] = `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
          calculateDiasCounter(row);
      };

      return { deleteFile, isLoggedIn, loginPass, loginUser, loggingIn, doLogin, logout, currentUser, currentRole, currentView, config, staffTracker, weeklyPlanData, searchQuery, goHome, selectDept, openStaffTracker, reloadStaffTracker, goBackToDept, saveRow, addNewRow, openModule, filteredStaff, getTrafficStyle, ppcData, isSubmitting, selectedResponsables, staffSearch, filteredDirectory, addResponsable, promptExtraData, confirmAddToQueue, activityQueue, submitBatch, clearQueue, pageTitle, openFileDialog, handleFileSelect, fileInput, isUploadingFile, uploadSuccess, closeIframe, showExtraModal, extraData, priorityOpts, riskOpts, salesStaff, cellFileInput, openCellUpload, handleCellFile, toIsoDate, updateDateFromPicker, formatDisplayDate, isMediaColumn, getColumnStyle, getHeaderLabel, isCol, isFieldEditable, deptStats, currentDeptData, currentModuleId, currentDept, ppcExistingData, dynamicPpc, saveDynamicPPC, getFechaRespuestaStyle, getFechaInicioTrafficStyle, syncQueueToBackend, isCompact, toggleSidebar, loadWeeklyPlan, weeklyStats, savePPCV3Row, selectedWeek, availableWeeks, filteredWeeklyData, projectCards, activeProjectsList, projectSubFolders, openFolderContent, toggleExpand, showPpcSelectorModal, openPpcProjectSelector, ppcMode, selectPpcProject, createNewProject, newProject, currentPpcProject, loadCascadeTree, showSubProjectModal, currentTargetSite, newSubProject, openAddSubProject, createSubProject, openProjectTask, projectTasks, refreshProjectTasks, addNewProjectTask, saveProjectRow,
      ecgData, loadEcgData, renderEcgCharts, toInitials, showPassword, currentTheme, toggleTheme, availableSpecialties, filterSpecialty, filterCompliance, kpiData, loadKPIData, activeTrackerTab, trackerSubView, switchTrackerTab, loadTrackerData, getAvatarUrl, workorderData, saveWorkOrder, currentWorkorderId, addWorkorderItem, removeWorkorderItem, formatCurrency, workorderTypes, generatedFolio, vehicleData, vehicleControlData, vehicleControlData2, showWorkOrderLogic, triggerUpload,
      saveAllTrackerRows,
      showTimePopup, timePopupValue, openTimePopup, saveTimePopup,
      projectProgram, addProjectItem, removeProjectItem, updateProjectRowTotal,
      laborTable, addLaborItem, removeLaborItem, updateLaborRowTotal, laborTableTotal, totalPersonnel, costPerWeekCrew, weeksRequired,
      requiredMaterials, addMaterialItem, removeMaterialItem, updateMaterialRowTotal, materialsTotal,
      toolsRequired, addToolItem, removeToolItem, updateToolRowTotal, toolsTotal,
      specialEquipment, addSpecialEquipItem, removeSpecialEquipItem, updateSpecialEquipRowTotal, specialEquipTotal,
      additionalCosts, laborTotal, dashboardSubtotal, dashboardUtility, dashboardTotal, animatedTotals,
      selectedFinancing,
      addDesignRow, removeDesignRow, triggerDesignUpload, designFileInput, handleDesignFileSelect,
      eppCost, netCostPerWeek, hoursRequired, costPerHour, totalOvertime, totalNight, totalWeekend,
      showLogic, showInstr, projectRespDropdownOpen, toggleProjectResponsable, openRespDropdown,
      cotizadorSearch, filteredCotizadores, addCotizador, removeCotizador, isRecording, toggleDictation,
      trackerTable, projectTable, ppcDraftTable,
      showEmployeeModal, newEmployee, openNewEmployeeModal, saveNewEmployee, deleteEmployee,
      infoBankState, ibYears, ibMonths, ibCompanies, ibFolders, filteredIbCompanies, selectIbYear, selectIbMonth, selectIbCompany, goBackInfoBank, resetInfoBank, openIbFolder, fetchInfoBankFiles, getBadgeClass };
    }
  });
  app.config.errorHandler = (err) => { console.error(err); Swal.fire({ icon: 'error', title: 'Error de Renderizado', text: 'Ocurrió un error visual: ' + err.message }); };
  app.mount('#app');
