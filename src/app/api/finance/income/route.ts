import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { incomeSchema } from "@/lib/validators/finance";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "HR_MANAGER" && session.user.role !== "FINANCE_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    const records = await prisma.incomeRecord.findMany({
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("[INCOME_GET]", error);
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
    const result = incomeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data", details: result.error.format() }, { status: 400 });
    }

    const data = result.data;
    
    const record = await prisma.incomeRecord.create({
      data: {
        source: data.source,
        clientName: data.clientName,
        amount: data.amount,
        date: new Date(data.date),
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        tenderReference: data.tenderReference,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("[INCOME_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
