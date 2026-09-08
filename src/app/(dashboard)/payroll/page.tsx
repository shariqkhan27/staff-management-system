import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminPayroll from "./_components/admin-payroll";
import EmployeePayroll from "./_components/employee-payroll";

export default async function PayrollPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "EMPLOYEE") {
    if (!session.user.employeeId) {
      return <div>Error: No employee profile linked to your account.</div>;
    }
    return <EmployeePayroll employeeId={session.user.employeeId} />;
  }

  // Owner or HR Manager
  return <AdminPayroll />;
}
