## Quality Control Checks

Please ensure you have answered the following questions before submitting this PR:

1. ¿Tiene un feedback loop que verifique el código generado?
   - [ ] Responder aquí...

2. ¿Cómo se hace el rollback si falla?
   - [ ] Responder aquí...

3. ¿Tiene observabilidad en producción?
   - [ ] Responder aquí...

4. ¿Escala si el equipo crece?
   - [ ] Responder aquí...

5. ¿Tu equipo lo mantiene sin ti?
   - [ ] Responder aquí...

> Una respuesta vacía o genérica invalida el PR. Ver ejemplos de respuestas aceptables y no
> aceptables en [`RESTRICCIONES_EXTREMAS.md`](../RESTRICCIONES_EXTREMAS.md) §R6.1.

## Restricciones extremas

Ver [`RESTRICCIONES_EXTREMAS.md`](../RESTRICCIONES_EXTREMAS.md).

- [ ] **R1** · Suite de pruebas en verde
- [ ] **R2** · Escenario Gherkin para toda regla de negocio nueva o modificada
- [ ] **R3** · Cobertura del diff ≥ 90%; el global no bajó
- [ ] **R4** · Sin mutantes sobrevivientes nuevos en el núcleo
- [ ] **R5** · `eslint` y `node check_html2.js` limpios; la complejidad no subió
- [ ] **R6** · PR con un solo propósito, ≤ 400 líneas útiles
- [ ] **R7** · Sin secretos; ninguna prueba toca la hoja de producción
- [ ] **R8** · Suite corrida 3 veces seguidas sin intermitencias
- [ ] **R9** · Contrato `index.html` ↔ `CODIGO.js` verificado
- [ ] **R10** · Rollback declarado y viable

## Directiva Cero

- [ ] **Este PR no modifica ningún umbral ni configuración de CI, ni añade
      `skip` / `.only()` / `eslint-disable` / `--no-verify` para que algo pase.**

<!-- Si tuviste que tocar una puerta, NO lo incluyas aquí: abre un PR aparte,
     sin código, explicando por qué la puerta está mal calibrada. -->

## Evidencia

<!-- Pega la salida real de los comandos de verificación. -->
