import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Helper to recalculate all balances
async function recalculateBalances() {
  const allLogs = await prisma.pettyCashLog.findMany({
    orderBy: [{ date: "asc" }, { createdAt: "asc" }]
  });
  
  let runningBalance = 0;
  for (const log of allLogs) {
    runningBalance = runningBalance + Number(log.credit) - Number(log.debit);
    if (Number(log.balance) !== runningBalance) {
      await prisma.pettyCashLog.update({
        where: { id: log.id },
        data: { balance: runningBalance }
      });
    }
  }
}

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
    const { date, description, credit, debit } = body;

    const record = await prisma.pettyCashLog.update({
      where: { id: resolvedParams.id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(description !== undefined && { description }),
        ...(credit !== undefined && { credit }),
        ...(debit !== undefined && { debit }),
      },
    });

    // Recalculate balances since credit/debit or date might have changed
    await recalculateBalances();

    return NextResponse.json(record);
  } catch (error) {
    console.error("[PETTY_CASH_PUT]", error);
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

    await prisma.pettyCashLog.delete({
      where: { id: resolvedParams.id },
    });

    // Recalculate balances after deletion
    await recalculateBalances();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PETTY_CASH_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
