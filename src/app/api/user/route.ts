import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const body = await req.json()
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: body.name,
        monthlyIncome: body.monthlyIncome ? parseFloat(body.monthlyIncome) : undefined,
        openrouterApiKey: body.openrouterApiKey !== undefined ? body.openrouterApiKey : undefined,
      },
    })
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      monthlyIncome: user.monthlyIncome,
      openrouterApiKey: user.openrouterApiKey,
    })
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, monthlyIncome: true, currency: true, createdAt: true, openrouterApiKey: true },
    })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
