import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { pettyCashSchema } from "@/lib/validators/finance";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "HR_MANAGER" && session.user.role !== "FINANCE_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const records = await prisma.pettyCashLog.findMany({
      orderBy: { date: "desc" },
      take: 100,
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("[PETTY_CASH_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "HR_MANAGER" && session.user.role !== "FINANCE_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const result = pettyCashSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data", details: result.error.format() }, { status: 400 });
    }

    const data = result.data;
    
    // Wrap in a Serializable transaction to prevent race conditions
    const record = await prisma.$transaction(async (tx) => {
      // Get the last log to calculate the new balance
      const lastLog = await tx.pettyCashLog.findFirst({
        orderBy: [{ date: "desc" }, { createdAt: "desc" }]
      });
      
      const previousBalance = lastLog ? Number(lastLog.balance) : 0;
      const newBalance = previousBalance + data.credit - data.debit;

      const pettyCash = await tx.pettyCashLog.create({
        data: {
          date: new Date(data.date),
          description: data.description,
          credit: data.credit,
          debit: data.debit,
          balance: newBalance
        },
      });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          action: data.credit > 0 ? "PETTY_CASH_ADDED" : "PETTY_CASH_EXPENSE",
          entity: "PettyCash",
          entityId: pettyCash.id,
          changes: {
            module: "FINANCE",
            details: `Petty cash ${data.credit > 0 ? 'added' : 'spent'}: ${data.credit || data.debit} for ${data.description}`,
          },
          userId: session.user.id,
        }
      });

      return pettyCash;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("[PETTY_CASH_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
