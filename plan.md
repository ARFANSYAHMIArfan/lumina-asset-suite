# plan.md — Lumina Asset Suite (MCR Web App)

## Objectives (Updated)
- ✅ Deliver a production-ready **end-to-end workflow**: **Supabase Auth + Supabase DB (RLS) + Cloudflare R2 presigned upload + public playback URL**.
- ✅ Provide a complete **MCR-style operator console**: **Asset Library, STAGING vs LIVE buses, TAKE/CUT transitions, Queue (autoplay), History**, and **External Display popup**.
- ✅ Implement professional **Audio Engine**: **Web Audio 10-band EQ + master gain + output routing** (when supported via `setSinkId`).
- ✅ Ensure **real-time LIVE mirroring** to external display using **BroadcastChannel** with periodic time sync.
- ✅ Validate app health with **automated end-to-end testing**.

---

## Phase 1 — Core POC (Isolation: Supabase + R2) ✅ COMPLETE

### User stories (POC)
1. ✅ As an operator, I can sign up and log in using email/password.
2. ✅ As an operator, I can request a presigned URL and upload a media file securely.
3. ✅ As an operator, I can access the uploaded file via a stable public URL.
4. ✅ As an operator, I can create an asset record in the database referencing the uploaded media.
5. ✅ As an operator, I can query back my assets and confirm persistence.

### Implementation steps (What was done)
1. ✅ **Supabase setup (once)**
   - Created tables: `assets`, `queue_items`, `history`.
   - Enabled RLS + policies so users can CRUD their own rows.
   - Added `updated_at` trigger for `assets`.
2. ✅ **R2 setup**
   - Configured presigned PUT generation using boto3 (S3v4, region `auto`).
   - Configured **bucket CORS** to allow browser direct PUT uploads.
   - Verified public access via `R2_PUBLIC_URL`.
3. ✅ **POC scripts (Python)**
   - Auth + R2 upload + DB insert/query roundtrip.
   - End-to-end test passed (upload → store metadata → query → public GET).
4. ✅ **Fix-until-works loop**
   - Email confirmation requirement addressed by using Supabase Admin API for auto-confirm.

### Deliverables
- ✅ Supabase schema created (tables + RLS policies).
- ✅ Verified: upload → public playback URL → DB record roundtrip.

### Success criteria
- ✅ 100% reproducible POC achieved.

---

## Phase 2 — V1 App Development (Full Stack MVP) ✅ COMPLETE

### User stories (v1)
1. ✅ Upload video/audio into Library with metadata.
2. ✅ Load any asset into **STAGING** for preview/QC.
3. ✅ **TAKE/CUT transition** STAGING → LIVE and mirror to External Display.
4. ✅ Build a **Queue** and enable **autoplay**.
5. ✅ Adjust **master gain** and **10-band EQ** and hear changes live (Web Audio).
6. ✅ Choose **audio output device** for LIVE playback when supported.
7. ✅ Open **External Display** window showing only LIVE content + minimal HUD.
8. ✅ Review **History** of playback/transition events.

### Implementation steps (What was built)

#### 1) Backend (FastAPI) ✅
- **Auth** (Supabase Auth integration)
  - `POST /api/auth/signup` (auto-confirms email via admin API, returns session tokens)
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout` (stateless acknowledgment)
- **Assets**
  - `POST /api/assets/upload-url` → presigned PUT + `r2_key` + `public_url`
  - `POST /api/assets` create metadata record
  - `GET /api/assets` list (scoped to user)
  - `PATCH /api/assets/{id}` update metadata
  - `DELETE /api/assets/{id}` delete DB row + best-effort delete in R2
- **Queue**
  - `GET /api/queue` list with embedded asset metadata
  - `POST /api/queue` add
  - `POST /api/queue/reorder` reorder by `item_ids`
  - `DELETE /api/queue/{id}` remove
  - `DELETE /api/queue` clear
- **History**
  - `POST /api/history` record
  - `GET /api/history` list (sorted desc)
  - `DELETE /api/history` clear

#### 2) Frontend (React + Tailwind + shadcn/ui) ✅
- **Routes**
  - `/login` and `/signup` (operator-grade dark UI)
  - `/app` (protected MCR control room)
  - `/display` (external display output)
- **MCR layout**
  - TopBar: branding, OFF AIR/ON AIR indicator, Pop-out Display button, user menu
  - Sidebar: Library / Queue / History tabs
  - Center: STAGING bus ↔ TAKE/CUT ↔ LIVE bus
  - Bottom Control Deck: transport controls + scrub timeline + EQ + master fader + output routing
- **Asset upload**
  - Direct browser PUT to R2 using presigned URL
  - Create asset metadata in Supabase via backend
- **Audio Engine**
  - Web Audio chain: media element → EQ filters → GainNode → destination
  - 10-band EQ (lowshelf + peaking + highshelf)
  - Master gain in dB
  - Output routing via `setSinkId()` with graceful fallback
- **Queue + autoplay**
  - Autoplay next item on `ended`
  - Queue reorder via up/down controls (v1)
- **External display**
  - BroadcastChannel state sync + periodic tick updates
  - Minimal HUD overlay (toggleable)

#### 3) Core runtime features ✅
- **BroadcastChannel protocol**
  - `control:state` snapshot + `control:tick` periodic sync
  - Handshake between control and display
  - Drift correction on display if time difference exceeds threshold
- **Resilience**
  - Safe fallbacks when `setSinkId` unsupported
  - Browser gesture requirement respected (TAKE/play triggers audio context resume)

#### 4) Incremental test pass ✅
- Completed comprehensive test suite with `testing_agent_v3`:
  - ✅ Backend: **20/20** tests passed
  - ✅ Frontend: all required user stories verified
  - ✅ No critical bugs detected

### Success criteria
- ✅ Operator can run complete workflow without errors:
  - upload → preview staging → TAKE live → external display mirrors live → queue autoplay works.
- ✅ Audio controls affect playback; no crashes if output routing unsupported.

---

## Phase 3 — Hardening, Edge Cases, and Polish (Future Work)

### User stories (polish)
1. ⏳ Resume last queue and live/staging state after refresh.
2. ⏳ More robust upload UX: retry, cancel, better error states, validation for very large files.
3. ⏳ Drag-and-drop queue reorder (currently up/down buttons).
4. ⏳ Search/filter enhancements: type filters, tag chips, sorting.
5. ⏳ More robust LIVE sync for complex actions (seek, pause, network hiccups).

### Implementation steps
- **State persistence & recovery**
  - Store last STAGING/LIVE selection and transport state (option: Supabase table or localStorage + reconciliation).
- **BroadcastChannel improvements**
  - Better drift correction, explicit seek/pause commands, and “control window is source of truth” enforcement.
- **Media enrichment**
  - Thumbnail generation for video (server-side job or client-side capture) and optional waveform for audio.
- **Queue UX upgrade**
  - Drag-and-drop reorder using a light library (keep performance safe).
- **Audio visualization**
  - Optional spectrum analyzer (low FPS) to avoid impacting playback.

### Success criteria
- No regressions across refresh/new window.
- Stable LIVE playback with consistent state under seeks/pauses.

---

## Next Actions (Updated)
1. ✅ No immediate blockers — Phase 1 and Phase 2 are complete and tested.
2. Optional hardening work (Phase 3) can be prioritized based on your operator workflow:
   - Drag-and-drop queue reorder
   - State recovery on refresh
   - Thumbnail generation
   - Advanced sync handling (seek/pause commands)
