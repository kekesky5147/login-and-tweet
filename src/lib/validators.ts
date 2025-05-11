import { z } from "zod"

export const SearchSchema = z.object({
  query: z
    .string()
    .min(1, "Query is required")
    .max(280, "Query must be 280 characters or less"),
})

export const UpdateProfileSchema = z
  .object({
    username: z
      .string()
      .min(1, "Username is required")
      .max(50, "Username must be 50 characters or less"),
    email: z.string().email("Invalid email address"),
    bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  })
