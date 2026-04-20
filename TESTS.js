/**
 * ======================================================================
 * SISTEMA DE PRUEBAS UNITARIAS (NATIVO)
 * ======================================================================
 * Este archivo contiene las pruebas para verificar la salud del sistema.
 *
 * INSTRUCCIONES:
 * 1. Selecciona la función 'ejecutarPruebas' en el menú de funciones.
 * 2. Haz clic en el botón "Ejecutar".
 * 3. Revisa la consola (Ver > Registros de ejecución) para ver los resultados.
 */

/**
 * Función auxiliar de aserción.
 * Imprime ✅ PASS si la condición es verdadera, ❌ FAIL si es falsa.
 * @param {boolean} condicion - La expresión a evaluar.
 * @param {string} mensaje - Descripción de lo que se está probando.
 */
function assert(condicion, mensaje) {
  if (condicion) {
    console.log('✅ PASS: ' + mensaje);
  } else {
    console.error('❌ FAIL: ' + mensaje);
  }
}

/**
 * ORQUESTADOR PRINCIPAL DE PRUEBAS
 * Ejecuta todas las funciones de prueba definidas abajo.
 */
function ejecutarPruebas() {
  console.log('🚀 INICIANDO SUITE DE PRUEBAS...');
  var errores = 0;

  // Lista de pruebas a ejecutar
  var pruebas = [
    test_SumaSimple,
    test_colIndexToLetter,
    test_getWeekNumber,
    test_apiLogin_Simulado
  ];

  pruebas.forEach(function(prueba) {
    try {
      prueba();
    } catch (e) {
      console.error('⚠️ ERROR CRÍTICO EJECUTANDO ' + prueba.name + ': ' + e.toString());
      errores++;
    }
  });

  console.log('--------------------------------------------------');
  if (errores > 0) {
    console.log('🏁 PRUEBAS FINALIZADAS CON ERRORES DE EJECUCIÓN.');
  } else {
    console.log('🏁 PRUEBAS FINALIZADAS.');
  }
}

// ==========================================
// DEFINICIÓN DE PRUEBAS
// ==========================================

function test_SumaSimple() {
  console.log('\n--- Probando: Ejemplo Básico (Suma) ---');
  var suma = 2 + 2;
  assert(suma === 4, '2 + 2 debe ser 4');
  assert(suma !== 5, '2 + 2 no debe ser 5');
}

function test_colIndexToLetter() {
  console.log('\n--- Probando: colIndexToLetter (CODIGO.js) ---');
  // Casos básicos
  assert(colIndexToLetter(1) === 'A', 'Índice 1 debe ser A');
  assert(colIndexToLetter(2) === 'B', 'Índice 2 debe ser B');
  assert(colIndexToLetter(26) === 'Z', 'Índice 26 debe ser Z');

  // Casos de doble letra
  assert(colIndexToLetter(27) === 'AA', 'Índice 27 debe ser AA');
  assert(colIndexToLetter(28) === 'AB', 'Índice 28 debe ser AB');
  assert(colIndexToLetter(52) === 'AZ', 'Índice 52 debe ser AZ');
}

function test_getWeekNumber() {
  console.log('\n--- Probando: getWeekNumber (CODIGO.js) ---');

  // Caso 1: 1 de Enero de 2025 (Miércoles) -> Semana 1
  // Nota: getWeekNumber usa lógica ISO 8601 o similar.
  var fecha1 = new Date('2025-01-01T12:00:00Z');
  var semana1 = getWeekNumber(fecha1);
  assert(semana1 === 1, '01/01/2025 debe estar en la Semana 1 (Obtenido: ' + semana1 + ')');

  // Caso 2: 8 de Enero de 2025 (Miércoles) -> Semana 2
  var fecha2 = new Date('2025-01-08T12:00:00Z');
  var semana2 = getWeekNumber(fecha2);
  assert(semana2 === 2, '08/01/2025 debe estar en la Semana 2 (Obtenido: ' + semana2 + ')');
}

function test_apiLogin_Simulado() {
  console.log('\n--- Probando: apiLogin (CODIGO.js) ---');

  // Prueba de Éxito (Usuario conocido en USER_DB)
  // "LUIS_CARLOS": { pass: "admin2025", role: "ADMIN", ... }
  var resExito = apiLogin("LUIS_CARLOS", "admin2025");
  assert(resExito.success === true, 'Login correcto debe retornar success: true');
  assert(resExito.role === 'ADMIN', 'El rol de LUIS_CARLOS debe ser ADMIN');

  // Prueba de Fallo (Contraseña incorrecta)
  var resFallo = apiLogin("LUIS_CARLOS", "password_incorrecto");
  assert(resFallo.success === false, 'Contraseña incorrecta debe retornar success: false');

  // Prueba de Fallo (Usuario inexistente)
  var resInexistente = apiLogin("USUARIO_FANTASMA", "12345");
  assert(resInexistente.success === false, 'Usuario inexistente debe retornar success: false');
}
