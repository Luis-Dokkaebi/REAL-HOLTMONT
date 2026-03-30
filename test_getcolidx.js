const headers = ['ID', 'ESPECIALIDAD', 'CONCEPTO', 'FECHA', 'RELOJ', 'ESTATUS', 'COMENTARIOS', 'ARCHIVO', 'CLASIFICACION', 'PRIORIDAD', 'FEC. EST. FIN', 'HORA'];
const colMap = {};
headers.forEach((h, i) => colMap[h] = i);

const getColIdx = (key) => {
  const k = key.toUpperCase().trim();
  if (colMap[k] !== undefined) return colMap[k];
  const aliases = {
    'FECHA': ['FECHA', 'FECHAS', 'FECHA ALTA', 'FECHA INICIO', 'ALTA', 'FECHA DE INICIO', 'FECHA VISITA', 'FECHA DE ALTA', 'F_INICIO'],
    'CONCEPTO': ['CONCEPTO', 'DESCRIPCION', 'DESCRIPCIÓN DE LA ACTIVIDAD', 'DESCRIPCIÓN', 'ACTIVIDAD'],
    'RESPONSABLE': ['RESPONSABLE', 'RESPONSABLES', 'INVOLUCRADOS', 'VENDEDOR', 'ENCARGADO', 'ASIGNADO'],
    'HORA': ['HORA', 'HORA ASIGNACION', 'HORA DE ASIGNACION'],
    'RELOJ': ['RELOJ', 'HORAS', 'DIAS', 'DÍAS'],
    'ESTATUS': ['ESTATUS', 'STATUS'],
    'CUMPLIMIENTO': ['CUMPLIMIENTO', 'CUMPL.', 'CUMP'],
    'AVANCE': ['AVANCE', 'AVANCE %', '% AVANCE'],
    'ALTA': ['AREA', 'DEPARTAMENTO', 'ESPECIALIDAD', 'ALTA'],
    'FECHA_RESPUESTA': ['FECHA RESPUESTA', 'FECHA FIN', 'FECHA ESTIMADA DE FIN', 'FECHA ESTIMADA', 'FECHA DE ENTREGA', 'FECHA_FIN', 'DEADLINE', 'FEC. EST. FIN'],
    'PRIORIDAD': ['PRIORIDAD', 'PRIORIDADES', 'PRIORIDAD DE COTIZACION', 'PRIO. COT.'],
    'RIESGOS': ['RIESGO', 'RIESGOS'],
    'ARCHIVO': ['ARCHIVO', 'ARCHIVOS', 'CLIP', 'LINK', 'URL', 'EVIDENCIA', 'DOCUMENTO', 'FOTO', 'VIDEO'],
    'CLASIFICACION': ['CLASIFICACION', 'CLASI'],
    'COMENTARIOS': ['COMENTARIOS', 'COMENTARIO', 'COMENTARIOS SEMANA EN CURSO', 'OBSERVACIONES', 'NOTAS', 'DETALLES'],
    'PREVIOS': ['COMENTARIOS PREVIOS', 'PREVIOS', 'COMENTARIOS SEMANA PREVIA'],
    'FECHA_TERMINO': ['FECHA TERMINO', 'FECHA REAL', 'TERMINO', 'REALIZADO']
  };

  // Here is the logic inside CODIGO.js
  for (let main in aliases) {
    if (aliases[main].includes(k)) {
         for(let alias of aliases[main]) if(colMap[alias] !== undefined) return colMap[alias];
    }
  }
  return -1;
};

console.log("TESTING FECHA_RESPUESTA mapping to FEC. EST. FIN:");
console.log("getColIdx('FECHA_RESPUESTA') =>", getColIdx('FECHA_RESPUESTA'));
console.log("Expected =>", headers.indexOf('FEC. EST. FIN'));

console.log("\nTESTING HORA mapping:");
console.log("getColIdx('HORA') =>", getColIdx('HORA'));
console.log("Expected =>", headers.indexOf('HORA'));

// Wait, the payload has 'FECHA_RESPUESTA' and it wants to find 'FEC. EST. FIN' in colMap.
// getColIdx('FECHA_RESPUESTA') will execute:
// k = 'FECHA_RESPUESTA'
// if (colMap['FECHA_RESPUESTA'] !== undefined) return colMap['FECHA_RESPUESTA']; -> undefined
// for (let main in aliases) {
//    if (aliases[main].includes('FECHA_RESPUESTA')) ... wait!
// Is 'FECHA_RESPUESTA' in aliases['FECHA_RESPUESTA']?
// No! The array is ['FECHA RESPUESTA', 'FECHA FIN', 'FECHA ESTIMADA DE FIN', 'FECHA ESTIMADA', 'FECHA DE ENTREGA', 'FECHA_FIN', 'DEADLINE', 'FEC. EST. FIN']
// 'FECHA_RESPUESTA' is NOT in that array!
// So it will NEVER find the alias!
