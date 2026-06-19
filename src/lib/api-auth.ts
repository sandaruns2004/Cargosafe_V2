import { NextResponse } from "next/server"
import { adminAuth } from "./firebase-admin"

export async function authenticateRequest(req: Request): Promise<{ uid: string } | NextResponse> {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { detail: "Invalid or expired token" },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
    )
  }

  const token = authHeader.slice(7)
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return { uid: decoded.uid }
  } catch {
    return NextResponse.json(
      { detail: "Invalid or expired token" },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
    )
  }
}

export function isAuthError(result: any): result is NextResponse {
  return result instanceof NextResponse
}
