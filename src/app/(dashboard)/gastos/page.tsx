"use client"

import { useState, useEffect } from "react"
import { ExpenseType } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, TrendingDown, UtensilsCrossed, Car, Building, Zap, Film, HeartPulse, BookOpen, ShoppingBag, PiggyBank, Circle } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"

const expenseCategories = [
  { value: "food", label: "Alimentación", icon: UtensilsCrossed, color: "text-orange-500" },
  { value: "transport", label: "Transporte", icon: Car, color: "text-blue-500" },
  { value: "housing", label: "Vivienda", icon: Building, color: "text-purple-500" },
  { value: "utilities", label: "Servicios", icon: Zap, color: "text-yellow-500" },
  { value: "entertainment", label: "Entretenimiento", icon: Film, color: "text-pink-500" },
  { value: "health", label: "Salud", icon: HeartPulse, color: "text-red-500" },
  { value: "education", label: "Educación", icon: BookOpen, color: "text-cyan-500" },
  { value: "shopping", label: "Compras", icon: ShoppingBag, color: "text-emerald-500" },
  { value: "savings", label: "Ahorro", icon: PiggyBank, color: "text-emerald-600" },
  { value: "other", label: "Otro", icon: Circle, color: "text-gray-500" },
]

export default function GastosPage() {
  const [expenses, setExpenses] = useState<ExpenseType[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset, watch } = useForm()

  const isEssential = watch("isEssential")

  useEffect(() => { loadExpenses() }, [])

  async function loadExpenses() {
    try {
      const res = await fetch("/api/expenses")
      setExpenses(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function onSubmit(data: any) {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success("Gasto registrado")
      setOpen(false)
      reset()
      loadExpenses()
    } catch {
      toast.error("Error al registrar")
    }
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const essentialExpenses = expenses.filter(e => e.isEssential).reduce((s, e) => s + e.amount, 0)
  const nonEssentialExpenses = expenses.filter(e => !e.isEssential).reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gastos</h1>
          <p className="text-muted-foreground mt-1">
            {expenses.length} registros · {formatCurrency(totalExpenses)} total
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Nuevo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Gasto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto</label>
                  <Input type="number" step="0.01" {...register("amount", { required: true })} placeholder="500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha</label>
                  <Input type="date" {...register("date")} defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <Input {...register("description")} placeholder="Supermercado" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <select {...register("category")} className="flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  {expenseCategories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" {...register("isRecurring")} id="recurring" className="rounded border-border" />
                  <label htmlFor="recurring" className="text-sm">Recurrente</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" {...register("isEssential")} id="essential" defaultChecked className="rounded border-border" />
                  <label htmlFor="essential" className="text-sm">Esencial</label>
                </div>
              </div>
              <Button type="submit" className="w-full">Guardar Gasto</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Total Gastos", value: formatCurrency(totalExpenses), subtitle: "todos los gastos", icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10" },
          { title: "Gastos Esenciales", value: formatCurrency(essentialExpenses), subtitle: "necesarios", icon: HeartPulse, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Gastos No Esenciales", value: formatCurrency(nonEssentialExpenses), subtitle: "potencial ahorro", icon: ShoppingBag, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((s) => (
          <Card key={s.title}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.title}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {expenses.length === 0 && !loading && (
              <div className="p-12 text-center">
                <TrendingDown className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No hay gastos registrados</h3>
                <p className="text-muted-foreground mb-4">Agrega tu primer gasto</p>
                <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Agregar Gasto</Button>
              </div>
            )}
            {expenses.map((expense) => {
              const cat = expenseCategories.find(c => c.value === expense.categoryId) || expenseCategories[expenseCategories.length - 1]
              return (
                <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${cat.color.replace("text", "bg")}/10`}>
                      <cat.icon className={`h-5 w-5 ${cat.color}`} />
                    </div>
                    <div>
                      <p className="font-medium">{expense.description || cat.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!expense.isEssential && <Badge variant="warning">No esencial</Badge>}
                    {expense.isRecurring && <Badge variant="info">Recurrente</Badge>}
                    <p className="text-lg font-bold text-rose-500">-{formatCurrency(expense.amount)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
