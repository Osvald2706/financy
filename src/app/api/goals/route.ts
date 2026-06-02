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
    const goals = await prisma.goal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(goals)
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
    const { name, type, targetAmount, deadline, icon, color, notes } = body

    if (!name || !targetAmount) {
      return NextResponse.json({ error: "Nombre y monto requeridos" }, { status: 400 })
    }

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        name,
        type: type || "savings",
        targetAmount: parseFloat(targetAmount),
        deadline: deadline ? new Date(deadline) : null,
        icon: icon || "target",
        color: color || "emerald",
        notes,
      },
    })
    return NextResponse.json(goal)
  } catch {
    return NextResponse.json({ error: "Error al crear" }, { status: 500 })
  }
}
