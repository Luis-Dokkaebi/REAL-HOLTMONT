# Credenciales Holtmont Workspace

> **DOBLE** = vendedor (Tracker + hoja `NOMBRE (VENTAS)`). **TRACKER** = solo su tabla.
> Organigrama alineado al organigrama oficial por departamento (última actualización: 2026-06-09).

## Cuentas de sistema (sin departamento)

| Usuario | Contraseña | Rol | Tabla |
|---|---|---|---|
| `JESUS_CANTU` | `ppc2025` | PPC_ADMIN | TRACKER |
| `JAIME_OLIVO` | `admin2025` | ADMIN_CONTROL | TRACKER |
| `PREWORK_ORDER` | `workorder2026` | WORKORDER_USER | TRACKER |
| `ANTONIA_VENTAS` | `tonita2025` | TONITA | DOBLE (VENTAS) |

## Personal por departamento

| Usuario | Contraseña | Rol | Tabla | Departamento | Nombre legal |
|---|---|---|---|---|---|
| `LUIS_CARLOS` | `admin2025` | ADMIN | TRACKER | **CEO** | Luis Carlos Holt Montero |
| `JUAN_JOSE_SANCHEZ` | `juan8226` | STAFF_USER | DOBLE | **CEO** | Juan Jose Sanchez Muñiz |
| `DIMAS_RAMOS` | `dimas2025` | ADMIN_CONTROL | TRACKER | RH | Dimas Eliel Ramos Garcia |
| `LAURA_HUERTA` | `laura8256` | STAFF_USER | TRACKER | RH | Laura Edith Huerta Rocha |
| `LILIANA_MARTINEZ` | `liliana4731` | STAFF_USER | TRACKER | RH | Liliana Aylin Martinez Ibarra |
| `FRANCISCO_SANCHEZ_SERNA` | `francisco3814` | STAFF_USER | TRACKER | RH | Francisco Sanchez Serna |
| `JUANY_RODRIGUEZ` | `juany2814` | STAFF_USER | TRACKER | FINANZAS | Juana Maria Rodriguez Juarez |
| `ZAIRA_AGUILAR` | `zaira5892` | STAFF_USER | TRACKER | FINANZAS | Zaira Yazmin Aguilar Aguilon |
| `ROCIO_CASTRO` | `rocio3947` | STAFF_USER | TRACKER | FINANZAS | Rocio Abigail Castro Covarrubias |
| `DANIA_GONZALEZ` | `dania2322` | STAFF_USER | TRACKER | FINANZAS | Dania Lizbeth Gonzalez Lores |
| `SONIA_GARCIA` | `sonia2960` | STAFF_USER | TRACKER | COMPRAS (+ALMACEN Y MAQUINARIA) | Sonia Garcia Perez |
| `JUDITH_ECHAVARRIA` | `judith2951` | STAFF_USER | DOBLE | COMPRAS | Cristian Judith Echavarria Rodriguez |
| `VANESSA_DE_LARA` | `vanessa6062` | STAFF_USER | TRACKER | COMPRAS | Erika Vanessa Rodriguez De Lara |
| `EDUARDO_TERAN` | `eduardo9815` | STAFF_USER | DOBLE | PRESUPUESTOS | Jesus Eduardo Teran Garcia |
| `ANTONIA_PINEDA` | `antonia7043` | STAFF_USER | TRACKER | PRESUPUESTOS | Antonia Pineda Lopez |
| `CARLOS_MENDEZ` | `carlos2250` | STAFF_USER | TRACKER | CALIDAD | Carlos Mendez Urbina |
| `RUBI_MORENO` | `rubi3641` | STAFF_USER | TRACKER | SEGURIDAD | Rubi Moreno Rodriguez |
| `TERESA_GARZA` | `teresa7891` | STAFF_USER | DOBLE | PRECIOS UNITARIOS | Maria Teresa Hernandez Garza |
| `GERALDINE_MARTINEZ` | `geraldine5279` | STAFF_USER | TRACKER | PRECIOS UNITARIOS | Geraldine Marie Martinez Hernandez |
| `ANGEL_SALINAS` | `angel9042` | STAFF_USER | DOBLE | DISEÑO | Jose Angel Salinas Ramirez |
| `URIMAR_LOPEZ` | `urimar7294` | STAFF_USER | TRACKER | DISEÑO | Edgar Urimar Lopez Maldonado |
| `EDUARDO_MANZANARES` | `eduardo6234` | STAFF_USER | DOBLE | VENTAS | Eduardo Manzanares Sanchez |
| `RAMIRO_RODRIGUEZ` | `ramiro9233` | STAFF_USER | DOBLE | VENTAS | Ramiro Rodriguez Escalante |
| `SEBASTIAN_PADILLA` | `sebastian9385` | STAFF_USER | DOBLE | VENTAS | Erick Sebastian Padilla Carrillo |
| `JEHU_MARTINEZ` | `jehu6696` | STAFF_USER | TRACKER | ELECTROMECANICA | Jehu Arsenio Martinez Montes |
| `MIGUEL_GALLARDO` | `miguel5120` | STAFF_USER | TRACKER | ELECTROMECANICA | Miguel Angel Gallardo Jaramillo |
| `ROLANDO_MORENO` | `rolando7508` | STAFF_USER | TRACKER | HVAC | Jesus Rolando Moreno Perez |
| `EMILIANO_AREDON` | `emiliano4187` | STAFF_USER | TRACKER | HVAC | Emiliano Arredondo Gomez |
| `INGE_OLIVO` | `inge2469` | STAFF_USER | TRACKER | CONSTRUCCION | Jaime Antonio Olivo Guerrero |
| `RICARDO_MENDO` | `ricardo9414` | STAFF_USER | TRACKER | CONSTRUCCION | Ricardo Alonso Mendo Morales |
| `ALFONSO_CORREA` | `alfonso4658` | STAFF_USER | DOBLE | CONSTRUCCION | Alfonso Correa De Leon |
| `CESAR_EDUARDO_GARCIA` | `cesar7052` | STAFF_USER | TRACKER | CONSTRUCCION | Cesar Eduardo Garcia Avalos |
| `EDUARDO_BENITEZ` | `eduardo1188` | STAFF_USER | TRACKER | LIMPIEZA | Eduardo Israel Benitez Garcia |
| `SAIRA` | `saira3725` | STAFF_USER | TRACKER | FINANZAS | (legacy — usar `ZAIRA_AGUILAR`) |

