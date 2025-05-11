"use server"

import { prisma } from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"
import {
  Tweet,
  UserProfile,
  CreateTweetResult,
  DeleteTweetResult,
} from "@/src/lib/types"
import { cookies } from "next/headers"

export async function createTweet(
  formData: FormData
): Promise<CreateTweetResult> {
  try {
    const session = cookies().get("session")?.value
    console.log("CreateTweet session:", session)
    if (!session) {
      return { message: "Unauthorized", errors: { server: ["Please log in."] } }
    }
    const { userId } = JSON.parse(session)
    const content = formData.get("content")?.toString()

    if (!content || content.length < 1 || content.length > 280) {
      return {
        message: "Invalid content",
        errors: { content: ["Content must be between 1 and 280 characters."] },
      }
    }

    const tweet = await prisma.tweet.create({
      data: { content, userId: Number(userId) },
    })
    console.log("Tweet created:", tweet)
    revalidatePath("/tweet")
    revalidatePath("/search")
    return { message: "Tweet created successfully!", tweetId: tweet.id }
  } catch (error) {
    console.error("Create tweet error:", error)
    return {
      message: "Failed to create tweet.",
      errors: { server: ["Failed to create tweet. Please try again."] },
    }
  }
}

export async function getUserTweets(userId: number): Promise<Tweet[]> {
  try {
    const tweets = await prisma.tweet.findMany({
      where: { userId },
      include: { user: { select: { nickname: true } } },
      orderBy: { createdAt: "desc" },
    })
    console.log("User tweets:", tweets)
    return tweets
  } catch (error) {
    console.error("Get user tweets error:", error)
    return []
  }
}

export async function getUserProfile(
  userId: number
): Promise<UserProfile | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        username: true,
        bio: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    console.log("User profile:", user)
    return user
  } catch (error) {
    console.error("Get user profile error:", error)
    return null
  }
}

export async function getUserByUsername(
  username: string
): Promise<UserProfile | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        nickname: true,
        username: true,
        bio: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    console.log("User by username:", user, "Username:", username)
    if (!user) {
      console.log("No user found for username:", username)
    }
    return user
  } catch (error) {
    console.error("Get user by username error:", error)
    return null
  }
}

export async function deleteTweet(tweetId: number): Promise<DeleteTweetResult> {
  try {
    const session = cookies().get("session")?.value
    console.log("DeleteTweet session:", session)
    if (!session) {
      return { message: "Unauthorized", errors: { server: ["Please log in."] } }
    }
    const { userId } = JSON.parse(session)
    const tweet = await prisma.tweet.findUnique({ where: { id: tweetId } })
    if (!tweet || tweet.userId !== Number(userId)) {
      return {
        message: "Unauthorized or tweet not found",
        errors: { authorization: ["You cannot delete this tweet."] },
      }
    }
    await prisma.tweet.delete({ where: { id: tweetId } })
    console.log("Tweet deleted:", tweetId)
    revalidatePath("/tweet")
    revalidatePath(`/profile/${userId}`)
    revalidatePath("/search")
    return { message: "Tweet deleted successfully!" }
  } catch (error) {
    console.error("Delete tweet error:", error)
    return {
      message: "Failed to delete tweet.",
      errors: { server: ["Failed to delete tweet. Please try again."] },
    }
  }
}

export async function searchTweets(query: string): Promise<Tweet[]> {
  try {
    const tweets = await prisma.tweet.findMany({
      where: {
        content: {
          contains: query,
          mode: "insensitive",
        },
      },
      include: {
        user: {
          select: { nickname: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    console.log("Search tweets:", tweets, "Query:", query)
    return tweets
  } catch (error) {
    console.error("Search tweets error:", error)
    return []
  }
}

export async function getAllTweets(): Promise<Tweet[]> {
  try {
    const tweets = await prisma.tweet.findMany({
      include: {
        user: {
          select: { nickname: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    console.log("All tweets:", tweets)
    return tweets
  } catch (error) {
    console.error("Get all tweets error:", error)
    return []
  }
}

export async function logout() {
  cookies().delete("session")
  revalidatePath("/")
}
