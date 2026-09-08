import * as z from "zod";

export const paymentMethodEnum = z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE"]);

export const incomeSchema = z.object({
  source: z.string().min(1, "Source is required"),
  clientName: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  paymentMethod: paymentMethodEnum,
  notes: z.string().optional(),
  tenderReference: z.string().optional(),
});

export const expenseCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export const expenseSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  description: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export const pettyCashSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  description: z.string().min(1, "Description is required"),
  credit: z.number().min(0).optional().default(0),
  debit: z.number().min(0).optional().default(0),
});

export const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  contact: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  paymentType: paymentMethodEnum,
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  budgetedAmount: z.number().min(0, "Amount must be positive"),
});

