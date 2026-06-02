"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardSummary } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatRelative, getDueDateStatus } from "@/lib/utils"
import { 
  Wallet, TrendingUp, TrendingDown, PiggyBank, AlertTriangle, 
  Calendar, ArrowRight, Brain, Target, Plus, RefreshCw, Loader2,
  CreditCard, DollarSign, BarChart3
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import Link from "next/link"
import toast from "react-hot-toast"

const COLORS = { primary: "#10b981", warning: "#f59e0b", destructive: "#ef4444", info: "#3b82f6" }

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login")
    if (status === "authenticated") loadSummary()
  }, [status])

  async function loadSummary() {
    try {
      const res = await fetch("/api/dashboard/summary")
      const data = await res.json()
      setSummary(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function runAIAnalysis() {
    setAiLoading(true)
    toast.loading("Analizando tus finanzas...", { id: "ai" })
    try {
      const res = await fetch("/api/ai/analyze")
      const data = await res.json()
      setAiAnalysis(data)
      toast.success("Análisis completado", { id: "ai" })
    } catch {
      toast.error("Error al analizar finanzas", { id: "ai" })
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const stats = [
    {
      title: "Deuda Total",
      value: formatCurrency(summary?.totalDebt || 0),
      subtitle: `${summary?.activeDebts || 0} deudas activas`,
      icon: Wallet,
      color: "destructive",
      gradient: "gradient-destructive",
    },
    {
      title: "Ingreso Mensual",
      value: formatCurrency(summary?.monthlyIncome || 0),
      subtitle: "+" + formatCurrency(summary?.cashFlow || 0) + " flujo neto",
      icon: TrendingUp,
      color: "success",
      gradient: "gradient-primary",
    },
    {
      title: "Gastos Mensuales",
      value: formatCurrency(summary?.monthlyExpenses || 0),
      subtitle: "de " + formatCurrency(summary?.disposableIncome || 0) + " disponible",
      icon: TrendingDown,
      color: "warning",
      gradient: "gradient-warning",
    },
    {
      title: "Deuda Restante",
      value: formatCurrency(summary?.remainingDebt || 0),
      subtitle: `${summary?.debtFreeProgress || 0}% pagado`,
      icon: PiggyBank,
      color: "info",
      gradient: "gradient-info",
    },
  ]

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenido, {session?.user?.name || "Usuario"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={runAIAnalysis} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            <span className="hidden sm:inline ml-2">Analizar con IA</span>
          </Button>
          <Button size="sm" onClick={loadSummary}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {aiAnalysis && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl gradient-primary shrink-0">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="font-semibold text-lg">Análisis Inteligente</h3>
                <p className="text-muted-foreground">{aiAnalysis.summary}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={aiAnalysis.riskLevel === "high" ? "destructive" : aiAnalysis.riskLevel === "medium" ? "warning" : "success"}>
                    Riesgo: {aiAnalysis.riskLevel === "high" ? "Alto" : aiAnalysis.riskLevel === "medium" ? "Medio" : "Bajo"}
                  </Badge>
                  <Badge variant="info">
                    Libre de deudas: {aiAnalysis.debtFreeDate}
                  </Badge>
                  <Badge variant="success">
                    Ahorro potencial: {formatCurrency(aiAnalysis.savingsPotential)}/mes
                  </Badge>
                </div>
                {aiAnalysis.recommendations.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-primary">Recomendaciones:</p>
                    <ul className="space-y-1">
                      {aiAnalysis.recommendations.map((r: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="card-hover relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${stat.gradient}`} />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${stat.gradient}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Flujo de Efectivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getCashFlowData()}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Distribución de Deudas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getDebtDistribution()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {getDebtDistribution().map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(222 47% 14%)",
                      border: "1px solid hsl(217 33% 18%)",
                      borderRadius: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {getDebtDistribution().map((entry, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Progreso de Metas
            </CardTitle>
            <Link href="/metas">
              <Button variant="ghost" size="sm">Ver todas</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary && summary.totalGoals > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Metas completadas</span>
                  <span className="font-medium">{summary.goalsCompleted}/{summary.totalGoals}</span>
                </div>
                <Progress value={(summary.goalsCompleted / summary.totalGoals) * 100} />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tienes metas financieras aún</p>
                <Link href="/metas">
                  <Button variant="link" className="mt-2">Crear tu primera meta</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Próximos Pagos
            </CardTitle>
            <Link href="/calendario">
              <Button variant="ghost" size="sm">Ver calendario</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {summary && summary.upcomingPayments > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Tienes <span className="text-foreground font-medium">{summary.upcomingPayments}</span> pagos próximos
                </p>
                <Link href="/deudas">
                  <Button variant="outline" size="sm" className="w-full">
                    <Wallet className="h-4 w-4 mr-2" />
                    Ir a deudas
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay pagos próximos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getCashFlowData() {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]
  return months.map(m => ({
    month: m,
    income: Math.floor(Math.random() * 30000 + 20000),
    expenses: Math.floor(Math.random() * 15000 + 10000),
  }))
}

function getDebtDistribution() {
  return [
    { name: "Bancos", value: 35, color: "#ef4444" },
    { name: "Tarjetas", value: 25, color: "#f59e0b" },
    { name: "Personales", value: 20, color: "#3b82f6" },
    { name: "Otros", value: 20, color: "#8b5cf6" },
  ]
}
