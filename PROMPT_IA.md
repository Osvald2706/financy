# PROMPT PARA IA: Financy v2 - App de Finanzas Personales

## OBJETIVO
Crear una aplicación web de finanzas personales llamada **Financy** usando **Next.js 14 (App Router)**, **Prisma**, **PostgreSQL (Supabase)**, **NextAuth**, **Tailwind CSS**, **Recharts**, **jsPDF** y **SheetJS**.

## REQUISITOS CLAVE (CAMBIOS RESPECTO A v1)

### 1. SISTEMA MENSUAL DE INGRESOS Y GASTOS
- No mostrar todos los registros de siempre. Cada ingreso y gasto pertenece a un **mes específico** (ej: "Enero 2026", "Febrero 2026")
- Al entrar al dashboard, mostrar el mes actual por defecto, con un selector para cambiar de mes (anterior/siguiente)
- Los ingresos y gastos deben poderse agregar para cualquier mes (pasado, presente o futuro)
- Dashboard: mostrar totales del mes seleccionado
- Si un ingreso o gasto es **recurrente** (mensual), al cambiar de mes debe aparecer automáticamente copiado al nuevo mes (como sugerencia o pre-creado)

### 2. CALENDARIO CON FECHAS DE PAGO MENSUALES
- Al registrar una deuda, el usuario debe poder configurar:
  - **Fecha de vencimiento final** (cuando se liquida)
  - **Día de pago mensual** (ej: "pago los días 5 de cada mes")
  - O **varias fechas de pago personalizadas** (ej: 5/01/2026, 5/02/2026, 5/03/2026...)
- El calendario debe mostrar **todas las fechas de pago** de cada deuda, no solo la fecha final
- Vista mensual: mostrar qué pagos vencen ese mes
- Indicar si un pago está "pagado" o "pendiente" en el calendario

### 3. DASHBOARD EN TIEMPO REAL
- Al agregar un ingreso o gasto, el dashboard debe reflejar el cambio inmediatamente (sin recargar)
- Gráficos y totales actualizados al instante
- Resumen del mes actual con:
  - Total ingresos del mes
  - Total gastos del mes
  - Balance del mes
  - Progreso de metas
  - Próximos pagos del mes

### 4. AUTOMATIZACIÓN MENSUAL
- Si un ingreso/gasto es recurrente y el usuario cambia a un mes nuevo, la app debe:
  - Crear automáticamente una copia del registro en el nuevo mes
  - Marcar estos registros como "automáticos" (para que el usuario sepa que los generó el sistema)
  - Permitir al usuario editarlos o eliminarlos individualmente si quiere ajustarlos

### 5. INGRESOS MENSUALES POR SEPARADO
- Cada mes tiene su propio registro de ingresos (no es un solo ingreso global)
- El usuario puede agregar múltiples ingresos por mes
- Vista de ingresos: mostrar tabla filtrada por mes, con total por mes
- Gráfico comparativo entre meses

## TECH STACK (DEBE USAR ESTOS)

