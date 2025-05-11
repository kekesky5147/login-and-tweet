"use server"

import { z } from "zod"
import { prisma } from "@/src/lib/prisma"
import { revalidatePath, revalidateTag } from "next/cache"
import { unstable_noStore as noStore } from "next/cache"
import bcrypt from "bcrypt"
import { cookies } from "next/headers"

const CreateAccountFormSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z
    .string()
    .min(5, "Password must be at least 5 characters")
    .regex(
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{5,}$/,
      "Password must contain at least one uppercase letter, one number, and one special character"
    ),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(
      /^[가-힣a-zA-Z0-9]+$/,
      "Username must contain only Korean, English, or numbers, no special characters"
    ),
  phone: z.string().optional().nullable(),
})

const LoginFormSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(5, "Password must be at least 5 characters"),
})

const CreateTweetFormSchema = z.object({
  content: z
    .string()
    .min(1, "Tweet content cannot be empty")
    .max(280, "Tweet cannot exceed 280 characters"),
})

const UpdateProfileFormSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(
      /^[가-힣a-zA-Z0-9]+$/,
      "Username must contain only Korean, English, or numbers, no special characters"
    ),
  bio: z
    .string()
    .max(160, "Bio cannot exceed 160 characters")
    .optional()
    .nullable(),
})

const ChangePasswordFormSchema = z.object({
  currentPassword: z.string().min(5, "Current password is required"),
  newPassword: z
    .string()
    .min(5, "New password must be at least 5 characters")
    .regex(
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{5,}$/,
      "Password must contain at least one uppercase letter, one number, and one special character"
    ),
})

interface CreateAccountResult {
  message: string
  userId?: number
  success?: boolean
  errors?: {
    email?: string[]
    password?: string[]
    username?: string[]
    phone?: string[]
    server?: string[]
  }
}

interface LoginResult {
  message: string
  userId?: number
  success?: boolean
  errors?: {
    email?: string[]
    password?: string[]
    phone?: string[]
    server?: string[]
  }
}

interface CreateTweetResult {
  message: string
  tweetId?: number
  success?: boolean
  errors?: {
    content?: string[]
    server?: string[]
  }
}

interface DeleteTweetResult {
  message: string
  success?: boolean
  errors?: {
    server?: string[]
  }
}

interface UpdateProfileResult {
  message: string
  success?: boolean
  errors?: {
    email?: string[]
    username?: string[]
    bio?: string[]
    server?: string[]
  }
}

interface ChangePasswordResult {
  message: string
  success?: boolean
  errors?: {
    currentPassword?: string[]
    newPassword?: string[]
    server?: string[]
  }
}

interface UserSession {
  userId: number
  email: string
  username: string
}

