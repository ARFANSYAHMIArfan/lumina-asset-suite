# plan.md — Lumina Asset Suite (MCR Web App)

## Objectives
- Prove the **core flow** works end-to-end: **Supabase Auth + Supabase DB + Cloudflare R2 presigned upload + public playback URL**.
- Build v1 MCR-style app: **Asset Library, Staging vs Live, Queue (autoplay), History, External Display popup**, plus **Web Audio 10-band EQ, master gain, output routing**.
- Ensure **reliable LIVE sync** between control window and external display using **BroadcastChannel**.

---

## Phase 1 — Core POC (Isolation: Supabase + R2)

### User stories (POC)
1. As an operator, I can sign up and log in using email/password.
2. As an operator, I can request a presigned URL and upload a media file securely.
3. As an operator, I can access the uploaded file via a stable public URL.
4. As an operator, I can create an asset record in the database referencing the uploaded media.
5. As an operator, I can query back my assets and confirm persistence.

### Implementation steps
1. **Web research (best practices)**
   - Confirm Cloudflare R2 S3 signing requirements (endpoint, region=auto, signature v4) and CORS guidance.
   - Confirm Supabase Auth server-side verification best practices (JWT verify vs Supabase client calls).
2. **Supabase setup (once)**
   - Create tables: `assets`, `queues`, `queue_items`, `history` (owner/user scoping).
   - Enable RLS + policies (owner can CRUD; service role bypass for backend).
3. **POC scripts (Python, standalone)**
   - Script A: signup/login → receive access token.
   - Script B: generate presigned PUT (or POST) for R2 → upload test file → verify HEAD/GET via `R2_PUBLIC_URL`.
   - Script C: insert asset row into Supabase → query list back.
4. **Fix-until-works loop**
   - Resolve CORS, content-type, ACL/public access expectations, URL correctness.
   - Validate DB writes under RLS (either via service role in backend or user JWT + policies).

### Deliverables
- Working POC scripts with documented env usage.
- Verified: upload → public playback URL → DB record roundtrip.

### Success criteria
- 100% reproducible run: `python poc.py` uploads a file, returns a working public URL, inserts and reads asset record.

---

## Phase 2 — V1 App Development (Full Stack MVP)

### User stories (v1)
1. As an operator, I can upload video/audio into my Library with title, type, duration, tags.
2. As an operator, I can load any asset into **STAGING** to preview and QC before broadcast.
3. As an operator, I can **TAKE/TRANSITION** STAGING to **LIVE** and it appears on the External Display.
4. As an operator, I can build a **Queue** and enable **autoplay** to play items sequentially.
5. As an operator, I can adjust **master gain** and **10-band EQ** and hear the change live.
6. As an operator, I can choose an **audio output device** for LIVE playback when supported.
7. As an operator, I can open an **External Display** window that shows only LIVE output.
8. As an operator, I can review **History** of what went LIVE and when.

### Implementation steps
1. **Backend (FastAPI)**
   - Auth: integrate Supabase email/password via Supabase Auth endpoints; backend verifies JWT for protected APIs.
   - R2: endpoint to generate presigned upload URL; store object key and final `public_url`.
   - CRUD endpoints:
     - `POST /api/assets/upload-url`, `POST /api/assets`, `GET /api/assets`, `DELETE /api/assets/:id`
     - `POST /api/queue`, `POST /api/queue/items`, `PATCH /api/queue/items/reorder`, `DELETE /api/queue/items/:id`
     - `POST /api/history`, `GET /api/history`
   - Use Supabase service role server-side for DB ops, enforce user ownership in queries.
2. **Frontend (React + Tailwind + shadcn/ui)**
   - Technical dark UI (carbon black, orange accents), Bento grid layout.
   - Pages/routes: `/login`, `/app` (MCR), `/display` (external).
   - MCR layout:
     - Left sidebar: Library / Queue / History.
     - Center: STAGING and LIVE players side-by-side + TAKE button.
     - Bottom deck: transport controls, timecode/progress, master gain, EQ, output selector.
3. **Core runtime features**
   - **BroadcastChannel** protocol: state snapshot + periodic time sync; reconcile drift in display.
   - **Web Audio**: media element → gain → 10 biquad filters → destination; bypass toggle; presets.
   - **Output routing**: `setSinkId()` when supported; graceful fallback.
   - Queue autoplay: on `ended` advance to next; persist queue state to DB.
4. **Incremental test pass (end of phase)**
   - Run testing agent: login → upload → staging preview → TAKE → open display → autoplay queue → EQ/gain.
   - Fix critical UX or sync issues before moving on.

### Success criteria
- Operator can run complete workflow without errors: upload → staging → take live → external display mirrors live → queue autoplay works.
- Audio controls (gain + EQ) audibly affect playback; no crashes when output routing unsupported.

---

## Phase 3 — Hardening, Edge Cases, and Polish

### User stories (polish)
1. As an operator, I can resume my last queue and live/staging state after refresh.
2. As an operator, I see clear errors for failed uploads and can retry safely.
3. As an operator, I can reorder the queue via drag-and-drop without breaking autoplay.
4. As an operator, I can quickly search/filter Library by type/tags.
5. As an operator, I can trust LIVE sync stays stable even after lag/seek/pause events.

### Implementation steps
- Add robust state persistence + recovery (queue cursor, last live asset, last staging asset).
- Improve BroadcastChannel sync: drift correction, seek handling, leader election (control window as source of truth).
- Better upload UX: progress, cancel, validation (size/type), thumbnail/waveform placeholder.
- History enrichment: duration played, manual vs autoplay, operator notes.
- E2E test round with testing agent; fix regressions.

### Success criteria
- No critical regressions across refresh/new window; stable LIVE playback with consistent state.

---

## Next Actions (Immediate)
1. Implement Phase 1 POC scripts and Supabase schema + RLS.
2. Validate R2 presigned upload + public GET works for both video and audio.
3. Once Phase 1 is green, proceed to Phase 2 full-stack build in minimal large commits.
