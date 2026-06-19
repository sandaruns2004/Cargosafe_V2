import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  try {
    const { name, email, password, company_name } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ detail: "Name, email, and password are required" }, { status: 400 })
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    })

    // Store profile data in Firestore
    const userData = {
      name,
      email,
      company_name: company_name || null,
      created_at: new Date().toISOString(),
    }
    await adminDb.collection("users").doc(userRecord.uid).set(userData)

    return NextResponse.json({
      id: userRecord.uid,
      ...userData,
    })
  } catch (error: any) {
    if (error.code === "auth/email-already-exists") {
      return NextResponse.json({ detail: "Email already registered" }, { status: 400 })
    }
    if (error.code === "auth/invalid-password") {
      return NextResponse.json({ detail: "Password must be at least 6 characters" }, { status: 400 })
    }
    return NextResponse.json({ detail: error.message || "Registration failed" }, { status: 500 })
  }
}