export async function createAccount(
  formData: FormData
): Promise<CreateAccountResult> {
  noStore()
  const data = {
    email: formData.get("email")?.toString() || "",
    password: formData.get("password")?.toString() || "",
    username: formData.get("username")?.toString() || "",
    phone: formData.get("phone")?.toString() || null,
  }

  console.log("CreateAccount input:", { ...data, password: "***" })

  const validatedFields = CreateAccountFormSchema.safeParse(data)
  console.log(
    "Validated fields:",
    validatedFields.success ? "Valid" : validatedFields.error
  )

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const errorMessages = Object.entries(errors).map(
      ([field, messages]) => `${field}: ${messages?.join(", ")}`
    )
    console.log("Validation errors:", errorMessages)
    return {
      errors,
      message: "Invalid input. Please check the fields.",
    }
  }

  const { email, password, username, phone } = validatedFields.data

  try {
    console.log("Checking Prisma initialization...")
    const prismaVersion = require("@prisma/client/package.json").version
    console.log("Prisma Client version:", prismaVersion)
    console.log("NODE_ENV:", process.env.NODE_ENV)
    console.log("DATABASE_URL set:", !!process.env.DATABASE_URL)

    // 데이터베이스 연결 테스트
    console.log("Testing database connection...")
    await prisma.$connect()
    console.log("Database connection successful")

    console.log("Checking existing user...")
    const [existingEmail, existingUsername, existingPhone] = await Promise.all([
      prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true },
      }),
      prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true },
      }),
      phone
        ? prisma.user.findUnique({
            where: { phone },
            select: { id: true, phone: true },
          })
        : Promise.resolve(null),
    ])

    console.log(
      "Existing email:",
      existingEmail
        ? { id: existingEmail.id, email: existingEmail.email }
        : null
    )
    console.log(
      "Existing username:",
      existingUsername
        ? { id: existingUsername.id, username: existingUsername.username }
        : null
    )
    console.log(
      "Existing phone:",
      existingPhone
        ? { id: existingPhone.id, phone: existingPhone.phone }
        : null
    )

    const errors: { email?: string[]; username?: string[]; phone?: string[] } =
      {}
    if (existingEmail) errors.email = ["Email already in use"]
    if (existingUsername) errors.username = ["Username already in use"]
    if (existingPhone) errors.phone = ["Phone number already in use"]

    if (Object.keys(errors).length > 0) {
      return {
        errors,
        message: "Some fields are already in use.",
      }
    }

    console.log("Hashing password...")
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log("Password hashed successfully")

    console.log("Creating user in database...")
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        phone,
      },
      select: { id: true, email: true, username: true },
    })
    console.log("User created:", {
      id: user.id,
      email: user.email,
      username: user.username,
    })

    console.log("Setting session cookie...")
    const sessionData = JSON.stringify({
      userId: user.id,
      email: user.email,
      username: user.username,
    } as UserSession)
    cookies().set("session", sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60,
      path: "/",
      sameSite: "strict",
    })
    console.log("Session set:", { userId: user.id })

    revalidatePath("/create-account")
    revalidatePath("/login")
    revalidateTag("users")

    return {
      message: "Account created successfully!",
      userId: user.id,
      success: true,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create account. Please try again."
    console.error("CreateAccount error:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      input: { email, username, phone, password: "***" },
      prismaVersion: require("@prisma/client/package.json").version,
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
    })

    if (error instanceof Error) {
      if (
        error.message.includes("database") ||
        error.message.includes("connect")
      ) {
        return {
          errors: {
            server: ["Database connection error. Please try again later."],
          },
          message: "Database connection error. Please try again later.",
        }
      }
      if (
        error.message.includes("constraint") ||
        error.message.includes("unique")
      ) {
        if (error.message.includes("nickname")) {
          return {
            errors: {
              server: [
                "Database schema error: nickname field detected. Please update schema.",
              ],
            },
            message:
              "Database schema error: nickname field detected. Please update schema.",
          }
        }
        if (error.message.includes("email")) {
          return {
            errors: { email: ["Email already exists in database."] },
            message: "Email already exists in database.",
          }
        }
        if (error.message.includes("username")) {
          return {
            errors: { username: ["Username already exists in database."] },
            message: "Username already exists in database.",
          }
        }
        if (error.message.includes("phone")) {
          return {
            errors: { phone: ["Phone number already exists in database."] },
            message: "Phone number already exists in database.",
          }
        }
        return {
          errors: {
            server: ["Database constraint violation. Check your input fields."],
          },
          message: "Database constraint violation. Check your input fields.",
        }
      }
      if (error.message.includes("bcrypt")) {
        return {
          errors: { server: ["Password hashing error. Please try again."] },
          message: "Password hashing error. Please try again.",
        }
      }
      if (error.message.includes("PrismaClient")) {
        return {
          errors: {
            server: [
              "Prisma Client error. Please check database configuration.",
            ],
          },
          message: "Prisma Client error. Please check database configuration.",
        }
      }
    }

    return {
      errors: { server: [errorMessage] },
      message: errorMessage,
    }
  } finally {
    await prisma.$disconnect()
  }
}

