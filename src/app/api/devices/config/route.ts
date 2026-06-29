import { NextResponse } from "next/server"
import * as db from "@/lib/db"

// GET /api/devices/config — Device polls for its configuration (API key auth)
export async function GET(req: Request) {
  const url = new URL(req.url)
  const device_id = url.searchParams.get("device_id")
  const api_key = url.searchParams.get("api_key")

  if (!device_id || !api_key) {
    return NextResponse.json({ detail: "device_id and api_key are required" }, { status: 400 })
  }

  const config = await db.getDeviceConfigByIdAndKey(device_id, api_key)
  if (!config) {
    return NextResponse.json({ detail: "Invalid device_id or api_key" }, { status: 403 })
  }

  return NextResponse.json(config)
}
