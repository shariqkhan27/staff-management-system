import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "HR_MANAGER" && session.user.role !== "FINANCE_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { categoryId, amount, date, description, receiptUrl } = body;

    const record = await prisma.expense.update({
      where: { id: resolvedParams.id },
      data: {
        ...(categoryId && { categoryId }),
        ...(amount && { amount }),
        ...(date && { date: new Date(date) }),
        ...(description !== undefined && { description }),
        ...(receiptUrl !== undefined && { receiptUrl }),
      },
      include: {
        category: true,
        addedBy: {
          include: {
            employee: true
          }
        }
      }
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("[EXPENSE_PUT]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "HR_MANAGER" && session.user.role !== "FINANCE_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.expense.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[EXPENSE_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
