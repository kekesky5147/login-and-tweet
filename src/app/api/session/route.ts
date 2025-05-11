import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const session = cookies().get("session")?.value
    if (!session) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }
    const parsedSession = JSON.parse(session)
    return NextResponse.json({ userId: parsedSession.userId })
  } catch (error) {
    console.error("Session fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    )
  }
}
