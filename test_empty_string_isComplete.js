let rawVal = 0;
let valStr = String(rawVal === 0 ? "0" : rawVal || "").trim();
console.log("valStr is:", valStr);
console.log("strictMatch is:", valStr === "100" || valStr === "100%" || valStr.toUpperCase() === "SI");
