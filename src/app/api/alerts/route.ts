import { NextResponse } from "next/server"
import { authenticateRequest, isAuthError } from "@/lib/api-auth"
import * as db from "@/lib/db"

// GET /api/alerts
export async function GET(req: Request) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const alerts = await db.getAlertsByUser(auth.uid)
  return NextResponse.json(alerts)
}
