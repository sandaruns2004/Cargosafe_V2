# 📦 CargoSafe v2.0

> **Premium Enterprise Fleet Intelligence & Cargo Tracking Platform**

CargoSafe is a **full-stack Next.js 16** application with a **glassmorphic, dark-luxury UI** powered by **Tailwind CSS v4**. It provides real-time IoT telemetry ingestion, an automated alerts engine, and a public shipment tracking portal — all backed by **Firebase Firestore & Firebase Auth**.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎨 **Premium Design System** | Glassmorphic cards, neon gradients, micro-animations, and a deep dark-mode luxury theme |
| 🔐 **Firebase Auth (Hybrid)** | Client-side email/password sign-in + server-side Admin SDK JWT verification |
| 📡 **IoT Telemetry Ingestion** | Hardware devices (ESP32, RPi) push sensor data via API key auth |
| 🚨 **Auto Alert Engine** | Server-side threshold evaluation on every telemetry push (temp, humidity, battery) |
| 🗺️ **Public Tracking Portal** | Shareable `TRK-...` links expose live GPS path & sensor state — no account needed |
| 📦 **Device Management** | Register devices, copy API keys, view online/offline status |
| 🚢 **Shipment Lifecycle** | Create, assign devices, generate QR codes, and track status |
| 📊 **Telemetry Charts** | Recharts-powered time-series graphs for temperature & humidity trends |
| 🧪 **Test Telemetry UI** | Developer tool to manually push sensor payloads for testing |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) – TypeScript |
| **Frontend** | React 19, Tailwind CSS v4, Recharts 3, Lucide React 1.x |
| **Backend** | Next.js API Routes (Node.js serverless) |
| **Database** | Firebase Firestore (NoSQL document store) |
| **Authentication** | Firebase Auth (client) + Firebase Admin SDK (server JWT verification) |
| **QR Codes** | `qrcode.react` v4 |
| **Fonts** | Syne (display), Inter (body), JetBrains Mono (code) — via Google Fonts |

---

## 🚀 Getting Started

### 1. Prerequisites

- A [Firebase](https://firebase.google.com/) project with:
  - **Firestore Database** enabled (Native mode)
  - **Authentication** enabled → Email/Password provider
  - A **Service Account Private Key** downloaded (for Admin SDK)

### 2. Environment Variables

Create `.env.local` in the project root:

```env
# ── Client SDK (public) ──────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

# ── Admin SDK (server-only, never exposed to browser) ────────
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

> ⚠️ The `FIREBASE_PRIVATE_KEY` must retain `\n` escape sequences exactly as exported from the Firebase console.

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login`. Register an account to access the dashboard.

---

## 📂 Project Structure

```
cargosafe/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (fonts, Navbar)
│   │   ├── page.tsx                # Root redirect → /dashboard
│   │   ├── globals.css             # Tailwind v4 base + atmosphere
│   │   ├── dashboard/              # Fleet overview & stat cards
│   │   ├── devices/                # IoT device management UI
│   │   ├── shipments/              # Shipment table + QR modal
│   │   ├── alerts/                 # Critical alert list + resolve
│   │   ├── login/                  # Email/password auth page
│   │   ├── track/[code]/           # Public tracking portal (light)
│   │   ├── test-telemetry/         # Developer telemetry sender
│   │   └── api/                    # Backend API routes
│   │       ├── auth/
│   │       │   ├── login/          # POST — Firebase REST proxy
│   │       │   ├── register/       # POST — create user + profile
│   │       │   └── me/             # GET  — current user profile
│   │       ├── devices/
│   │       │   ├── route.ts        # GET (list) / POST (create)
│   │       │   └── [id]/route.ts   # GET / PATCH / DELETE
│   │       ├── shipments/
│   │       │   ├── route.ts        # GET (list) / POST (create)
│   │       │   └── [id]/route.ts   # GET / PATCH / DELETE
│   │       ├── telemetry/
│   │       │   └── route.ts        # POST — ingest sensor data + auto-alerts
│   │       ├── alerts/
│   │       │   ├── route.ts        # GET — list user alerts
│   │       │   └── [id]/resolve/   # PATCH — mark alert resolved
│   │       └── track/[code]/       # GET — public tracking (no auth)
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── Navbar.tsx              # Sticky nav with mobile menu
│   │   ├── AuthGuard.tsx           # Client-side route protection
│   │   ├── TelemetryChart.tsx      # Recharts time-series graph
│   │   └── ModernDropdown.tsx      # Custom styled dropdown
│   │
│   ├── lib/                        # Backend/shared logic
│   │   ├── firebase.ts             # Firebase client SDK init (auth + db)
│   │   ├── firebase-admin.ts       # Firebase Admin SDK init (server)
│   │   ├── db.ts                   # Firestore CRUD abstraction layer
│   │   ├── api-auth.ts             # JWT verification middleware
│   │   └── alerts.ts               # Telemetry threshold evaluation
│   │
│   └── services/
│       └── api.ts                  # Frontend HTTP client (token injection)
│
├── tailwind.config.ts              # Design system tokens & animations
├── next.config.ts                  # Next.js configuration
├── package.json                    # Dependencies
└── .env.local                      # Environment variables (not committed)
```

---

## 📖 Documentation

| File | Purpose |
|---|---|
| `README.md` | Project overview, setup, and structure (this file) |
| `HOW_IT_WORKS.md` | Architecture deep-dive: auth, data flow, alert engine, public tracking |
| `AGENTS.md` | AI agent coding rules for this repository |

---

## 🎨 Design System

Defined in `tailwind.config.ts`. Key tokens:

| Token | Value | Use |
|---|---|---|
| `base` | `#050a14` | Page background |
| `surface` | `rgba(255,255,255,0.04)` | Card backgrounds |
| `neon` | `#1a6fff` | Primary accent (CTA, active states) |
| `teal` | `#00c9a7` | Online/success states |
| `coral` | `#ff4d6d` | Danger/error states |
| `amber` | `#f59e0b` | Warning states |
| `violet` | `#8b5cf6` | Secondary accent |

**Animations:** `fade-up`, `fade-in`, `slide-in`, `shimmer`, `pulse-slow`, `orb-drift`, `float`

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow the design system — use existing Tailwind tokens, not ad-hoc colors.
4. Submit a pull request with a clear description.

---

## 📜 License

MIT © CargoSafe Team
