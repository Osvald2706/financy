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
    const expenses = await prisma.expense.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    })
    return NextResponse.json(expenses)
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const body = await req.json()
    const { amount, description, category, date, isRecurring, frequency, isEssential } = body

    if (!amount) {
      return NextResponse.json({ error: "Monto requerido" }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        amount: parseFloat(amount),
        description,
        categoryId: category,
        date: date ? new Date(date) : new Date(),
        isRecurring: isRecurring || false,
        frequency: isRecurring ? frequency : null,
        isEssential: isEssential !== undefined ? isEssential : true,
      },
    })
    return NextResponse.json(expense)
  } catch {
    return NextResponse.json({ error: "Error al crear" }, { status: 500 })
  }
}
