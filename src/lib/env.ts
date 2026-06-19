/**
 * Environment variable validation — called at server startup.
 * Throws a clear error if any required variable is missing,
 * so the app fails fast instead of failing silently mid-request.
 *
 * Usage: import "@/lib/env" at the top of firebase-admin.ts
 */

const SERVER_REQUIRED = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

const CLIENT_REQUIRED = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

function validate(vars: readonly string[], context: "server" | "client") {
  const missing = vars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const list = missing.map((k) => `  - ${k}`).join("\n");
    throw new Error(
      `[CargoSafe] Missing ${context} environment variables:\n${list}\n\n` +
        `Add them to your .env.local file. See README.md for the full list.`
    );
  }
}

// Server-side validation runs when this module is imported by firebase-admin.ts
if (typeof window === "undefined") {
  validate(SERVER_REQUIRED, "server");
}

// Client-side check (only warns — NEXT_PUBLIC_ vars are baked in at build time)
if (typeof window !== "undefined") {
  const missingClient = CLIENT_REQUIRED.filter((key) => !process.env[key]);
  if (missingClient.length > 0) {
    console.warn(
      "[CargoSafe] Missing NEXT_PUBLIC_ env vars:",
      missingClient.join(", ")
    );
  }
}
