import * as db from "./db"
import { adminDb } from "./firebase-admin"

/**
 * Check if an unresolved alert of the given type already exists for this device.
 * This prevents alert floods when a sensor stays above/below a threshold.
 */
async function hasUnresolvedAlert(deviceDocId: string, type: string): Promise<boolean> {
  const snapshot = await adminDb
    .collection("alerts")
    .where("device_id", "==", deviceDocId)
    .where("type", "==", type)
    .where("resolved", "==", false)
    .limit(1)
    .get()
  return !snapshot.empty
}

export async function autoGenerateAlerts(
  deviceDocId: string,
  temp: number,
  hum: number,
  shock_x: number,
  shock_y: number,
  shock_z: number,
  vibration: number | null,
  tilt: number | null
) {
  const checks = await Promise.all([
    hasUnresolvedAlert(deviceDocId, "temperature"),
    hasUnresolvedAlert(deviceDocId, "humidity"),
    hasUnresolvedAlert(deviceDocId, "shock"),
    hasUnresolvedAlert(deviceDocId, "vibration"),
    hasUnresolvedAlert(deviceDocId, "tilt"),
  ])
  const [hasTempAlert, hasHumidityAlert, hasShockAlert, hasVibrationAlert, hasTiltAlert] = checks

  const promises: Promise<any>[] = []

  // Temperature thresholds — only create if no existing unresolved alert
  if (!hasTempAlert) {
    if (temp > 35) {
      promises.push(db.createAlert({
        device_id: deviceDocId,
        type: "temperature",
        message: `CRITICAL: Temp ${temp}°C > 35°C`,
        level: "critical",
      }))
    } else if (temp > 30) {
      promises.push(db.createAlert({
        device_id: deviceDocId,
        type: "temperature",
        message: `WARNING: Temp ${temp}°C > 30°C`,
        level: "warning",
      }))
    }
  }

  // Humidity threshold
  if (!hasHumidityAlert && hum > 80) {
    promises.push(db.createAlert({
      device_id: deviceDocId,
      type: "humidity",
      message: `WARNING: Hum ${hum}% > 80%`,
      level: "warning",
    }))
  }

  // Shock threshold
  const shockMagnitude = Math.sqrt(shock_x * shock_x + shock_y * shock_y + shock_z * shock_z)
  if (!hasShockAlert) {
    if (shockMagnitude > 20) {
      promises.push(db.createAlert({
        device_id: deviceDocId,
        type: "shock",
        message: `CRITICAL: Shock high ${shockMagnitude.toFixed(2)} m/s²`,
        level: "critical",
      }))
    } else if (shockMagnitude > 15) {
      promises.push(db.createAlert({
        device_id: deviceDocId,
        type: "shock",
        message: `WARNING: Shock high ${shockMagnitude.toFixed(2)} m/s²`,
        level: "warning",
      }))
    }
  }

  // Vibration threshold
  if (!hasVibrationAlert && vibration !== null) {
    if (vibration > 1.0) {
      promises.push(db.createAlert({
        device_id: deviceDocId,
        type: "vibration",
        message: `CRITICAL: Vibration ${vibration.toFixed(2)} > 1.0`,
        level: "critical",
      }))
    } else if (vibration > 0.5) {
      promises.push(db.createAlert({
        device_id: deviceDocId,
        type: "vibration",
        message: `WARNING: Vibration ${vibration.toFixed(2)} > 0.5`,
        level: "warning",
      }))
    }
  }

  // Tilt threshold
  if (!hasTiltAlert && tilt !== null) {
    if (tilt > 45) {
      promises.push(db.createAlert({
        device_id: deviceDocId,
        type: "tilt",
        message: `CRITICAL: Tilt ${tilt.toFixed(1)}° > 45°`,
        level: "critical",
      }))
    } else if (tilt > 30) {
      promises.push(db.createAlert({
        device_id: deviceDocId,
        type: "tilt",
        message: `WARNING: Tilt ${tilt.toFixed(1)}° > 30°`,
        level: "warning",
      }))
    }
  }

  await Promise.all(promises)
}
