let dir = [
    { name: "MIGUEL GALLARDO", dept: "VENTAS", type: "HIBRIDO" },
    { name: "EDUARDO TERAN", dept: "PRESUPUESTOS", type: "HIBRIDO" },
    { name: "TERESA GARZA", dept: "PRECIOS UNITARIOS", type: "HIBRIDO" }
];

let res = dir.filter(p => p.name !== 'ANTONIA_VENTAS' && !p.name.includes('EDUARDO TERAN') && (p.dept === 'VENTAS' || p.type === 'VENTAS' || p.type === 'HIBRIDO')).map(p => p.name);
console.log(res);
