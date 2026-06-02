"use client"

import { useState, useEffect } from "react"
import { DebtType, PaymentCalendarItem } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, getDueDateStatus } from "@/lib/utils"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Wallet, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CalendarioPage() {
  const [debts, setDebts] = useState<DebtType[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    fetch("/api/debts")
      .then(r => r.json())
      .then(setDebts)
      .finally(() => setLoading(false))
  }, [])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const calendarPayments: PaymentCalendarItem[] = debts
    .filter(d => d.dueDate && d.status === "active")
    .map(d => {
      const due = new Date(d.dueDate!)
      const now = new Date()
      const diff = due.getTime() - now.getTime()
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
      return {
        id: d.id,
        debtId: d.id,
        debtName: d.name,
        amount: d.minimumPayment || d.totalAmount * 0.05,
        dueDate: d.dueDate!,
        status: d.status,
        daysUntilDue: days,
      }
    })
    .filter(p => {
      const d = new Date(p.dueDate)
      return d.getMonth() === month && d.getFullYear() === year
    })

  const totalDueThisMonth = calendarPayments.reduce((s, p) => s + p.amount, 0)
  const paidThisMonth = debts
    .filter(d => d.status === "paid")
    .reduce((s, d) => s + d.paidAmount, 0)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Calendario de Pagos</h1>
          <p className="text-muted-foreground mt-1">
            {calendarPayments.length} pagos este mes · {formatCurrency(totalDueThisMonth)} por pagar
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10">
              <Wallet className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pagos este mes</p>
              <p className="text-xl font-bold">{calendarPayments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total a pagar</p>
              <p className="text-xl font-bold">{formatCurrency(totalDueThisMonth)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total pagado</p>
              <p className="text-xl font-bold">{formatCurrency(paidThisMonth)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(year, month - 1))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle>
              {currentMonth.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(year, month + 1))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const dayPayments = calendarPayments.filter(p => {
                const pd = new Date(p.dueDate)
                return pd.getDate() === day
              })
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year

              return (
                <div
                  key={day}
                  className={`min-h-[80px] p-1 rounded-lg border transition-colors ${
                    isToday ? "border-primary bg-primary/5" : "border-transparent hover:border-border"
                  }`}
                >
                  <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {day}
                  </span>
                  <div className="space-y-0.5 mt-1">
                    {dayPayments.map(p => (
                      <div
                        key={p.id}
                        className="text-[10px] px-1 py-0.5 rounded bg-rose-500/10 text-rose-500 truncate"
                        title={`${p.debtName}: ${formatCurrency(p.amount)}`}
                      >
                        {formatCurrency(p.amount)}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Pagos del Mes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {calendarPayments.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No hay pagos programados este mes</p>
          )}
          {calendarPayments.map(p => {
            const dueStatus = getDueDateStatus(p.dueDate)
            return (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10">
                    <Wallet className="h-4 w-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.debtName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.dueDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={dueStatus.variant}>{dueStatus.label}</Badge>
                  <p className="font-bold">{formatCurrency(p.amount)}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
