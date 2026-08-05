# RESTRICCIONES EXTREMAS

### Contrato de confianza para el código que escriben los agentes

> «Soy bastante mayor que tú. Empecé a programar a finales de los 60. Mi estrategia actual es
> **no leer el código que escriben mis agentes**. Es la única forma de aprovechar su productividad.
> En cambio, los someto a **restricciones extremas**: pruebas unitarias, pruebas Gherkin,
> procedimientos de control de calidad, métricas de calidad, pruebas de mutación, cobertura de
> pruebas y muchas otras. Al final, tengo mucha confianza en el código que producen porque han
> tenido que superar todas mis restricciones y pruebas.»
>
> — Robert C. Martin (*Uncle Bob*), [@unclebobmartin](https://x.com/unclebobmartin)

---

## 0. ⚠️ REGLA OBLIGATORIA PARA TODO AGENTE

> **Esta sección es vinculante para Claude, Codex, Cursor, Jules, Copilot, Gemini, cualquier otro
> agente de IA y cualquier desarrollador humano que trabaje en este repositorio.**
> No es una recomendación y no depende de que alguien te lo recuerde en el prompt.

### Antes de reportar cualquier trabajo como terminado, DEBES ejecutar:

```bash
node tests/gas/run_tests.js    # suite del backend GAS  (ver §4: hay que instalarla primero)
node check_html2.js            # sintaxis del frontend monolítico
node test_departments.js       # organigrama, si tocaste USER_DB o INITIAL_DIRECTORY
```

Y **pegar la salida real en tu respuesta y en el PR**.

### Las cinco obligaciones no negociables

1. **Ejecutar las pruebas.** Siempre. En cada tarea que toque código, por pequeña que parezca.
   "Es un cambio de una línea" no es una excepción: los cambios de una línea son los que rompen
   producción, precisamente porque nadie los prueba.

2. **Escribir la prueba que falta.** Comportamiento nuevo → prueba unitaria nueva. Bug corregido →
   prueba que fallaba antes del arreglo y pasa después. Regla de negocio → escenario Gherkin.
   Entregar código sin su prueba es entregar código en el que nadie puede confiar, incluido tú.

3. **No tocar las puertas.** Prohibido bajar un umbral, añadir `skip`, `.only()`, `noqa`,
   `--no-verify`, `continue-on-error` o borrar una prueba para que algo pase. Ver
   [Directiva Cero](#2-directiva-cero--la-regla-que-sostiene-todo-lo-demás).

4. **Reportar con honestidad.** Si una prueba falla y no la arreglaste, **dilo, con la salida
   literal del comando**. Si no pudiste correr la suite, **dilo y explica por qué**. Nunca afirmes
   "todas las pruebas pasan" sin haberlas corrido. Un reporte falso destruye más confianza que un
   bug: el bug se arregla, la desconfianza no.

5. **Responder las cinco preguntas de calidad** ([R6.1](#61--las-cinco-preguntas-obligatorias)) en
   todo PR, en español y con respuestas concretas. Ya están en
   `.github/PULL_REQUEST_TEMPLATE.md`.

### Por qué esto es obligatorio y no opcional

El dueño de este repositorio **no va a leer línea por línea el código que generas**. Esa es una
decisión deliberada, y es la única forma de aprovechar tu productividad.

Eso significa que **tú eres la última persona que ve ese código antes de que se ejecute contra la
hoja de cálculo real de la empresa.** Aquí no hay entorno de staging: `CODIGO.js` corre contra los
datos de producción de Holtmont. Un error no se descubre en QA, se descubre cuando a alguien se le
borró su tarea.

Si no corres las pruebas, no estás ahorrando tiempo. Estás gastando la confianza de alguien más.

---

## 1. La premisa

La productividad de un agente se pierde si un humano tiene que releer cada línea que produce. Si
vas a revisar todo a mano, no ganaste nada: cambiaste "escribir código" por "auditar código", que
es más lento y más aburrido.

La salida no es confiar a ciegas. Es **mover la confianza de sitio**: no confías en el código
porque lo leíste, confías en él porque **sobrevivió a un campo minado que tú diseñaste**.

| Modelo tradicional | Modelo de restricciones extremas |
| --- | --- |
| El humano lee el código y decide si sirve | Las puertas ejecutan el código y deciden si sirve |
| "Se ve bien" | "Pasó 87 pruebas y 0 regresiones" |
| La revisión escala con el tamaño del diff | La revisión escala con el número de puertas (constante) |
| Confianza subjetiva, no reproducible | Confianza medida, con número y fecha |

Con un corolario incómodo que hay que decir en voz alta:

> **Tu confianza vale exactamente lo que valen tus puertas.**
> Si las puertas son débiles, la confianza es falsa — y es peor que no tener ninguna, porque ahora
> no lees el código *y* además crees que está bien.

Este repositorio tiene hoy una particularidad que hace todo esto más urgente, no menos:
**`CODIGO.js` (6,414 líneas) e `index.html` (10,215 líneas) son monolitos que corren directamente
contra producción, sin suite automatizada** (§4). Cada cambio no probado es una apuesta.

---

## 2. Directiva Cero — la regla que sostiene todo lo demás

Cuando nadie lee el código, el mayor riesgo **no** es que el agente escriba un bug.
Es que el agente, al toparse con una puerta cerrada, **abra la puerta en vez de arreglar el código**.

Un bug lo atrapa la siguiente prueba. Una puerta debilitada no la atrapa nadie, nunca.

### 🚫 Movimientos prohibidos

1. **Bajar un umbral.** Ninguno baja. Nunca.
2. **Silenciar una prueba.** Nada de `.skip()`, `.only()`, comentar o borrar bloques de pruebas.
3. **Silenciar el análisis.** Nada de `eslint-disable` nuevo ni añadir rutas a las exclusiones.
4. **Saltarse la puerta.** Nada de `git commit --no-verify`, `continue-on-error: true`, ni
   `|| true` colgado de un comando de verificación.
5. **Debilitar una aserción.** Cambiar una igualdad exacta por "no es nulo" es falsificar evidencia.
6. **Simular lo que se está probando.** Los mocks van en las **fronteras** (`SpreadsheetApp`,
   `CacheService`, `UrlFetchApp`, `PropertiesService`), nunca en la lógica bajo prueba.
7. **Reescribir la prueba para que acepte el bug.** Si el código y la prueba discrepan, el
   sospechoso por defecto es el código.

### ✅ Qué hacer cuando una puerta se cierra

Solo hay dos salidas legítimas:

- **Arreglar el código** hasta que la puerta abra por mérito propio; o
- **Detenerse y reportar**: qué puerta falló, la salida literal del comando, qué intentaste y por
  qué crees que la puerta está mal calibrada.

Proponer cambiar un umbral es válido — **como propuesta explícita al humano, en un PR aparte, sin
código**. Nunca como parte del cambio que necesita pasar esa puerta.

> **Regla mnemotécnica:** el agente juega el juego. El agente **no** escribe las reglas del juego.

---

## 3. Las restricciones

---

### R1 · Pruebas unitarias

**Qué:** cada regla de negocio de `CODIGO.js` tiene una prueba automatizada que la ejerce contra el
código real, con los servicios de GAS simulados.

**Por qué:** es el piso. Sin esto ninguna otra restricción significa nada.

**Reglas:**

- Todo comportamiento nuevo llega **con** su prueba, en el mismo commit.
- Todo bug corregido llega con una prueba que **falla antes del arreglo y pasa después**.
- Las pruebas corren contra el `CODIGO.js` real cargado con mocks (`tests/gas/gas_mocks.js`),
  **no** contra una copia del código pegada en la prueba. Una prueba contra una copia solo verifica
  la copia.
- Una prueba, una razón para fallar. Nombres que describen el comportamiento en español.
- La suite devuelve **código de salida 0 o 1**. Un script que imprime bonito pero siempre sale 0
  no es una prueba: es un `console.log` con ambiciones.

**Comando:**
```bash
node tests/gas/run_tests.js
```

**Bloquea si:** falla una sola prueba. No hay "fallos conocidos aceptables".

---

### R2 · Pruebas Gherkin (BDD / aceptación)

**Qué:** las reglas de negocio críticas se escriben en `Dado / Cuando / Entonces` y se ejecutan.

**Por qué:** una prueba unitaria demuestra que *el código hace lo que el código hace*. Un escenario
Gherkin demuestra que *el sistema hace lo que el negocio pidió*. Es la única capa que Luis o
cualquier persona del negocio puede leer y aprobar — y por lo tanto la única defensa real contra un
agente que implementa perfectamente la cosa equivocada.

**Reglas:**

- Los `.feature` los aprueba el dueño del negocio y son la **fuente de verdad**.
- Escritos en español, en lenguaje del dominio: FOLIO, ESTATUS, AVANCE, INVOLUCRADOS, papa
  caliente. **Cero vocabulario técnico**.
- Toda regla idiosincrática de `AGENTS.md` **debe** tener escenario.

**Cobertura obligatoria de escenarios:**

| Regla de negocio | Origen |
| --- | --- |
| La Ley de Antonia — ruteo y sufijo `(VENTAS)` | `AGENTS.md` §3 |
| Reverse Sync — tareas con prefijo `AV-` | `AGENTS.md` §3 |
| Gatekeeper — anti-duplicación por `_tempId` | `AGENTS.md` §2 |
| AVANCE: el `1` crudo de GAS es 100% | `AGENTS.md` §4 |
| Resolución de conflictos por `CONCEPTO` + `FECHA` | `AGENTS.md` §2 |
| Fechas ISO 8601 íntegras hacia Make.com | `AGENTS.md` §5 |
| Fallbacks de Data Validation (`PENDIENTE`, `NO`) | `AGENTS.md` §2 |

Ver el [Anexo A](#anexo-a--escenarios-gherkin-de-referencia).

**Comando:**
```bash
npx cucumber-js features/
```

**Bloquea si:** falla un escenario, **o** existe un `.feature` sin `steps` implementados. Un
escenario sin implementación es documentación disfrazada de garantía.

---

### R3 · Cobertura de pruebas

**Qué:** qué porcentaje de `CODIGO.js` ejecuta la suite.

**Por qué:** el código no cubierto es código que **nadie ha ejecutado nunca a propósito**. Cuando
no lees el código del agente, la cobertura es tu único mapa de qué quedó inexplorado.

**Reglas — con advertencia:**

- La cobertura es una métrica **negativa**: 20% prueba que hay un problema; 95% **no** prueba que
  esté bien. Por eso va amarrada a R4 (mutación), que sí mide si las pruebas *verifican* algo.
- **Trinquete (§4): el número global nunca baja.**
- **Regla del diff:** el código nuevo o modificado exige **≥ 90%**. Deuda vieja se tolera; deuda
  nueva no se crea.

**Comando:**
```bash
npx c8 --reporter=text --check-coverage --lines 20 node tests/gas/run_tests.js
```

---

### R4 · Pruebas de mutación

**Qué:** la herramienta corrompe el código a propósito (`>` por `>=`, `true` por `false`, borrar
una línea) y vuelve a correr la suite. Si las pruebas **siguen pasando** con el código roto, esas
pruebas no sirven.

**Por qué:** **es la restricción que hace honesto todo lo demás.** Un agente puede generar 500
pruebas que suben la cobertura sin verificar nada — es justo lo que produce un modelo optimizando
por "cobertura alta". La mutación detecta ese fraude en segundos.

Si solo puedes adoptar **una** restricción además de R1, que sea esta.

**Reglas:**

- No sobre todo `CODIGO.js` (6,414 líneas): sobre el **núcleo crítico** — `internalBatchUpdateTasks`,
  `apiSaveTrackerBatch`, `apiSavePPCData` y la lógica de reverse sync.
- Un mutante sobreviviente es un hallazgo, no ruido: se mata escribiendo la prueba que falta.
- En el PR solo sobre lo tocado; completo cada noche.

**Comando:**
```bash
npx stryker run
```

**Umbral:** ≥ **80%** de mutantes muertos en el núcleo. **Bloquea si:** baja respecto de la corrida anterior.

---

### R5 · Métricas de calidad

**Qué:** propiedades estructurales medibles, independientes de si funciona.

**Por qué:** el código puede pasar todas las pruebas y ser inmantenible. Las pruebas miden el
comportamiento **de hoy**; estas métricas protegen tu capacidad de cambiarlo **mañana**.

| Métrica | Herramienta | Umbral |
| --- | --- | --- |
| Errores estáticos | `eslint` | 0 nuevos |
| Sintaxis del monolito | `node check_html2.js` | debe pasar siempre |
| Complejidad ciclomática | `eslint complexity` | ≤ 10 en código nuevo; nunca subir la existente |
| Duplicación | `jscpd` | ≤ 3% |
| Secretos filtrados | `gitleaks` | **0, sin excepción** |
| Tamaño de función | revisión | ≤ 50 líneas en código nuevo |
| Tamaño del diff del PR | — | ≤ 400 líneas útiles |

**Regla clave:** los umbrales aplican al **código que tocas**. No se exige refactorizar 6,414
líneas para entregar un cambio de tres. Pero la complejidad de una función existente **no puede
subir**: si la tocas, sale igual o mejor.

**Comando:**
```bash
npx eslint CODIGO.js *.js
node check_html2.js
npx jscpd CODIGO.js
gitleaks detect --no-banner
```

---

### R6 · Procedimientos de control de calidad

#### 6.1 · Las cinco preguntas obligatorias

Ya vigentes en `.github/PULL_REQUEST_TEMPLATE.md` y en `AGENTS.md` §8. Todo PR las responde,
**en español**, con respuestas concretas — no "sí":

1. **¿Tiene un feedback loop que verifique el código generado?**
   *Malo:* "Sí, hay pruebas." *Bueno:* "`tests/gas/run_tests.js` bloque 2 falla si se reintroduce
   el sufijo `(VENTAS)` en el ruteo; corre en CI en cada push."
2. **¿Cómo se hace el rollback si falla?**
   *Malo:* "Revertir el commit." *Bueno:* "`git revert abc1234` y volver a desplegar con `clasp
   push`; no se alteró ninguna columna de la hoja, así que no hay migración que deshacer."
3. **¿Tiene observabilidad en producción?**
   *Malo:* "Hay logs." *Bueno:* "`registrarLog(user, 'SAVE_BATCH', ...)` deja traza por usuario en
   la hoja AUDITORIA con fecha ISO."
4. **¿Escala si el equipo crece?**
5. **¿Tu equipo lo mantiene sin ti?**

Una respuesta vacía o genérica **invalida el PR**.

#### 6.2 · Definición de Terminado (DoD)

- [ ] R1–R5 en verde, localmente y en CI
- [ ] Comportamiento nuevo con prueba unitaria propia
- [ ] Bug corregido con prueba que fallaba antes del arreglo
- [ ] Regla de negocio nueva o modificada con escenario Gherkin
- [ ] Cobertura del diff ≥ 90%; el global no bajó
- [ ] Las 5 preguntas respondidas con especificidad
- [ ] `AGENTS.md` actualizado si cambió una regla de negocio
- [ ] Sin secretos ni credenciales en el diff
- [ ] Ninguna puerta modificada (Directiva Cero)

#### 6.3 · Higiene de PR

- **Un PR, un propósito.** Refactor y feature no viajan juntos.
- **≤ 400 líneas útiles.** Si no cabe, se parte.
- Título y descripción **en español** (`AGENTS.md` §8).

---

### R7 · Seguridad y protección de datos de producción

**Por qué:** aquí no hay staging. `CODIGO.js` corre contra la hoja real de Holtmont. Un agente sin
supervisión ejecutando código contra producción es la única falla de este documento que **no se
puede revertir con `git revert`**.

**Reglas — no negociables:**

- **Ninguna prueba escribe en la hoja real.** Todo corre contra `tests/gas/gas_mocks.js`.
  Nunca se prueba con un `SpreadsheetApp` real.
- Cero credenciales en el repositorio: todo por Propiedades del Script de GAS.
  ⚠️ `CREDENCIALES.md` existe en la raíz de este repositorio — **revisar que no contenga secretos
  vivos y rotar los que haya**. Un secreto en el historial de git se asume comprometido.
- `gitleaks` en cada PR. Un secreto detectado bloquea el merge **y obliga a rotar la credencial**:
  borrar el commit no basta, ya está en el historial.

**Comando:**
```bash
gitleaks detect --no-banner
npm audit --audit-level=high
```

---

### R8 · Determinismo (política anti-flaky)

**Por qué:** una prueba intermitente es **peor que ninguna prueba**. Entrena al equipo a re-correr
CI hasta que pase por casualidad, y el día que atrapa un bug real, nadie le cree.

**Reglas:**

- Prohibido depender de reloj real, red, orden de ejecución o aleatoriedad sin semilla. El tiempo
  se inyecta a través de los mocks.
- Una prueba intermitente se **arregla o se borra en 48 horas**. No existe `@flaky` ni reintentos
  automáticos.

**Comando:**
```bash
for i in 1 2 3; do node tests/gas/run_tests.js || echo "FLAKY en corrida $i"; done
```

---

### R9 · Contratos entre capas

**Por qué:** aquí es donde el código generado falla de la forma más cara. `index.html` y
`CODIGO.js` pasan sus verificaciones por separado y el sistema está roto igual porque uno manda
`folio` y el otro espera `FOLIO`.

**Reglas:**

- Toda función invocada por `google.script.run` desde `index.html` **debe** existir en el scope
  global de `CODIGO.js` — verificado automáticamente, no a ojo.
- Las comparaciones de claves usan `.toUpperCase().trim()` (`AGENTS.md` §4).
- Los payloads a Make.com preservan ISO 8601 con milisegundos y `Z` (`AGENTS.md` §5), con prueba.

**Comando:**
```bash
node tests/gas/run_tests.js    # el bloque 7 es el contrato frontend ↔ backend
node check_html2.js
```

---

### R10 · Reversibilidad y observabilidad

**Por qué:** las nueve restricciones anteriores reducen la probabilidad de un fallo. Ninguna la
lleva a cero. Esta determina si el costo son diez minutos o un día perdido.

**Reglas:**

- Todo PR declara su plan de rollback (pregunta 2 de R6.1), y debe ser verdad.
- Cambios en la estructura de la hoja: siempre compatibles hacia atrás. Nunca borrar una columna
  en el mismo despliegue que introduce su reemplazo.
- Operaciones sensibles dejan traza con `registrarLog(user, action_type, description)`.
- Los webhooks y triggers fallan **ruidosamente**. Un trigger que falla en silencio es peor que no
  tenerlo.

---

## 4. El trinquete (*ratchet*) — línea base medida

<sub>Medición: 5 de agosto de 2026, rama `claude/uncle-bob-restrictions-doc-0zc7ld`, commit `f79a682`.</sub>

| Métrica | Valor medido hoy | Piso vigente | Meta |
| --- | --- | --- | --- |
| Suite automatizada | **no existe** | — | 87 pruebas (portar de `HOLTMONT-PYTHON`) |
| Scripts `test_*.js` sueltos en la raíz | **37** | — | 0 (consolidar o borrar) |
| Otros scripts de diagnóstico en la raíz | **17** | — | 0 |
| Archivos `.js` en la raíz | **71** | — | < 10 |
| Líneas de `CODIGO.js` | **6,414** | — | modularizar |
| Líneas de `index.html` | **10,215** | — | — |
| Cobertura | **0% medida** | — | 20% → 60% |
| Escenarios Gherkin | **0** | — | 7 reglas críticas (R2) |
| Puntaje de mutación | **no medido** | — | 80% |

### ⚠️ El hallazgo más importante de este repositorio

**Hoy no existe una suite automatizada.** Los 37 archivos `test_*.js` de la raíz **no son pruebas**:
son scripts de diagnóstico manual escritos para depurar un problema puntual y nunca borrados.
Nadie los corre en conjunto, ninguno verifica su código de salida, y muchos prueban versiones del
código que ya cambiaron.

Esto importa decirlo claro porque **su presencia se confunde con cobertura**. Un repositorio con 37
archivos que empiezan con `test_` aparenta estar probado. No lo está. Es la peor combinación
posible: cero protección real, más la falsa tranquilidad de que hay algo.

### La ruta más corta: portar la suite que ya existe

`HOLTMONT-PYTHON` tiene `tests/gas/` — **87 pruebas que ya corren contra este mismo `CODIGO.js`**,
con mocks de GAS, salida en tabla y código de salida 0/1. Prueba el semáforo, el ruteo VENTAS, el
gatekeeper, el reverse sync, las métricas y el contrato frontend ↔ backend.

Pasos, en orden:

1. Copiar `tests/gas/` completo desde `HOLTMONT-PYTHON`.
2. Añadir a `package.json`:
   ```json
   { "scripts": { "test": "node tests/gas/run_tests.js" } }
   ```
3. Correrlo y **anotar aquí el resultado real**. Si fallan pruebas, es porque los dos `CODIGO.js`
   divergieron: cada fallo es un hallazgo legítimo, no un problema de la suite.
4. Rescatar de los 37 `test_*.js` los casos que aún valgan, convertirlos en pruebas de la suite y
   **borrar el resto**.
5. Conectar la puerta 3 (§7).

### Regla del trinquete

> **Los umbrales solo se mueven en una dirección: hacia arriba.**

- Un PR que sube una métrica sube el piso, en el mismo PR.
- Un PR que baja cualquier métrica **no se mergea**. No se "arregla después": después no llega.
- Nadie baja un piso para desbloquear un cambio (Directiva Cero).

---

## 5. Las cuatro puertas

```
   ┌──────────────────────────────────────────────────────────────────┐
   │  PUERTA 1 · Antes de escribir código        (segundos)          │
   │  Prueba en rojo primero. Sin prueba que falle, no hay código.   │
   └──────────────────────────────────────────────────────────────────┘
                                 ↓
   ┌──────────────────────────────────────────────────────────────────┐
   │  PUERTA 2 · Local, antes del commit         (< 1 minuto)        │
   │  node tests/gas/run_tests.js + node check_html2.js              │
   │  El agente NO hace commit sin esto en verde.                    │
   └──────────────────────────────────────────────────────────────────┘
                                 ↓
   ┌──────────────────────────────────────────────────────────────────┐
   │  PUERTA 3 · CI en el Pull Request           (minutos)           │
   │  R1–R5, R7–R9 completas. Bloqueante para el merge.              │
   │  ⚠️  Esta es la única puerta que el agente no puede evitar.      │
   └──────────────────────────────────────────────────────────────────┘
                                 ↓
   ┌──────────────────────────────────────────────────────────────────┐
   │  PUERTA 4 · Revisión humana                 (2 minutos)         │
   │  NO se lee el código. Se verifica el contrato:                  │
   │    · ¿Están las 5 preguntas respondidas con especificidad?      │
   │    · ¿El diff toca alguna puerta, umbral o configuración de CI? │
   │    · ¿El PR hace UNA cosa?                                      │
   │    · ¿Los escenarios Gherkin describen lo que pedí?             │
   └──────────────────────────────────────────────────────────────────┘
```

**La puerta 4 es la que hace realidad la idea de Uncle Bob.** El humano no audita implementación:
audita que el contrato se respetó. Dos minutos, y no escala con el tamaño del diff.

Su punto más importante es **revisar el diff en busca de manipulación de las puertas**. Es la única
lectura de código que sigue siendo obligatoria, porque ninguna herramienta puede hacerla por ti. Se
automatiza parcialmente con `CODEOWNERS` sobre `.github/workflows/**`, `package.json` y este
documento.

---

## 6. Comandos exactos

```bash
# R1 · unitarias  (requiere portar tests/gas/ — ver §4)
node tests/gas/run_tests.js

# R2 · Gherkin
npx cucumber-js features/

# R3 · cobertura
npx c8 --reporter=text --check-coverage --lines 20 node tests/gas/run_tests.js

# R4 · mutación
npx stryker run

# R5 · métricas
npx eslint CODIGO.js *.js
node check_html2.js
npx jscpd CODIGO.js

# R7 · seguridad
gitleaks detect --no-banner
npm audit --audit-level=high

# R8 · determinismo (3 corridas, 3 verdes)
for i in 1 2 3; do node tests/gas/run_tests.js || echo "FLAKY en corrida $i"; done

# R9 · contratos
node tests/gas/run_tests.js   # bloque 7
node check_html2.js

# Organigrama, si tocaste USER_DB o INITIAL_DIRECTORY
node test_departments.js
```

---

## 7. CI — lista para pegar

Guardar como `.github/workflows/restricciones-extremas.yml`. Es **la puerta 3**.

```yaml
name: Restricciones Extremas

on:
  pull_request:
  push:
    branches: [main]

jobs:
  restricciones:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0          # gitleaks necesita el historial completo

      - uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Instalar dependencias
        run: npm install

      # ---- R5 · métricas (lo más rápido primero: falla barato) ----
      - name: R5 · Sintaxis del frontend monolítico
        run: node check_html2.js

      - name: R5 · Lint
        run: npx eslint CODIGO.js *.js
        continue-on-error: true   # ⏳ temporal: quitar al sanear la línea base

      # ---- R7 · seguridad ----
      - name: R7 · Secretos
        uses: gitleaks/gitleaks-action@v2

      # ---- R1 + R9 · suite GAS y contratos ----
      - name: R1+R9 · Suite GAS
        run: node tests/gas/run_tests.js

      # ---- R2 · Gherkin ----
      - name: R2 · Escenarios de aceptación
        run: npx cucumber-js features/

      # ---- R9 · organigrama ----
      - name: R9 · Directorio y departamentos
        run: node test_departments.js
```

> ⚠️ **`continue-on-error: true` está prohibido** salvo el caso marcado de `eslint`, que es
> temporal mientras se sanea la línea base y **tiene que quitarse**. Una puerta que no bloquea no
> es una puerta: es un adorno que da falsa tranquilidad.

**Además, en la configuración del repositorio en GitHub:**

- Proteger `main`: prohibido el push directo.
- Marcar el job `restricciones` como **required status check**.
- `CODEOWNERS` sobre `.github/workflows/**`, `package.json` y `RESTRICCIONES_EXTREMAS.md`.

---

## 8. Plantilla de Pull Request

Ampliar `.github/PULL_REQUEST_TEMPLATE.md` (que ya tiene las 5 preguntas) con:

```markdown
## Restricciones extremas

- [ ] **R1** · `node tests/gas/run_tests.js` en verde
- [ ] **R2** · Escenario Gherkin para toda regla de negocio nueva o modificada
- [ ] **R3** · Cobertura del diff ≥ 90%; el global no bajó
- [ ] **R4** · Sin mutantes sobrevivientes nuevos en el núcleo
- [ ] **R5** · `eslint` y `check_html2.js` limpios; complejidad no subió
- [ ] **R6** · PR con un solo propósito, ≤ 400 líneas útiles
- [ ] **R7** · Sin secretos; ninguna prueba toca la hoja real
- [ ] **R8** · Suite corrida 3 veces seguidas sin intermitencias
- [ ] **R9** · Contrato `index.html` ↔ `CODIGO.js` verificado
- [ ] **R10** · Rollback declarado y viable

## Directiva Cero

- [ ] **Este PR no modifica ningún umbral ni configuración de CI, ni añade
      `skip` / `.only()` / `eslint-disable` / `--no-verify`.**

## Evidencia

<!-- Pega la salida real de node tests/gas/run_tests.js -->
```

---

## 9. Cómo portar esto a otro proyecto

1. **Copia este archivo** a la raíz del proyecto nuevo.
2. **Mide la línea base antes de fijar cualquier umbral.** Anota números reales en §4.
   *No inventes umbrales.* Uno aspiracional que falla desde el día uno enseña al equipo a ignorar
   CI — el daño exacto que este documento existe para evitar.
3. **Sustituye las herramientas por las de tu stack**, conservando la restricción:

   | Restricción | Node / TypeScript | Python | Go | Java |
   | --- | --- | --- | --- | --- |
   | R1 unitarias | vitest / jest | pytest | `go test` | JUnit |
   | R2 Gherkin | cucumber-js | pytest-bdd | godog | Cucumber-JVM |
   | R3 cobertura | c8 / istanbul | pytest-cov | `go test -cover` | JaCoCo |
   | R4 mutación | Stryker | mutmut | go-mutesting | PIT |
   | R5 lint | eslint + tsc | ruff + mypy | golangci-lint | SpotBugs |
   | R7 secretos | gitleaks | gitleaks | gitleaks | gitleaks |

4. **Reescribe R2** con las reglas de negocio *de ese* dominio. Es la única sección que no se puede
   copiar: el Gherkin sin dominio real es plantilla vacía.
5. **Conecta la puerta 3** (§7) y márcala como *required status check*. **Sin este paso el
   documento no hace nada** (§10).
6. **Adopta en este orden:** R1 → R3 → R5 → R7 → R2 → R4 → el resto.

---

## 10. Este documento no se hace cumplir solo

> **Un archivo `.md` no es una restricción. Es una intención.**

Un agente puede leer este documento y aun así no cumplirlo — por prisa, por una instrucción
contradictoria o por no haberlo cargado en su contexto. Lo que **sí** restringe a un agente es un
comando que devuelve código de salida distinto de cero y un merge que GitHub bloquea.

El valor de este archivo es ser **la especificación** de esas puertas. La restricción real vive en:

1. `.github/workflows/restricciones-extremas.yml` — la puerta que ejecuta (§7)
2. La rama protegida con *required status checks* — lo que impide el merge
3. `CODEOWNERS` sobre los archivos de las puertas — lo que impide que se abran solas

Mientras esos tres no existan, este documento describe un campo minado sin minas.

**En este repositorio hay un paso previo obligatorio:** primero portar `tests/gas/` (§4). Conectar
CI sin una suite que ejecutar produce un check verde que no verifica nada — que es exactamente el
tipo de falsa confianza que este documento existe para eliminar.

**El orden correcto:** portar la suite → conectar la puerta 3 con R1 → subir umbrales con el
trinquete. Una puerta modesta que bloquea de verdad vale infinitamente más que diez restricciones
perfectas que nadie ejecuta.

---

## Anexo A · Escenarios Gherkin de referencia

Escritos con las reglas reales de `AGENTS.md`. Plantilla para los `.feature` de R2.

```gherkin
# features/ley_de_antonia.feature
# language: es

Característica: Ruteo de tareas y la Ley de Antonia
  Para que la tabla maestra de ventas no se contamine con tareas del tracker general,
  el sistema debe enrutar según el origen de la tarea.

  Escenario: Un usuario cualquiera no puede enviar tareas a una hoja de ventas
    Dado que el usuario "RICARDO GARCIA" está en el tracker general
    Cuando envía una tarea a la hoja "JUAN PEREZ (VENTAS)"
    Entonces la tarea se guarda en la hoja "JUAN PEREZ"
    Y el sufijo "(VENTAS)" no aparece en la hoja destino

  Escenario: Las tareas de Antonia sí viven en la tabla de ventas
    Dado que la tarea tiene el folio "AV-00123"
    Cuando se actualiza su ESTATUS a "TERMINADO" desde otra hoja de personal
    Entonces el cambio se refleja también en la hoja "ANTONIA_VENTAS"
    Y la hoja maestra conserva el mismo FOLIO "AV-00123"

  Escenario: Una tarea del tracker general nunca genera reverse sync
    Dado que la tarea tiene el folio "TR-00456"
    Cuando se actualiza su ESTATUS a "TERMINADO"
    Entonces la hoja "ANTONIA_VENTAS" no se modifica
```

```gherkin
# features/anti_duplicacion.feature
# language: es

Característica: Prevención de tareas duplicadas
  Para que un doble clic o una red lenta no generen dos filas idénticas,
  el backend debe bloquear ejecuciones concurrentes de la misma tarea.

  Escenario: Doble envío del mismo formulario crea una sola fila
    Dado que el usuario crea una tarea nueva con el identificador temporal "tmp-abc-123"
    Cuando el formulario se envía dos veces seguidas antes de recibir respuesta
    Entonces existe exactamente una fila con esa tarea
    Y el frontend recibe el objeto guardado completo para poder fusionarlo

  Escenario: Si el FOLIO no se encuentra, se busca por CONCEPTO y FECHA
    Dado que existe una tarea con CONCEPTO "REVISION DE PLANOS" y FECHA "2026-08-05"
    Y que su FOLIO se perdió por un error de escritura
    Cuando llega una actualización para esa misma combinación
    Entonces se actualiza la fila existente
    Y no se genera un FOLIO nuevo
```

```gherkin
# features/avance.feature
# language: es

Característica: Interpretación del porcentaje de AVANCE
  Google Apps Script devuelve el valor numérico 1 para una celda con formato
  de porcentaje al 100%. Confundirlo con "1%" corrompe todos los indicadores.

  Esquema del escenario: Valores que significan tarea completada
    Dado que la celda AVANCE contiene <valor>
    Cuando el sistema evalúa si la tarea está completa
    Entonces el resultado es <completa>

    Ejemplos:
      | valor   | completa |
      | 1       | sí       |
      | "100"   | sí       |
      | "100%"  | sí       |
      | "1"     | no       |
      | "1.0"   | no       |
      | 0.5     | no       |
      | ""      | no       |
```

---

## Anexo B · Resumen de una página

Para pegar en el `AGENTS.md` de cualquier proyecto:

> **Las restricciones no se negocian.**
> Cuando una puerta se cierra, arregla el código o detente y reporta.
> Nunca bajes un umbral, silencies una prueba, añadas un `skip`, un `eslint-disable` ni un
> `--no-verify` para pasar. Modificar una puerta y el código en el mismo commit corrompe la única
> razón por la que nadie necesita leer tu trabajo.
>
> **Antes de cada commit:** la suite y el chequeo de sintaxis en verde.
> **En cada PR:** las 5 preguntas respondidas con especificidad, prueba para todo comportamiento
> nuevo, escenario Gherkin para toda regla de negocio, cobertura del diff ≥ 90%.
> **Siempre:** ninguna prueba toca la hoja de producción.

---

*Basado en la práctica descrita por Robert C. Martin (Uncle Bob). La cita es suya; los umbrales,
comandos y la línea base son de este repositorio y fueron medidos, no estimados.*
