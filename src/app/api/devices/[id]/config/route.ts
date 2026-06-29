import { NextResponse } from "next/server"
import { authenticateRequest, isAuthError } from "@/lib/api-auth"
import * as db from "@/lib/db"

// PATCH /api/devices/[id]/config — Dashboard updates device config (JWT required)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const { id } = await params
  const device = await db.getDeviceById(id)
  if (!device || device.user_id !== auth.uid) {
    return NextResponse.json({ detail: "Device not found" }, { status: 404 })
  }

  const configUpdates = await req.json()
  // Filter to only allowed config fields
  const allowedFields = [
    "sampling_rate_seconds", "temp_threshold_high", "temp_threshold_low",
    "hum_threshold_high", "hum_threshold_low", "shock_threshold",
    "vibration_threshold", "tilt_threshold", "gps_enabled"
  ]
  
  const sanitized: Record<string, any> = {}
  for (const [key, value] of Object.entries(configUpdates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      sanitized[key] = value
    }
  }

  const updatedConfig = await db.updateDeviceConfig(id, sanitized)
  return NextResponse.json(updatedConfig)
}
