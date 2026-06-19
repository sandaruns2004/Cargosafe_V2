import { NextResponse } from "next/server"
import { authenticateRequest, isAuthError } from "@/lib/api-auth"
import * as db from "@/lib/db"

// GET /api/devices/[id]/telemetry — Returns telemetry records for a specific device
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const { id } = await params
  const device = await db.getDeviceById(id)
  if (!device || device.user_id !== auth.uid) {
    return NextResponse.json({ detail: "Device not found" }, { status: 404 })
  }

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200)

  const records = await db.getTelemetryByDevice(id, limit)

  return NextResponse.json({
    device_id: device.device_id,
    label: device.label,
    records,
  })
}
