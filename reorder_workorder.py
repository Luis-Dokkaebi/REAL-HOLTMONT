import re

def reorder_workorder():
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            content = f.read()

        # 1. EXTRACT BLOCKS
        # Helper to extract block including start marker, up to end marker (exclusive)
        def get_block(start_marker, end_marker):
            pattern = re.escape(start_marker) + r"(.*?)" + re.escape(end_marker)
            match = re.search(pattern, content, re.DOTALL)
            if not match:
                print(f"Warning: Block not found: {start_marker}")
                return ""
            return start_marker + match.group(1)

        # DEFINE MARKERS
        M_CHECKLIST = "<!-- CHECKLIST VISITA -->"
        M_VEHICLE_1 = "<!-- PROTOTYPE SECTION (MOVED UP) -->"
        M_HEADER = "<!-- HEADER (MOVED DOWN) -->"
        M_CLIENT = "<!-- LEFT COL: CLIENT INFO -->" # Start of row
        M_DESC = "<!-- BOTTOM: DESCRIPTION & MEDIA -->"
        M_DOCS = "<!-- BUTTONS LOGIC -->"
        M_PROGRAM = "<!-- PROGRAMA DEL PROYECTO (NUEVO PROTOTIPO) -->"
        M_LABOR = "<!-- MANO DE OBRA (NUEVO) -->"
        M_MATERIALS = "<!-- MATERIALES REQUERIDOS & PAPA CALIENTE -->"
        M_DESIGN = "<!-- DISEÑO / MAQUINADOS / DIBUJOS (NUEVO) -->"
        M_TOOLS = "<!-- HERRAMIENTAS REQUERIDAS & PAPA CALIENTE -->"
        M_EQUIP = "<!-- EQUIPOS ESPECIALES Y ACCESORIOS (NUEVO) -->"
        M_COSTS = "<!-- COSTOS ADICIONALES -->"
        M_FOOTER = "<!-- NEW FOOTER LAYOUT (USER REQUEST) -->"

        # EXTRACT CONTENT
        # We need the top part up to M_DOCS (exclusive), because M_DOCS is moving.
        # Wait, M_DOCS is currently after M_DESC.
        # So we take everything up to M_DOCS.

        # Split file at M_DOCS
        part1 = content.split(M_DOCS)[0]
        # part1 contains Checklist, Vehicle1, Header, Client, Desc.

        # Now we need to extract the moving parts from the REST of the file (or just search entire file).
        # Better to search entire file to be safe.

        block_docs = get_block(M_DOCS, M_PROGRAM)
        block_program = get_block(M_PROGRAM, M_LABOR)
        block_labor = get_block(M_LABOR, M_MATERIALS)
        block_materials = get_block(M_MATERIALS, M_DESIGN)
        block_design = get_block(M_DESIGN, M_TOOLS)
        block_tools = get_block(M_TOOLS, M_EQUIP)
        block_equip = get_block(M_EQUIP, M_COSTS)

        # Cost block is special, we need to split it later or just rewrite it.
        # Let's extract it to be safe.
        block_costs = get_block(M_COSTS, M_FOOTER)

        # Footer and rest
        part_footer = content.split(M_FOOTER)[1]

        # 2. CONSTRUCT NEW COSTS SECTIONS
        # We will manually create the HTML for Insumos/Viaticos and Transporte based on standard structure
        new_insumos_viaticos = """
                <!-- INSUMOS Y VIATICOS (SEPARADO) -->
                <div class="row g-3 mt-4">
                    <div class="col-md-6">
                        <div class="card shadow-sm border-0 h-100">
                            <div class="card-body">
                                <h6 class="fw-bold text-primary mb-3 text-uppercase small" style="color: #009688 !important;">INSUMOS</h6>
                                <input type="number" v-model="additionalCosts.insumos" class="form-control fw-bold" placeholder="0">
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card shadow-sm border-0 h-100">
                            <div class="card-body">
                                <h6 class="fw-bold text-primary mb-3 text-uppercase small" style="color: #009688 !important;">VIÁTICOS</h6>
                                <input type="number" v-model="additionalCosts.viaticos" class="form-control fw-bold" placeholder="0">
                            </div>
                        </div>
                    </div>
                </div>
        """

        new_transporte = """
                <!-- TRANSPORTE (SEPARADO) -->
                <div class="row g-3 mt-2">
                    <div class="col-12">
                        <div class="card shadow-sm border-0 h-100">
                            <div class="card-body">
                                <h6 class="fw-bold text-primary mb-3 text-uppercase small" style="color: #0d6efd !important;">TRANSPORTE DE EQUIPO Y PERSONAL</h6>
                                <input type="number" v-model="additionalCosts.transporte" class="form-control fw-bold" placeholder="0">
                            </div>
                        </div>
                    </div>
                </div>
        """

        # 3. CONSTRUCT VEHICLE 2
        # Extract Vehicle 1 block content
        raw_vehicle1 = get_block(M_VEHICLE_1, M_HEADER)
        # Replace data binding and title
        vehicle2 = raw_vehicle1.replace("vehicleControlData", "vehicleControlData2")
        vehicle2 = vehicle2.replace("PROTOTIPO: Control de Vehículo y Cotización", "CONTROL DE VEHICULO FINAL")
        vehicle2 = vehicle2.replace("MOVED UP", "DUPLICATE END")
        vehicle2 = vehicle2.replace("showLogic.vehicle", "showLogic.vehicle2") # Need to add this state too
        vehicle2 = "\n<!-- VEHICLE CONTROL 2 -->\n" + vehicle2

        # 4. ASSEMBLE NEW CONTENT
        # Order:
        # 1. Part1 (Top)
        # 2. Tools
        # 3. Labor
        # 4. Materials (Tabla de Otros)
        # 5. Design
        # 6. Equip
        # 7. Insumos/Viaticos
        # 8. Transporte
        # 9. Docs (Buttons)
        # 10. Vehicle 2
        # 11. Program (Appended to keep it safe)
        # 12. Footer + Rest

        new_content = (
            part1 + "\n" +
            block_tools + "\n" +
            block_labor + "\n" +
            block_materials + "\n" +
            block_design + "\n" +
            block_equip + "\n" +
            new_insumos_viaticos + "\n" +
            new_transporte + "\n" +
            block_docs + "\n" +
            vehicle2 + "\n" +
            block_program + "\n" +
            M_FOOTER + part_footer
        )

        # 5. UPDATE JS (setup)
        # Find "vehicleControlData = ref({});" and add vehicleControlData2
        new_content = new_content.replace(
            "const vehicleControlData = ref({});",
            "const vehicleControlData = ref({});\n      const vehicleControlData2 = ref({}); // Second independent table"
        )

        # Add vehicle2 to showLogic
        new_content = new_content.replace(
            "vehicle: false,",
            "vehicle: false,\n          vehicle2: false,"
        )

        # 6. UPDATE JS (saveWorkOrder)
        # Find where concept string is built and add vehicle 2 data
        # Look for "if (vCtrl.verifVehiculo) conceptoStr += `\nVerificación: ${vCtrl.verifVehiculo}`;"
        # Append logic for vCtrl2

        js_hook = "if (vCtrl.verifVehiculo) conceptoStr += `\\nVerificación: ${vCtrl.verifVehiculo}`;"
        js_addition = """
        if (vCtrl.verifVehiculo) conceptoStr += `\\nVerificación: ${vCtrl.verifVehiculo}`;
        }

        // Serialize Vehicle Control 2
        const vCtrl2 = vehicleControlData2.value;
        if (Object.keys(vCtrl2).length > 0) {
            conceptoStr += `\\n\\n[CONTROL VEHICULO FINAL]`;
            if (vCtrl2.cotizacion) conceptoStr += `\\nCotización: ${vCtrl2.cotizacion}`;
            if (vCtrl2.chofer) conceptoStr += `\\nChofer: ${vCtrl2.chofer}`;
            if (vCtrl2.vehiculo) conceptoStr += `\\nVehiculo: ${vCtrl2.vehiculo}`;
            if (vCtrl2.gasolina) conceptoStr += `\\nGasolina: ${vCtrl2.gasolina}`;
            if (vCtrl2.horaSalida) conceptoStr += `\\nHora Salida: ${vCtrl2.horaSalida}`;
            if (vCtrl2.evaluacion) conceptoStr += `\\nEvaluación: ${vCtrl2.evaluacion}`;
            if (vCtrl2.multas) conceptoStr += `\\nMultas: ${vCtrl2.multas}`;
            if (vCtrl2.horaLlegada) conceptoStr += `\\nHora Llegada: ${vCtrl2.horaLlegada}`;
            if (vCtrl2.ruta) conceptoStr += `\\nRuta: ${vCtrl2.ruta}`;
            if (vCtrl2.verifVehiculo) conceptoStr += `\\nVerificación: ${vCtrl2.verifVehiculo}`;
        """

        # Need to match the closing brace of the vCtrl block carefully.
        # The original code:
        # if (vCtrl.verifVehiculo) conceptoStr += `\nVerificación: ${vCtrl.verifVehiculo}`;
        # }

        # We replace the line and the closing brace with the new block (which includes the closing brace and the new block)
        # Note: In the replacement string above, I included "}" at start to close the previous block?
        # No, "if (vCtrl.verifVehiculo)..." is inside the block. The block ends after that line.
        # So I replace "if (vCtrl.verifVehiculo) ... ;" with "if (vCtrl.verifVehiculo) ... ;\n }" (closing existing) + NEW BLOCK + "{" (opening next? No).

        # Let's just find the closing brace of the if(Object.keys(vCtrl).length > 0) block.
        # It's risky to replace just the last line.
        # I will replace the entire vCtrl block logic if possible, or just append after it.

        # Search for the block start: "const vCtrl = vehicleControlData.value;"
        # And finding the end is hard with regex.

        # Simplified approach: Insert AFTER the vCtrl block.
        # The vCtrl block ends with "}" followed by "const fullClientName".
        # So I can replace "const fullClientName" with " ... new block ... \nconst fullClientName".

        v2_logic = """
        // Serialize Vehicle Control 2
        const vCtrl2 = vehicleControlData2.value;
        if (Object.keys(vCtrl2).length > 0) {
            conceptoStr += `\\n\\n[CONTROL VEHICULO FINAL]`;
            if (vCtrl2.cotizacion) conceptoStr += `\\nCotización: ${vCtrl2.cotizacion}`;
            if (vCtrl2.chofer) conceptoStr += `\\nChofer: ${vCtrl2.chofer}`;
            if (vCtrl2.vehiculo) conceptoStr += `\\nVehiculo: ${vCtrl2.vehiculo}`;
            if (vCtrl2.gasolina) conceptoStr += `\\nGasolina: ${vCtrl2.gasolina}`;
            if (vCtrl2.horaSalida) conceptoStr += `\\nHora Salida: ${vCtrl2.horaSalida}`;
            if (vCtrl2.evaluacion) conceptoStr += `\\nEvaluación: ${vCtrl2.evaluacion}`;
            if (vCtrl2.multas) conceptoStr += `\\nMultas: ${vCtrl2.multas}`;
            if (vCtrl2.horaLlegada) conceptoStr += `\\nHora Llegada: ${vCtrl2.horaLlegada}`;
            if (vCtrl2.ruta) conceptoStr += `\\nRuta: ${vCtrl2.ruta}`;
            if (vCtrl2.verifVehiculo) conceptoStr += `\\nVerificación: ${vCtrl2.verifVehiculo}`;
        }
        """

        new_content = new_content.replace(
            "const fullClientName =",
            v2_logic + "\n        const fullClientName ="
        )

        # WRITE BACK
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(new_content)

        print("Success: index.html reordered and updated.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reorder_workorder()
