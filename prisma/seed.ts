import { PrismaClient, UserRole, EmploymentType, EmploymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.salaryComponent.deleteMany();
  await prisma.salaryAdvance.deleteMany();
  await prisma.salaryRecord.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.attendanceLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.pettyCashLog.deleteMany();
  await prisma.incomeRecord.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  // Create Owner user
  const ownerPasswordHash = await bcrypt.hash("Admin@123", 12);
  const ownerUser = await prisma.user.create({
    data: {
      email: "admin@elegence.com",
      passwordHash: ownerPasswordHash,
      role: UserRole.OWNER,
    },
  });
  console.log("✅ Owner user created: admin@elegence.com / Admin@123");

  // Create Departments
  const departments = await Promise.all([
    prisma.department.create({ data: { name: "Administration" } }),
    prisma.department.create({ data: { name: "Sales & Marketing" } }),
    prisma.department.create({ data: { name: "Construction" } }),
    prisma.department.create({ data: { name: "Finance" } }),
    prisma.department.create({ data: { name: "Design & Architecture" } }),
  ]);
  console.log("✅ Created 5 departments");

  // Create Owner employee profile
  const ownerEmployee = await prisma.employee.create({
    data: {
      employeeId: "EMP-001",
      name: "Admin Owner",
      phone: "03001234567",
      email: "admin@elegence.com",
      joiningDate: new Date("2020-01-01"),
      designation: "Owner / CEO",
      departmentId: departments[0].id,
      employmentType: EmploymentType.FULL_TIME,
      basicSalary: 500000,
      status: EmploymentStatus.ACTIVE,
      userId: ownerUser.id,
    },
  });

  // Set owner as Admin department head
  await prisma.department.update({
    where: { id: departments[0].id },
    data: { headEmployeeId: ownerEmployee.id },
  });

  // Create sample employees
  const emp2Password = await bcrypt.hash("employee123", 12);
  const emp2User = await prisma.user.create({
    data: {
      email: "ahmed@elegence.com",
      passwordHash: emp2Password,
      role: UserRole.EMPLOYEE,
    },
  });

  await prisma.employee.create({
    data: {
      employeeId: "EMP-002",
      name: "Ahmed Hassan",
      cnic: "42201-1234567-1",
      phone: "03012345678",
      email: "ahmed@elegence.com",
      address: "House 12, Block C, Gulshan-e-Iqbal, Karachi",
      dateOfBirth: new Date("1995-03-15"),
      joiningDate: new Date("2023-06-01"),
      designation: "Site Engineer",
      departmentId: departments[2].id,
      employmentType: EmploymentType.FULL_TIME,
      basicSalary: 75000,
      bankAccountTitle: "Ahmed Hassan",
      bankAccountNo: "1234567890",
      bankName: "HBL",
      bankBranch: "Gulshan Branch",
      status: EmploymentStatus.ACTIVE,
      userId: emp2User.id,
    },
  });

  await prisma.employee.create({
    data: {
      employeeId: "EMP-003",
      name: "Fatima Ali",
      cnic: "42301-9876543-2",
      phone: "03123456789",
      email: "fatima@elegence.com",
      address: "Flat 4-A, Navy Heights, Clifton, Karachi",
      dateOfBirth: new Date("1992-07-22"),
      joiningDate: new Date("2022-01-15"),
      designation: "Interior Designer",
      departmentId: departments[4].id,
      employmentType: EmploymentType.FULL_TIME,
      basicSalary: 90000,
      bankAccountTitle: "Fatima Ali",
      bankAccountNo: "9876543210",
      bankName: "Meezan Bank",
      bankBranch: "Clifton Branch",
      status: EmploymentStatus.ACTIVE,
    },
  });

  await prisma.employee.create({
    data: {
      employeeId: "EMP-004",
      name: "Usman Khan",
      phone: "03234567890",
      joiningDate: new Date("2024-03-01"),
      designation: "Sales Executive",
      departmentId: departments[1].id,
      employmentType: EmploymentType.FULL_TIME,
      basicSalary: 50000,
      status: EmploymentStatus.ACTIVE,
    },
  });

  await prisma.employee.create({
    data: {
      employeeId: "EMP-005",
      name: "Maria Bibi",
      phone: "03345678901",
      joiningDate: new Date("2023-09-15"),
      designation: "Accountant",
      departmentId: departments[3].id,
      employmentType: EmploymentType.FULL_TIME,
      basicSalary: 65000,
      status: EmploymentStatus.ON_LEAVE,
    },
  });

  console.log("✅ Created 5 employees");

  // Create Leave Types
  await Promise.all([
    prisma.leaveType.create({
      data: { name: "Sick Leave", maxDaysPerYear: 10, isPaid: true },
    }),
    prisma.leaveType.create({
      data: { name: "Casual Leave", maxDaysPerYear: 12, isPaid: true },
    }),
    prisma.leaveType.create({
      data: { name: "Annual Leave", maxDaysPerYear: 15, isPaid: true },
    }),
    prisma.leaveType.create({
      data: { name: "Unpaid Leave", maxDaysPerYear: 30, isPaid: false },
    }),
  ]);
  console.log("✅ Created 4 leave types");

  // Create Expense Categories
  await Promise.all([
    prisma.expenseCategory.create({ data: { name: "Staff Salaries" } }),
    prisma.expenseCategory.create({ data: { name: "Utilities" } }),
    prisma.expenseCategory.create({ data: { name: "Rent" } }),
    prisma.expenseCategory.create({ data: { name: "Transport" } }),
    prisma.expenseCategory.create({ data: { name: "Office Supplies" } }),
    prisma.expenseCategory.create({ data: { name: "Petty Cash" } }),
    prisma.expenseCategory.create({ data: { name: "Miscellaneous" } }),
  ]);
  console.log("✅ Created 7 expense categories");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Login Credentials:");
  console.log("   Owner:    admin@elegence.com / Admin@123");
  console.log("   Employee: ahmed@elegence.com / employee123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