export async function login(formData: FormData): Promise<LoginResult> {
  noStore()
  const data = {
    email: formData.get("email")?.toString() || "",
    password: formData.get("password")?.toString() || "",
  }

  console.log("Login input:", { email: data.email, password: "***" })

  const validatedFields = LoginFormSchema.safeParse(data)
  console.log(
    "Validated fields:",
    validatedFields.success ? "Valid" : validatedFields.error
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid input. Please check the fields.",
    }
  }

  const { email, password } = validatedFields.data

  try {
    console.log("Fetching user...")
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true, password: true },
    })
    console.log("User found:", user ? { id: user.id, email: user.email } : null)

    if (!user) {
      return {
        errors: { email: ["Email not found"] },
        message: "Invalid email or password.",
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log("Password valid:", isPasswordValid)

    if (!isPasswordValid) {
      return {
        errors: { password: ["Invalid password"] },
        message: "Invalid email or password.",
      }
    }

    console.log("Setting session cookie...")
    const sessionData = JSON.stringify({
      userId: user.id,
      email: user.email,
      username: user.username,
    } as UserSession)
    cookies().set("session", sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60,
      path: "/",
      sameSite: "strict",
    })
    console.log("Session set:", { userId: user.id, session: sessionData })

    revalidatePath("/tweet")
    revalidatePath(`/profile/${user.id}`)
    revalidatePath(`/users/${user.username}`)

    return {
      message: "Login successful!",
      userId: user.id,
      success: true,
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      errors: { server: ["Failed to login. Please try again."] },
      message: "Server error occurred.",
    }
  }
}

export async function createTweet(
  formData: FormData
): Promise<CreateTweetResult> {
  noStore()
  const content = formData.get("content")?.toString()
  const session = cookies().get("session")?.value

  console.log("CreateTweet session:", session ? session : "Missing")

  if (!session) {
    console.log("No session cookie found")
    return {
      errors: { server: ["You must be logged in to tweet"] },
      message: "Authentication required.",
    }
  }

  let userSession: UserSession
  try {
    userSession = JSON.parse(session) as UserSession
    if (!userSession.userId || !userSession.email || !userSession.username) {
      throw new Error("Incomplete session data")
    }
    console.log("Parsed session:", {
      userId: userSession.userId,
      email: userSession.email,
      username: userSession.username,
    })
  } catch (error) {
    console.error("Session parse error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      sessionData: session,
    })
    return {
      errors: { server: ["Invalid session data"] },
      message: "Authentication error.",
    }
  }

  const data = { content }

  console.log("CreateTweet input:", {
    content:
      content?.substring(0, 50) + (content && content.length > 50 ? "..." : ""),
  })

  const validatedFields = CreateTweetFormSchema.safeParse(data)
  console.log(
    "Validated fields:",
    validatedFields.success ? "Valid" : validatedFields.error
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid input. Please check the fields.",
    }
  }

  const { content: validatedContent } = validatedFields.data

  try {
    console.log("Verifying user...")
    const user = await prisma.user.findUnique({
      where: { id: userSession.userId },
      select: { id: true },
    })
    console.log("User exists:", user ? { id: user.id } : null)

    if (!user) {
      return {
        errors: { server: ["User not found"] },
        message: "User not found.",
      }
    }

    console.log("Creating tweet in database...")
    const tweet = await prisma.tweet.create({
      data: {
        content: validatedContent,
        userId: userSession.userId,
      },
      select: { id: true },
    })
    console.log("Tweet created:", { id: tweet.id, userId: userSession.userId })

    revalidatePath("/tweet")
    revalidatePath(`/profile/${userSession.userId}`)
    revalidatePath(`/users/${userSession.username}`)

    return {
      message: "Tweet created successfully!",
      tweetId: tweet.id,
      success: true,
    }
  } catch (error) {
    console.error("CreateTweet error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      input: {
        content: validatedContent.substring(0, 50),
        userId: userSession.userId,
      },
    })
    return {
      errors: { server: ["Failed to create tweet. Please try again."] },
      message: "Server error occurred.",
    }
  }
}

