"use server"

import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_REGEX_ERROR,
} from "@/src/lib/constants"
import { z } from "zod"

const formSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(PASSWORD_MIN_LENGTH)
    .regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
})

export type ActionState = {
  fieldErrors?: {
    email?: string[]
    password?: string[]
  }
  error?: string
  success?: boolean
} | null

export async function logIn(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const result = formSchema.safeParse(data)
  if (!result.success) {
    console.log(result.error.flatten())
    return {
      error: "다시 확인해주세요",
      fieldErrors: result.error.flatten().fieldErrors,
    }
  } else {
    console.log(result.data)
    return { success: true }
  }
}
