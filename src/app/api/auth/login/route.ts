import { NextResponse } from "next/server"

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ detail: "Email and password are required" }, { status: 400 })
    }

    // Use Firebase REST API to sign in
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      const message = data.error?.message === "EMAIL_NOT_FOUND" || data.error?.message === "INVALID_PASSWORD"
        ? "Invalid credentials"
        : data.error?.message || "Login failed"
      return NextResponse.json({ detail: message }, { status: 401 })
    }

    return NextResponse.json({
      access_token: data.idToken,
      token_type: "bearer",
      refresh_token: data.refreshToken,
      expires_in: data.expiresIn,
    })
  } catch (error: any) {
    return NextResponse.json({ detail: error.message || "Login failed" }, { status: 500 })
  }
}
