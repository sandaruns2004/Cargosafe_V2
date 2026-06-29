import { adminDb } from "./firebase-admin"
import crypto from "crypto"

// ── Helpers ────────────────────────────────────────────

function generateToken(bytes: number): string {
  return crypto.randomBytes(bytes).toString("base64url")
}

// ══════════════════════════════════════════════════════
// ── USERS ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════

export async function getUserById(uid: string) {
  const doc = await adminDb.collection("users").doc(uid).get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() } as any
}

export async function createUserProfile(uid: string, data: {
  name: string
  email: string
  company_name: string | null
}) {
  const profile = {
    ...data,
    created_at: new Date().toISOString(),
  }
  await adminDb.collection("users").doc(uid).set(profile)
  return { id: uid, ...profile }
}

// ══════════════════════════════════════════════════════
// ── DEVICES ───────────────────────────────────────────
// ══════════════════════════════════════════════════════

export async function createDevice(data: {
  device_id: string
  user_id: string
  label: string | null
}) {
  // Check uniqueness of device_id string
  const existing = await adminDb.collection("devices")
    .where("device_id", "==", data.device_id).limit(1).get()
  if (!existing.empty) throw new Error("Device ID already exists")

  const api_key = generateToken(32) // ~43 char URL-safe key
  const ref = adminDb.collection("devices").doc()
  const device = {
    id: ref.id,
    ...data,
    api_key,
    status: "offline",
    last_seen: null,
    created_at: new Date().toISOString(),
    config: {
      sampling_rate_seconds: 60,
      temp_threshold_high: 30,
      temp_threshold_low: 0,
      hum_threshold_high: 80,
      hum_threshold_low: 20,
      shock_threshold: 15,
      vibration_threshold: 0.5,
      tilt_threshold: 30,
      gps_enabled: true,
      updated_at: new Date().toISOString(),
    }
  }
  await ref.set(device)
  return device
}

export async function getDevicesByUser(userId: string) {
  const snapshot = await adminDb.collection("devices")
    .where("user_id", "==", userId).get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function getDeviceById(id: string) {
  const doc = await adminDb.collection("devices").doc(id).get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() } as any
}

export async function findDeviceByIdAndKey(deviceIdStr: string, apiKey: string) {
  const snapshot = await adminDb.collection("devices")
    .where("device_id", "==", deviceIdStr)
    .where("api_key", "==", apiKey)
    .limit(1).get()
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  return { id: doc.id, ...doc.data() } as any
}

export async function updateDevice(id: string, data: Record<string, any>) {
  await adminDb.collection("devices").doc(id).update(data)
  const updated = await adminDb.collection("devices").doc(id).get()
  return { id: updated.id, ...updated.data() }
}

export async function getDeviceConfigByIdAndKey(deviceIdStr: string, apiKey: string) {
  const snapshot = await adminDb.collection("devices")
    .where("device_id", "==", deviceIdStr)
    .where("api_key", "==", apiKey)
    .limit(1).get()
  
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  const data = doc.data()
  
  return {
    device_id: data.device_id,
    config: data.config || {}
  }
}

export async function updateDeviceConfig(id: string, configUpdates: Record<string, any>) {
  const doc = await adminDb.collection("devices").doc(id).get()
  if (!doc.exists) throw new Error("Device not found")
  
  const currentData = doc.data()
  const currentConfig = currentData?.config || {}
  
  const newConfig = {
    ...currentConfig,
    ...configUpdates,
    updated_at: new Date().toISOString(),
  }
  
  await adminDb.collection("devices").doc(id).update({ config: newConfig })
  
  return newConfig
}

export async function deleteDevice(id: string) {
  // Cascade: delete telemetry subcollection
  const telemetrySnap = await adminDb.collection("devices").doc(id)
    .collection("telemetry").get()
  if (!telemetrySnap.empty) {
    const batch = adminDb.batch()
    telemetrySnap.docs.forEach(doc => batch.delete(doc.ref))
    await batch.commit()
  }

  // Cascade: delete alerts for this device
  const alertsSnap = await adminDb.collection("alerts")
    .where("device_id", "==", id).get()
  if (!alertsSnap.empty) {
    const batch = adminDb.batch()
    alertsSnap.docs.forEach(doc => batch.delete(doc.ref))
    await batch.commit()
  }

  // Delete the device document
  await adminDb.collection("devices").doc(id).delete()
}

// ══════════════════════════════════════════════════════
// ── SHIPMENTS ─────────────────────────────────────────
// ══════════════════════════════════════════════════════

