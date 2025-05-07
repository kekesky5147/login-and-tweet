"use server"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export type ActionState = {
  error?: string
  success?: boolean
  fieldErrors?: {
    email?: string[]
    password?: string[]
  }
} | null

export async function login(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const result = loginSchema.safeParse(data)
  if (!result.success) {
    return {
      error: "Invalid login credentials",
      fieldErrors: result.error.flatten().fieldErrors,
    }
  }

  const validatedData = result.data
  // 로그인 로직 (예: 데이터베이스 인증)
  console.log(validatedData)
  return { success: true }
}
