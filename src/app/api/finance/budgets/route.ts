import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { budgetSchema } from "@/lib/validators/finance";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "HR_MANAGER" && session.user.role !== "FINANCE_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const records = await prisma.budget.findMany({
      where: { month, year },
      include: { category: true }
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("[BUDGETS_GET]", error);
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
    const result = budgetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data", details: result.error.format() }, { status: 400 });
    }

    const data = result.data;
    
    // Upsert budget to avoid unique constraint violations
    const record = await prisma.budget.upsert({
      where: {
        categoryId_month_year: {
          categoryId: data.categoryId,
          month: data.month,
          year: data.year
        }
      },
      update: {
        budgetedAmount: data.budgetedAmount
      },
      create: {
        categoryId: data.categoryId,
        month: data.month,
        year: data.year,
        budgetedAmount: data.budgetedAmount
      },
      include: { category: true }
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("[BUDGETS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
