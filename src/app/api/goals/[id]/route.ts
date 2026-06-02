import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

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
    const goal = await prisma.goal.updateMany({
      where: { id: params.id, userId: session.user.id },
      data: {
        currentAmount: body.currentAmount !== undefined ? parseFloat(body.currentAmount) : undefined,
        status: body.status,
        name: body.name,
        targetAmount: body.targetAmount ? parseFloat(body.targetAmount) : undefined,
      },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
