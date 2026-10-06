# AuraWealth Pro

Aplicación web de finanzas personales **local-first**: guarda todos los datos en tu navegador, incluye analítica visual y un motor **Excel bidireccional** (exporta e importa).

Construida con **Next.js 16 (exportación estática) · React 19 · Tailwind CSS 4 · Recharts 3 · Motion · Lucide · xlsx-js-style**.

## Puesta en marcha

```bash
cd aurawealth-pro
npm install
npm run dev          # http://localhost:3000
npm run build        # genera /out (sitio 100 % estático)
npm start            # sirve /out
npm run test:excel   # prueba de ida y vuelta: exportar → importar → comparar
npm run build:artifact  # versión de un solo archivo HTML → dist-artifact/aurawealth-pro.html
npm run lint && npm run typecheck
```

La app arranca en blanco y todo lo que registras se guarda en tu navegador. Si quieres ver un ejemplo, en **Excel → Respaldo → Cargar datos de demostración** hay 14 meses de datos de prueba (antes se crea un snapshot de tus datos).

### Versión de un solo archivo

`npm run build:artifact` usa Vite para empaquetar la misma app en un único HTML, con todo el JS y el CSS en línea (`artifact/`). Las rutas de Next.js se sustituyen por un enrutador en memoria (`artifact/router.ts`, más `next/link` y `next/navigation` simulados), y un ancla como `#metas` abre directamente ese módulo. Así se publica como artefacto de claude.ai. Dentro de ese visor, las descargas usan su capacidad `downloads`, que pide confirmación, y el archivo vinculado se desactiva porque el visor no permite la API de archivos.

## Módulos

| Ruta | Módulo | Contenido |
|---|---|---|
| `/` | **Command Center** | KPIs (patrimonio neto, flujo de caja, tasa de ahorro, deuda total) con sparklines y variación; ingresos vs. gastos (12 m); dona de gastos; alertas inteligentes; presupuesto; próximos vencimientos; metas; actividad reciente; evolución del patrimonio. |
| `/transacciones` | **Motor de Transacciones** | Ingresos (Salario, Pasivos, Inversiones, Freelance, Regalías, Bonos…) y gastos con macro/micro categoría, método de pago y prioridad (Necesidad/Gusto/Inversión). Filtros por fecha, categoría, método, prioridad, rango de monto y recurrencia; búsqueda en tiempo real; ordenamiento, paginación, selección múltiple. |
| `/pasivos` | **Pasivos y Cobros** | Deudas con interés mensual, avance, próxima cuota, curva de amortización, capital vs. interés por año, simulador de pago extra y estrategias avalancha/bola de nieve. Cuentas por cobrar con estados (Pendiente/Parcial/Cobrado), alertas de vencimiento y antigüedad de saldos. |
| `/metas` | **Centro de Metas** | Metas de ahorro e inversión con termómetro y barra animada, fecha estimada según tu ritmo real (plan → aportes de los últimos 3 meses → ahorro global), aporte requerido y tarjetas motivacionales. |
| `/analitica` | **Inteligencia y Analítica** | Proyección por regresión lineal (3 meses), medidor de tasa de ahorro, ratios (fondo de emergencia, deuda/ingreso, volatilidad, gasto fijo), comparativa mes a mes, áreas apiladas por categoría, matriz de rendimiento (mapa de calor), regla 50/30/20, métodos de pago, fuentes de ingreso, patrón por día de la semana y principales comercios. |
| `/excel` | **Centro Excel y Datos** | Exportación, vista previa en vivo del libro, importación con informe previo, archivo vinculado con autoguardado, snapshots, respaldo JSON y preferencias. |

La navegación combina una barra lateral (contraíble y con cajón en móvil), pestañas de espacio de trabajo (cada módulo visitado queda abierto como pestaña), ruta de navegación (breadcrumbs), búsqueda global (`Ctrl/⌘+K`), menú **Nuevo** para dar de alta cualquier registro y **Deshacer** (`Ctrl/⌘+Z`).

## Motor Excel

