# plan.md — Lumina Asset Suite (MCR Web App)

## Objectives (Updated)
- ✅ Deliver a production-ready **end-to-end workflow**: **Supabase Auth + Supabase DB (RLS) + Cloudflare R2 presigned upload + public playback URL**.
- ✅ Provide a complete **MCR-style operator console**: **Asset Library, STAGING vs LIVE buses, TAKE/CUT transitions, Queue (autoplay), History**, and **External Display popup**.
- ✅ Implement professional **Audio Engine**: **Web Audio 10-band EQ + master gain + output routing** (when supported via `setSinkId`).
- ✅ Ensure **real-time LIVE mirroring** to external display using **BroadcastChannel** with periodic time sync.
- ✅ Add Phase 3 operator-grade polish:
  - ✅ Drag-and-drop **Queue reorder** (persisted)
  - ✅ Low-FPS **Audio spectrum analyzer** visualization
  - ✅ Advanced BroadcastChannel **explicit play/pause/seek/load/stop commands**
  - ✅ **State recovery on refresh** (STAGING/LIVE + audio/transport preferences)
- ✅ Validate app health with **automated end-to-end testing** (Phase 2 backend+frontend, Phase 3 frontend regression).

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
  - (Phase 2) Queue reorder via up/down controls (later replaced by DnD in Phase 3)
- **External display**
  - BroadcastChannel state sync + periodic tick updates
  - Minimal HUD overlay (toggleable)

#### 3) Core runtime features ✅
- **BroadcastChannel protocol (Phase 2)**
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

## Phase 3 — Hardening, Edge Cases, and Polish ✅ COMPLETE

### User stories (polish)
1. ✅ Resume last working set after refresh (STAGING/LIVE sources + operator preferences) **safely**.
2. ✅ Improve Queue UX with drag-and-drop reorder (operator-grade speed under stress).
3. ✅ Provide audio visualization feedback (spectrum) without harming playback performance.
4. ✅ Improve LIVE sync reliability for complex actions (seek/pause/play/load/stop).

### Implementation steps (What was built)

#### 1) State persistence & recovery ✅
- Added `sessionState.js` using `localStorage` key: `lumina:session:v1`.
- Persisted:
  - `stagingAssetId`, `stagingQueueItemId`
  - `liveAssetId`, `liveQueueItemId`
  - `autoplay`, `loop`
  - `gainDb`, `eqValues` (10-band)
  - `selectedOutputId`
  - `sidebarTab`
- Restores on mount **after** assets/queue load so IDs can be resolved to objects.
- Safety behavior:
  - LIVE source restores but **does not auto-play**; operator must press PLAY.
  - Shows toast: “Restored last LIVE source. Press PLAY to resume.” (~4s).
- Cleared on logout (AuthContext calls `clearSessionState()`).

#### 2) Queue UX upgrade (Drag-and-drop) ✅
- Installed `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- Replaced up/down reorder with:
  - `DndContext` + `SortableContext` + `arrayMove`.
  - Pointer + Keyboard sensors for accessibility.
  - GripVertical drag handle with `data-testid='queue-drag-handle-{id}'`.
  - Visual dragging feedback: shadow + ring.
- Persists ordering to backend via `POST /api/queue/reorder`.

#### 3) Audio visualization (Spectrum analyzer) ✅
- New `SpectrumAnalyzer` component:
  - Canvas + `ResizeObserver` for responsive sizing.
  - Throttled to ~24fps to protect playback performance.
  - Logarithmic frequency mapping (emphasizes low frequencies).
  - Orange gradient bars rendered **behind EQ sliders** (60% opacity).
  - Uses existing `AudioEngine` analyser (no extra audio routing).
  - `data-testid='spectrum-analyzer-canvas'`.
- Integrated into EQ panel UI label: “10-BAND EQ + SPECTRUM”.

#### 4) Advanced BroadcastChannel sync ✅
- Updated `bus.js`:
  - Exported `MSG` + `CMD` constants.
  - Added explicit command messages: `control:cmd` with actions:
    - `PLAY`, `PAUSE`, `SEEK`, `STOP`, `LOAD`.
- Control window sends explicit commands on:
  - Play / Pause / Seek / Stop
  - Take / Cut / Next / Autoplay transitions (load+autoplay)
- Display window:
  - Listens for `control:cmd` and applies immediately to local media element.
  - Passive drift correction remains as fallback; threshold raised to 1s.

### Testing ✅
- Phase 3 regression validated by `testing_agent_v3`:
  - ✅ Frontend: **100%** (21 checks passed)
  - ✅ Zero bugs and no regressions from Phase 1/2

### Success criteria ✅
- ✅ No regressions across refresh/new window.
- ✅ Stable LIVE behavior for play/pause/seek due to explicit command sync.
- ✅ Queue reordering fast and reliable via drag-and-drop + backend persistence.

---

## Next Actions (Updated)
1. ✅ No immediate blockers — Phase 1, Phase 2, and Phase 3 are complete and tested.
2. Optional future enhancements (nice-to-have):
   - Thumbnail generation for video assets
   - Waveform preview for audio assets
   - More robust upload UX (retry/cancel, large-file validations)
   - Multi-operator roles / audit logs
   - Persist queue cursor and multi-show playlists
