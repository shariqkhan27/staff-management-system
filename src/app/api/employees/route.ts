import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { employeeCreateSchema } from "@/lib/validators/employee";
import bcrypt from "bcryptjs";

// GET /api/employees — List all employees with filters
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Employees can only see their own data
  if (session.user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const department = searchParams.get("department") || "";
  const status = searchParams.get("status") || "";
  const type = searchParams.get("type") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  try {
    const where: any = {
      OR: [
        { user: null },
        { user: { role: { not: "OWNER" } } }
      ]
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { employeeId: { contains: search, mode: "insensitive" } },
            { cnic: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      ];
    }

    if (department) {
      where.departmentId = department;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.employmentType = type;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);

    // Strip salary for HR_MANAGER
    const safeEmployees = session.user.role === "HR_MANAGER"
      ? employees.map(({ basicSalary, ...rest }: any) => rest)
      : employees;

    return NextResponse.json({
      employees: safeEmployees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List employees error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

// POST /api/employees — Create new employee
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only owner can create employees now
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validation = employeeCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate employee ID
    const lastEmployee = await prisma.employee.findFirst({
      orderBy: { employeeId: "desc" },
      select: { employeeId: true },
    });

    let nextNum = 1;
    if (lastEmployee?.employeeId) {
      const match = lastEmployee.employeeId.match(/EMP-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const employeeId = `EMP-${String(nextNum).padStart(3, "0")}`;

    // Create user account if requested
    let userId: string | undefined;
    if (data.createAccount && data.accountEmail && data.accountPassword) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.accountEmail },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }

      const passwordHash = await bcrypt.hash(data.accountPassword, 12);
      const user = await prisma.user.create({
        data: {
          email: data.accountEmail,
          passwordHash,
          role: data.role || "EMPLOYEE",
        },
      });
      userId = user.id;
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        name: data.name,
        cnic: data.cnic || null,
        phone: data.phone || null,
        email: data.email || null,
        photoUrl: data.photoUrl || null,
        address: data.address || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        joiningDate: new Date(data.joiningDate),
        designation: data.designation || null,
        departmentId: data.departmentId || null,
        employmentType: data.employmentType,
        basicSalary: data.basicSalary,
        bankAccountTitle: data.bankAccountTitle || null,
        bankAccountNo: data.bankAccountNo || null,
        bankName: data.bankName || null,
        bankBranch: data.bankBranch || null,
        status: data.status || "ACTIVE",
        userId: userId || null,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("Create employee error:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
