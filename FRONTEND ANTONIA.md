Documento de Especificaciones Técnicas (SDD)
Refactorización UI/UX: Optimización de Data Grid y Componente de Estatus
Versión: 1.0.0 Enfoque: Spec-Driven Development (Frontend)

ÍNDICE
Resumen Ejecutivo y Objetivos
Especificaciones de Hitboxes e Interacción de Celdas
Especificaciones del Componente "Timeline de Estatus"
Arquitectura de Fila Expandible (Master-Detail)
Layout General y Alineación
Guía de Accesibilidad (A11y) y Navegación
Arquitectura CSS recomendada
Fases de Implementación
1. RESUMEN EJECUTIVO Y OBJETIVOS
Problema Actual: El Data Grid principal sufre de "clics de francotirador" (hitboxes muy pequeños en áreas interactivas) y una sobrecarga de información vertical en la columna de Estatus, lo que genera filas excesivamente altas, espacios muertos, y una carga cognitiva alta para el usuario.

Objetivo de la Refactorización: Implementar patrones modernos de diseño de tablas interactivas para maximizar el área de clic (100% de la celda), reducir drásticamente la altura de las filas (colapsando información secundaria en Tooltips y Acordeones), y guiar visualmente al usuario con affordances (señales visuales) claros y transiciones fluidas.

2. ESPECIFICACIONES DE HITBOXES E INTERACCIÓN DE CELDAS
Aplica a las columnas: AREA, CLASI, VENDEDOR, F. VISITA, F. INICIO, F. ENTREGA.

