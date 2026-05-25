import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Remove getFechaInicioTrafficStyle
pattern_inicio = r"const getFechaInicioTrafficStyle = \(row\) => \{[\s\S]*?return {backgroundColor:'#2ecc71', color:'black'};\s*?\};\n"
content = re.sub(pattern_inicio, "", content)

# Remove getFechaRespuestaStyle
pattern_respuesta = r"const getFechaRespuestaStyle = \(row\) => \{.*?\};\n"
content = re.sub(pattern_respuesta, "", content)

# Remove from return statement
content = content.replace("getFechaRespuestaStyle, getFechaInicioTrafficStyle, ", "")

with open("index.html", "w", encoding="utf-8") as f:
    f.write(content)
