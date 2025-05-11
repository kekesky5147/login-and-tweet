"use server"

import { z } from "zod"
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_REGEX_ERROR,
} from "@/src/lib/constants"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const createAccountSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
    )
    .regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
  username: z.string().min(5, "Username must be at least 5 characters"), // nickname을 username으로 변경
  phone: z.string().optional(),
})

interface CreateAccountState {
  error?: {
    fieldErrors?: {
      email?: string[]
      password?: string[]
      username?: string[] // nickname을 username으로 변경
      phone?: string[]
    }
  }
  success?: boolean
}

export async function createAccount(_: CreateAccountState, formData: FormData) {
  const data = {
    email: formData.get("email")?.toString(),
    password: formData.get("password")?.toString(),
    username: formData.get("username")?.toString(), // nickname을 username으로 변경
    phone: formData.get("phone")?.toString(),
  }

  const result = createAccountSchema.safeParse(data)
  if (!result.success) {
    return {
      error: result.error.flatten(),
    }
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: result.data.email }, { phone: result.data.phone }] },
  })

  if (existingUser) {
    return {
      error: { fieldErrors: { email: ["Email or phone already in use"] } },
    }
  }

  await prisma.user.create({
    data: {
      email: result.data.email,
      password: result.data.password, // 실제로는 해싱 필요
      username: result.data.username, // nickname을 username으로 변경
      phone: result.data.phone,
    },
  })

  return { success: true }
}
