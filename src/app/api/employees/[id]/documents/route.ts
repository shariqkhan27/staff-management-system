import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "HR_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { type, fileName, fileUrl } = body;

    if (!type || !fileName || !fileUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        employeeId: id,
        type,
        fileName,
        fileUrl
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("[EMPLOYEE_DOCUMENT_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "HR_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 });
    }

    await prisma.document.delete({
      where: { id: documentId, employeeId: id }
    });

    return NextResponse.json({ message: "Document deleted" });
  } catch (error) {
    console.error("[EMPLOYEE_DOCUMENT_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
