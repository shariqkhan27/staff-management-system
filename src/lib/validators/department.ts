import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  headEmployeeId: z.string().optional().or(z.literal("")),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
