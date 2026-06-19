# ⚙️ How CargoSafe Works — Architecture & Data Flow

This document explains the internal mechanics of CargoSafe v2.0: how the frontend, backend, Firestore database, and IoT hardware layers communicate.

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Authentication Lifecycle](#2-authentication-lifecycle)
3. [Database Design (Firestore)](#3-database-design-firestore)
4. [API Layer — Route Reference](#4-api-layer--route-reference)
5. [IoT Telemetry Ingestion Flow](#5-iot-telemetry-ingestion-flow)
6. [Automated Alert Engine](#6-automated-alert-engine)
7. [Public Tracking System](#7-public-tracking-system)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Data Security & Isolation](#9-data-security--isolation)

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                         │
│   React 19 Pages  ──►  services/api.ts  ──►  localStorage JWT  │
└────────────────────────────┬────────────────────────────────────┘
                             │  HTTPS + Bearer Token
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Next.js 16 App Router (Vercel / Node)          │
│                                                                 │
│   ┌─────────────────┐    ┌──────────────────────────────────┐  │
│   │  Page Routes    │    │        API Routes                │  │
│   │  /dashboard     │    │  api-auth.ts (JWT verify)        │  │
│   │  /devices       │    │  db.ts (Firestore abstraction)   │  │
│   │  /shipments     │    │  alerts.ts (threshold engine)    │  │
│   │  /alerts        │    └────────────────┬─────────────────┘  │
│   │  /track/[code]  │                     │                    │
│   └─────────────────┘                     │                    │
└───────────────────────────────────────────┼────────────────────┘
                                            │ Firebase Admin SDK
                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase (Google Cloud)                       │
│                                                                 │
│   ┌──────────────────┐    ┌────────────────────────────────┐   │
│   │  Firebase Auth   │    │     Cloud Firestore            │   │
│   │  - Email/Pass    │    │     - users/{uid}              │   │
│   │  - JWT issuance  │    │     - devices/{id}             │   │
│   │  - Token verify  │    │       - telemetry/{id}         │   │
│   └──────────────────┘    │     - shipments/{id}           │   │
│                           │     - alerts/{id}              │   │
│                           └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             ▲
                             │  POST /api/telemetry
                             │  { device_id, api_key, temp, … }
┌─────────────────────────────────────────────────────────────────┐
│                    IoT Hardware Devices                          │
│   ESP32 / Raspberry Pi / Any HTTP-capable sensor               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication Lifecycle

CargoSafe uses a **hybrid authentication model**: Firebase Auth handles identity, and the Firebase Admin SDK validates tokens on every protected server request.

### Registration Flow

```
User fills /login form (Register tab)
  │
  ▼
POST /api/auth/register
  │  { name, email, password, company_name }
  │
  ├── Firebase Admin: adminAuth.createUser({ email, password })
  │   └── Returns: uid
  │
  └── Firestore: users/{uid}.set({ name, email, company_name, created_at })
```

### Login Flow

```
User fills /login form (Login tab)
  │
  ▼
POST /api/auth/login
  │  { email, password }
  │
  ├── Firebase REST API: signInWithPassword
  │   └── Returns: idToken (JWT), refreshToken
  │
  └── Response: { token: idToken, user: { name, email, … } }
        │
        ▼
    localStorage.setItem("token", idToken)
```

### Authenticated Request Flow

```
Frontend: api.get("/devices")
  │
  ├── services/api.ts injects: Authorization: Bearer <token>
  │
  ▼
GET /api/devices (Next.js Route Handler)
  │
  ├── lib/api-auth.ts: authenticateRequest(req)
  │   ├── Extracts Bearer token from header
  │   └── adminAuth.verifyIdToken(token) → { uid }
  │
  ├── lib/db.ts: getDevicesByUser(uid)
  │   └── Firestore query: devices WHERE user_id == uid
  │
  └── Response: JSON array of devices
```

### Session Termination

- On `401` from any API call, `services/api.ts` auto-clears `localStorage` and redirects to `/login`.
- The `AuthGuard` component also checks for a token in `localStorage` on page load and redirects unauthenticated users.

---

## 3. Database Design (Firestore)

Firestore uses a **NoSQL document/collection** model. The schema is optimized for per-user isolation and high-volume telemetry writes.

### Collections

```
Firestore Root
│
├── users/
│   └── {uid}                        ← Document ID = Firebase Auth UID
│       ├── name: string
│       ├── email: string
│       ├── company_name: string | null
│       └── created_at: ISO 8601 string
│
├── devices/
│   └── {auto-id}
│       ├── id: string               ← Mirrors Firestore doc ID
│       ├── device_id: string        ← Human-readable hardware ID (e.g. "DEV-001")
│       ├── user_id: string          ← Owning user's UID (FK to users)
│       ├── label: string | null
│       ├── api_key: string          ← 43-char URL-safe random key
│       ├── status: "online" | "offline"
│       ├── last_seen: ISO 8601 | null
│       ├── created_at: ISO 8601
│       │
│       └── telemetry/               ← SUBCOLLECTION (per-device isolation)
│           └── {auto-id}
│               ├── id: string
│               ├── device_id: string  ← Parent device doc ID
│               ├── temperature: number (°C)
│               ├── humidity: number (%)
│               ├── battery: number (Volts)
│               ├── lat: number | null
│               ├── lon: number | null
│               └── timestamp: ISO 8601
│
├── shipments/
│   └── {auto-id}
│       ├── id: string
│       ├── tracking_code: string    ← URL-safe random code (e.g. "TRK-abc123")
│       ├── description: string
│       ├── origin: string
│       ├── destination: string
│       ├── device_id: string | null ← Links to devices/{id}
│       ├── status: string           ← "pending" | "in_transit" | "delivered"
│       ├── user_id: string
│       └── created_at: ISO 8601
│
└── alerts/
    └── {auto-id}
        ├── id: string
        ├── device_id: string        ← Links to devices/{id}
        ├── type: "temperature" | "humidity" | "battery"
        ├── message: string          ← Human-readable description
        ├── level: "warning" | "critical"
        ├── resolved: boolean
        └── created_at: ISO 8601
```

### Design Decisions

- **Telemetry as subcollection**: Isolates high-volume sensor records per device. Querying device X's telemetry never touches device Y's data — ensures linear O(1) query performance regardless of fleet size.
- **Alerts as top-level collection**: Allows fleet-wide alert queries (all unresolved alerts across all devices) with a single Firestore `in` query, chunked at 30 IDs.
- **`user_id` denormalization**: Stored on `devices` and `shipments` to enable simple ownership-filtered queries without joins.
- **Cascading deletes in `db.ts`**: `deleteDevice()` first batch-deletes all `telemetry` subcollection documents and all `alerts` referencing the device before deleting the device document.

---

## 4. API Layer — Route Reference

All protected routes require `Authorization: Bearer <Firebase ID Token>`.

### Auth Routes (`/api/auth`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/auth/register` | ❌ Public | Create Firebase user + Firestore profile |
| `POST` | `/api/auth/login` | ❌ Public | Firebase REST sign-in → returns JWT |
| `GET`  | `/api/auth/me` | ✅ Required | Return current user's Firestore profile |

### Device Routes (`/api/devices`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET`  | `/api/devices` | ✅ Required | List all devices belonging to user |
| `POST` | `/api/devices` | ✅ Required | Register new device → generates `api_key` |
| `GET`  | `/api/devices/[id]` | ✅ Required | Get single device + latest telemetry |
| `PATCH`| `/api/devices/[id]` | ✅ Required | Update device label or status |
| `DELETE`| `/api/devices/[id]` | ✅ Required | Delete device (cascades telemetry + alerts) |

### Shipment Routes (`/api/shipments`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET`  | `/api/shipments` | ✅ Required | List all user shipments (sorted newest first) |
| `POST` | `/api/shipments` | ✅ Required | Create shipment → generates `tracking_code` |
| `GET`  | `/api/shipments/[id]` | ✅ Required | Get single shipment |
| `PATCH`| `/api/shipments/[id]` | ✅ Required | Update status, device assignment, etc. |
| `DELETE`| `/api/shipments/[id]` | ✅ Required | Delete shipment |

### Telemetry Route (`/api/telemetry`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/telemetry` | 🔑 API Key | IoT push: validates `device_id` + `api_key`, stores reading, triggers alert engine |

**Telemetry Payload:**
```json
{
  "device_id": "DEV-001",
  "api_key": "your-43-char-key",
  "temperature": 28.5,
  "humidity": 65.2,
  "battery": 3.7,
  "lat": 6.9271,
  "lon": 79.8612
}
```

### Alert Routes (`/api/alerts`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET`  | `/api/alerts` | ✅ Required | List all alerts across all user devices |
| `PATCH`| `/api/alerts/[id]/resolve` | ✅ Required | Mark a single alert as resolved |

### Public Tracking Route

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET`  | `/api/track/[code]` | ❌ Public | Returns merged shipment + telemetry for public view |

---

## 5. IoT Telemetry Ingestion Flow

How physical hardware sends data to CargoSafe:

```
IoT Device (ESP32, RPi, etc.)
  │
  │  POST /api/telemetry
  │  { device_id: "DEV-001", api_key: "abc...", temperature: 28.5,
  │    humidity: 65.0, battery: 3.7, lat: 6.92, lon: 79.86 }
  │
  ▼
lib/db.ts: findDeviceByIdAndKey(device_id, api_key)
  ├── Firestore query: devices WHERE device_id=="DEV-001" AND api_key=="abc..."
  ├── If NOT found → 401 Unauthorized
  └── If found → deviceDoc (contains Firestore doc ID)
        │
        ├── lib/db.ts: addTelemetry({ device_id: deviceDoc.id, ... })
        │   └── Writes to: devices/{deviceDoc.id}/telemetry/{new-id}
        │
        ├── lib/db.ts: updateDevice(deviceDoc.id, { status:"online", last_seen: now })
        │
        └── lib/alerts.ts: autoGenerateAlerts(deviceDoc.id, temp, humidity, battery)
              └── → (see Alert Engine section)
```

---

## 6. Automated Alert Engine

Located in `src/lib/alerts.ts`. Runs **synchronously** on every successful telemetry ingestion before responding to the hardware device.

### Threshold Rules

| Sensor | Condition | Alert Level | Message |
|--------|-----------|-------------|---------|
| Temperature | > 35°C | `critical` | `CRITICAL: Temp {n}°C > 35°C` |
| Temperature | > 30°C (but ≤ 35°C) | `warning` | `WARNING: Temp {n}°C > 30°C` |
| Humidity | > 80% | `warning` | `WARNING: Humidity {n}% > 80%` |
| Battery | < 3.3V | `warning` | `WARNING: Battery low {n}V` |

All triggered alerts are written to `alerts/{auto-id}` with `resolved: false`. Alerts are **not deduplicated** — each telemetry push that breaches a threshold creates a new alert document. Users resolve alerts manually via the `/alerts` page.

---

## 7. Public Tracking System

Allows sharing shipment status with customers without requiring an account.

```
User creates Shipment → backend generates tracking_code (e.g. "abc12345")
User shares link: https://yourdomain.com/track/abc12345

Customer visits /track/abc12345
  │
  ▼
GET /api/track/abc12345 (PUBLIC — no auth)
  │
  ├── db.getShipmentByTrackingCode("abc12345")
  │   └── shipment: { device_id: "firestoreId", origin, destination, status, … }
  │
  ├── db.getTelemetryByDevice(shipment.device_id, limit=50)
  │   └── telemetry[]: [ { temperature, humidity, lat, lon, timestamp }, … ]
  │
  └── Response: {
        shipment: { … },
        latestTemp: telemetry[0].temperature,
        latestHumidity: telemetry[0].humidity,
        path: [ { lat, lon } ]  ← GPS coordinates array for map rendering
      }

/track/[code]/page.tsx renders:
  - Light-themed, public-facing UI (no Navbar)
  - Leaflet map with GPS path polyline
  - Current temperature & humidity badges
  - Shipment status & route info
```

---

## 8. Frontend Architecture

### Page Structure

| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| `/` | `page.tsx` | Redirect | Redirects to `/dashboard` |
| `/login` | `login/page.tsx` | Public | Email/password login + register tabs |
| `/dashboard` | `dashboard/page.tsx` | `AuthGuard` | Fleet overview stat cards + charts |
| `/devices` | `devices/page.tsx` | `AuthGuard` | Device grid with API key copy |
| `/shipments` | `shipments/page.tsx` | `AuthGuard` | Shipment table + QR code modal |
| `/alerts` | `alerts/page.tsx` | `AuthGuard` | Alert list + one-click resolve |
| `/track/[code]` | `track/[code]/page.tsx` | Public | Public tracking map + sensor data |
| `/test-telemetry` | `test-telemetry/page.tsx` | `AuthGuard` | Developer payload sender |

### Component Inventory

| Component | File | Description |
|-----------|------|-------------|
| `Navbar` | `components/Navbar.tsx` | Sticky top nav, mobile-responsive hamburger menu, hidden on `/login` and `/track` routes |
| `AuthGuard` | `components/AuthGuard.tsx` | Checks `localStorage` for token; redirects to `/login` if absent |
| `TelemetryChart` | `components/TelemetryChart.tsx` | Recharts `LineChart` displaying temperature/humidity time series |
| `ModernDropdown` | `components/ModernDropdown.tsx` | Custom accessible dropdown for status selectors |

### Frontend HTTP Client (`services/api.ts`)

All API calls go through the `api` object which:
1. Reads the JWT from `localStorage`
2. Attaches `Authorization: Bearer <token>` to every request
3. On `401` response: clears token + redirects to `/login`
4. On other errors: parses and throws `{ detail: string }`

```ts
api.get("/devices")                          // GET /api/devices
api.post("/devices", { device_id, label })   // POST /api/devices
api.patch("/shipments/abc", { status })      // PATCH /api/shipments/abc
api.delete("/devices/xyz")                   // DELETE /api/devices/xyz
```

---

## 9. Data Security & Isolation

| Security Concern | Mechanism |
|-----------------|-----------|
| **User data isolation** | Every Firestore query filters by `user_id == auth.uid` (extracted from verified JWT) |
| **API route protection** | `authenticateRequest()` in every protected route; returns `401` if token is missing or invalid |
| **IoT device auth** | Telemetry endpoint uses `device_id` + `api_key` pair (no user JWT) — keys are 43-char URL-safe random tokens |
| **Admin SDK on server only** | `firebase-admin.ts` is only imported in `src/lib/` (server-side). Client code only uses `firebase.ts` |
| **Token storage** | JWT stored in `localStorage` (XSS consideration — future upgrade path: `httpOnly` cookie via Next.js middleware) |
| **Private key handling** | `FIREBASE_PRIVATE_KEY` is a server-only env var, never prefixed with `NEXT_PUBLIC_` |
