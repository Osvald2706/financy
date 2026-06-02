import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id

    const [debts, incomes, expenses, goals, user] = await Promise.all([
      prisma.debt.findMany({ where: { userId } }),
      prisma.income.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 50 }),
      prisma.expense.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 50 }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ])

    const totalDebt = debts.reduce((sum, d) => sum + d.totalAmount, 0)
    const totalPaid = debts.reduce((sum, d) => sum + d.paidAmount, 0)
    const remainingDebt = totalDebt - totalPaid
    const monthlyIncome = incomes
      .filter(i => i.isRecurring)
      .reduce((sum, i) => sum + i.amount, 0)
    const monthlyExpenses = expenses
      .filter(e => e.isRecurring)
      .reduce((sum, e) => sum + e.amount, 0)
    const cashFlow = monthlyIncome - monthlyExpenses
    const disposableIncome = monthlyIncome - monthlyExpenses
    const debtFreeProgress = totalDebt > 0 ? Math.round((totalPaid / totalDebt) * 100) : 100
    const activeDebts = debts.filter(d => d.status === "active").length
    const paidDebts = debts.filter(d => d.status === "paid").length

    const now = new Date()
    const upcomingPayments = debts.filter(d => {
      if (!d.dueDate || d.status !== "active") return false
      const due = new Date(d.dueDate)
      const diff = due.getTime() - now.getTime()
      const days = diff / (1000 * 60 * 60 * 24)
      return days >= 0 && days <= 30
    }).length

    const totalGoals = goals.length
    const goalsCompleted = goals.filter(g => g.status === "completed").length

    return NextResponse.json({
      totalDebt,
      totalPaid,
      remainingDebt,
      monthlyIncome: user?.monthlyIncome || monthlyIncome,
      monthlyExpenses,
      disposableIncome,
      debtFreeProgress,
      activeDebts,
      paidDebts,
      upcomingPayments,
      totalGoals,
      goalsCompleted,
      cashFlow,
    })
  } catch (error) {
    console.error("Dashboard summary error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
