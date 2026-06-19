import { NextResponse } from "next/server"
import { authenticateRequest, isAuthError } from "@/lib/api-auth"
import * as db from "@/lib/db"

// GET /api/devices/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const { id } = await params
  const device = await db.getDeviceById(id)
  if (!device || device.user_id !== auth.uid) {
    return NextResponse.json({ detail: "Device not found" }, { status: 404 })
  }
  return NextResponse.json(device)
}

// DELETE /api/devices/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const { id } = await params
  const device = await db.getDeviceById(id)
  if (!device || device.user_id !== auth.uid) {
    return NextResponse.json({ detail: "Device not found" }, { status: 404 })
  }

  await db.deleteDevice(id)
  return NextResponse.json({ message: "Device deleted" })
}
