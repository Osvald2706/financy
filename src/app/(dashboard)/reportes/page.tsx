"use client"

import { useState, useEffect, useRef } from "react"
import { DebtType, IncomeType, ExpenseType, GoalType } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import { 
  FileText, Download, FileSpreadsheet, Printer, 
  TrendingUp, TrendingDown, Wallet, Target, BarChart3,
  PieChart, Loader2
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartPie, Pie, Cell, LineChart, Line } from "recharts"
import toast from "react-hot-toast"

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#f97316"]

export default function ReportesPage() {
  const [debts, setDebts] = useState<DebtType[]>([])
  const [incomes, setIncomes] = useState<IncomeType[]>([])
  const [expenses, setExpenses] = useState<ExpenseType[]>([])
  const [goals, setGoals] = useState<GoalType[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/debts").then(r => r.json()),
      fetch("/api/income").then(r => r.json()),
      fetch("/api/expenses").then(r => r.json()),
      fetch("/api/goals").then(r => r.json()),
    ]).then(([d, i, e, g]) => {
      setDebts(d)
      setIncomes(i)
      setExpenses(e)
      setGoals(g)
    }).finally(() => setLoading(false))
  }, [])

  const totalDebt = debts.reduce((s, d) => s + d.totalAmount, 0)
  const totalPaid = debts.reduce((s, d) => s + d.paidAmount, 0)
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const balance = totalIncome - totalExpenses

  const debtByType = debts.reduce((acc: Record<string, number>, d) => {
    acc[d.type] = (acc[d.type] || 0) + (d.totalAmount - d.paidAmount)
    return acc
  }, {})

  const expenseByCategory = expenses.reduce((acc: Record<string, number>, e) => {
    const cat = e.categoryId || "other"
    acc[cat] = (acc[cat] || 0) + e.amount
    return acc
  }, {})

  const incomeBySource = incomes.reduce((acc: Record<string, number>, i) => {
    acc[i.source] = (acc[i.source] || 0) + i.amount
    return acc
  }, {})

  const monthlyData = getMonthlyData(incomes, expenses)

  async function exportPDF() {
    setExporting("pdf")
    try {
      const { default: jsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")
      const doc = new jsPDF()
      
      doc.setFillColor(16, 185, 129)
      doc.rect(0, 0, 210, 40, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.text("Financy - Reporte Financiero", 14, 28)
      
      doc.setTextColor(100, 100, 100)
      doc.setFontSize(10)
      doc.text(`Generado el ${new Date().toLocaleDateString("es-MX")}`, 14, 50)

      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text("Resumen Financiero", 14, 65)
      doc.setFontSize(10)
      
      const summaryData = [
        ["Deuda Total", formatCurrency(totalDebt)],
        ["Total Pagado", formatCurrency(totalPaid)],
        ["Deuda Restante", formatCurrency(totalDebt - totalPaid)],
        ["Total Ingresos", formatCurrency(totalIncome)],
        ["Total Gastos", formatCurrency(totalExpenses)],
        ["Balance Neto", formatCurrency(balance)],
      ]

      autoTable(doc, {
        startY: 70,
        head: [["Concepto", "Monto"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] },
      })

      if (debts.length > 0) {
        doc.setFontSize(16)
        doc.text("Detalle de Deudas", 14, doc.lastAutoTable.finalY + 20)
        
        const debtData = debts.map(d => [
          d.name,
          d.creditor,
          formatCurrency(d.totalAmount),
          formatCurrency(d.paidAmount),
          formatCurrency(d.totalAmount - d.paidAmount),
          `${d.interestRate}%`,
          d.status,
        ])

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 25,
          head: [["Nombre", "Acreedor", "Total", "Pagado", "Restante", "Interés", "Estado"]],
          body: debtData,
          theme: "grid",
          headStyles: { fillColor: [239, 68, 68] },
        })
      }

      doc.save(`financy-reporte-${Date.now()}.pdf`)
      toast.success("PDF descargado")
    } catch (e) {
      toast.error("Error al generar PDF")
    } finally {
      setExporting(null)
    }
  }

  async function exportExcel() {
    setExporting("excel")
    try {
      const XLSX = await import("xlsx")
      const wb = XLSX.utils.book_new()

      const summarySheet = XLSX.utils.aoa_to_sheet([
        ["Financy - Reporte Financiero"],
        [`Generado: ${new Date().toLocaleDateString("es-MX")}`],
        [],
        ["Resumen Financiero"],
        ["Concepto", "Monto"],
        ["Deuda Total", totalDebt],
        ["Total Pagado", totalPaid],
        ["Deuda Restante", totalDebt - totalPaid],
        ["Total Ingresos", totalIncome],
        ["Total Gastos", totalExpenses],
        ["Balance Neto", balance],
      ])
      XLSX.utils.book_append_sheet(wb, summarySheet, "Resumen")

      if (debts.length > 0) {
        const debtSheet = XLSX.utils.json_to_sheet(
          debts.map(d => ({
            Nombre: d.name,
            Acreedor: d.creditor,
            Total: d.totalAmount,
            Pagado: d.paidAmount,
            Restante: d.totalAmount - d.paidAmount,
            Interés: `${d.interestRate}%`,
            Estado: d.status,
            Vencimiento: d.dueDate ? formatDateShort(d.dueDate) : "",
          }))
        )
        XLSX.utils.book_append_sheet(wb, debtSheet, "Deudas")
      }

      if (incomes.length > 0) {
        const incomeSheet = XLSX.utils.json_to_sheet(
          incomes.map(i => ({
            Monto: i.amount,
            Descripción: i.description || "",
            Fuente: i.source,
            Fecha: formatDateShort(i.date),
            Recurrente: i.isRecurring ? "Sí" : "No",
          }))
        )
        XLSX.utils.book_append_sheet(wb, incomeSheet, "Ingresos")
      }

      if (expenses.length > 0) {
        const expenseSheet = XLSX.utils.json_to_sheet(
          expenses.map(e => ({
            Monto: e.amount,
            Descripción: e.description || "",
            Categoría: e.categoryId || "other",
            Fecha: formatDateShort(e.date),
            Esencial: e.isEssential ? "Sí" : "No",
            Recurrente: e.isRecurring ? "Sí" : "No",
          }))
        )
        XLSX.utils.book_append_sheet(wb, expenseSheet, "Gastos")
      }

      XLSX.writeFile(wb, `financy-reporte-${Date.now()}.xlsx`)
      toast.success("Excel descargado")
    } catch (e) {
      toast.error("Error al generar Excel")
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground mt-1">Análisis completo de tus finanzas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={exporting === "pdf"}>
            {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            <span className="hidden sm:inline ml-2">PDF</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={exporting === "excel"}>
            {exporting === "excel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            <span className="hidden sm:inline ml-2">Excel</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Deuda Total", value: formatCurrency(totalDebt), icon: Wallet, color: "text-rose-500", bg: "bg-rose-500/10" },
          { title: "Total Ingresos", value: formatCurrency(totalIncome), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { title: "Total Gastos", value: formatCurrency(totalExpenses), icon: TrendingDown, color: "text-amber-500", bg: "bg-amber-500/10" },
          { title: "Balance Neto", value: formatCurrency(balance), icon: BarChart3, color: balance >= 0 ? "text-emerald-500" : "text-rose-500", bg: balance >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10" },
        ].map((s) => (
          <Card key={s.title}>
            <CardContent className="p-6 flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.title}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Ingresos vs Gastos Mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 18%)" />
                  <XAxis dataKey="month" stroke="hsl(215 20% 65%)" fontSize={12} />
                  <YAxis stroke="hsl(215 20% 65%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(222 47% 14%)",
                      border: "1px solid hsl(217 33% 18%)",
                      borderRadius: "12px",
                    }}
                  />
                  <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Gastos por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartPie>
                  <Pie
                    data={Object.entries(expenseByCategory).map(([name, value], i) => ({
                      name,
                      value,
                      color: COLORS[i % COLORS.length],
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {Object.entries(expenseByCategory).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(222 47% 14%)",
                      border: "1px solid hsl(217 33% 18%)",
                      borderRadius: "12px",
                    }}
                  />
                </RechartPie>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {Object.entries(expenseByCategory).map(([name, value], i) => (
                <div key={name} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {name}: {formatCurrency(value)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Deudas por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(debtByType).map(([type, amount]) => (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{type.replace("_", " ")}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                  <Progress value={(amount / (totalDebt - totalPaid || 1)) * 100} />
                </div>
              ))}
              {Object.keys(debtByType).length === 0 && (
                <p className="text-center text-muted-foreground py-8">Sin deudas activas</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Ingresos por Fuente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(incomeBySource).map(([source, amount]) => (
                <div key={source} className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <span className="capitalize">{source}</span>
                  <span className="font-medium text-emerald-500">+{formatCurrency(amount)}</span>
                </div>
              ))}
              {Object.keys(incomeBySource).length === 0 && (
                <p className="text-center text-muted-foreground py-8">Sin ingresos registrados</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Progreso de Metas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.map(goal => {
            const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
            return (
              <div key={goal.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{goal.name}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)} ({progress}%)
                  </span>
                </div>
                <Progress value={progress} indicatorColor={goal.status === "completed" ? "#10b981" : "#3b82f6"} />
              </div>
            )
          })}
          {goals.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No hay metas definidas</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getMonthlyData(incomes: IncomeType[], expenses: ExpenseType[]) {
  const months: Record<string, { income: number; expenses: number }> = {}
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

  incomes.forEach(i => {
    const d = new Date(i.date)
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
    if (!months[key]) months[key] = { income: 0, expenses: 0 }
    months[key].income += i.amount
  })

  expenses.forEach(e => {
    const d = new Date(e.date)
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
    if (!months[key]) months[key] = { income: 0, expenses: 0 }
    months[key].expenses += e.amount
  })

  return Object.entries(months).slice(-6).map(([month, data]) => ({
    month,
    ...data,
  }))
}