export async function createShipment(data: {
  description: string
  origin: string
  destination: string
  device_id: string | null
  status: string
  user_id: string
}) {
  const tracking_code = generateToken(8) // ~11 char URL-safe code
  const ref = adminDb.collection("shipments").doc()
  const shipment = {
    id: ref.id,
    tracking_code,
    ...data,
    created_at: new Date().toISOString(),
  }
  await ref.set(shipment)
  return shipment
}

export async function getShipmentsByUser(userId: string) {
  const snapshot = await adminDb.collection("shipments")
    .where("user_id", "==", userId).get()

  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const aDate = new Date((a as any).created_at).getTime()
      const bDate = new Date((b as any).created_at).getTime()
      return bDate - aDate
    })
}

export async function getShipmentById(id: string) {
  const doc = await adminDb.collection("shipments").doc(id).get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() } as any
}

export async function getShipmentByTrackingCode(code: string) {
  const snapshot = await adminDb.collection("shipments")
    .where("tracking_code", "==", code).limit(1).get()
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  return { id: doc.id, ...doc.data() } as any
}

export async function updateShipment(id: string, data: Record<string, any>) {
  await adminDb.collection("shipments").doc(id).update(data)
  return getShipmentById(id)
}

export async function deleteShipment(id: string) {
  await adminDb.collection("shipments").doc(id).delete()
}

// ══════════════════════════════════════════════════════
// ── TELEMETRY ─────────────────────────────────────────
// ══════════════════════════════════════════════════════

export async function addTelemetry(data: {
  device_id: string  // Firestore device doc ID
  temp: number
  hum: number
  shock_x: number
  shock_y: number
  shock_z: number
  vibration?: number | null
  tilt?: number | null
  lat: number | null
  lon: number | null
  flags?: string[] | null
  device_timestamp?: string | null
}) {
  // Compute shock_magnitude server-side
  const shock_magnitude = Math.sqrt(
    data.shock_x * data.shock_x + 
    data.shock_y * data.shock_y + 
    data.shock_z * data.shock_z
  )

  // Store as subcollection under the device doc
  const ref = adminDb.collection("devices").doc(data.device_id)
    .collection("telemetry").doc()
  const telemetry = {
    id: ref.id,
    ...data,
    shock_magnitude,
    timestamp: new Date().toISOString(),
  }
  await ref.set(telemetry)
  return telemetry
}

export async function getTelemetryByDevice(deviceId: string, limit: number = 50): Promise<any[]> {
  const snapshot = await adminDb.collection("devices").doc(deviceId)
    .collection("telemetry")
    .orderBy("timestamp", "desc")
    .limit(limit).get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function getTelemetryByUser(userId: string, deviceId?: string, limit: number = 50): Promise<any[]> {
  // If specific device, just get that device's telemetry
  if (deviceId) {
    return getTelemetryByDevice(deviceId, limit)
  }

  // Otherwise, get telemetry from all user's devices
  const devices = await getDevicesByUser(userId)
  const allTelemetry: any[] = []

  for (const device of devices) {
    const records = await getTelemetryByDevice((device as any).id, limit)
    allTelemetry.push(...records)
  }

  return allTelemetry
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

// ══════════════════════════════════════════════════════
// ── ALERTS ────────────────────────────────────────────
// ══════════════════════════════════════════════════════

export async function createAlert(data: {
  device_id: string
  type: string
  message: string
  level: string
}) {
  const ref = adminDb.collection("alerts").doc()
  const alert = {
    id: ref.id,
    ...data,
    resolved: false,
    created_at: new Date().toISOString(),
  }
  await ref.set(alert)
  return alert
}

export async function getAlertsByUser(userId: string) {
  const devices = await getDevicesByUser(userId)
  const deviceIds = devices.map((d: any) => d.id)
  if (deviceIds.length === 0) return []

  // Firestore "in" query limited to 30 items per query
  const allAlerts: any[] = []
  for (let i = 0; i < deviceIds.length; i += 30) {
    const chunk = deviceIds.slice(i, i + 30)
    const snapshot = await adminDb.collection("alerts")
      .where("device_id", "in", chunk).get()
    allAlerts.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  }

  return allAlerts.sort((a, b) =>
    new Date((b as any).created_at).getTime() - new Date((a as any).created_at).getTime()
  )
}

export async function getAlertById(id: string) {
  const doc = await adminDb.collection("alerts").doc(id).get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() } as any
}

export async function resolveAlert(id: string) {
  await adminDb.collection("alerts").doc(id).update({ resolved: true })
  const doc = await adminDb.collection("alerts").doc(id).get()
  return { id: doc.id, ...doc.data() }
}
