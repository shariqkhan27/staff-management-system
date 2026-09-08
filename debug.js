const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const leaves = await prisma.leaveRequest.findMany({
    select: { id: true, employeeId: true, totalDays: true, paidDays: true, unpaidDays: true, status: true, fromDate: true }
  });
  const balances = await prisma.leaveBalance.findMany();
  const types = await prisma.leaveType.findMany();
  
  const fs = require('fs');
  fs.writeFileSync('debug_output.json', JSON.stringify({ leaves, balances, types }, null, 2));
}

main().finally(() => prisma.$disconnect());
