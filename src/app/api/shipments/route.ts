import { NextResponse } from "next/server"
import { authenticateRequest, isAuthError } from "@/lib/api-auth"
import * as db from "@/lib/db"

// GET /api/shipments
export async function GET(req: Request) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const shipments = await db.getShipmentsByUser(auth.uid)
  return NextResponse.json(shipments)
}

// POST /api/shipments
export async function POST(req: Request) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth

  const { description, origin, destination, device_id, status } = await req.json()

  const shipment = await db.createShipment({
    description,
    origin,
    destination,
    device_id: device_id || null,
    status: status || "Pending",
    user_id: auth.uid,
  })
  return NextResponse.json(shipment)
}
