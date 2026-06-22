/**
 * test_departments.js
 * Verifica que el organigrama del código (INITIAL_DIRECTORY + USER_DB en CODIGO.js)
 * coincida EXACTAMENTE con el organigrama oficial entregado (imagen por departamento).
 *
 * Uso:  node test_departments.js
 * Salida: reporte por departamento + resumen. Sale con código !=0 si algo falla.
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, 'CODIGO.js'), 'utf8');

// --- Extrae un bloque "const NOMBRE = <abridor> ... <cerrador>;" con balanceo de brackets ---
function extractBlock(src, decl, open, close) {
  const start = src.indexOf(decl);
  if (start === -1) throw new Error('No se encontró: ' + decl);
  let i = src.indexOf(open, start);
  let depth = 0, end = -1;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) { end = j; break; } }
  }
  if (end === -1) throw new Error('Bloque no balanceado: ' + decl);
  return src.slice(start, end + 1) + ';';
}

const dirCode = extractBlock(SRC, 'const INITIAL_DIRECTORY', '[', ']');
const dbCode  = extractBlock(SRC, 'const USER_DB', '{', '}');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(dirCode + '\n' + dbCode + '\nthis.INITIAL_DIRECTORY = INITIAL_DIRECTORY; this.USER_DB = USER_DB;', sandbox);
const INITIAL_DIRECTORY = sandbox.INITIAL_DIRECTORY;
const USER_DB = sandbox.USER_DB;

// --- ORGANIGRAMA OFICIAL (transcripción literal de la imagen) ---
// Clave = departamento; valor = nombres tal como deben aparecer en el directorio.
const EXPECTED = {
  "CEO":                 ["LUIS CARLOS", "JUAN JOSE SANCHEZ"],
  "GENERAL":             ["DANIELA CASTRO", "CESAR GOMEZ"],
  "RH":                  ["DIMAS ELIEL RAMOS GARCIA", "LAURA EDITH HUERTA ROCHA", "LILIANA AYLIN MARTINEZ IBARRA", "FRANCISCO SANCHEZ SERNA"],
  "FINANZAS":            ["JUANA MARIA RODRIGUEZ JUAREZ", "ZAIRA YAZMIN AGUILAR AGUILON", "ROCIO ABIGAIL CASTRO COVARRUBIAS", "DANIA LIZBETH GONZALEZ LORES"],
  "COMPRAS":             ["SONIA GARCIA PEREZ", "JUDITH ECHAVARRIA", "VANESSA DE LARA"],
  "PRESUPUESTOS":        ["EDUARDO TERAN", "ANTONIA PINEDA LOPEZ"],
  "CALIDAD":             ["CARLOS MENDEZ"],
  "SEGURIDAD":           ["RUBI MORENO RODRIGUEZ"],
  "PRECIOS UNITARIOS":   ["TERESA GARZA", "GERALDINE MARTINEZ HERNANDEZ"],
  "DISEÑO":              ["ANGEL SALINAS", "EDGAR URIMAR LOPEZ MALDONADO"],
  "VENTAS":              ["EDUARDO MANZANARES", "RAMIRO RODRIGUEZ", "SEBASTIAN PADILLA"],
  "ELECTROMECANICA":     ["JEHU MARTINEZ", "MIGUEL GALLARDO"],
  "HVAC":                ["ROLANDO MORENO", "EMILIANO ARREDONDO GOMEZ"],
  "CONSTRUCCION":        ["JAIME OLIVO", "RICARDO MENDO", "ALFONSO CORREA", "CESAR EDUARDO GARCIA AVALOS"],
  "LIMPIEZA":            ["EDUARDO BENITEZ"],
  "ALMACEN Y MAQUINARIA":["SONIA GARCIA PEREZ"]
};

// Entradas de directorio que NO provienen de la imagen pero deben conservarse:
const ALLOWED_EXTRA = [
  { name: "ANTONIA_VENTAS", dept: "VENTAS" },     // rol TONITA, conservado a propósito
  { name: "ADMINISTRADOR", dept: "ADMINISTRACION" } // hoja espejo de control (sin login)
];

// Usuarios que debieron ELIMINARSE de USER_DB:
const SHOULD_BE_DELETED = [
  "GUILLERMO_DAMICO", "REYNALDO_GARCIA", "EDGAR_HOLT", "ALEXIS_TORRES",
  "RUBEN_PESQUEDA", "GISELA_DOMINGUEZ", "CITLALI_GOMEZ", "AIMEE_RAMIREZ", "EDGAR_LOPEZ",
  "JUAN_ENRIQUE_PEREZ"
];

let pass = 0, fail = 0;
const fails = [];
const ok = (m) => { pass++; console.log("  ✅ " + m); };
const bad = (m) => { fail++; fails.push(m); console.log("  ❌ " + m); };

// Índice nombre->Set(depts) del directorio en código
const dirByName = {};
INITIAL_DIRECTORY.forEach(e => {
  const n = String(e.name).toUpperCase().trim();
  (dirByName[n] = dirByName[n] || new Set()).add(String(e.dept).toUpperCase().trim());
});
// Índice staffName->userKey en USER_DB
const dbByStaff = {};
Object.keys(USER_DB).forEach(k => {
  const sn = (USER_DB[k].staffName || '').toUpperCase().trim();
  if (sn) (dbByStaff[sn] = dbByStaff[sn] || []).push(k);
});

console.log("==================================================");
console.log(" VERIFICACIÓN DE ORGANIGRAMA — Holtmont Workspace");
console.log("==================================================\n");

// 1) Cada persona de la imagen está en su departamento (directorio + USER_DB)
Object.keys(EXPECTED).forEach(dept => {
  console.log("● " + dept);
  EXPECTED[dept].forEach(name => {
    const N = name.toUpperCase().trim();
    const depts = dirByName[N];
    if (depts && depts.has(dept)) ok(`${name} → ${dept} (directorio)`);
    else bad(`${name} NO está en ${dept} en el directorio (encontrado: ${depts ? [...depts].join(', ') : 'NINGUNO'})`);

    // Verifica USER_DB.dept (si tiene login). SONIA aparece en 2 depts -> se acepta cualquiera de los suyos.
    const keys = dbByStaff[N];
    if (keys && keys.length) {
      const userDepts = keys.map(k => (USER_DB[k].dept || '').toUpperCase().trim());
      const allowedForPerson = Object.keys(EXPECTED).filter(d => EXPECTED[d].map(x=>x.toUpperCase().trim()).includes(N));
      if (userDepts.some(d => allowedForPerson.includes(d))) ok(`${name} → USER_DB.dept=${userDepts.join('/')} (coherente)`);
      else bad(`${name} USER_DB.dept=${userDepts.join('/')} no coincide con ${allowedForPerson.join('/')}`);
    } else if (dept === "PRESUPUESTOS" && N === "ANTONIA PINEDA LOPEZ") {
      bad(`${name} no tiene entrada en USER_DB (login)`);
    }
  });
  console.log("");
});

// 2) El directorio no debe contener nadie fuera de la imagen (salvo extras permitidos)
console.log("● Sin entradas inesperadas en el directorio");
const expectedPairs = new Set();
Object.keys(EXPECTED).forEach(d => EXPECTED[d].forEach(n => expectedPairs.add(n.toUpperCase().trim() + '||' + d)));
ALLOWED_EXTRA.forEach(e => expectedPairs.add(e.name.toUpperCase().trim() + '||' + e.dept.toUpperCase().trim()));
INITIAL_DIRECTORY.forEach(e => {
  const key = String(e.name).toUpperCase().trim() + '||' + String(e.dept).toUpperCase().trim();
  if (!expectedPairs.has(key)) bad(`Entrada inesperada en directorio: ${e.name} / ${e.dept}`);
});
if (fail === 0 || !fails.some(f=>f.includes('inesperada'))) ok("No hay entradas inesperadas");
console.log("");

// 3) Los usuarios dados de baja ya no existen en USER_DB
console.log("● Bajas eliminadas de USER_DB");
SHOULD_BE_DELETED.forEach(k => {
  if (USER_DB[k]) bad(`${k} sigue existiendo en USER_DB (debió eliminarse)`);
  else ok(`${k} eliminado correctamente`);
});
console.log("");

// 4) La nueva alta existe con login y departamento correctos
console.log("● Alta nueva");
if (USER_DB["ANTONIA_PINEDA"] && (USER_DB["ANTONIA_PINEDA"].dept||'').toUpperCase() === "PRESUPUESTOS")
  ok("ANTONIA_PINEDA creada en PRESUPUESTOS (login: ANTONIA_PINEDA)");
else bad("ANTONIA_PINEDA no creada correctamente");
console.log("");

console.log("==================================================");
console.log(` RESULTADO: ${pass} OK, ${fail} FALLOS`);
console.log("==================================================");
if (fail > 0) {
  console.log("\nFALLOS:");
  fails.forEach(f => console.log(" - " + f));
  process.exit(1);
}
console.log("\n🎉 Todo el organigrama coincide con la imagen.");