## Cambios de esta actualización (organigrama oficial)

**Movimientos de departamento:**
- `LUIS_CARLOS` (ADMINISTRACION → **CEO**), `JUAN_JOSE_SANCHEZ` (VENTAS → **CEO**).
- `ZAIRA_AGUILAR` y `DANIA_GONZALEZ` (FACTURACION → **FINANZAS**).
- `JUDITH_ECHAVARRIA` (VENTAS → **COMPRAS**).
- `EDUARDO_TERAN` (CONSTRUCCION → **PRESUPUESTOS**).
- `RUBI_MORENO` (EHS → **SEGURIDAD**).
- `TERESA_GARZA` (VENTAS → **PRECIOS UNITARIOS**), `GERALDINE_MARTINEZ` (ADMINISTRACION → **PRECIOS UNITARIOS**).
- `ANGEL_SALINAS` (VENTAS → **DISEÑO**).
- `ALFONSO_CORREA` (VENTAS → **CONSTRUCCION**), `CESAR_EDUARDO_GARCIA` (DISEÑO → **CONSTRUCCION**).
- `EDUARDO_BENITEZ` (ADMINISTRACION → **LIMPIEZA**).

**Alta nueva:**
- `ANTONIA_PINEDA` — Antonia Pineda Lopez (PRESUPUESTOS, pass: `antonia7043`).

**Bajas (eliminados de USER_DB):**
- `CESAR_GOMEZ`, `GUILLERMO_DAMICO`, `REYNALDO_GARCIA`, `EDGAR_HOLT`, `ALEXIS_TORRES`, `RUBEN_PESQUEDA`, `GISELA_DOMINGUEZ`, `CITLALI_GOMEZ`, `AIMEE_RAMIREZ`, `EDGAR_LOPEZ`, `JUAN_ENRIQUE_PEREZ`.

**Departamentos nuevos:** CEO, PRESUPUESTOS, PRECIOS UNITARIOS, SEGURIDAD, LIMPIEZA, ALMACEN Y MAQUINARIA.

**Conservados a propósito:** `ANTONIA_VENTAS` (rol TONITA, permanece en VENTAS) y la hoja espejo `ADMINISTRADOR` (control, sin login).

> **Para aplicar en producción:** entrar como ADMIN y ejecutar **Re-sincronizar Directorio** (`apiResyncDirectory`). Esto reescribe `DB_DIRECTORY` con el nuevo organigrama y crea automáticamente la hoja de tracker faltante (`ANTONIA PINEDA LOPEZ`).
