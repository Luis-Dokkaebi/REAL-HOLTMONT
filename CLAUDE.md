# CLAUDE.md — Reglas de trabajo en este repositorio

Este archivo se carga automáticamente al iniciar una sesión. Es vinculante.

## ⚠️ Regla 0 — Restricciones extremas (OBLIGATORIA)

**Debes cumplir [`RESTRICCIONES_EXTREMAS.md`](RESTRICCIONES_EXTREMAS.md) en toda tarea que toque
código de este repositorio.** Léelo antes de tu primer cambio.

**Antes de reportar cualquier trabajo como terminado, ejecuta y pega la salida real:**

```bash
node tests/gas/run_tests.js    # suite del backend GAS
node check_html2.js            # sintaxis del frontend monolítico
node test_departments.js       # si tocaste USER_DB o INITIAL_DIRECTORY
```

### Las cinco obligaciones no negociables

1. **Ejecuta las pruebas siempre.** En toda tarea que toque código. "Es un cambio de una línea" no
   es excepción.
2. **Escribe la prueba que falta.** Comportamiento nuevo → prueba unitaria. Bug corregido → prueba
   que fallaba antes del arreglo. Regla de negocio → escenario Gherkin.
3. **No toques las puertas** (*Directiva Cero*). Prohibido bajar umbrales o añadir `skip`,
   `.only()`, `eslint-disable`, `--no-verify` o `continue-on-error` para que algo pase. Si una
   puerta se cierra: arregla el código, o detente y reporta.
4. **Reporta con honestidad.** Si una prueba falla, dilo con la salida literal del comando. Si no
   pudiste correr la suite, dilo y explica por qué. Nunca afirmes que las pruebas pasan sin
   haberlas corrido.
5. **Responde las 5 preguntas de calidad** en todo PR, en español y con respuestas concretas
   (`.github/PULL_REQUEST_TEMPLATE.md`).

**Por qué:** el dueño de este repositorio no lee línea por línea el código que generas, y aquí
**no hay staging**: `CODIGO.js` corre contra la hoja real de la empresa. Eres la última revisión
antes de producción.

## ⚠️ Estado actual de las pruebas

Este repositorio **todavía no tiene suite automatizada**. Los 37 archivos `test_*.js` de la raíz
son scripts de diagnóstico manual, no pruebas: nadie los corre en conjunto y ninguno verifica su
código de salida. **No los cuentes como cobertura.**

La tarea de mayor prioridad es portar `tests/gas/` desde `HOLTMONT-PYTHON` — 87 pruebas que ya
corren contra este mismo `CODIGO.js`. Ver `RESTRICCIONES_EXTREMAS.md` §4.

## Contexto del proyecto

Las reglas de negocio, el stack y las skills específicas están en [`AGENTS.md`](AGENTS.md).
Léelo antes de tocar `CODIGO.js` o `index.html`.

## Regla de seguridad crítica

**Ninguna prueba escribe en la hoja de cálculo real.** Todo corre contra mocks de GAS
(`SpreadsheetApp`, `CacheService`, `PropertiesService`, `UrlFetchApp`).

## Idioma

Los PR, commits y comentarios se redactan **en español** (`AGENTS.md` §8).
