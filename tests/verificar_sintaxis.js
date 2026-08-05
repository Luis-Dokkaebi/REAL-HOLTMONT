/**
 * ======================================================================
 * R5 · VERIFICACIÓN DE SINTAXIS — puerta real, no informe
 * ======================================================================
 * Parsea con acorn:
 *   1. CODIGO.js            (backend Google Apps Script)
 *   2. index.html           (cada bloque <script> del monolito Vue)
 *   3. workorder_form.html  (idem)
 *
 * POR QUÉ EXISTE:
 * `check_html2.js` — que AGENTS.md §6 recomendaba como verificación —
 * SIEMPRE sale con código 0. Se le inyectó JavaScript inválido a propósito
 * y siguió reportando éxito. Era un informe disfrazado de prueba: la peor
 * clase de red de seguridad, porque da tranquilidad sin dar protección.
 *
 * Este script sí devuelve 1. Ver RESTRICCIONES_EXTREMAS.md §2.
 *
 * Uso:  node tests/verificar_sintaxis.js
 * Sale: 0 si todo parsea, 1 si algo no
 * ======================================================================
 */

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const RAIZ = path.resolve(__dirname, '..');
const OPCIONES = { ecmaVersion: 2022, allowReturnOutsideFunction: true };

let fallos = 0;
let revisados = 0;

function ok(msg) {
    console.log(`  \x1b[32m[PASA]\x1b[0m ${msg}`);
}

function falla(msg, detalle) {
    console.log(`  \x1b[31m[FALLA]\x1b[0m ${msg}`);
    console.log(`         ${detalle}`);
    fallos += 1;
}

/** Parsea un archivo .js completo. */
function verificarJs(relativo) {
    const absoluto = path.join(RAIZ, relativo);
    if (!fs.existsSync(absoluto)) {
        falla(relativo, 'el archivo no existe');
        return;
    }
    revisados += 1;
    try {
        acorn.parse(fs.readFileSync(absoluto, 'utf8'), OPCIONES);
        ok(`${relativo} parsea`);
    } catch (e) {
        falla(relativo, `${e.message}`);
    }
}

/**
 * Parsea cada bloque <script> embebido de un HTML.
 *
 * Se saltan los que declaran un `src` (no tienen cuerpo) y los que no son
 * JavaScript (p. ej. `type="text/x-template"`, que es HTML de Vue y no debe
 * pasar por un parser de JS).
 */
function verificarHtml(relativo) {
    const absoluto = path.join(RAIZ, relativo);
    if (!fs.existsSync(absoluto)) {
        falla(relativo, 'el archivo no existe');
        return;
    }

    const html = fs.readFileSync(absoluto, 'utf8');
    const bloques = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];

    let n = 0;
    let malos = 0;

    for (const [, atributos, cuerpo] of bloques) {
        if (/\bsrc\s*=/i.test(atributos)) continue;

        const tipo = (atributos.match(/type\s*=\s*["']([^"']+)["']/i) || [])[1];
        const esJs =
            !tipo ||
            /javascript|module|text\/babel/i.test(tipo);
        if (!esJs) continue;
        if (!cuerpo.trim()) continue;

        n += 1;
        // El número de línea real ayuda a ubicar el error en un archivo de
        // 10,000 líneas; sin esto el reporte es inútil.
        const linea = html.slice(0, html.indexOf(cuerpo)).split('\n').length;
        try {
            acorn.parse(cuerpo, { ...OPCIONES, sourceType: /module/i.test(tipo || '') ? 'module' : 'script' });
        } catch (e) {
            malos += 1;
            falla(`${relativo} · bloque <script> #${n} (cerca de la línea ${linea})`, e.message);
        }
    }

    revisados += 1;
    if (malos === 0) ok(`${relativo}: ${n} bloques <script> parsean`);
}

console.log('\n\x1b[1mR5 · Verificación de sintaxis\x1b[0m\n');

verificarJs('CODIGO.js');
verificarHtml('index.html');
verificarHtml('workorder_form.html');

console.log('');
if (fallos === 0) {
    console.log(`\x1b[32mTODO PARSEA\x1b[0m — ${revisados} archivos revisados\n`);
    process.exit(0);
}
console.log(`\x1b[31mHAY ${fallos} PROBLEMA(S) DE SINTAXIS\x1b[0m — ${revisados} archivos revisados\n`);
process.exit(1);
