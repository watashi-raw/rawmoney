# Raw Money · finanzas personales

Dashboard mensual de finanzas personales (ingresos, gastos, tarjetas, deudas, compras a meses, recurrentes, presupuestos, calendario e historial). Sin servidor: todo se calcula y se guarda en el navegador (`localStorage`).

Brand: el mismo sistema del Toolbox (Helvetica, fondo crema, cards limpias, botones pill, modo claro/oscuro) con acentos **plum** `#6E2C5B` y **verde** `#1F7A4D`.

## Archivos
- `index.html` + `css/app.css` + `js/*.js` — código fuente (para editar).
- `dist/index.html` — **un solo archivo** listo para subir a cualquier hosting (Hostinger `public_html`, Netlify, Vercel) o abrir con doble clic.
- `dist/artifact.html` — versión para publicar como artifact en claude.ai.
- `build.py` — regenera `dist/` después de editar: `python3 build.py`.

## Módulos
| Archivo | Qué hace |
|---|---|
| `js/store.js` | Estado, formato MXN, íconos, categorías por defecto y datos demo |
| `js/calc.js` | Todos los cálculos: resumen mensual, saldos de tarjeta, deudas, compras a meses, presupuestos, calendario, historial |
| `js/charts.js` | Gráficos SVG sin librerías: donut, líneas, barras apiladas, flujo del ingreso, tooltips |
| `js/views.js` | Las 12 pantallas |
| `js/forms.js` | Drawer y formularios (movimiento, tarjeta, deuda, compra a meses, recurrente, categoría, presupuesto, cuenta) |
| `js/app.js` | Navegación por `#hash`, selector de mes, tema, acciones, exportar/importar |

## Reglas de cálculo (para no contar doble)
- Una **compra a crédito** cuenta como gasto en el mes que se hace y sube el saldo de la tarjeta. El **pago de tarjeta** baja el saldo y sale de la cuenta, pero **no** cuenta como gasto.
- **Me queda este mes** = ingresos − gastos pagados con efectivo/débito − pagos de tarjeta − pagos de deuda − ahorro.
- **Saldo de tarjeta** = saldo inicial + compras a crédito + mensualidades cargadas − pagos.
- **Compras a meses**: la mensualidad se suma sola cada mes a la tarjeta y a los gastos fijos; no hay que registrarla como gasto.
- **Recurrentes** se materializan como movimientos reales del mes al abrirlo (se pueden editar o quitar de un solo mes).
- **Deudas**: pendiente = saldo al registrarla − pagos de deuda registrados.

## Datos
- Al abrir por primera vez carga datos demo (jun–sep 2026). En **Cuentas y ajustes** → *Borrar datos de demostración* para empezar de cero.
- Exportar/Importar respaldo JSON desde la misma pantalla.
- Preview local: entrada `finanzas` en `.claude/launch.json` (sirve una copia en el scratchpad; hacer `rsync` antes).
