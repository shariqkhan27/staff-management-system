import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLeaves from "./_components/admin-leaves";
import EmployeeLeaves from "./_components/employee-leaves";

export default async function LeavesPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "EMPLOYEE") {
    if (!session.user.employeeId) {
      return <div>Error: No employee profile linked to your account.</div>;
    }
    return <EmployeeLeaves employeeId={session.user.employeeId} />;
  }

  return <AdminLeaves />;
}
