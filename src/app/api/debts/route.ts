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
    const debts = await prisma.debt.findMany({
      where: { userId: session.user.id },
      include: { payments: { orderBy: { date: "desc" } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(debts)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener deudas" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const body = await req.json()
    const { name, creditor, type, totalAmount, interestRate, minimumPayment, dueDate, notes } = body

    if (!name || !creditor || !totalAmount) {
      return NextResponse.json({ error: "Nombre, acreedor y monto son requeridos" }, { status: 400 })
    }

    const debt = await prisma.debt.create({
      data: {
        userId: session.user.id,
        name,
        creditor,
        type: type || "personal",
        totalAmount: parseFloat(totalAmount),
        interestRate: parseFloat(interestRate || 0),
        minimumPayment: parseFloat(minimumPayment || 0),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
      },
    })
    return NextResponse.json(debt)
  } catch (error) {
    console.error("Create debt error:", error)
    return NextResponse.json({ error: "Error al crear deuda" }, { status: 500 })
  }
}
