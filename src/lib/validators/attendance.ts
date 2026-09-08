import * as z from "zod";

export const attendanceStatusEnum = z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LATE"]);

export const attendanceRecordSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  status: attendanceStatusEnum,
  overtimeHours: z.number().min(0, "Overtime cannot be negative").default(0),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
});

export const batchAttendanceSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  records: z.array(attendanceRecordSchema),
});

export type AttendanceRecordFormValues = z.infer<typeof attendanceRecordSchema>;
export type BatchAttendanceFormValues = z.infer<typeof batchAttendanceSchema>;
