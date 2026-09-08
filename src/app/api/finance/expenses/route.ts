import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { expenseSchema } from "@/lib/validators/finance";
import { logAudit } from "@/lib/audit-logger";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "HR_MANAGER" && session.user.role !== "FINANCE_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    const records = await prisma.expense.findMany({
      include: { category: true, addedBy: { select: { email: true } } },
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("[EXPENSES_GET]", error);
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
    const result = expenseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data", details: result.error.format() }, { status: 400 });
    }

    const data = result.data;
    
    const record = await prisma.expense.create({
      data: {
        categoryId: data.categoryId,
        amount: data.amount,
        date: new Date(data.date),
        description: data.description,
        receiptUrl: data.receiptUrl,
        addedById: session.user.id,
      },
      include: { category: true }
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE",
      entity: "EXPENSE",
      entityId: record.id,
      changes: { amount: data.amount, categoryId: data.categoryId }
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("[EXPENSES_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