### Frontend
- **Next.js 14** con **App Router** (app directory)
- **Tailwind CSS** para estilos (dark theme, colores: slate/emerald/primary #10b981)
- **Recharts** para gráficos (AreaChart, PieChart, BarChart)
- **Lucide React** para iconos
- **react-hot-toast** para notificaciones
- **jsPDF** y **xlsx (SheetJS)** para exportar reportes

### Backend
- **Next.js API Routes** en app/api/
- **Prisma ORM** con PostgreSQL
- **NextAuth.js** con autenticación por credentials (email + password)

### Base de datos
- **Supabase PostgreSQL**
- Prisma schema con modelos: User, Account, Session, Debt, DebtPayment, Income, Expense, Goal, Category, Reminder

### IA
- **OpenRouter** con modelo **qwen/qwen3-30b-a3b:free**
- El usuario configura su API Key desde la UI (Configuración > Inteligencia Artificial)
- Chat asistente financiero que conoce los datos del usuario

## MODELOS PRISMA (esquema de BD)

Crea los modelos con estos campos, adaptando para el sistema mensual:

### User
- id, name, email, password, avatar, currency (default "MXN"), locale (default "es-MX"), monthlyIncome, openrouterApiKey (String?), createdAt, updatedAt
- Relaciones: accounts, sessions, debts, incomeRecords, expenses, goals, categories

### Debt
- id, userId, name, creditor, type, totalAmount, interestRate, minimumPayment, paidAmount, status, dueDate (final), startDate, notes, category
- Relación: user, payments (DebtPayment[]), reminders
- **NUEVO**: paymentDay (Int?) — día del mes para pagos mensuales

### DebtPayment (pagos individuales de deuda)
- id, debtId, amount, date (DateTime — fecha específica del pago), method, notes, month (String — "2026-01"), isAutomatic (Boolean default false)

### Income
- id, userId, amount, description, source, categoryId, date (DateTime), isRecurring (Boolean), frequency, notes
- **NUEVO**: month (String — "2026-01"), isAutomatic (Boolean default false)
- Relación: user, category

### Expense
- id, userId, amount, description, categoryId, date, isRecurring, frequency, isEssential, notes
- **NUEVO**: month (String — "2026-01"), isAutomatic (Boolean default false)
- Relación: user, category

### Goal - sin cambios
### Category - agregar budget por mes (budgetMonthly Float?)
### Reminder - sin cambios

## PÁGINAS

### Dashboard (/dashboard)
- Selector de mes (anterior/siguiente/actual)
- Cards: Ingresos del mes, Gastos del mes, Balance, Deuda total
- Gráfico de ingresos vs gastos (AreaChart) por día del mes
- Gráfico circular de gastos por categoría
- Metas activas con progreso
- Próximos pagos del mes
- Botón "Análisis IA" que analiza las finanzas del mes

### Ingresos (/ingresos)
- Selector de mes
- Tabla de ingresos del mes con: fecha, descripción, fuente, monto, acciones
- Total del mes
- Botón "Agregar Ingreso" con modal: monto, fuente, descripción, fecha, recurrente, mes
- Si es recurrente, al cambiar de mes se crea automáticamente

### Gastos (/gastos)
- Igual que ingresos pero para gastos
- Campo adicional: ¿es esencial?
- Categorización

### Deudas (/deudas)
- Lista de deudas
- Modal para nueva deuda con campos: nombre, acreedor, monto total, tasa interés, pago mínimo, **día de pago mensual**, fecha de vencimiento final
- Al abrir una deuda: historial de pagos, tabla de fechas de pago programadas
- Cada pago se marca como pagado/pendiente
- Calendario de pagos por mes

### Calendario (/calendario)
- Vista mensual tipo calendario
- **Muestra TODAS las fechas de pago de todas las deudas activas en el mes**
- Días con pago: marcados con indicador
- Al hacer clic en un día: lista de pagos con monto, deuda, estado
- Botón para marcar pago como realizado

### Metas (/metas) - sin cambios mayores
### Reportes (/reportes) - exportar por mes o rango
### Configuración (/configuracion)
- Perfil, finanzas, API Key de OpenRouter
- Preferencias de moneda, idioma, tema

### Asistente IA (/asistente)
- Chat con IA (Qwen via OpenRouter)
- El asistente conoce los datos financieros del usuario
- Puede responder preguntas como: "¿Cuánto gasté este mes?", "¿En qué mes gasté más?", "Recomiéndame cómo ahorrar"

## API ROUTES

Todas las rutas API deben:
1. Verificar sesión con getServerSession
2. Filtrar por userId
3. Soportar filtro por mes (query param ?month=2026-01)

Endpoints existentes (modificar para soportar mes):
- GET/PUT /api/user
- GET/POST /api/income?month=2026-01
- GET/POST /api/expenses?month=2026-01
- GET/POST /api/debts
- GET/PUT/DELETE /api/debts/[id]
- POST /api/debts/[id]/payments
- GET/POST /api/goals
- PUT /api/goals/[id]
- GET /api/dashboard/summary?month=2026-01
- GET /api/ai/analyze?month=2026-01
- POST /api/ai/chat

**NUEVO**: GET /api/calendar?month=2026-01
- Devuelve todos los pagos programados del mes

## COMPORTAMIENTO ESPERADO

### Algoritmo de recurrencia mensual
1. Cuando un usuario crea un Income o Expense con isRecurring=true, se guarda con el mes actual
2. Al cambiar de mes en la UI, la app verifica si el registro recurrente ya existe en el nuevo mes
3. Si no existe, lo crea automáticamente como copia con isAutomatic=true
4. El usuario puede eliminar o modificar estas copias automáticas sin afectar el original

### Algoritmo de pagos de deuda
1. Al crear una deuda con paymentDay=5, se generan automáticamente las fechas de pago:
   - Desde el mes actual hasta el mes de vencimiento final
   - Cada mes, el día 5
2. Al entrar al calendario, mostrar todos estos pagos agrupados por mes
3. El usuario puede marcar un pago como "pagado" individualmente

## DISEÑO Y UX
- Dark theme con colores oscuros (slate/neutral)
- Primary color: emerald (#10b981)
- Sidebar responsive con menú colapsable
- Animaciones suaves con Tailwind (animate-in)
- Mobile-first responsive
- Toast notifications para feedback
- Modales para crear/editar registros

## IMPORTANTE
- Todo el código debe estar listo para correr con `npm install`, `npx prisma db push`, `npm run dev`
- El .env.local debe documentarse en .env.example
- La app debe funcionar sin la API de IA (fallback a análisis local sin IA)
- No usar ninguna dependencia externa no listada arriba
- Código en español para UI, inglés para código técnico

---

Crea el proyecto completo con TODOS los archivos necesarios para que funcione desde cero con solo npm install && npx prisma db push && npm run dev.
