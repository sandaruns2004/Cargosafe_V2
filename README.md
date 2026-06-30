<div align="center">
  <img src="https://img.icons8.com/?size=512&id=5nLOfxYgP5O0&format=png" alt="CargoSafe Logo" width="120" height="120" />
  <h1>CargoSafe Platform v2.0</h1>
  <p><strong>Premium Enterprise Fleet Intelligence & IoT Cargo Tracking Platform</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16.2-black?logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase" alt="Firebase" />
  </p>
</div>

<br />

CargoSafe is a next-generation **IoT telematics and logistics platform** built on a unified full-stack **Next.js 16** architecture. Featuring a stunning glassmorphic, dark-luxury UI, it provides real-time sensor data ingestion, automated environmental alerting, and a public shipment tracking portal designed for modern fleet management.

---

## ✨ Enterprise Features

- 🎨 **Premium UI/UX Design System**: Built with Tailwind CSS v4, featuring glassmorphic cards, neon gradients, subtle micro-animations, and a highly polished dark-mode aesthetic.
- 📡 **Advanced IoT Telemetry Engine**: Ingests multi-dimensional environmental data (Temperature, Humidity, Vibration, Tilt, and 3-Axis Shock) from hardware trackers (ESP32, Raspberry Pi) via secure API key authentication.
- ⚙️ **Over-The-Air (OTA) Configuration**: Remotely adjust hardware parameters (sampling rates, GPS toggles, and environmental thresholds) directly from the web dashboard.
- 🚨 **Automated Alerting System**: Server-side threshold evaluation automatically flags critical environmental breaches in real-time.
- 🗺️ **Public Tracking Portal**: Generate shareable, tokenized `TRK-...` tracking links exposing live GPS routes and sensor states without requiring an account.
- 📦 **End-to-End Shipment Lifecycle**: Create shipments, assign tracking devices, generate QR codes, and monitor global status.
- 📊 **Interactive Data Visualization**: 5-line time-series telemetry charts powered by Recharts for deep analytical insights.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) & TypeScript |
| **Frontend UI** | React 19, Tailwind CSS v4, Recharts 3, Lucide React 1.x, Leaflet Maps |
| **Backend API** | Next.js API Routes (Node.js Serverless Functions) |
| **Database** | Firebase Firestore (NoSQL Document Store) |
| **Authentication** | Firebase Auth (Client) + Firebase Admin SDK (Server JWT Verification) |
| **Typography** | Syne (Display), Inter (Body), JetBrains Mono (Code) |

---

## 🚀 Getting Started

Follow these instructions to spin up your local development environment.

### 1. Prerequisites

You will need a [Firebase Console](https://firebase.google.com/) project configured with:
1. **Firestore Database** (Native mode enabled).
2. **Authentication** (Email/Password provider enabled).
3. A downloaded **Service Account Private Key** (for the Firebase Admin SDK).

### 2. Environment Configuration

Create a `.env.local` file in the root of the project and populate it with your Firebase credentials:

```env
# ── Client SDK (Public) ──────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

# ── Admin SDK (Server-only, strictly confidential) ───────────
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxx@your.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```
> **⚠️ Critical:** Ensure the `FIREBASE_PRIVATE_KEY` retains the `\n` escape sequences exactly as exported from the Firebase console.

### 3. Installation & Execution

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) in your browser. You will be securely redirected to the `/login` portal.

---

## 📡 Hardware Integration (IoT API)

CargoSafe provides simple REST endpoints for your hardware engineers to push data and pull configurations.

### Ingest Telemetry (POST)
Endpoint: `POST /api/telemetry`
```json
{
  "device_id": "DEV-123",
  "api_key": "SECURE_KEY",
  "timestamp": "2023-08-01T12:34:56Z",
  "temp": 25.5,
  "hum": 60.2,
  "shock_x": 0.123,
  "shock_y": -0.456,
  "shock_z": 0.789,
  "vibration": 0.012,
  "tilt": 15.3,
  "lat": 12.345678,
  "lon": 98.765432,
  "flags": ["TEMP_HI"]
}
```

### Pull Configuration (GET)
Endpoint: `GET /api/devices/config?device_id=DEV-123&api_key=SECURE_KEY`
```json
{
  "sampling_rate_seconds": 60,
  "temp_threshold_high": 35,
  "gps_enabled": true
}
```

---

## 📂 Project Architecture

```text
cargosafe/
├── src/
│   ├── app/                        # Next.js App Router Core
│   │   ├── api/                    # Backend API Routes (Serverless)
│   │   ├── dashboard/              # Fleet Overview & Analytics
│   │   ├── devices/                # IoT Device Management
│   │   ├── track/[code]/           # Public Tracking Portal
│   │   └── globals.css             # Tailwind Design System
│   ├── components/                 # Reusable React UI Library
│   ├── lib/                        # Backend Services & DB Abstractions
│   └── services/                   # Frontend API Fetch Wrappers
├── tailwind.config.ts              # Custom Tokens & Animations
└── next.config.ts                  # Next.js Build Configuration
```

---

## 🤝 Contributing

We welcome contributions to CargoSafe! 
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request.

---

<div align="center">
  <p>Built with precision by the CargoSafe Engineering Team.</p>
  <p><strong>&copy; 2026 CargoSafe. All Rights Reserved.</strong></p>
</div>
