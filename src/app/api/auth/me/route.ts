import { NextResponse } from "next/server"
import { authenticateRequest, isAuthError } from "@/lib/api-auth"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(req: Request) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const userDoc = await adminDb.collection("users").doc(auth.uid).get()
  if (!userDoc.exists) {
    return NextResponse.json({ detail: "User not found" }, { status: 404 })
  }

  return NextResponse.json({
    id: auth.uid,
    ...userDoc.data(),
  })
}
