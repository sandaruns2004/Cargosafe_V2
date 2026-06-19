import { NextResponse } from "next/server"
import { authenticateRequest, isAuthError } from "@/lib/api-auth"
import * as db from "@/lib/db"

// GET /api/devices/[id]/telemetry/export — Download telemetry as CSV
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const { id } = await params
  const device = await db.getDeviceById(id)
  if (!device || device.user_id !== auth.uid) {
    return NextResponse.json({ detail: "Device not found" }, { status: 404 })
  }

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200"), 1000)
  const records = await db.getTelemetryByDevice(id, limit)

  // Build CSV
  const headers = ["timestamp", "temp", "hum", "shock_x", "shock_y", "shock_z", "lat", "lon"]
  const rows = records.map((r: any) =>
    [
      r.timestamp || "",
      r.temp ?? "",
      r.hum ?? "",
      r.shock_x ?? "",
      r.shock_y ?? "",
      r.shock_z ?? "",
      r.lat ?? "",
      r.lon ?? "",
    ].join(",")
  )

  const csv = [headers.join(","), ...rows].join("\n")
  const filename = `${device.device_id}_telemetry_${new Date().toISOString().slice(0, 10)}.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
