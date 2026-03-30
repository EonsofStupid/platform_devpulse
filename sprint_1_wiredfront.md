# Sprint 1: The Full Desktop Experience (Real-Life Execution)

**Protocol:** ELITE_EXECUTION (Strict Path Adherence)
**Status:** READY_TO_EXECUTE

## 1. Compliance & Architecture
*   **Backbone:** `interfaces/desktop` (Tauri 2 + Svelte 5).
*   **Style:** Glassmorphism + "Mad Scientist" Backgrounds (`bg-cyber.png`).
*   **Shell:** Modular `Sidebar`, `Header`, `AppFrame`.

---

## 2. Execution Steps (File-by-File)

### Phase 0: Visuals & Shell (The Foundation)
1.  **Assets:**
    *   `src/lib/assets/bg-cyber.png` (From `static/imgs/.../maincontentbackground.png`).
    *   `src/styles/recipes/backgrounds.css` (Animation Keyframes).
2.  **Modular Shell:**
    *   `src/lib/layouts/app/Sidebar.svelte` (Collapsible, Icons).
    *   `src/lib/layouts/app/Header.svelte` (Breadcrumbs, User Avatar).
    *   `src/lib/layouts/app/Navigation.svelte` (Menu Logic).
    *   `src/lib/layouts/app/frame/AppFrame.svelte` (Grid Layout Integration).

### Phase 1: WiredFront (The Connect Hub)
*Goal: Connect Services, View Latest Assets.*
*   **Path:** `src/lib/domains/wiredfront/`
    *   **File:** `WiredHubFrame.svelte` (Layout shell).
    *   **File:** `WiredDashboard.svelte` (Overview: "Connections", "Latest Stream", "Recent Snaps").
    *   **File:** `WiredGallery.svelte` (`wf-gallery.svelte` - The visual grid).
    *   **File:** `stores/connections.svelte.ts` (Mock state for Twitch/YT).
*   **Route:** `src/routes/wiredfront/+page.svelte`.

### Phase 2: Thinkclyffy (The  Sandbox)
*Goal: Safe, Ephemeral Experimentation.*
*   **Specs:** Temp=0, 30-Day Eviction, Sandbox Mode.
*   **Path:** `src/lib/domains/thinkclyffy/`
    *   **File:** `ThinkclyffyFrame.svelte` (Visuals: "Safety Field" styling).
    *   **File:** `ThinkDashboard.svelte` (Active Experiments, "Time to Eviction" stats).
    *   **File:** `ThinkGallery.svelte` (Debug Screenshots, Throwaway captures).
    *   **File:** `modes/Sandbox.svelte` (The Chat/Graph Canvas).
    *   **File:** `modes/Classroom.svelte` (Ladle Tutorials Overlay).
*   **Route:** `src/routes/thinkclyffy/+page.svelte`.

### Phase 3: Devclyffy (The Factory / Production)
*Goal: Committed Work, Official Assets.*
*   **Specs:** Git-backed, Permanent.
*   **Path:** `src/lib/domains/devclyffy/`
    *   **File:** `DevclyffyFrame.svelte` (Visuals: "Production" styling).
    *   **File:** `DevDashboard.svelte` (Project Status, Git State).
    *   **File:** `DevGallery.svelte` (Official Documentation Images).
    *   **File:** `tools/ShortcutManager.svelte`.
*   **Route:** `src/routes/devclyffy/+page.svelte`.

### Phase 4: PixVix & The Promotion Flow
*Goal: The Unified Tool + "Moving Up".*
1.  **PixVix Overlay:**
    *   **Path:** `src/lib/domains/pixvix/`
    *   **File:** `PixVixFrame.svelte` (Transparent Window).
    *   **File:** `stores/mode.svelte.ts` (Pix vs Vix).
2.  **The Hybrid Promotion Logic (Option D):**
    *   **Concept:** Context-aware saving.
    *   **File:** `src/lib/domains/shared/AssetPromoter.ts`.
        *   *Function:* `promoteToDevclyffy(assetId)` -> Moves from Temp to Perm.
    *   **UI:** `PromotionModal.svelte` (Right-click "Promote with Details").

### Phase 5: Clyffy Chat (Separate Window)
1.  **Config:** Update `tauri.conf.json` -> `windows: [{label: "main"}, {label: "chat"}]`.
2.  **UI:** `src/routes/chat-window/+page.svelte`.

---

## 3. Verification Protocol
- [ ] **Shell:** Background animations active. Sidebar collapses.
- [ ] **WiredFront:** Dashboard shows "Connections", Gallery loads `wf-gallery`.
- [ ] **Thinkclyffy:** Dashboard shows "Sandbox Mode", Visual distinction is clear.
- [ ] **Devclyffy:** Dashboard shows "Production", Gallery is distinct.
- [ ] **PixVix:** Click "Promote" -> Mock moves asset from Think -> Dev.
