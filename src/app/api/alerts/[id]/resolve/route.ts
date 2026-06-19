import { NextResponse } from "next/server"
import { authenticateRequest, isAuthError } from "@/lib/api-auth"
import * as db from "@/lib/db"

// PATCH /api/alerts/[id]/resolve
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const { id } = await params

  // Verify alert belongs to user's device
  const alerts = await db.getAlertsByUser(auth.uid)
  const alert = alerts.find((a: any) => a.id === id)
  if (!alert) {
    return NextResponse.json({ detail: "Alert not found" }, { status: 404 })
  }

  const resolved = await db.resolveAlert(id)
  return NextResponse.json(resolved)
}