export async function deleteTweet(tweetId: number): Promise<DeleteTweetResult> {
  noStore()
  const session = cookies().get("session")?.value

  console.log("DeleteTweet session:", session ? "Present" : "Missing")

  if (!session) {
    return {
      errors: { server: ["You must be logged in to delete a tweet"] },
      message: "Authentication required.",
    }
  }

  let userSession: UserSession
  try {
    userSession = JSON.parse(session) as UserSession
    if (!userSession.userId || !userSession.email || !userSession.username) {
      throw new Error("Incomplete session data")
    }
    console.log("Parsed session:", { userId: userSession.userId })
  } catch (error) {
    console.error("Session parse error:", error)
    return {
      errors: { server: ["Invalid session data"] },
      message: "Authentication error.",
    }
  }

  try {
    console.log("Fetching tweet...")
    const tweet = await prisma.tweet.findUnique({
      where: { id: tweetId },
      select: { id: true, userId: true },
    })
    console.log(
      "Tweet found:",
      tweet ? { id: tweet.id, userId: tweet.userId } : null
    )

    if (!tweet) {
      return {
        errors: { server: ["Tweet not found"] },
        message: "Tweet not found.",
      }
    }

    if (tweet.userId !== userSession.userId) {
      return {
        errors: { server: ["You can only delete your own tweets"] },
        message: "Unauthorized.",
      }
    }

    await prisma.tweet.delete({
      where: { id: tweetId },
    })
    console.log("Tweet deleted:", { id: tweetId, userId: userSession.userId })

    revalidatePath("/tweet")
    revalidatePath(`/profile/${userSession.userId}`)
    revalidatePath(`/users/${userSession.username}`)

    return {
      message: "Tweet deleted successfully!",
      success: true,
    }
  } catch (error) {
    console.error("DeleteTweet error:", error)
    return {
      errors: { server: ["Failed to delete tweet. Please try again."] },
      message: "Server error occurred.",
    }
  }
}

export async function getUserByUsername(username: string) {
  noStore()
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, email: true, username: true, bio: true },
    })
    console.log(
      "User fetched by username:",
      user ? { id: user.id, username } : null
    )
    return user
  } catch (error) {
    console.error("GetUserByUsername error:", error)
    return null
  }
}

