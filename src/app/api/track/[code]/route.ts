import { NextResponse } from "next/server"
import * as db from "@/lib/db"
import { adminDb } from "@/lib/firebase-admin"

// GET /api/track/[code] — Public, no auth required
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200)

  const shipment = await db.getShipmentByTrackingCode(code)
  if (!shipment) {
    return NextResponse.json({ detail: "Shipment not found" }, { status: 404 })
  }

  let last_update = null
  let location = null
  let temp = null
  let hum = null
  let shock_magnitude = null
  let vibration = null
  let tilt = null
  let path: any[] = []

  if (shipment.device_id) {
    // ── FIX: shipment.device_id is the HARDWARE STRING (e.g. "CS-1042"),
    // but getTelemetryByDevice() needs the FIRESTORE DOCUMENT ID.
    // Resolve the doc ID first via a Firestore query on device_id field.
    const deviceSnap = await adminDb
      .collection("devices")
      .where("device_id", "==", shipment.device_id)
      .limit(1)
      .get()

    if (!deviceSnap.empty) {
      const deviceDocId = deviceSnap.docs[0].id
      const telemetryRecords = await db.getTelemetryByDevice(deviceDocId, limit)

      if (telemetryRecords.length > 0) {
        const latest = telemetryRecords[0]  // already sorted newest-first
        last_update = latest.timestamp
        temp = latest.temp ?? null
        hum = latest.hum ?? null
        shock_magnitude = latest.shock_magnitude ?? null
        vibration = latest.vibration ?? null
        tilt = latest.tilt ?? null
        if (latest.lat && latest.lon) {
          location = { lat: latest.lat, lon: latest.lon }
        }
      }

      // Build GPS path: oldest → newest (only records with coordinates)
      const reversed = [...telemetryRecords].reverse()
      for (const record of reversed) {
        if (record.lat && record.lon) {
          path.push({
            lat: record.lat,
            lon: record.lon,
            timestamp: record.timestamp,
            temp: record.temp,
            hum: record.hum,
            shock_magnitude: record.shock_magnitude ?? null,
            vibration: record.vibration ?? null,
            tilt: record.tilt ?? null,
          })
        }
      }
    }
  }

  return NextResponse.json({
    tracking_code: shipment.tracking_code,
    description: shipment.description,
    origin: shipment.origin,
    destination: shipment.destination,
    status: shipment.status,
    device_id: shipment.device_id ?? null,
    last_update,
    location,
    temp,
    hum,
    shock_magnitude,
    vibration,
    tilt,
    path,
  })
}
