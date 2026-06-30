const fs = require('fs');

let indexHtml = fs.readFileSync('index.html', 'utf8');

// Buscaremos las condiciones en el frontend (Vue js) que manejan la visualización de la columna ESTATUS
// y las vamos a fusionar con la logica que dibuja la columna MAP COT (la linea de tiempo interactiva)
