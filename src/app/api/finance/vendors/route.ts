import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { vendorSchema } from "@/lib/validators/finance";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "HR_MANAGER" && session.user.role !== "FINANCE_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const records = await prisma.vendor.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("[VENDORS_GET]", error);
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
    const result = vendorSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data", details: result.error.format() }, { status: 400 });
    }

    const record = await prisma.vendor.create({
      data: result.data,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("[VENDORS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
