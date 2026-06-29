import { NextResponse } from "next/server"
import { authenticateRequest, isAuthError } from "@/lib/api-auth"
import * as db from "@/lib/db"
import { autoGenerateAlerts } from "@/lib/alerts"

// POST /api/telemetry — Device submits sensor data (NO JWT, uses api_key)
export async function POST(req: Request) {
  const {
    device_id, api_key, timestamp: deviceTimestamp,
    temp, hum, shock_x, shock_y, shock_z,
    vibration, tilt, lat, lon, flags
  } = await req.json()

  const device = await db.findDeviceByIdAndKey(device_id, api_key)
  if (!device) {
    return NextResponse.json({ detail: "Invalid device_id or api_key" }, { status: 403 })
  }

  // Update device status
  await db.updateDevice(device.id, {
    status: "online",
    last_seen: new Date().toISOString(),
  })

  // Store telemetry
  const telemetry = await db.addTelemetry({
    device_id: device.id,
    temp,
    hum,
    shock_x,
    shock_y,
    shock_z,
    vibration: vibration ?? null,
    tilt: tilt ?? null,
    lat: lat ?? null,
    lon: lon ?? null,
    flags: flags ?? null,
    device_timestamp: deviceTimestamp ?? null,
  })

  // Auto-generate alerts
  await autoGenerateAlerts(
    device.id, temp, hum, shock_x, shock_y, shock_z, 
    vibration ?? null, tilt ?? null
  )

  return NextResponse.json(telemetry)
}

// GET /api/telemetry — Get telemetry for user's devices (JWT required)
export async function GET(req: Request) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const url = new URL(req.url)
  const deviceId = url.searchParams.get("device_id") || undefined
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200)

  const telemetry = await db.getTelemetryByUser(auth.uid, deviceId, limit)
  return NextResponse.json(telemetry)
}
