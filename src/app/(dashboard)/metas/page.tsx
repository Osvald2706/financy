"use client"

import { useState, useEffect } from "react"
import { GoalType } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency, formatDate, calculateProgress } from "@/lib/utils"
import { Plus, Target, PiggyBank, TrendingUp, Shield, CheckCircle2, Clock, Trophy, Sparkles } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"

const goalTypes = [
  { value: "savings", label: "Ahorro", icon: PiggyBank, color: "emerald" },
  { value: "debt_free", label: "Libre de Deudas", icon: CheckCircle2, color: "rose" },
  { value: "investment", label: "Inversión", icon: TrendingUp, color: "blue" },
  { value: "emergency_fund", label: "Fondo de Emergencia", icon: Shield, color: "amber" },
  { value: "custom", label: "Personalizada", icon: Sparkles, color: "purple" },
]

export default function MetasPage() {
  const [goals, setGoals] = useState<GoalType[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => { loadGoals() }, [])

  async function loadGoals() {
    try {
      const res = await fetch("/api/goals")
      setGoals(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function onSubmit(data: any) {
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success("Meta creada")
      setOpen(false)
      reset()
      loadGoals()
    } catch {
      toast.error("Error al crear meta")
    }
  }

  async function updateProgress(goal: GoalType, amount: number) {
    const newCurrent = goal.currentAmount + amount
    const status = newCurrent >= goal.targetAmount ? "completed" : "active"
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAmount: newCurrent, status }),
      })
      if (res.ok) {
        toast.success(status === "completed" ? "¡Meta completada!" : "Progreso actualizado")
        loadGoals()
      }
    } catch {
      toast.error("Error al actualizar")
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Metas Financieras</h1>
          <p className="text-muted-foreground mt-1">
            {goals.filter(g => g.status === "active").length} activas · {goals.filter(g => g.status === "completed").length} completadas
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Nueva Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Meta Financiera</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input {...register("name", { required: true })} placeholder="Ej: Fondo de emergencia" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto Objetivo</label>
                  <Input type="number" step="0.01" {...register("targetAmount", { required: true })} placeholder="50000" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha Límite</label>
                  <Input type="date" {...register("deadline")} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <select {...register("type")} className="flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  {goalTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas</label>
                <Textarea {...register("notes")} placeholder="¿Por qué es importante esta meta?" />
              </div>
              <Button type="submit" className="w-full">Crear Meta</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Metas Activas", value: goals.filter(g => g.status === "active").length, icon: Target, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Completadas", value: goals.filter(g => g.status === "completed").length, icon: Trophy, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { title: "Ahorro Total", value: formatCurrency(goals.reduce((s, g) => s + g.currentAmount, 0)), icon: PiggyBank, color: "text-purple-500", bg: "bg-purple-500/10" },
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const progress = calculateProgress(goal.currentAmount, goal.targetAmount)
          const GoalIcon = goalTypes.find(t => t.value === goal.type)?.icon || Target
          const isCompleted = goal.status === "completed"

          return (
            <Card key={goal.id} className={`card-hover ${isCompleted ? "border-emerald-500/30" : ""}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                      isCompleted ? "bg-emerald-500/10" : "bg-primary/10"
                    }`}>
                      <GoalIcon className={`h-6 w-6 ${isCompleted ? "text-emerald-500" : "text-primary"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{goal.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {goalTypes.find(t => t.value === goal.type)?.label || goal.type}
                      </p>
                    </div>
                  </div>
                  <Badge variant={isCompleted ? "success" : goal.status === "cancelled" ? "destructive" : "default"}>
                    {isCompleted ? "Completada" : goal.status === "active" ? "En progreso" : "Cancelada"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} indicatorColor={isCompleted ? "#10b981" : "#3b82f6"} />
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(goal.currentAmount)}</p>
                    <p className="text-xs text-muted-foreground">de {formatCurrency(goal.targetAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(goal.targetAmount - goal.currentAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">restantes</p>
                  </div>
                </div>

                {goal.deadline && (
                  <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Fecha límite: {formatDate(goal.deadline)}</span>
                  </div>
                )}

                {!isCompleted && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const amount = prompt("¿Cuánto deseas agregar?", "1000")
                        if (amount) updateProgress(goal, parseFloat(amount))
                      }}
                    >
                      + Agregar Progreso
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {goals.length === 0 && !loading && (
          <Card className="md:col-span-2">
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No hay metas financieras</h3>
              <p className="text-muted-foreground mb-4">Define metas para mantenerte motivado</p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Crear Primera Meta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
