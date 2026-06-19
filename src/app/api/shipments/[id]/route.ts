import { NextResponse } from "next/server"
import { authenticateRequest, isAuthError } from "@/lib/api-auth"
import * as db from "@/lib/db"

// GET /api/shipments/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const { id } = await params
  const shipment = await db.getShipmentById(id)
  if (!shipment || shipment.user_id !== auth.uid) {
    return NextResponse.json({ detail: "Shipment not found" }, { status: 404 })
  }
  return NextResponse.json(shipment)
}

// PATCH /api/shipments/[id]
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const { id } = await params
  const shipment = await db.getShipmentById(id)
  if (!shipment || shipment.user_id !== auth.uid) {
    return NextResponse.json({ detail: "Shipment not found" }, { status: 404 })
  }

  const data = await req.json()
  // Only update provided fields
  const updates: Record<string, any> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) updates[key] = value
  }

  const updated = await db.updateShipment(id, updates)
  return NextResponse.json(updated)
}

// DELETE /api/shipments/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const { id } = await params
  const shipment = await db.getShipmentById(id)
  if (!shipment || shipment.user_id !== auth.uid) {
    return NextResponse.json({ detail: "Shipment not found" }, { status: 404 })
  }

  await db.deleteShipment(id)
  return NextResponse.json({ message: "Shipment deleted" })
}
