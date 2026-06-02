"use client"

import { useState, useEffect } from "react"
import { IncomeType } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, TrendingUp, Briefcase, Laptop, TrendingUp as Investment, Home, Gift, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"

const incomeSources = [
  { value: "salary", label: "Salario", icon: Briefcase },
  { value: "freelance", label: "Freelance", icon: Laptop },
  { value: "investment", label: "Inversiones", icon: Investment },
  { value: "rental", label: "Renta", icon: Home },
  { value: "gift", label: "Regalo", icon: Gift },
  { value: "other", label: "Otro", icon: TrendingUp },
]

export default function IngresosPage() {
  const [incomes, setIncomes] = useState<IncomeType[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset, watch } = useForm()

  useEffect(() => { loadIncomes() }, [])

  async function loadIncomes() {
    try {
      const res = await fetch("/api/income")
      setIncomes(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function onSubmit(data: any) {
    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success("Ingreso registrado")
      setOpen(false)
      reset()
      loadIncomes()
    } catch {
      toast.error("Error al registrar")
    }
  }

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const recurringIncome = incomes.filter(i => i.isRecurring).reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Ingresos</h1>
          <p className="text-muted-foreground mt-1">
            {incomes.length} registros · {formatCurrency(recurringIncome)}/mes recurrentes
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Nuevo Ingreso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Ingreso</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto</label>
                  <Input type="number" step="0.01" {...register("amount", { required: true })} placeholder="15000" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha</label>
                  <Input type="date" {...register("date")} defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <Input {...register("description")} placeholder="Sueldo mensual" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fuente</label>
                <select {...register("source")} className="flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  {incomeSources.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" {...register("isRecurring")} id="recurring" className="rounded border-border" />
                <label htmlFor="recurring" className="text-sm">Ingreso recurrente</label>
              </div>
              <Button type="submit" className="w-full">Guardar Ingreso</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Total Ingresos", value: formatCurrency(totalIncome), subtitle: "todos los registros", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { title: "Ingresos Recurrentes", value: formatCurrency(recurringIncome), subtitle: "por mes", icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Promedio por registro", value: formatCurrency(incomes.length > 0 ? totalIncome / incomes.length : 0), subtitle: "por transacción", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
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
            {incomes.length === 0 && !loading && (
              <div className="p-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No hay ingresos registrados</h3>
                <p className="text-muted-foreground mb-4">Agrega tu primer ingreso</p>
                <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Agregar Ingreso</Button>
              </div>
            )}
            {incomes.map((income) => {
              const SourceIcon = incomeSources.find(s => s.value === income.source)?.icon || TrendingUp
              return (
                <div key={income.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10">
                      <SourceIcon className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium">{income.description || income.source}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(income.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {income.isRecurring && <Badge variant="success">Recurrente</Badge>}
                    <p className="text-lg font-bold text-emerald-500">+{formatCurrency(income.amount)}</p>
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