2.1. Extensión del "Área de Clic" (Hitbox al 100%)
Comportamiento esperado: El usuario no debe apuntar al texto. La celda (<td>) entera actúa como el botón disparador de la acción (abrir calendario o select).
Especificación Técnica UI:
La celda contenedora <td> debe tener position: relative.
El elemento interactivo interno (<button>, <div> o <input>) debe tener position: absolute; top: 0; left: 0; width: 100%; height: 100%;.
El cursor del sistema debe cambiar obligatoriamente a pointer (manita) al entrar en las coordenadas de la celda.
2.2. Feedback Visual (Hover State)
Regla de Estado: El sistema debe responder instantáneamente al movimiento del ratón para confirmar que el área es interactiva.
Paleta de Interacción (Ejemplo):
Celdas base blanca (AREA, CLASI, VENDEDOR): Al hacer :hover, el background-color transiciona en 150ms a un tono gris ultraclaro (ej. #F3F4F6) o azul muy pálido (#EFF6FF).
Celdas base verde (F. VISITA, F. INICIO, F. ENTREGA): Al hacer :hover, el verde base transiciona en 150ms a un tono verde con un 10% más de luminosidad o saturación (ej. de #10B981 a #34D399), o se aplica un filtro brightness(1.1).
2.3. Affordance (Señales Visuales Claras)
Columnas de Fecha:
Añadir un ícono de calendario (SVG) de 16x16px alineado rígidamente al margen derecho (right: 8px).
Color del ícono: Blanco con 50% de opacidad (rgba(255,255,255,0.5)) para celdas verdes.
Columnas de Dropdown (AREA, CLASI, VENDEDOR):
Añadir un ícono de flecha hacia abajo (Chevron down) de 16x16px alineado al margen derecho.
El texto de la celda debe tener un padding-right suficiente (padding-right: 24px) para que textos largos no se sobrepongan al ícono.
Indicador de Edición: El texto de la opción seleccionada debe tener un border-bottom: 1px dashed #ccc o subrayado punteado sutil para indicar modificabilidad.
2.4. Transición a Estado de "Edición" (Active / Focus)
Expansión del Input: Al hacer clic, si se inyecta un <select> nativo o un <input type="date">, este elemento debe adoptar width: 100%; height: 100%; box-sizing: border-box. No se permiten inputs flotantes de tamaño menor a la celda.
Focus Ring: Al entrar en modo edición, la celda debe mostrar un anillo de enfoque exterior (outline: 2px solid #3B82F6; outline-offset: -2px;) para indicar claramente en qué celda se encuentra el foco del teclado/ratón.
3. ESPECIFICACIONES DEL COMPONENTE "TIMELINE DE ESTATUS"
Esta es la reestructuración arquitectónica principal para reducir la altura de la fila.

3.1. Reemplazo del Label "ASIGNADO"
Eliminación: Se elimina la barra verde que ocupa el ancho total de la celda de Estatus.
Nuevo Componente "Badge": Se crea una pastilla visual (Badge).
Dimensiones: Altura máxima de 24px, padding horizontal de 8px.
Tipografía: 10px a 11px, en mayúsculas (Uppercase), negrita (Bold o SemiBold).
Diseño: Bordes completamente redondeados (border-radius: 12px). Fondo verde sólido, texto blanco.
Posicionamiento: Esquina superior izquierda o centrado arriba del Stepper, ocupando solo el espacio de su propio texto (Inline-flex).
3.2. Stepper Lineal (Conexión de Círculos)
Estructura Base: Los círculos dejan de ser elementos flotantes aislados. Se agrupan en un contenedor flexbox o grid horizontal.
Línea Conectora:
Detrás de los círculos (usando z-index o pseudo-elementos ::before), se traza una línea continua de 2px de grosor de color gris claro (#E5E7EB).
La línea conecta el centro geométrico del primer círculo con el centro del último.
Micro-interacción (Opcional): La línea puede cambiar de color gris a verde hasta el punto del proceso actual.
3.3. Optimización de los Círculos de Estatus
Reducción de tamaño: Los círculos se establecen en un tamaño fijo estándar (ej. 32x32px).
Contenido Interno: Se elimina cualquier texto exterior. Dentro del círculo se colocan las iniciales del paso (L, CD, EP, CI, etc.).
Tipografía interna: 12px, font-weight: 600. Color contrastante según el estado del círculo (Ej. Letra blanca si el círculo es rojo o verde).
3.4. Implementación de Tooltips (Hover Informativo)
Trigger: Al pasar el ratón (Hover) sobre cualquier círculo por más de 200ms, se dispara el Tooltip.
Contenido del Tooltip: Todo el texto eliminado de la vista base se inyecta aquí.
Línea 1: Nombre completo del paso (Ej. Levantamiento).
Línea 2: Estado y Tiempo transcurrido (Ej. Pendiente - < 1h).
Línea 3: Fecha y Hora exactas (Ej. 18/03/26 10:02 am).
Estilo del Tooltip: Fondo oscuro (#1F2937), texto blanco, esquinas redondeadas (4px), pequeña flecha (caret) apuntando hacia el círculo.
Posicionamiento: Preferentemente centrado en la parte superior del círculo (top-center). Debe usar una librería (como Popper.js, Tippy.js o Floating UI) o CSS puro para asegurar que no se corte por los bordes de la pantalla.
4. ARQUITECTURA DE FILA EXPANDIBLE (MASTER-DETAIL)
Para usuarios que no necesitan ver todo el timeline todo el tiempo, se implementa un patrón "Accordion".

4.1. Estado Contraído (Vista Principal por Defecto)
Columna Estatus: En lugar de mostrar los 8 círculos, muestra un solo bloque (Badge/Pill) altamente legible indicando exclusivamente el paso actual que requiere atención.
Diseño del bloque actual:
Icono o Emoji de estado (🔴, 🟡, 🟢).
Texto descriptivo breve: "Pendiente: Eval. Técnica (EP)".
Pequeño indicador de tiempo: "Hace 2h".
Trigger de Expansión: Al inicio de la fila (junto al número de ID o Folio) o al final de la celda de Estatus, se coloca un botón de control de expansión: un ícono de flecha lateral [ > ] que al hacer clic rota hacia abajo [ v ].
4.2. Estado Expandido (Detail View)
Al hacer clic en el trigger, la fila inyecta dinámicamente una sub-fila completa justo debajo.
Contenido de sub-fila: Ocupa el 100% del ancho de la tabla (usando colspan). En el centro, despliega el Stepper Lineal completo descrito en la Sección 3.
Animación: La expansión debe estar acompañada de una transición fluida en CSS (height o max-height transicionando de 0 a auto, con un ease-in-out de 300ms).
5. LAYOUT GENERAL Y ALINEACIÓN
5.1. Distribución de "Espacios Muertos"
Alineación Vertical (Vertical-Align): Absolutamente todas las celdas de la tabla (<th> y <td>) deben aplicar la regla CSS vertical-align: middle;.
Nota: Si se usa Flexbox dentro de las celdas, aplicar align-items: center;.
Beneficio: Los textos como "CLIENTE" o "CONCEPTO" ya no flotarán en la parte superior de la celda, sino que se ubicarán en el centro geométrico, equilibrando el espacio en blanco de forma armónica.
5.2. Paginación y Alturas Mínimas
Fijar una altura mínima de fila (min-height: 48px; o 60px). Esto garantiza que, incluso si una fila tiene poco texto, mantenga un tamaño estándar que sea fácil de cliquear (ayuda a evitar clics de francotirador incluso en filas vacías).
6. GUÍA DE ACCESIBILIDAD (A11Y) Y NAVEGACIÓN
El rediseño debe poder usarse sin ratón (Power Users).

Keyboard Focus: Todas las celdas editables y el trigger de expansión deben ser focuseables mediante la tecla TAB (agregando tabindex="0" si no son inputs nativos).
Teclas de acción: Estando el foco sobre una celda, presionar Enter o Espacio debe abrir el select o calendario correspondiente.
ARIA Labels: Los círculos del stepper deben tener aria-label="Paso: Levantamiento, Estado: Pendiente", de modo que los lectores de pantalla puedan leer la información que está oculta dentro de los Tooltips.
7. ARQUITECTURA CSS RECOMENDADA (VISTA TÉCNICA)
Variables CSS recomendadas a nivel :root para mantener coherencia en el rediseño:

:root {
  /* Tiempos de Transición */
  --transition-fast: 150ms ease;
  --transition-accordion: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Colores de Interacción */
  --cell-hover-bg: #F9FAFB;
  --cell-focus-ring: #3B82F6;
  
  /* Stepper */
  --stepper-line-color: #E5E7EB;
  --stepper-circle-size: 32px;
  --badge-bg: #10B981;
}

/* Ejemplo base para el Hitbox de Celdas Editables */
.editable-cell {
  position: relative;
  vertical-align: middle;
  padding: 0; /* Remover padding de la celda, darlo al hitbox interior */
}

.editable-hitbox {
  position: absolute;
  inset: 0; /* top: 0, right: 0, bottom: 0, left: 0 */
  display: flex;
  align-items: center;
  justify-content: space-between; /* Texto izquierda, icono derecha */
  padding: 0 12px;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.editable-hitbox:hover {
  background-color: var(--cell-hover-bg);
}

.editable-hitbox:focus-visible {
  outline: 2px solid var(--cell-focus-ring);
  outline-offset: -2px;
}
8. FASES DE IMPLEMENTACIÓN (ROADMAP)
Para no romper el sistema actual en producción, se recomienda este plan de entregas:

FASE 1: Foundations (Layout y Hitboxes).
Implementar vertical-align: middle en toda la tabla.
Refactorizar las celdas de AREA, CLASI, VENDEDOR, y las tres Fechas para usar hitboxes de tamaño completo (position: absolute; inset: 0).
Agregar íconos de affordance (calendarios/flechas) y estados hover básicos.
FASE 2: Colapso del Estatus.
Reemplazar la barra verde gigante por el pequeño Badge "ASIGNADO".
Integrar la librería de Tooltips.
Reducir los círculos de estatus poniendo las iniciales dentro y moviendo todo el texto al Tooltip.
FASE 3: Stepper y Accordion (Avanzado).
Conectar los círculos rediseñados con la línea gris (Stepper Lineal).
Implementar la lógica Master-Detail (Botón de expandir/contraer fila).
Crear la vista condensada (mostrar solo el paso actual cuando la fila está cerrada).