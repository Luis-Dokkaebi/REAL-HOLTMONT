"""
Parsing y extracción de datos de TrackerVersion4_7.xlsx (Holtmont Workspace).

Este módulo es puro (no toca la base de datos): dado un Workbook de openpyxl,
produce listas de dicts listas para insertar. `migrate.py` es quien las carga
a Postgres/Supabase. Se probó en modo dry-run contra el archivo real antes de
escribir el loader, para no adivinar formatos.
"""
from __future__ import annotations

import datetime as dt
import re
import unicodedata
from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# Helpers genéricos de limpieza
# ---------------------------------------------------------------------------

def _strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def normalize_header(value) -> str:
    """'Fecha estimada de fin' -> 'fecha estimada de fin'; 'Avance %' -> 'avance'."""
    if value is None:
        return ""
    s = str(value).replace("\n", " ")
    s = _strip_accents(s).lower()
    s = s.replace("%", "").replace(".", "")
    s = re.sub(r"[_\-]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def clean_text(value):
    if value is None:
        return None
    if isinstance(value, str):
        v = value.strip()
        return v if v else None
    return str(value).strip() or None


# Fechas basura que Google Sheets/Excel producen para celdas vacías con formato de fecha
_EPOCH_JUNK_YEARS = {1899, 1900}


def parse_date(value):
    if value is None or value == "":
        return None
    if isinstance(value, dt.datetime):
        d = value.date()
    elif isinstance(value, dt.date):
        d = value
    elif isinstance(value, str):
        s = value.strip()
        if not s or s in {"-", "--"}:
            return None
        d = None
        for fmt in ("%d/%m/%y", "%d/%m/%Y", "%Y-%m-%d", "%m/%d/%Y"):
            try:
                d = dt.datetime.strptime(s, fmt).date()
                break
            except ValueError:
                continue
        if d is None:
            return None
    else:
        return None
    if d.year in _EPOCH_JUNK_YEARS:
        return None
    return d


def parse_time_text(value):
    """Reloj/Hora se guardan como texto libre (formatos inconsistentes en origen)."""
    if value is None or value == "":
        return None
    if isinstance(value, dt.time):
        return value.strftime("%H:%M:%S")
    if isinstance(value, dt.datetime):
        return value.strftime("%H:%M:%S")
    return clean_text(value)


def parse_time(value):
    if value is None or value == "":
        return None
    if isinstance(value, dt.time):
        return value
    if isinstance(value, dt.datetime):
        return value.time()
    if isinstance(value, str):
        s = value.strip()
        for fmt in ("%H:%M:%S", "%H:%M"):
            try:
                return dt.datetime.strptime(s, fmt).time()
            except ValueError:
                continue
    return None


def parse_number(value):
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        s = value.strip().replace("%", "").replace(",", "")
        if not s or s in {"-", "--"}:
            return None
        try:
            return float(s)
        except ValueError:
            return None
    return None


def parse_avance(value):
    """Normaliza AVANCE a escala 0-100. Origen mezcla '0%', 100 (int), 1 (=100%)."""
    n = parse_number(value)
    if n is None:
        return 0.0
    if 0 <= n <= 1:
        return round(n * 100, 2)
    return round(n, 2)


_DURATION_EPOCH = dt.datetime(1899, 12, 31)


def parse_duration_days(value):
    """Columnas como DIAS vienen con formato de celda 'duración', que Sheets/Excel
    serializa como fecha desde el epoch (1899-12-31 = día 0)."""
    if value is None or value == "":
        return None
    if isinstance(value, dt.datetime):
        return (value - _DURATION_EPOCH).days
    if isinstance(value, dt.time):
        return round(value.hour / 24 + value.minute / 1440, 4)
    return parse_number(value)


def split_involucrados(raw):
    """Separa un campo que puede traer varios nombres juntos, separados por
    coma y/o salto de línea (ambos aparecen en el origen)."""
    if not raw:
        return []
    text = str(raw).replace("\n", ",")
    parts = [p.strip() for p in text.split(",")]
    return [p for p in parts if p]


# ---------------------------------------------------------------------------
# Detección de encabezados dinámicos (mismo espíritu que findHeaderRow en CODIGO.js)
# ---------------------------------------------------------------------------

def find_header_row(rows, max_scan=20, min_string_cells=3):
    for i, row in enumerate(rows[:max_scan]):
        nonempty = [c for c in row if c not in (None, "")]
        if len(nonempty) >= min_string_cells and all(isinstance(c, str) for c in nonempty):
            return i
    return None


def rows_as_dicts(all_rows, header_row_idx):
    """A partir de la fila de encabezado, produce dicts {header_normalizado: valor} por fila,
    descartando filas totalmente vacías."""
    header = all_rows[header_row_idx]
    norm_header = [normalize_header(h) for h in header]
    out = []
    for row in all_rows[header_row_idx + 1:]:
        if all(c in (None, "") for c in row):
            continue
        d = {}
        for key, val in zip(norm_header, row):
            if not key:
                continue
            d[key] = val
        out.append(d)
    return out


def sheet_rows(ws):
    return list(ws.iter_rows(values_only=True))


# ---------------------------------------------------------------------------
# 1. DB_DIRECTORY -> people
# ---------------------------------------------------------------------------

def extract_people(ws):
    rows = sheet_rows(ws)
    hidx = find_header_row(rows) or 0
    people = []
    for d in rows_as_dicts(rows, hidx):
        nombre = clean_text(d.get("nombre"))
        if not nombre:
            continue
        people.append({
            "nombre": nombre.upper(),
            "departamento": clean_text(d.get("departamento")),
            "tipo_hoja": clean_text(d.get("tipo hoja")),
        })
    return people


# ---------------------------------------------------------------------------
# 2. Trackers personales (una hoja por persona) -> tasks + task_involucrados
# ---------------------------------------------------------------------------

# En varias hojas plantilla (nunca usadas) quedaron restos de listas de
# validación de datos pegados justo en la columna "Concepto" (p. ej. ALEXIS
# TORRES, fila 3/5: 'Restricciones' / 'Prioridades' sueltos). No son tareas.
_JUNK_CONCEPTOS = {"concepto", "restricciones", "prioridades", "folio",
                    "tareas realizadas"}  # separador de sección dentro de la hoja, no es una tarea

# nombres normalizados de encabezado -> campo canónico de `tasks`
TRACKER_COLMAP = {
    "folio": "folio", "id": "folio",
    "alta": "departamento", "especialidad": "departamento",
    "fecha": "fecha_alta",
    "hora": "hora_alta",
    "clasificacion": "clasificacion",
    "concepto": "concepto",
    "involucrados": "involucrados",
    "avance": "avance",
    "fecha estimada de fin": "fecha_estimada_fin",
    "hora estimada de fin": "hora_estimada_fin",
    "reloj": "reloj",
    "restricciones": "restricciones",
    "prioridades": "prioridad", "prioridad": "prioridad",
    "riesgos": "riesgos",
    "fecha respuesta": "fecha_respuesta", "fecha_respuesta": "fecha_respuesta",
    "correo": "correo",
    "carpeta": "carpeta", "archivo": "carpeta", "archivos": "carpeta",
    "status": "status", "estatus": "status",
    "comentarios": "comentarios",
}


@dataclass
class TaskExtractionResult:
    tasks: list = field(default_factory=list)
    involucrados: list = field(default_factory=list)  # [(dedupe_key placeholder idx, raw_name)]


def extract_tasks_from_tracker(ws, sheet_name):
    rows = sheet_rows(ws)
    hidx = find_header_row(rows)
    if hidx is None:
        return []
    dicts = rows_as_dicts(rows, hidx)
    out = []
    for i, raw in enumerate(dicts):
        mapped = {}
        for norm_key, val in raw.items():
            field_name = TRACKER_COLMAP.get(norm_key)
            if field_name:
                mapped.setdefault(field_name, val)
        concepto = clean_text(mapped.get("concepto"))
        if not concepto or concepto.strip().lower() in _JUNK_CONCEPTOS:
            continue  # fila sin contenido real o resto de leyenda de validación de datos
        folio_raw = clean_text(mapped.get("folio"))
        task = {
            "folio": folio_raw,
            "assignee_raw": sheet_name.strip().upper(),
            "departamento": clean_text(mapped.get("departamento")),
            "fecha_alta": parse_date(mapped.get("fecha_alta")),
            "hora_alta": parse_time(mapped.get("hora_alta")),
            "clasificacion": clean_text(mapped.get("clasificacion")),
            "concepto": concepto,
            "avance": parse_avance(mapped.get("avance")),
            "fecha_estimada_fin": parse_date(mapped.get("fecha_estimada_fin")),
            "hora_estimada_fin": parse_time(mapped.get("hora_estimada_fin")),
            "reloj": parse_time_text(mapped.get("reloj")),
            "restricciones": clean_text(mapped.get("restricciones")),
            "prioridad": clean_text(mapped.get("prioridad")),
            "riesgos": clean_text(mapped.get("riesgos")),
            "fecha_respuesta": parse_date(mapped.get("fecha_respuesta")),
            "correo": clean_text(mapped.get("correo")),
            "carpeta": clean_text(mapped.get("carpeta")),
            "cumplimiento": None,
            "comentarios": clean_text(mapped.get("comentarios")),
            "comentarios_semana": None,
            "comentarios_semana_previa": None,
            "status": clean_text(mapped.get("status")) or "PENDIENTE",
            "source_sheet": sheet_name,
            "_involucrados_raw": mapped.get("involucrados"),
            "_row_index": i,
        }
        out.append(task)
    return out


# ---------------------------------------------------------------------------
# 3. PPCV4 -> tasks (maestro; header no está en la fila 0, hay un bloque de
#    estadísticas antes)
# ---------------------------------------------------------------------------

PPCV4_COLMAP = {
    "id": "folio",
    "especialidad": "departamento",
    "descripcion de la actividad": "concepto",
    "responsable": "assignee_raw",
    "fecha de alta": "fecha_alta",
    "reloj": "reloj",
    "cumplimiento": "cumplimiento",
    "archivos": "carpeta",
    "comentarios semana en curso": "comentarios_semana",
    "comentarios semana previa": "comentarios_semana_previa",
}


def extract_tasks_from_ppcv4(ws, sheet_name="PPCV4"):
    rows = sheet_rows(ws)
    # el header real es la primera fila cuya primera celda normalizada es 'id'
    hidx = None
    for i, row in enumerate(rows):
        if row and normalize_header(row[0]) == "id":
            hidx = i
            break
    if hidx is None:
        return []
    dicts = rows_as_dicts(rows, hidx)
    out = []
    for i, raw in enumerate(dicts):
        mapped = {}
        for norm_key, val in raw.items():
            field_name = PPCV4_COLMAP.get(norm_key)
            if field_name:
                mapped.setdefault(field_name, val)
        concepto = clean_text(mapped.get("concepto"))
        if not concepto:
            continue
        assignee_raw = clean_text(mapped.get("assignee_raw"))
        task = {
            "folio": clean_text(mapped.get("folio")),
            "assignee_raw": assignee_raw.upper() if assignee_raw else None,
            "departamento": clean_text(mapped.get("departamento")),
            "fecha_alta": parse_date(mapped.get("fecha_alta")),
            "hora_alta": None,
            "clasificacion": None,
            "concepto": concepto,
            "avance": 0.0,
            "fecha_estimada_fin": None,
            "hora_estimada_fin": None,
            "reloj": parse_time_text(mapped.get("reloj")),
            "restricciones": None,
            "prioridad": None,
            "riesgos": None,
            "fecha_respuesta": None,
            "correo": None,
            "carpeta": clean_text(mapped.get("carpeta")),
            "cumplimiento": clean_text(mapped.get("cumplimiento")),
            "comentarios": None,
            "comentarios_semana": clean_text(mapped.get("comentarios_semana")),
            "comentarios_semana_previa": clean_text(mapped.get("comentarios_semana_previa")),
            "status": "PENDIENTE",
            "source_sheet": sheet_name,
            "_involucrados_raw": None,
            "_row_index": i,
        }
        out.append(task)
    return out


# ---------------------------------------------------------------------------
# 4. PPC_BORRADOR -> ppc_borradores
# ---------------------------------------------------------------------------

def extract_ppc_borradores(ws):
    rows = sheet_rows(ws)
    hidx = find_header_row(rows) or 0
    out = []
    for d in rows_as_dicts(rows, hidx):
        concepto = clean_text(d.get("concepto"))
        if not concepto:
            continue
        responsable_raw = clean_text(d.get("responsable"))
        out.append({
            "especialidad": clean_text(d.get("especialidad")),
            "concepto": concepto,
            "responsable_raw": responsable_raw.upper() if responsable_raw else None,
            "horas": parse_number(d.get("horas")),
            "cumplimiento": clean_text(d.get("cumplimiento")),
            "archivo": clean_text(d.get("archivo")),
            "comentarios": clean_text(d.get("comentarios")),
            "previos": clean_text(d.get("previos")),
            "prioridad": clean_text(d.get("prioridad")),
            "riesgos": clean_text(d.get("riesgos")),
            "restricciones": clean_text(d.get("restricciones")),
            "fecha_respuesta": parse_date(d.get("fecha resp")),
            "clasificacion": clean_text(d.get("clasificacion")),
            "fecha_alta": parse_date(d.get("fecha alta")),
            "ruta_critica": clean_text(d.get("ruta critica")),
            "zona": clean_text(d.get("zona")),
            "contratista": clean_text(d.get("contratista")),
            "cuant_requerida": parse_number(d.get("cuant req")),
            "cuant_real": parse_number(d.get("cuant real")),
            "dias_json": clean_text(d.get("dias json")),
        })
    return out


# ---------------------------------------------------------------------------
# 5. DB_SITIOS / DB_PROYECTOS
# ---------------------------------------------------------------------------

def extract_sites(ws):
    rows = sheet_rows(ws)
    hidx = find_header_row(rows) or 0
    out = []
    for d in rows_as_dicts(rows, hidx):
        id_sitio = clean_text(d.get("id sitio"))
        if not id_sitio:
            continue
        out.append({
            "id_sitio": id_sitio,
            "nombre": clean_text(d.get("nombre")) or id_sitio,
            "cliente": clean_text(d.get("cliente")),
            "tipo": clean_text(d.get("tipo")),
            "estatus": clean_text(d.get("estatus")),
            "fecha_creacion": parse_date(d.get("fecha creacion")),
            "creado_por": clean_text(d.get("creado por")),
        })
    return out


def extract_projects(ws):
    rows = sheet_rows(ws)
    hidx = find_header_row(rows) or 0
    out = []
    for d in rows_as_dicts(rows, hidx):
        id_proyecto = clean_text(d.get("id proyecto"))
        if not id_proyecto:
            continue
        out.append({
            "id_proyecto": id_proyecto,
            "id_sitio": clean_text(d.get("id sitio")),
            "nombre_subproyecto": clean_text(d.get("nombre subproyecto")) or id_proyecto,
            "tipo": clean_text(d.get("tipo")),
            "estatus": clean_text(d.get("estatus")),
            "fecha_creacion": parse_date(d.get("fecha creacion")),
            "creado_por": clean_text(d.get("creado por")),
        })
    return out


# ---------------------------------------------------------------------------
# 6. Ventas: ANTONIA_VENTAS (maestra) + hojas por vendedor -> quotes
# ---------------------------------------------------------------------------

QUOTES_COLMAP = {
    "folio": "folio",
    "area": "area",
    "cliente": "cliente",
    "concepto": "concepto",
    "clasificacion": "clasificacion",
    "vendedor": "vendedor_raw",
    "f visita": "f_visita", "fecha visita": "f_visita",
    "f inicio": "f_inicio", "fecha inicio": "f_inicio", "fecha de inicio": "f_inicio",
    "f entrega": "f_entrega",
    "dias": "dias",
    "avance": "avance",
    "estatus": "estatus",
    "comentarios": "comentarios",
    "requisitor": "requisitor",
    "prio cot": "prioridad_cot",
    "info cliente": "info_cliente",
    "f2": "f2",
    "cotizacion": "cotizacion",
    "cotización": "cotizacion",
    "timeline": "timeline",
    "layout": "layout",
    "proceso": "proceso",
    "proceso log": "proceso_log",
    "map cot": "map_cot",
    "monto": "monto",
    # DEFAULT_SALES_HEADERS (CODIGO.js) que antes caían al jsonb `extra`
    "archivo": "archivo",
    "fecha": "fecha",
    # columnas propias de hojas de vendedor
    "comentario": "comentario",          # singular, distinto de COMENTARIOS
    "estatus 2": "estatus_2",
    "timeout": "timeline",               # errata de 'TIMELINE' en Juan Jose Sanchez (VENTAS)
    # columnas de las hojas de ventas por departamento
    "fecha envio": "fecha_envio",
    "dias 2": "dias_2",
    "llamada al cliente": "llamada_cliente",
    "reloj": "reloj",
    "completada": "completada",
}


def extract_quotes(ws, sheet_name):
    rows = sheet_rows(ws)
    hidx = find_header_row(rows)
    if hidx is None:
        return []
    out = []
    for d in rows_as_dicts(rows, hidx):
        folio = clean_text(d.get("folio"))
        if not folio:
            continue
        mapped = {}
        extra = {}
        for norm_key, val in d.items():
            field_name = QUOTES_COLMAP.get(norm_key)
            if field_name:
                mapped.setdefault(field_name, val)
            elif norm_key != "folio" and clean_text(val) is not None:
                extra[norm_key] = clean_text(val)
        vendedor_raw = clean_text(mapped.get("vendedor_raw"))
        out.append({
            "folio": folio,
            "area": clean_text(mapped.get("area")),
            "cliente": clean_text(mapped.get("cliente")),
            "concepto": clean_text(mapped.get("concepto")),
            "clasificacion": clean_text(mapped.get("clasificacion")),
            "vendedor_raw": vendedor_raw.upper() if vendedor_raw else None,
            "f_visita": parse_date(mapped.get("f_visita")),
            "f_inicio": parse_date(mapped.get("f_inicio")),
            "f_entrega": parse_date(mapped.get("f_entrega")),
            "dias": (lambda v: int(v) if v is not None else None)(parse_duration_days(mapped.get("dias"))),
            "avance": parse_avance(mapped.get("avance")),
            "estatus": clean_text(mapped.get("estatus")),
            "comentarios": clean_text(mapped.get("comentarios")),
            "requisitor": clean_text(mapped.get("requisitor")),
            "prioridad_cot": clean_text(mapped.get("prioridad_cot")),
            "info_cliente": clean_text(mapped.get("info_cliente")),
            "f2": clean_text(mapped.get("f2")),
            "cotizacion": clean_text(mapped.get("cotizacion")),
            "timeline": clean_text(mapped.get("timeline")),
            "layout": clean_text(mapped.get("layout")),
            "proceso": clean_text(mapped.get("proceso")),
            "proceso_log": clean_text(mapped.get("proceso_log")),
            "map_cot": clean_text(mapped.get("map_cot")),
            "monto": parse_number(mapped.get("monto")),
            "archivo": clean_text(mapped.get("archivo")),
            "fecha": parse_date(mapped.get("fecha")),
            "comentario": clean_text(mapped.get("comentario")),
            "estatus_2": clean_text(mapped.get("estatus_2")),
            "fecha_envio": parse_date(mapped.get("fecha_envio")),
            "dias_2": (lambda v: int(v) if v is not None else None)(parse_duration_days(mapped.get("dias_2"))),
            "llamada_cliente": clean_text(mapped.get("llamada_cliente")),
            "reloj": parse_time_text(mapped.get("reloj")),
            "completada": mapped.get("completada") if isinstance(mapped.get("completada"), bool) else None,
            "source_sheet": sheet_name,
            "extra": extra or None,
        })
    return out


# ---------------------------------------------------------------------------
# 6b. PPCV3 -> plan_semanal ("Plan de Trabajo Semanal")
#
# Esta hoja NO se puede leer por nombre de encabezado: el bloque útil empieza
# después de un resumen estadístico, y los 7 días de la semana comparten un
# solo encabezado combinado ("DÍAS DE LA SEMANA"). Se lee por posición.
# ---------------------------------------------------------------------------

_PLAN_DIAS = ["L", "M", "X", "J", "V", "S", "D"]
# índices de columna en la hoja PPCV3
_PLAN_IDX = {
    "id": 0, "ruta_critica": 1, "zona": 2, "especialidad": 3, "descripcion": 4,
    "cuant_req": 5, "cuant_real": 6, "responsable": 7, "contratista": 8,
    "dias_start": 9, "dias_end": 16, "cumplimiento": 16, "nota_cnc": 17,
}


def extract_plan_semanal(ws, sheet_name="PPCV3"):
    rows = sheet_rows(ws)
    # el encabezado real es la fila cuya primera celda es 'ID' y la segunda 'Ruta critica'
    hidx = None
    for i, r in enumerate(rows):
        if r and normalize_header(r[0]) == "id" and len(r) > 1 and normalize_header(r[1]).startswith("ruta"):
            hidx = i
            break
    if hidx is None:
        return []

    out = []
    for r in rows[hidx + 1:]:
        if not r or all(c in (None, "") for c in r):
            continue

        def cell(key):
            idx = _PLAN_IDX[key]
            return r[idx] if idx < len(r) else None

        id_origen = clean_text(cell("id"))
        descripcion = clean_text(cell("descripcion"))
        if not id_origen and not descripcion:
            continue

        # los IDs numéricos vienen como float (17.0) -> normalizar a entero
        if id_origen and id_origen.replace(".", "", 1).isdigit() and id_origen.endswith(".0"):
            id_origen = id_origen[:-2]

        dias = []
        for offset, dia in enumerate(_PLAN_DIAS):
            idx = _PLAN_IDX["dias_start"] + offset
            if idx >= _PLAN_IDX["dias_end"]:
                break
            val = r[idx] if idx < len(r) else None
            if clean_text(val):
                dias.append(dia)

        responsable = clean_text(cell("responsable"))
        out.append({
            "id_origen": id_origen,
            "task_folio": id_origen if (id_origen or "").startswith("PPC-") else None,
            "ruta_critica": clean_text(cell("ruta_critica")),
            "zona": clean_text(cell("zona")),
            "especialidad": clean_text(cell("especialidad")),
            "descripcion": descripcion,
            "cuantificacion_req": clean_text(cell("cuant_req")),
            "cuantificacion_real": parse_number(cell("cuant_real")),
            "responsable_raw": responsable.upper() if responsable else None,
            "contratista": clean_text(cell("contratista")),
            "dias": dias or None,
            "cumplimiento": clean_text(cell("cumplimiento")),
            "nota_cnc": clean_text(cell("nota_cnc")),
            "source_sheet": sheet_name,
        })
    return out


# ---------------------------------------------------------------------------
# 6c. Hoja `Datos` -> catalogos (valores de las listas desplegables)
# ---------------------------------------------------------------------------

_CATALOGO_TIPOS = {
    "area": "AREA",
    "cliente": "CLIENTE",
    "vendedor": "VENDEDOR",
    "clasificacion": "CLASIFICACION",
    "estatus": "ESTATUS",
    "estatus cot": "ESTATUS_COT",
}


def extract_catalogos(ws):
    rows = sheet_rows(ws)
    hidx = find_header_row(rows)
    if hidx is None:
        return []
    header = [normalize_header(h) for h in rows[hidx]]
    seen = set()
    out = []
    for row in rows[hidx + 1:]:
        for col_idx, key in enumerate(header):
            tipo = _CATALOGO_TIPOS.get(key)
            if not tipo:
                continue
            valor = clean_text(row[col_idx]) if col_idx < len(row) else None
            if not valor:
                continue
            dedupe = (tipo, valor.upper())
            if dedupe in seen:
                continue
            seen.add(dedupe)
            out.append({"tipo": tipo, "valor": valor})
    return out


def extract_banco_datos(ws):
    rows = sheet_rows(ws)
    hidx = find_header_row(rows) or 0
    out = []
    for d in rows_as_dicts(rows, hidx):
        folio = clean_text(d.get("folio"))
        if not folio:
            continue
        out.append({
            "folio": folio,
            "cliente": clean_text(d.get("cliente")),
            "fecha_inicio": parse_date(d.get("fecha inicio")),
            "area": clean_text(d.get("area")),
            "concepto": clean_text(d.get("concepto")),
            "vendedor": clean_text(d.get("vendedor")),
            "estatus": clean_text(d.get("estatus")),
            "cotizacion": clean_text(d.get("cotizacion")),
            "last_update": parse_date(d.get("last update")),
        })
    return out


# ---------------------------------------------------------------------------
# 7. Work orders (DB_WO_*)
# ---------------------------------------------------------------------------

WO_TABLE_COLMAPS = {
    "wo_materiales": {
        "folio": "folio", "cantidad": "cantidad", "unidad": "unidad", "tipo": "tipo",
        "descripcion": "descripcion", "costo": "costo", "especificacion": "especificacion",
        "total": "total", "residente": "residente", "compras": "compras",
        "controller": "controller", "orden compra": "orden_compra", "pagos": "pagos",
        "almacen": "almacen", "logistica": "logistica", "residente obra": "residente_obra",
    },
    "wo_mano_obra": {
        "folio": "folio", "categoria": "categoria", "salario": "salario", "personal": "personal",
        "semanas": "semanas", "extras": "extras", "nocturno": "nocturno",
        "fin semana": "fin_semana", "otros": "otros", "total": "total",
    },
    "wo_herramientas": {
        "folio": "folio", "cantidad": "cantidad", "unidad": "unidad", "descripcion": "descripcion",
        "costo": "costo", "total": "total", "residente": "residente", "controller": "controller",
        "almacen": "almacen", "logistica": "logistica", "residente fin": "residente_fin",
    },
    "wo_equipos": {
        "folio": "folio", "cantidad": "cantidad", "unidad": "unidad", "tipo": "tipo",
        "descripcion": "descripcion", "especificacion": "especificacion", "dias": "dias",
        "horas": "horas", "costo": "costo", "total": "total",
    },
    "wo_programa": {
        "folio": "folio", "descripcion": "descripcion", "fecha": "fecha", "duracion": "duracion",
        "unidad duracion": "unidad_duracion", "unidad": "unidad", "cantidad": "cantidad",
        "precio": "precio", "total": "total", "responsable": "responsable",
        "seccion": "seccion", "estatus": "estatus",
    },
}

_WO_NUMERIC_FIELDS = {
    "cantidad", "costo", "total", "salario", "personal", "semanas", "extras", "nocturno",
    "fin_semana", "otros", "dias", "horas", "duracion", "precio",
}
_WO_DATE_FIELDS = {"fecha"}


def extract_wo_table(ws, table_name):
    colmap = WO_TABLE_COLMAPS[table_name]
    rows = sheet_rows(ws)
    hidx = find_header_row(rows) or 0
    out = []
    for d in rows_as_dicts(rows, hidx):
        folio = clean_text(d.get("folio"))
        if not folio:
            continue
        record = {"folio": folio}
        for norm_key, field_name in colmap.items():
            if field_name == "folio":
                continue
            val = d.get(norm_key)
            if field_name in _WO_NUMERIC_FIELDS:
                record[field_name] = parse_number(val)
            elif field_name in _WO_DATE_FIELDS:
                record[field_name] = parse_date(val)
            else:
                record[field_name] = clean_text(val)
        out.append(record)
    return out


# ---------------------------------------------------------------------------
# 8. Agenda personal / hábitos / KPI / log
# ---------------------------------------------------------------------------

def extract_personal_agenda(ws):
    rows = sheet_rows(ws)
    hidx = find_header_row(rows) or 0
    out = []
    for d in rows_as_dicts(rows, hidx):
        rid = clean_text(d.get("id"))
        if not rid:
            continue
        usuario_raw = clean_text(d.get("usuario"))
        out.append({
            "id": rid,
            "usuario_raw": usuario_raw.upper() if usuario_raw else None,
            "fecha": parse_date(d.get("fecha")),
            "tipo": clean_text(d.get("tipo")),
            "hora_inicio": parse_time(d.get("hora inicio")),
            "hora_fin": parse_time(d.get("hora fin")),
            "titulo": clean_text(d.get("titulo")),
            "estatus": clean_text(d.get("estatus")),
            "detalles": clean_text(d.get("detalles")),
        })
    return out


def extract_habits_log(ws):
    rows = sheet_rows(ws)
    hidx = find_header_row(rows) or 0
    out = []
    for d in rows_as_dicts(rows, hidx):
        habito = clean_text(d.get("habito"))
        if not habito:
            continue
        usuario_raw = clean_text(d.get("usuario"))
        out.append({
            "usuario_raw": usuario_raw.upper() if usuario_raw else None,
            "habito": habito,
            "meta": clean_text(d.get("meta")),
            "log_json": clean_text(d.get("log json")),
            "fecha_actualizacion": parse_date(d.get("fecha actualizacion")),
        })
    return out


def extract_kpi_cotizaciones(ws):
    rows = sheet_rows(ws)
    hidx = find_header_row(rows)
    if hidx is None:
        return []
    out = []
    for d in rows_as_dicts(rows, hidx):
        depto = clean_text(d.get("departamento"))
        if not depto:
            continue
        out.append({
            "departamento": depto,
            "total": int(parse_number(d.get("total")) or 0),
            "ganadas": int(parse_number(d.get("ganadas")) or 0),
            "perdidas": int(parse_number(d.get("perdidas")) or 0),
        })
    return out


def extract_system_log(ws):
    rows = sheet_rows(ws)
    hidx = find_header_row(rows) or 0
    out = []
    for d in rows_as_dicts(rows, hidx):
        fecha = d.get("fecha y hora")
        usuario = clean_text(d.get("usuario"))
        accion = clean_text(d.get("accion"))
        if not (fecha or usuario or accion):
            continue
        ts = None
        if isinstance(fecha, dt.datetime):
            ts = fecha
        elif isinstance(fecha, dt.date):
            ts = dt.datetime.combine(fecha, dt.time())
        out.append({
            "fecha_hora": ts,
            "usuario": usuario,
            "accion": accion,
            "detalles": clean_text(d.get("detalles")),
        })
    return out
