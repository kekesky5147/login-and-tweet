"use server"
import { z } from "zod"

const formSchema = z
  .object({
    username: z.string().min(3, "사용자 이름은 3~10자여야 합니다").max(10),
    email: z.string().email("유효한 이메일 주소를 입력하세요"),
    password: z
      .string()
      .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
      .regex(/[0-9]/, "비밀번호는 최소 하나의 숫자를 포함해야 합니다"),
    confirm_password: z
      .string()
      .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
      .regex(/[0-9]/, "비밀번호는 최소 하나의 숫자를 포함해야 합니다"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirm_password"],
  })

export type ActionState = {
  error?: string
  success?: boolean
  fieldErrors?: {
    username?: string[]
    email?: string[]
    password?: string[]
    confirm_password?: string[]
  }
} | null

export async function createAccount(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  console.log("createAccount 호출됨", { prevState, formData })

  const data = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  }

  console.log("폼 데이터:", data)

  const result = formSchema.safeParse(data)
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    console.log("유효성 검사 실패:", errors)
    return {
      error: "다시 확인해주세요",
      fieldErrors: errors,
    }
  }

  const validatedData = result.data
  console.log("유효성 검사 성공, 검증된 데이터:", validatedData)

  // 데이터베이스 작업 예시 (Prisma 사용 가정)
  /*
  try {
    const prisma = new PrismaClient();
    await prisma.user.create({
      data: {
        username: validatedData.username,
        email: validatedData.email,
        password: validatedData.password, // 실제로는 해시 처리 필요
      },
    });
    console.log("사용자 생성 성공:", validatedData.username);
  } catch (error) {
    console.error("사용자 생성 실패:", error);
    return { error: "계정 생성에 실패했습니다" };
  }
  */

  return { success: true }
}
