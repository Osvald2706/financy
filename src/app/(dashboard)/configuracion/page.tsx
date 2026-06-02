"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Mail, DollarSign, Save, Loader2, Palette, Bell, Shield } from "lucide-react"
import toast from "react-hot-toast"

export default function ConfiguracionPage() {
  const { data: session } = useSession()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    monthlyIncome: "",
  })

  useEffect(() => {
    if (session?.user) {
      setForm(f => ({ ...f, name: session.user?.name || "", email: session.user?.email || "" }))
      fetch("/api/user").then(r => r.json()).then(data => {
        if (data.monthlyIncome) setForm(f => ({ ...f, monthlyIncome: String(data.monthlyIncome) }))
      }).catch(() => {})
    }
  }, [session])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          monthlyIncome: form.monthlyIncome ? parseFloat(form.monthlyIncome) : 0,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Configuración guardada")
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-1">Personaliza tu experiencia</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    value={form.email}
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Finanzas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ingreso Mensual</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    type="number"
                    placeholder="Ej: 25000"
                    value={form.monthlyIncome}
                    onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Usado para cálculos de flujo de efectivo</p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Apariencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tema Oscuro</span>
                <div className="w-10 h-6 rounded-full bg-primary flex items-center px-1 cursor-pointer">
                  <div className="w-4 h-4 rounded-full bg-white ml-auto" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Recordatorios de pago</span>
                <div className="w-10 h-6 rounded-full bg-primary flex items-center px-1 cursor-pointer">
                  <div className="w-4 h-4 rounded-full bg-white ml-auto" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Alertas de vencimiento</span>
                <div className="w-10 h-6 rounded-full bg-muted flex items-center px-1 cursor-pointer">
                  <div className="w-4 h-4 rounded-full bg-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tus datos están encriptados y protegidos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
