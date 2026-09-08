import { z } from "zod";

export const employeeCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  cnic: z
    .string()
    .regex(/^\d{5}-\d{7}-\d{1}$/, "CNIC format: XXXXX-XXXXXXX-X")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^(\+92|0)?3\d{9}$/, "Invalid Pakistani phone number")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  photoUrl: z.string().url().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  joiningDate: z.string().min(1, "Joining date is required"),
  designation: z.string().optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]),
  basicSalary: z.coerce.number().min(0, "Salary cannot be negative"),
  bankAccountTitle: z.string().optional().or(z.literal("")),
  bankAccountNo: z.string().optional().or(z.literal("")),
  bankName: z.string().optional().or(z.literal("")),
  bankBranch: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED", "RESIGNED"]).optional(),
  createAccount: z.boolean().optional(),
  accountEmail: z.string().email().optional().or(z.literal("")),
  accountPassword: z.string().min(6).optional().or(z.literal("")),
  role: z.enum(["OWNER", "HR_MANAGER", "FINANCE_MANAGER", "EMPLOYEE"]).optional(),
});

export const employeeUpdateSchema = employeeCreateSchema.partial();

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
