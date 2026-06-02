import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const { amount } = await req.json()
    
    const payment = await prisma.debtPayment.create({
      data: {
        debtId: params.id,
        amount: parseFloat(amount),
      },
    })
    return NextResponse.json(payment)
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
