import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { analyzeFinances } from "@/lib/ai"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id

    const [debts, income, expenses, goals, user] = await Promise.all([
      prisma.debt.findMany({ where: { userId } }),
      prisma.income.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 100 }),
      prisma.expense.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 100 }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ])

    const analysis = await analyzeFinances({
      debts: debts.map(d => ({
        name: d.name,
        creditor: d.creditor,
        totalAmount: d.totalAmount,
        paidAmount: d.paidAmount,
        interestRate: d.interestRate,
        minimumPayment: d.minimumPayment,
        dueDate: d.dueDate?.toISOString() || null,
        status: d.status,
      })),
      income: income.map(i => ({
        amount: i.amount,
        source: i.source,
        date: i.date.toISOString(),
        isRecurring: i.isRecurring,
      })),
      expenses: expenses.map(e => ({
        amount: e.amount,
        description: e.description || "",
        category: e.categoryId || "other",
        date: e.date.toISOString(),
        isEssential: e.isEssential,
      })),
      goals: goals.map(g => ({
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        deadline: g.deadline?.toISOString() || null,
      })),
      monthlyIncome: user?.monthlyIncome || 0,
    })

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("AI analysis error:", error)
    return NextResponse.json({ error: "Error al analizar" }, { status: 500 })
  }
}
