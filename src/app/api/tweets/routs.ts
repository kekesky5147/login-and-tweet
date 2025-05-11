import { NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import { unstable_noStore as noStore } from "next/cache"

export async function GET() {
  noStore()
  try {
    const tweets = await prisma.tweet.findMany({
      include: { user: { select: { nickname: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(tweets)
  } catch (error) {
    console.error("Fetch tweets error:", error)
    return NextResponse.json(
      { error: "Failed to fetch tweets" },
      { status: 500 }
    )
  }
}
