import * as z from "zod";

export const leaveRequestSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  leaveTypeId: z.string().min(1, "Leave type is required"),
  fromDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  toDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  reason: z.string().optional(),
}).refine(data => new Date(data.fromDate) <= new Date(data.toDate), {
  message: "From date must be before or equal to To date",
  path: ["toDate"]
});

export const leaveApprovalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
  approvedDays: z.number().min(1).optional(),
  reviewComment: z.string().optional(),
});
