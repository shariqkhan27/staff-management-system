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
    const { source, clientName, amount, date, paymentMethod, notes, tenderReference } = body;

    const record = await prisma.incomeRecord.update({
      where: { id: resolvedParams.id },
      data: {
        ...(source && { source }),
        ...(clientName !== undefined && { clientName }),
        ...(amount && { amount }),
        ...(date && { date: new Date(date) }),
        ...(paymentMethod && { paymentMethod }),
        ...(notes !== undefined && { notes }),
        ...(tenderReference !== undefined && { tenderReference }),
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("[INCOME_PUT]", error);
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

    await prisma.incomeRecord.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[INCOME_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
