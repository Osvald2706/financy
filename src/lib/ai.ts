import OpenAI from "openai"

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  defaultHeaders: {
    "HTTP-Referer": "https://financy.app",
    "X-Title": "Financy",
  },
})

export interface AIAnalysisRequest {
  debts: {
    name: string
    creditor: string
    totalAmount: number
    paidAmount: number
    interestRate: number
    minimumPayment: number
    dueDate: string | null
    status: string
  }[]
  income: {
    amount: number
    source: string
    date: string
    isRecurring: boolean
  }[]
  expenses: {
    amount: number
    description: string
    category: string
    date: string
    isEssential: boolean
  }[]
  goals: {
    name: string
    targetAmount: number
    currentAmount: number
    deadline: string | null
  }[]
  monthlyIncome: number
}

export interface AIAnalysisResponse {
  summary: string
  totalDebt: number
  disposableIncome: number
  debtFreeDate: string
  recommendations: string[]
  unnecessaryExpenses: string[]
  priorityPayments: { name: string; reason: string; amount: number }[]
  savingsPotential: number
  riskLevel: "low" | "medium" | "high"
}

function createClient(apiKey?: string) {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey || process.env.OPENROUTER_API_KEY || "",
    defaultHeaders: {
      "HTTP-Referer": "https://financy.app",
      "X-Title": "Financy",
    },
  })
}

export async function analyzeFinances(data: AIAnalysisRequest, userApiKey?: string): Promise<AIAnalysisResponse> {
  const apiKey = userApiKey || process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return getLocalAnalysis(data)
  }

  const client = createClient(apiKey)

  try {
    const prompt = `Eres un asesor financiero experto. Analiza estas finanzas personales y proporciona recomendaciones.

DATOS FINANCIEROS:
- Ingreso mensual: $${data.monthlyIncome.toFixed(2)}
- Total deudas: ${data.debts.length}
- Total ingresos registrados: ${data.income.length}
- Total gastos registrados: ${data.expenses.length}

DEUDAS:
${data.debts.map(d => `- ${d.name} (${d.creditor}): $${d.totalAmount} total, $${d.paidAmount} pagado, ${d.interestRate}% interés, pago mínimo $${d.minimumPayment}, vence ${d.dueDate || "N/A"}, estado: ${d.status}`).join("\n")}

INGRESOS:
${data.income.map(i => `- $${i.amount} de ${i.source} el ${i.date}${i.isRecurring ? " (recurrente)" : ""}`).join("\n")}

GASTOS:
${data.expenses.map(e => `- $${e.amount} en ${e.description || e.category}${e.isEssential ? " (esencial)" : " (no esencial)"} el ${e.date}`).join("\n")}

METAS:
${data.goals.map(g => `- ${g.name}: $${g.currentAmount} de $${g.targetAmount}${g.deadline ? ` para ${g.deadline}` : ""}`).join("\n")}

Responde en español con el siguiente JSON (sin markdown):
{
  "summary": "resumen ejecutivo de 2-3 oraciones",
  "totalDebt": número_total_deuda,
  "disposableIncome": ingreso_disponible_después_de_gastos_esenciales,
  "debtFreeDate": "fecha estimada libre de deudas (YYYY-MM-DD o 'No estimada')",
  "recommendations": ["recomendación 1", "recomendación 2", ...],
  "unnecessaryExpenses": ["gasto 1", "gasto 2", ...],
  "priorityPayments": [{"name": "deuda", "reason": "razón", "amount": monto}],
  "savingsPotential": monto_ahorro_potencial_mensual,
  "riskLevel": "low|medium|high"
}`

    const completion = await client.chat.completions.create({
      model: "qwen/qwen3-30b-a3b:free",
      messages: [
        { role: "system", content: "Eres un asesor financiero experto en finanzas personales. Responde SIEMPRE con JSON válido sin markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    })

    const responseText = completion.choices[0]?.message?.content || "{}"
    const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error("OpenRouter API error:", error)
    return getLocalAnalysis(data)
  }
}

function getLocalAnalysis(data: AIAnalysisRequest): AIAnalysisResponse {
  const totalDebt = data.debts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0)
  const essentialExpenses = data.expenses.filter(e => e.isEssential).reduce((sum, e) => sum + e.amount, 0)
  const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0)
  const disposableIncome = Math.max(0, data.monthlyIncome - essentialExpenses)
  const unnecessaryExpenses = data.expenses.filter(e => !e.isEssential).map(e => `${e.description || e.category}: $${e.amount}`)

  const sortedByInterest = [...data.debts].sort((a, b) => b.interestRate - a.interestRate)
  const priorityPayments = sortedByInterest.slice(0, 3).map(d => ({
    name: d.name,
    reason: `Tasa de interés más alta (${d.interestRate}%)`,
    amount: d.minimumPayment || d.totalAmount * 0.05,
  }))

  const recommendations: string[] = []
  if (totalDebt > 0) {
    recommendations.push(`Prioriza el pago de "${sortedByInterest[0]?.name || 'tu deuda con mayor interés'}" para minimizar intereses.`)
  }
  if (disposableIncome > 0) {
    recommendations.push(`Destina $${disposableIncome.toFixed(2)} mensuales al pago de deudas para acelerar tu libertad financiera.`)
  }
  if (unnecessaryExpenses.length > 0) {
    recommendations.push(`Reduce gastos innecesarios como ${unnecessaryExpenses.slice(0, 3).join(", ")}.`)
  }
  if (data.goals.length > 0) {
    recommendations.push(`Avanza en tu meta "${data.goals[0].name}" — llevas $${data.goals[0].currentAmount} de $${data.goals[0].targetAmount}.`)
  }

  let riskLevel: "low" | "medium" | "high" = "low"
  const debtToIncome = totalDebt / (data.monthlyIncome || 1)
  if (debtToIncome > 12) riskLevel = "high"
  else if (debtToIncome > 4) riskLevel = "medium"

  return {
    summary: `Tienes una deuda total de $${totalDebt.toFixed(2)}. Tu ingreso disponible mensual es de $${disposableIncome.toFixed(2)}. ${riskLevel === "high" ? "Tu nivel de endeudamiento es alto, requiere acción inmediata." : riskLevel === "medium" ? "Tu nivel de endeudamiento es moderado, mantén el control." : "Tu situación financiera es manejable."}`,
    totalDebt,
    disposableIncome,
    debtFreeDate: disposableIncome > 0 && totalDebt > 0
      ? new Date(Date.now() + (totalDebt / disposableIncome) * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      : "Hoy (sin deudas)",
    recommendations,
    unnecessaryExpenses,
    priorityPayments,
    savingsPotential: Math.max(0, data.monthlyIncome - totalExpenses),
    riskLevel,
  }
}
