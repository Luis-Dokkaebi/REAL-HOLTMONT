let dir = [
    { name: "MIGUEL GALLARDO", dept: "ELECTROMECANICA", type: "ESTANDAR" },
    { name: "EDUARDO TERAN", dept: "PRESUPUESTOS", type: "HIBRIDO" },
    { name: "TERESA GARZA", dept: "PRECIOS UNITARIOS", type: "HIBRIDO" }
];

let res = dir.filter(p => p.name !== 'ANTONIA_VENTAS' && !p.name.includes('EDUARDO TERAN') && (p.dept === 'VENTAS' || p.type === 'VENTAS' || p.type === 'HIBRIDO' || p.name.includes('MIGUEL GALLARDO'))).map(p => p.name);
console.log(res);
