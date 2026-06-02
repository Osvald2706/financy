import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import OpenAI from "openai"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { message } = await req.json()
    if (!message) {
      return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 })
    }

    const userId = session.user.id
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const apiKey = user?.openrouterApiKey || process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        reply: "No has configurado una API key de OpenRouter. Ve a Configuración > Inteligencia Artificial para agregar tu key y activar el asistente.",
      })
    }

    const [debts, income, expenses, goals] = await Promise.all([
      prisma.debt.findMany({ where: { userId } }),
      prisma.income.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 50 }),
      prisma.expense.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 50 }),
      prisma.goal.findMany({ where: { userId } }),
    ])

    const contextData = `
Resumen financiero del usuario:
- Ingreso mensual: $${user?.monthlyIncome || 0}
- Total deudas: ${debts.length} ($${debts.reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0).toFixed(2)} pendiente)
- Total gastos registrados: ${expenses.length}
- Total ingresos registrados: ${income.length}
- Metas activas: ${goals.filter(g => g.status === "active").length}

Deudas:
${debts.map(d => `- ${d.name}: $${d.totalAmount - d.paidAmount} pendiente, ${d.interestRate}% interés, estado: ${d.status}`).join("\n")}

Gastos recientes:
${expenses.slice(0, 10).map(e => `- $${e.amount} - ${e.description || "sin desc"}`).join("\n")}

Ingresos recientes:
${income.slice(0, 10).map(i => `- $${i.amount} - ${i.source}`).join("\n")}

Metas:
${goals.map(g => `- ${g.name}: $${g.currentAmount} de $${g.targetAmount} (${g.status})`).join("\n")}
`

    const client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer": "https://financy.app",
        "X-Title": "Financy",
      },
    })

    const completion = await client.chat.completions.create({
      model: "qwen/qwen3-30b-a3b:free",
      messages: [
        {
          role: "system",
          content: `Eres un asesor financiero experto y amable. Usas los datos del usuario para responder sus preguntas sobre finanzas personales.
Siempre respondes en español de forma clara, concisa y útil.

Contexto actual del usuario:
${contextData}

Responde de manera natural y conversacional. Si te preguntan algo fuera de finanzas, redirige amablemente al tema financiero.`,
        },
        { role: "user", content: message },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    })

    const reply = completion.choices[0]?.message?.content || "Lo siento, no pude procesar tu pregunta."

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("AI chat error:", error)
    return NextResponse.json({ reply: "Ocurrió un error al procesar tu mensaje. Intenta de nuevo." })
  }
}
