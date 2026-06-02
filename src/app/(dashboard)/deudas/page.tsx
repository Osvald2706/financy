"use client"

import { useState, useEffect } from "react"
import { DebtType, DebtPaymentType } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency, formatDate, getDueDateStatus, calculateProgress } from "@/lib/utils"
import { Plus, Wallet, Banknote, CreditCard, Building, GraduationCap, Car, MoreHorizontal, Trash2, PiggyBank, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"

const debtTypes = [
  { value: "personal", label: "Personal", icon: Wallet },
  { value: "bank", label: "Bancaria", icon: Banknote },
  { value: "credit_card", label: "Tarjeta de Crédito", icon: CreditCard },
  { value: "mortgage", label: "Hipoteca", icon: Building },
  { value: "student", label: "Estudiantil", icon: GraduationCap },
  { value: "car", label: "Automóvil", icon: Car },
  { value: "other", label: "Otra", icon: MoreHorizontal },
]

export default function DeudasPage() {
  const [debts, setDebts] = useState<DebtType[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState<string | null>(null)
  const { register, handleSubmit, reset, watch } = useForm()

  useEffect(() => { loadDebts() }, [])

  async function loadDebts() {
    try {
      const res = await fetch("/api/debts")
      const data = await res.json()
      setDebts(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function onSubmit(data: any) {
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success("Deuda registrada")
      setOpen(false)
      reset()
      loadDebts()
    } catch {
      toast.error("Error al registrar")
    }
  }

  async function deleteDebt(id: string) {
    if (!confirm("¿Eliminar esta deuda?")) return
    try {
      await fetch(`/api/debts/${id}`, { method: "DELETE" })
      toast.success("Deuda eliminada")
      loadDebts()
    } catch {
      toast.error("Error al eliminar")
    }
  }

  async function addPayment(debtId: string, amount: number) {
    try {
      const debt = debts.find(d => d.id === debtId)
      if (!debt) return
      const newPaid = debt.paidAmount + amount
      const status = newPaid >= debt.totalAmount ? "paid" : "active"
      
      const res = await fetch(`/api/debts/${debtId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: newPaid, status }),
      })
      
      if (res.ok) {
        // Register the payment
        await fetch(`/api/debts/${debtId}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        })
        
        toast.success(status === "paid" ? "¡Deuda pagada!" : "Pago registrado")
        setPaymentOpen(null)
        loadDebts()
      }
    } catch {
      toast.error("Error al registrar pago")
    }
  }

  const totalDebt = debts.reduce((s, d) => s + d.totalAmount, 0)
  const totalPaid = debts.reduce((s, d) => s + d.paidAmount, 0)
  const activeDebts = debts.filter(d => d.status === "active")

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Deudas</h1>
          <p className="text-muted-foreground mt-1">
            {activeDebts.length} deudas activas · {formatCurrency(totalDebt)} total
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Deuda
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Deuda</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre</label>
                  <Input {...register("name", { required: true })} placeholder="Ej: Préstamo BBVA" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Acreedor</label>
                  <Input {...register("creditor", { required: true })} placeholder="Ej: BBVA" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto Total</label>
                  <Input type="number" step="0.01" {...register("totalAmount", { required: true })} placeholder="100000" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tasa de Interés (%)</label>
                  <Input type="number" step="0.01" {...register("interestRate")} placeholder="15" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pago Mínimo</label>
                  <Input type="number" step="0.01" {...register("minimumPayment")} placeholder="5000" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha de Vencimiento</label>
                  <Input type="date" {...register("dueDate")} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <select {...register("type")} className="flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  {debtTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas</label>
                <Textarea {...register("notes")} placeholder="Notas adicionales..." />
              </div>
              <Button type="submit" className="w-full">Guardar Deuda</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Deuda Total", value: formatCurrency(totalDebt), icon: Wallet, color: "destructive" },
          { title: "Pagado", value: formatCurrency(totalPaid), icon: CheckCircle2, color: "success" },
          { title: "Restante", value: formatCurrency(totalDebt - totalPaid), icon: AlertTriangle, color: "warning" },
        ].map((s) => (
          <Card key={s.title}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-${s.color === "destructive" ? "red" : s.color === "success" ? "emerald" : "amber"}-500/10`}>
                  <s.icon className={`h-5 w-5 text-${s.color === "destructive" ? "red" : s.color === "success" ? "emerald" : "amber"}-500`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.title}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {debts.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No hay deudas registradas</h3>
              <p className="text-muted-foreground mb-4">Agrega tu primera deuda para comenzar</p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Registrar Deuda
              </Button>
            </CardContent>
          </Card>
        )}

        {debts.map((debt) => {
          const progress = calculateProgress(debt.paidAmount, debt.totalAmount)
          const dueStatus = getDueDateStatus(debt.dueDate)
          const TypeIcon = debtTypes.find(t => t.value === debt.type)?.icon || Wallet

          return (
            <Card key={debt.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${
                      debt.status === "paid" ? "bg-emerald-500/10" : "bg-rose-500/10"
                    }`}>
                      <TypeIcon className={`h-6 w-6 ${debt.status === "paid" ? "text-emerald-500" : "text-rose-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{debt.name}</h3>
                        <Badge variant={debt.status === "paid" ? "success" : debt.status === "active" ? "warning" : "destructive"}>
                          {debt.status === "paid" ? "Pagada" : debt.status === "active" ? "Activa" : debt.status}
                        </Badge>
                        <Badge variant={dueStatus.variant}>{dueStatus.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {debt.creditor} · {debt.interestRate > 0 && `${debt.interestRate}% interés`}
                      </p>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-medium">{formatCurrency(debt.paidAmount)} / {formatCurrency(debt.totalAmount)}</span>
                        </div>
                        <Progress value={progress} indicatorColor={debt.status === "paid" ? "#10b981" : debt.status === "active" ? "#f59e0b" : "#ef4444"} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-xl font-bold">{formatCurrency(debt.totalAmount - debt.paidAmount)}</p>
                    <div className="flex gap-1">
                      <Dialog open={paymentOpen === debt.id} onOpenChange={(o) => setPaymentOpen(o ? debt.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="success" size="sm">
                            <PiggyBank className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Pagar</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Registrar Pago - {debt.name}</DialogTitle>
                          </DialogHeader>
                          <PaymentForm debt={debt} onSubmit={addPayment} />
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon-sm" onClick={() => deleteDebt(debt.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function PaymentForm({ debt, onSubmit }: { debt: DebtType; onSubmit: (id: string, amount: number) => void }) {
  const [amount, setAmount] = useState(debt.minimumPayment || debt.totalAmount * 0.05)
  const remaining = debt.totalAmount - debt.paidAmount

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Monto del pago</label>
        <Input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Restante: {formatCurrency(remaining)}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setAmount(debt.minimumPayment || 0)}>
          Mínimo ({formatCurrency(debt.minimumPayment)})
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => setAmount(remaining)}>
          Total ({formatCurrency(remaining)})
        </Button>
      </div>
      <Button className="w-full" onClick={() => onSubmit(debt.id, amount)} disabled={amount <= 0 || amount > remaining}>
        {amount >= remaining ? "✓ Liquidar Deuda" : "Registrar Pago"}
      </Button>
    </div>
  )
}
