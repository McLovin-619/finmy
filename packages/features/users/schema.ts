import { z } from "zod";

export const SignInSchema = z.object({
  emailOrPhone: z.string().min(1, "Email or phone is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

export const SignUpSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  mobileNumber: z
    .string()
    .min(1, "Mobile number is required")
    .regex(/^\+966\s?\d{9}$/, "Enter a valid Saudi mobile number (+966 5X XXX XXXX)"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms to continue" }),
  }),
});

export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;

export type User = {
  id: string;
  fullName: string;
  email?: string;
  mobileNumber: string;
  createdAt: string;
};
