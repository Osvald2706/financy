import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const debt = await prisma.debt.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { payments: { orderBy: { date: "desc" } } },
    })
    if (!debt) {
      return NextResponse.json({ error: "Deuda no encontrada" }, { status: 404 })
    }
    return NextResponse.json(debt)
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const body = await req.json()
    const debt = await prisma.debt.updateMany({
      where: { id: params.id, userId: session.user.id },
      data: {
        name: body.name,
        creditor: body.creditor,
        type: body.type,
        totalAmount: body.totalAmount ? parseFloat(body.totalAmount) : undefined,
        interestRate: body.interestRate !== undefined ? parseFloat(body.interestRate) : undefined,
        minimumPayment: body.minimumPayment ? parseFloat(body.minimumPayment) : undefined,
        paidAmount: body.paidAmount ? parseFloat(body.paidAmount) : undefined,
        status: body.status,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        notes: body.notes,
      },
    })
    return NextResponse.json({ success: true, updated: debt.count })
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    await prisma.debt.deleteMany({
      where: { id: params.id, userId: session.user.id },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
