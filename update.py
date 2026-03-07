import re

with open('CODIGO.js', 'r') as f:
    content = f.read()

# Replace PROCESO with MAP COT in allowedBase arrays
content = re.sub(r"const allowedBase = \['FOLIO', 'ID', 'ESTATUS', 'STATUS', 'AVANCE', 'AVANCE %', '_rowIndex', 'VENDEDOR', 'RESPONSABLE', 'INVOLUCRADOS', 'ENCARGADO', 'CONCEPTO', 'DESCRIPCION', 'CLIENTE', 'COTIZACION', 'F2', 'LAYOUT', 'TIMELINE', 'AREA', 'CLASIFICACION', 'CLASI', 'DIAS', 'RELOJ', 'ESPECIALIDAD', 'ARCHIVO', 'ARCHIVOS', 'COMENTARIOS', 'PRIORIDAD', 'PRIORIDAD DE COTIZACION', 'PRIO\. COT\.', 'F\. VISITA', 'F\. INICIO', 'F\. ENTREGA', 'FECHA VISITA', 'FECHA INICIO'\];",
                 r"const allowedBase = ['FOLIO', 'ID', 'ESTATUS', 'MAP COT', 'STATUS', 'AVANCE', 'AVANCE %', '_rowIndex', 'VENDEDOR', 'RESPONSABLE', 'INVOLUCRADOS', 'ENCARGADO', 'CONCEPTO', 'DESCRIPCION', 'CLIENTE', 'COTIZACION', 'F2', 'LAYOUT', 'TIMELINE', 'AREA', 'CLASIFICACION', 'CLASI', 'DIAS', 'RELOJ', 'ESPECIALIDAD', 'ARCHIVO', 'ARCHIVOS', 'COMENTARIOS', 'PRIORIDAD', 'PRIORIDAD DE COTIZACION', 'PRIO. COT.', 'F. VISITA', 'F. INICIO', 'F. ENTREGA', 'FECHA VISITA', 'FECHA INICIO'];",
                 content)

# Replace PROCESO with MAP COT in missingCols check
content = content.replace('if (!headers.includes("PROCESO")) missingCols.push("PROCESO");',
                          'if (!headers.includes("MAP COT")) missingCols.push("MAP COT");')

with open('CODIGO.js', 'w') as f:
    f.write(content)
