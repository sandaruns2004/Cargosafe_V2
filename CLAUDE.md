# CargoSafe — Quick Reference for Claude/AI Assistants

**Stack:** Next.js 16 · React 19 · Firebase Firestore + Auth · Tailwind CSS v4 · TypeScript

**Auth pattern:** All protected API routes → `authenticateRequest(req)` from `src/lib/api-auth.ts`  
**DB pattern:** All Firestore ops → `src/lib/db.ts` (never call `adminDb` directly in routes)  
**Frontend calls:** Always `api.get/post/patch/delete()` from `src/services/api.ts`  
**Design:** Custom Tailwind tokens only — `neon`, `teal`, `coral`, `amber`, `surface`, `edge`  
**Client components:** All `.tsx` pages and components need `"use client"` at top  

See `AGENTS.md` for full rules and `HOW_IT_WORKS.md` for architecture details.
