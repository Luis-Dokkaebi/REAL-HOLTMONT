
function setupDirectoryDB() {
  const DB_NAME = "DB_DIRECTORY";
  let sheet = SS.getSheetByName(DB_NAME);

  if (!sheet) {
    sheet = SS.insertSheet(DB_NAME);
    sheet.appendRow(["NOMBRE", "DEPARTAMENTO", "TIPO_HOJA"]);
    sheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#e6e6e6");

    const initialDirectory = [
      { name: "ANTONIA_VENTAS", dept: "VENTAS" },
      { name: "JUDITH ECHAVARRIA", dept: "VENTAS" },
      { name: "EDUARDO MANZANARES", dept: "VENTAS" },
      { name: "RAMIRO RODRIGUEZ", dept: "VENTAS" },
      { name: "SEBASTIAN PADILLA", dept: "VENTAS" },
      { name: "CESAR GOMEZ", dept: "VENTAS" },
      { name: "ALFONSO CORREA", dept: "VENTAS" },
      { name: "TERESA GARZA", dept: "VENTAS" },
      { name: "GUILLERMO DAMICO", dept: "VENTAS" },
      { name: "ANGEL SALINAS", dept: "VENTAS" },
      { name: "JUAN JOSE SANCHEZ", dept: "VENTAS" },
      { name: "LUIS CARLOS", dept: "ADMINISTRACION" },
      { name: "ANTONIO SALAZAR", dept: "ADMINISTRACION" },
      { name: "ROCIO CASTRO", dept: "ADMINISTRACION" },
      { name: "DANIA GONZALEZ", dept: "ADMINISTRACION" },
      { name: "JUANY RODRIGUEZ", dept: "ADMINISTRACION" },
      { name: "LAURA HUERTA", dept: "ADMINISTRACION" },
      { name: "LILIANA MARTINEZ", dept: "ADMINISTRACION" },
      { name: "DANIELA CASTRO", dept: "ADMINISTRACION" },
      { name: "EDUARDO BENITEZ", dept: "ADMINISTRACION" },
      { name: "ANTONIO CABRERA", dept: "ADMINISTRACION" },
      { name: "ADMINISTRADOR", dept: "ADMINISTRACION" },
      { name: "EDUARDO MANZANARES", dept: "HVAC" },
      { name: "JUAN JOSE SANCHEZ", dept: "HVAC" },
      { name: "SELENE BALDONADO", dept: "HVAC" },
      { name: "ROLANDO MORENO", dept: "HVAC" },
      { name: "MIGUEL GALLARDO", dept: "ELECTROMECANICA" },
      { name: "SEBASTIAN PADILLA", dept: "ELECTROMECANICA" },
      { name: "JEHU MARTINEZ", dept: "ELECTROMECANICA" },
      { name: "MIGUEL GONZALEZ", dept: "ELECTROMECANICA" },
      { name: "ALICIA RIVERA", dept: "ELECTROMECANICA" },
      { name: "RICARDO MENDO", dept: "CONSTRUCCION" },
      { name: "CARLOS MENDEZ", dept: "CONSTRUCCION" },
      { name: "REYNALDO GARCIA", dept: "CONSTRUCCION" },
      { name: "INGE OLIVO", dept: "CONSTRUCCION" },
      { name: "EDUARDO TERAN", dept: "CONSTRUCCION" },
      { name: "EDGAR HOLT", dept: "CONSTRUCCION" },
      { name: "ALEXIS TORRES", dept: "CONSTRUCCION" },
      { name: "TERESA GARZA", dept: "CONSTRUCCION" },
      { name: "RAMIRO RODRIGUEZ", dept: "CONSTRUCCION" },
      { name: "GUILLERMO DAMICO", dept: "CONSTRUCCION" },
      { name: "RUBEN PESQUEDA", dept: "CONSTRUCCION" },
      { name: "JUDITH ECHAVARRIA", dept: "COMPRAS" },
      { name: "GISELA DOMINGUEZ", dept: "COMPRAS" },
      { name: "VANESSA DE LARA", dept: "COMPRAS" },
      { name: "NELSON MALDONADO", dept: "COMPRAS" },
      { name: "VICTOR ALMACEN", dept: "COMPRAS" },
      { name: "DIMAS RAMOS", dept: "EHS" },
      { name: "CITLALI GOMEZ", dept: "EHS" },
      { name: "AIMEE RAMIREZ", dept: "EHS" },
      { name: "EDGAR HOLT", dept: "MAQUINARIA" },
      { name: "ALEXIS TORRES", dept: "MAQUINARIA" },
      { name: "ANGEL SALINAS", dept: "DISEÑO" },
      { name: "EDGAR HOLT", dept: "DISEÑO" },
      { name: "EDGAR LOPEZ", dept: "DISEÑO" }
    ];

    const hybrids = ["ANGEL SALINAS", "TERESA GARZA", "EDUARDO TERAN", "RAMIRO RODRIGUEZ"];

    // Filter duplicates based on name, prioritizing the one we want or just keeping one
    // The original list had duplicates (e.g. ANGEL SALINAS in VENTAS and DISEÑO).
    // The DB should probably have unique names or handle multiple roles.
    // For now, simple migration: insert all. But "Directory" usually implies unique entries for dropdowns.
    // Let's deduplicate by Name.

    const seen = new Set();
    const rows = [];

    initialDirectory.forEach(p => {
      const cleanName = p.name.trim().toUpperCase();
      if (!seen.has(cleanName)) {
        seen.add(cleanName);
        let tipo = "ESTANDAR";
        if (hybrids.includes(cleanName)) tipo = "HIBRIDO";
        rows.push([cleanName, p.dept, tipo]);
      }
    });

    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
    console.log("DB_DIRECTORY created and populated.");
  } else {
    console.log("DB_DIRECTORY already exists.");
  }
}