- **Sincronización en tiempo real:** `buildWorkbookModel(data)` se recalcula con cada cambio del estado. La misma estructura alimenta la vista previa, el exportador y el mapeo del importador.
- **Hojas generadas:** 1 Resumen Ejecutivo · 2 Libro de Ingresos · 3 Libro de Gastos · 4 Control de Deudas · 5 Cuentas por Cobrar · 6 Metas de Ahorro · 7 Historial de Movimientos · 8 Configuración. Las hojas 7 y 8 hacen que la restauración sea **sin pérdidas**: incluyen los pagos de deudas, los cobros, los aportes a metas y las preferencias.
- **Formato:** banda de título con el color de cada hoja, cabecera índigo `#4F46E5` con texto blanco, filas cebra, bordes finos, formatos estrictos `"$"#,##0.00`, `0.0%` y `dd/mm/yyyy`, anchos `wch` calculados según el contenido, autofiltro y fila **TOTAL** con `SUBTOTAL(109, …)`. Los KPIs del resumen usan fórmulas que referencian otras hojas (`=SUM('Control de Deudas'!E5:E7)`) y guardan el valor ya calculado.
- **Importación:** encuentra las hojas por nombre sin importar acentos ni mayúsculas; detecta la fila de cabecera y mapea las columnas por título, en cualquier orden. Acepta fechas seriales o en texto (`dd/mm/yyyy`, ISO), montos con separadores locales y "Sí/No". Cada fila pasa por el mismo saneador que el almacenamiento local. Antes de aplicar se muestra un informe por hoja y se elige **Reemplazar** o **Combinar** (por ID). Antes de aplicar se guarda automáticamente un snapshot.
- **Archivo vinculado (Chrome/Edge):** con la File System Access API eliges un `.xlsx` y cada cambio se escribe en él (con 1,2 s de espera). **Releer desde Excel** importa las ediciones hechas en ese archivo. El vínculo se recuerda en IndexedDB.

## Persistencia

`lib/store/storage.ts` guarda un sobre versionado `{ version, savedAt, data }` en localStorage, con migraciones por versión, guardado con 250 ms de espera más un guardado forzado al cerrar u ocultar la pestaña, y sincronización entre pestañas mediante el evento `storage`. Si los datos están dañados, se apartan en una clave de cuarentena y se recupera el último snapshot. Los snapshots rotan (máximo 10): uno automático cada 30 minutos y otros manuales o creados antes de importar, restaurar o reiniciar.

Modelo contable: **liquidez** = saldo inicial + ingresos − gastos; **patrimonio neto** = liquidez + cuentas por cobrar pendientes − saldos de deuda. Un pago de deuda puede registrarse también como gasto, y un cobro también como ingreso; ambos son opcionales y cada operación es un solo paso de Deshacer.

## Estructura

```
app/                 rutas (/, /transacciones, /pasivos, /metas, /analitica, /excel) + layout
components/
  layout/            AppShell, Sidebar, Topbar (breadcrumbs, búsqueda, Nuevo), WorkspaceTabs, UIProvider
  ui/                Card, KpiCard, Badge, Button, Modal, Field, Tabs, Progress, Toaster, InfoTip…
  charts/            Cashflow, Donut, MonthlyBars, Forecast, StackedArea, Heatmap, Gauge, Thermometer, Amortization…
  dashboard/ transactions/ liabilities/ goals/ analytics/ excel/   vistas y formularios por módulo
lib/
  types.ts           modelo de dominio
  constants/         catálogos (categorías, métodos, colores, monedas)
  finance/           cálculos puros: KPIs, amortización, pronóstico, alertas, metas
  store/             reducer, proveedor (deshacer, bitácora, persistencia), saneador, semilla
  excel/             modelo del libro, exportador con estilos, importador, proveedor de sincronización
scripts/             prueba de ida y vuelta de Excel
```

## Paleta

Índigo `#4F46E5` y cobalto `#2563EB` como colores primarios; esmeralda `#10B981` para ingresos y metas; coral `#F43F5E` para gastos y deudas; ámbar `#F59E0B` para cuentas por cobrar. Las categorías usan una paleta de 8 tonos verificada para daltonismo. Como el verde y el rojo se confunden con deuteranopía, los gastos llevan además trazo discontinuo o trama, y todas las series tienen leyenda.
