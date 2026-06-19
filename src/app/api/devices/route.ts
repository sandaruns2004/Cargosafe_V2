import { NextResponse } from "next/server"
import { authenticateRequest, isAuthError } from "@/lib/api-auth"
import * as db from "@/lib/db"

// GET /api/devices — List user's devices
export async function GET(req: Request) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const devices = await db.getDevicesByUser(auth.uid)
  return NextResponse.json(devices)
}

// POST /api/devices — Register new device
export async function POST(req: Request) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const { device_id, label } = await req.json()
  if (!device_id) return NextResponse.json({ detail: "device_id is required" }, { status: 400 })

  try {
    const device = await db.createDevice({
      device_id,
      label: label || null,
      user_id: auth.uid,
    })
    return NextResponse.json(device)
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 400 })
  }
}
