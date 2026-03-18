import re

with open('index.html', 'r') as f:
    content = f.read()

# Add CSS variables
variables = """    /* VARIABLES Y ESTILOS GLOBALES */
    :root {
        --sidebar-w: 260px; --sidebar-mini: 65px; --primary: #1c1c1c; --accent: #3699ff; --bg-body: #f3f6f9;
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
    }"""
content = re.sub(r'    /\* VARIABLES Y ESTILOS GLOBALES \*/\n    :root \{ [^}]* \}', variables, content)

# Add CSS classes
css_classes = """
    /* HITBOXES Y ACCESIBILIDAD */
    .editable-cell {
      position: relative;
      vertical-align: middle;
      padding: 0 !important;
    }

    .editable-hitbox {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      cursor: pointer;
      transition: background-color var(--transition-fast), filter var(--transition-fast);
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }

    .editable-hitbox.base-white:hover {
      background-color: var(--cell-hover-bg);
    }

    .editable-hitbox.base-green:hover {
      filter: brightness(1.1);
    }

    .editable-hitbox:focus-within {
      outline: 2px solid var(--cell-focus-ring);
      outline-offset: -2px;
      z-index: 10;
    }

    .hitbox-icon {
        opacity: 0.5;
        font-size: 12px;
        pointer-events: none;
    }
    .base-green .hitbox-icon {
        color: white;
    }
    .base-white .hitbox-icon {
        color: #666;
    }

    .hitbox-input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
      box-sizing: border-box;
      z-index: 2;
    }

    .hitbox-text {
        pointer-events: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        z-index: 1;
        font-size: 11px;
        font-weight: bold;
    }

    /* TOOLTIP */
    .hp-circle-wrapper {
        position: relative;
        display: inline-block;
    }

    .hp-tooltip {
        visibility: hidden;
        background-color: #1F2937;
        color: #fff;
        text-align: center;
        border-radius: 4px;
        padding: 5px 10px;
        position: absolute;
        z-index: 100;
        bottom: 125%;
        left: 50%;
        transform: translateX(-50%);
        opacity: 0;
        transition: opacity 0.2s;
        font-size: 11px;
        white-space: nowrap;
        line-height: 1.3;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        pointer-events: none;
    }

    .hp-tooltip::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #1F2937 transparent transparent transparent;
    }

    .hp-circle-wrapper:hover .hp-tooltip {
        visibility: visible;
        opacity: 1;
        transition-delay: 200ms;
    }

    /* BADGE Y ACORDEON */
    .hp-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 24px;
        padding: 0 8px;
        font-size: 11px;
        text-transform: uppercase;
        font-weight: 600;
        border-radius: 12px;
        color: white;
        background-color: var(--badge-bg);
        white-space: nowrap;
    }

    .hp-badge.red { background-color: #dc3545; }
    .hp-badge.yellow { background-color: #ffc107; color: #000; }
    .hp-badge.green { background-color: #10B981; }

    .hp-stepper-line {
        position: absolute;
        top: 16px; /* Mitad de 32px */
        left: 16px;
        right: 16px;
        height: 2px;
        background-color: var(--stepper-line-color);
        z-index: 0;
    }

    .hp-step {
        position: relative;
        z-index: 1;
    }

    .hp-circle {
        position: relative;
        z-index: 2;
    }

    .hp-timeline-container {
        position: relative;
    }
"""

content = content.replace("</style>", css_classes + "\n</style>")

with open('index.html', 'w') as f:
    f.write(content)
