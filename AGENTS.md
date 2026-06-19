# 🤖 AGENTS.md — AI Coding Rules for CargoSafe

This file contains rules and guidelines for AI coding agents (Copilot, Cursor, Antigravity, etc.) working on the CargoSafe codebase. **Read before writing any code.**

---

## 🚨 Critical Framework Notes

<!-- BEGIN:nextjs-agent-rules -->
### Next.js Version Warning

This project uses **Next.js 16** (App Router). APIs, file conventions, and runtime behavior **differ significantly** from Next.js 13/14 training data. Always check `node_modules/next/dist/docs/` before writing route handlers or middleware. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## 📐 Architecture Rules

### 1. Server vs Client Boundary

| File type | Directive | Rule |
|-----------|-----------|------|
| `src/app/api/**/*.ts` | none (server by default) | NEVER import `firebase.ts` (client SDK) here |
| `src/lib/firebase-admin.ts` | none (server) | NEVER import in client components |
| `src/app/**/page.tsx` | `"use client"` | ALWAYS add — all pages fetch data client-side |
| `src/components/*.tsx` | `"use client"` | ALWAYS add — all components use hooks/state |

### 2. Authentication Pattern

- **All protected API routes** MUST call `authenticateRequest(req)` from `src/lib/api-auth.ts` as the **first operation**.
- Check with `isAuthError(auth)` before proceeding. Return early if true.
- The `auth.uid` is the verified Firebase UID — use it for all Firestore queries.

```ts
// ✅ Correct pattern
export async function GET(req: Request) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return auth
  // ... use auth.uid
}
```

### 3. Database Access

- **Never import `firebase-admin` directly** in route files. Always use `src/lib/db.ts` functions.
- All Firestore CRUD is centralized in `db.ts`. Add new operations there.
- Telemetry is a **subcollection** of devices: `devices/{id}/telemetry/{id}` — never store it flat.

### 4. Frontend API Calls

- **Never use raw `fetch()` in page components.** Always use `api.get/post/patch/delete()` from `src/services/api.ts`.
- This ensures the auth token is always injected and 401 redirects are handled.

---

## 🎨 Design System Rules

### Tailwind Tokens (defined in `tailwind.config.ts`)

- Use `base`, `surface`, `surface-hover`, `edge` for backgrounds and borders.
- Use `neon` (blue) for primary actions, `teal` for success/online, `coral` for danger/delete, `amber` for warnings/keys.
- **Never use plain Tailwind colors** (`blue-500`, `red-600`) — use the custom palette.
- Font classes: `font-display` (Syne — headings), `font-body` (Inter), `font-mono` (JetBrains Mono).

### Component Patterns

- Card containers: `rounded-2xl border border-edge bg-surface backdrop-blur-2xl p-6 shadow-card`
- CTA buttons: `bg-gradient-to-r from-neon to-teal rounded-xl font-semibold text-white shadow-neon-btn hover:shadow-neon-btn-hover`
- Danger buttons: `hover:text-coral hover:bg-coral/10`
- All new page sections must have `animate-fade-up` entrance animation.

---

## 📁 Where to Put New Code

| What | Where |
|------|-------|
| New page | `src/app/{route}/page.tsx` |
| New API endpoint | `src/app/api/{resource}/route.ts` |
| New Firestore operation | `src/lib/db.ts` |
| New reusable component | `src/components/{Name}.tsx` |
| New alert threshold | `src/lib/alerts.ts: autoGenerateAlerts()` |
| New frontend API helper | `src/services/api.ts` |

---

## ⚠️ Common Mistakes to Avoid

1. **Returning `null` from async route handlers** — always return a `NextResponse`.
2. **Using `getDoc/setDoc` directly in routes** — use `db.ts` abstractions.
3. **Forgetting `"use client"`** on components that use `useState`, `useEffect`, or `useRouter`.
4. **Storing sensitive env vars with `NEXT_PUBLIC_` prefix** — Admin SDK keys must never be public.
5. **Querying alerts without chunking** — Firestore `in` operator max is 30. `db.getAlertsByUser()` already handles this; don't bypass it.
6. **Not cascading deletes** — Deleting a device must also delete its telemetry subcollection and associated alerts (already handled in `db.deleteDevice()`).