export async function getTweetsByUsername(username: string) {
  noStore()
  try {
    const tweets = await prisma.tweet.findMany({
      where: {
        user: { username },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
        user: {
          select: { username: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    console.log("Tweets fetched for username:", {
      username,
      count: tweets.length,
    })
    return tweets
  } catch (error) {
    console.error("GetTweetsByUsername error:", error)
    return []
  }
}

export async function getTweetsByUser(userId: number) {
  noStore()
  try {
    const tweets = await prisma.tweet.findMany({
      where: { userId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
        user: {
          select: { username: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    console.log("User tweets fetched:", { userId, count: tweets.length })
    return tweets
  } catch (error) {
    console.error("GetTweetsByUser error:", error)
    return []
  }
}

export async function updateUserProfile(
  formData: FormData
): Promise<UpdateProfileResult> {
  noStore()
  const session = cookies().get("session")?.value

  if (!session) {
    return {
      errors: { server: ["You must be logged in to update your profile"] },
      message: "Authentication required.",
    }
  }

  let userSession: UserSession
  try {
    userSession = JSON.parse(session) as UserSession
    if (!userSession.userId || !userSession.email || !userSession.username) {
      throw new Error("Incomplete session data")
    }
    console.log("Parsed session:", { userId: userSession.userId })
  } catch (error) {
    console.error("Session parse error:", error)
    return {
      errors: { server: ["Invalid session data"] },
      message: "Authentication error.",
    }
  }

  const data = {
    email: formData.get("email")?.toString() || "",
    username: formData.get("username")?.toString() || "",
    bio: formData.get("bio")?.toString() || null,
  }

  console.log("UpdateProfile input:", { ...data })

  const validatedFields = UpdateProfileFormSchema.safeParse(data)
  console.log(
    "Validated fields:",
    validatedFields.success ? "Valid" : validatedFields.error
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid input. Please check the fields.",
    }
  }

  const { email, username, bio } = validatedFields.data

  try {
    console.log("Checking existing user...")
    const existingEmail = await prisma.user.findFirst({
      where: { email, NOT: { id: userSession.userId } },
      select: { id: true, email: true },
    })
    const existingUsername = await prisma.user.findFirst({
      where: { username, NOT: { id: userSession.userId } },
      select: { id: true, username: true },
    })

    console.log(
      "Existing email:",
      existingEmail
        ? { id: existingEmail.id, email: existingEmail.email }
        : null
    )
    console.log(
      "Existing username:",
      existingUsername
        ? { id: existingUsername.id, username: existingUsername.username }
        : null
    )

    const errors: { email?: string[]; username?: string[] } = {}
    if (existingEmail?.email) errors.email = ["Email already in use"]
    if (existingUsername?.username)
      errors.username = ["Username already in use"]

    if (Object.keys(errors).length > 0) {
      return {
        errors,
        message: "Some fields are already in use.",
      }
    }

    console.log("Updating user in database...")
    const user = await prisma.user.update({
      where: { id: userSession.userId },
      data: {
        email,
        username,
        bio,
        updatedAt: new Date(),
      },
      select: { id: true, email: true, username: true },
    })
    console.log("User updated:", {
      id: user.id,
      email: user.email,
      username: user.username,
    })

    console.log("Updating session cookie...")
    const sessionData = JSON.stringify({
      userId: user.id,
      email: user.email,
      username: user.username,
    } as UserSession)
    cookies().set("session", sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60,
      path: "/",
      sameSite: "strict",
    })
    console.log("Session updated:", { userId: user.id, session: sessionData })

    revalidatePath(`/profile/${user.id}`)
    revalidatePath(`/users/${user.username}`)
    revalidateTag("users")

    return {
      message: "Profile updated successfully!",
      success: true,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update profile. Please try again."
    console.error("UpdateProfile error:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      input: { email, username, bio },
    })
    return {
      errors: { server: [errorMessage] },
      message: "Server error occurred.",
    }
  }
}

export async function changePassword(
  formData: FormData
): Promise<ChangePasswordResult> {
  noStore()
  const session = cookies().get("session")?.value

  if (!session) {
    return {
      errors: { server: ["You must be logged in to change your password"] },
      message: "Authentication required.",
    }
  }

  let userSession: UserSession
  try {
    userSession = JSON.parse(session) as UserSession
    if (!userSession.userId || !userSession.email || !userSession.username) {
      throw new Error("Incomplete session data")
    }
    console.log("Parsed session:", { userId: userSession.userId })
  } catch (error) {
    console.error("Session parse error:", error)
    return {
      errors: { server: ["Invalid session data"] },
      message: "Authentication error.",
    }
  }

  const data = {
    currentPassword: formData.get("currentPassword")?.toString() || "",
    newPassword: formData.get("newPassword")?.toString() || "",
  }

  console.log("ChangePassword input:", {
    currentPassword: "***",
    newPassword: "***",
  })

  const validatedFields = ChangePasswordFormSchema.safeParse(data)
  console.log(
    "Validated fields:",
    validatedFields.success ? "Valid" : validatedFields.error
  )

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid input. Please check the fields.",
    }
  }

  const { currentPassword, newPassword } = validatedFields.data

  try {
    console.log("Fetching user...")
    const user = await prisma.user.findUnique({
      where: { id: userSession.userId },
      select: { id: true, password: true },
    })
    console.log("User found:", user ? { id: user.id } : null)

    if (!user) {
      return {
        errors: { server: ["User not found"] },
        message: "User not found.",
      }
    }

    console.log("Verifying current password...")
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    console.log("Current password valid:", isPasswordValid)

    if (!isPasswordValid) {
      return {
        errors: { currentPassword: ["Incorrect current password"] },
        message: "Invalid current password.",
      }
    }

    console.log("Hashing new password...")
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    console.log("New password hashed successfully")

    console.log("Updating password in database...")
    await prisma.user.update({
      where: { id: userSession.userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    })
    console.log("Password updated for user:", { id: userSession.userId })

    return {
      message: "Password changed successfully!",
      success: true,
    }
  } catch (error) {
    console.error("ChangePassword error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    return {
      errors: { server: ["Failed to change password. Please try again."] },
      message: "Server error occurred.",
    }
  }
}

export async function getCurrentUser() {
  noStore()
  const session = cookies().get("session")?.value

  console.log("GetCurrentUser session:", session ? session : "Missing")

  if (!session) {
    console.log("No session cookie found")
    return null
  }

  try {
    const userSession = JSON.parse(session) as UserSession
    console.log("Parsed session:", { userId: userSession.userId })
    if (!userSession.userId || !userSession.email || !userSession.username) {
      console.log("Incomplete session data")
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: userSession.userId },
      select: { id: true, email: true, username: true, bio: true },
    })
    console.log(
      "User fetched:",
      user ? { id: user.id, email: user.email } : null
    )

    return user
  } catch (error) {
    console.error("GetCurrentUser error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      sessionData: session,
    })
    return null
  }
}

export async function logout() {
  noStore()
  try {
    cookies().delete("session")
    console.log("Session deleted")
    revalidatePath("/login")
    revalidatePath("/tweet")
    return { message: "Logged out successfully!", success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return {
      message: "Failed to log out.",
      errors: { server: ["Server error occurred"] },
    }
  }
}

export async function getTweets() {
  noStore()
  try {
    const tweets = await prisma.tweet.findMany({
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
        user: {
          select: { username: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    console.log("Tweets fetched:", { count: tweets.length })
    return tweets
  } catch (error) {
    console.error("GetTweets error:", error)
    return []
  }
}

export async function smsLogin(
  prevState: LoginResult,
  formData: FormData
): Promise<LoginResult> {
  noStore()
  const phone = formData.get("phone")?.toString() || ""

  console.log("SMSLogin input:", { phone })

  // 간단한 전화번호 유효성 검사
  const phoneSchema = z
    .string()
    .regex(/^\d{10,11}$/, "Invalid phone number (e.g., 01012345678)")
  const validatedFields = phoneSchema.safeParse(phone)

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error?.flatten().fieldErrors as
      | {
          phone?: string[]
        }
      | undefined
    return {
      message: "Invalid phone number.",
      errors: { phone: fieldErrors?.phone || ["Invalid phone number format"] },
    }
  }

  try {
    console.log("Fetching user by phone...")
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, email: true, username: true },
    })
    console.log("User found:", user ? { id: user.id, phone } : null)

    if (!user) {
      return {
        message: "Phone number not registered.",
        errors: { phone: ["Phone number not found"] },
      }
    }

    console.log("Setting session cookie...")
    const sessionData = JSON.stringify({
      userId: user.id,
      email: user.email,
      username: user.username,
    } as UserSession)
    cookies().set("session", sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60,
      path: "/",
      sameSite: "strict",
    })
    console.log("Session set:", { userId: user.id, session: sessionData })

    revalidatePath("/tweet")
    revalidatePath(`/profile/${user.id}`)
    revalidatePath(`/users/${user.username}`)

    return {
      message: "SMS Login successful!",
      userId: user.id,
      success: true,
    }
  } catch (error) {
    console.error("SMSLogin error:", error)
    return {
      message: "Server error occurred.",
      errors: { server: ["Failed to login. Please try again."] },
    }
  }
}
