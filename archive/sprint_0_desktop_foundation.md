# Desktop Sprint 0: The Foundation

**Protocol:** ELITE_EXECUTION
**Status:** DRAFTING (Awaiting Approval)
**Objective:** Fresh scaffold of `interfaces/desktop` (Tauri 2 + Svelte 5 Runes).

## 1. The Architecture (Absolute Truth)

### 1.1 The Host (DevPulse Platform)
*   **Role:** The "Mother Ship". A singular window that houses the primary workspace.
*   **Scaffold:** `interfaces/desktop` (Root Crates & App).
*   **Shell:** `AppFrame.svelte` (Sidebar, Status Bar, Main Content Area).

### 1.2 The Features (Tabs & Overlays)
1.  **Chat (Operations):**
    *   **Type:** Main View (Default).
    *   **Scaffold:** `src/lib/domains/chat`.
    *   **Dumb Component:** `ChatFrame.svelte`.
2.  **WiredFront (Media Hub):**
    *   **Type:** **Sidebar Tab** (Navigates to `/wiredfront`).
    *   **Role:** Dashboard for Broadcasting, Gallery, & Media Assets.
    *   **Scaffold:** `src/lib/domains/wiredfront`.
    *   **Dumb Component:** `WiredHubFrame.svelte`.
3.  **PixVix (The Snapper):**
    *   **Type:** **Overlay Window** (Multi-Window).
    *   **Role:** Transient tool for screen capture/snipping.
    *   **Scaffold:** `src/routes/pixvix-overlay`.
    *   **Behavior:** Launched by Engine. Floats on top.

---

## 2. The Design System (Glass & Runes)

**Philosophy:** Reference `bad_desktop` concepts, but write clean Svelte 5 code.

### 2.1 Tokens (The Atoms)
*   **`tokens/colors.css`**: OKLCH Palette.
    *   `--dp-hue`: The global theme variable (Cyan/Teal/Purple).
    *   `--dp-obsidian-*`: The background scale (950 to 700).
    *   `--dp-accent-*`: Primary highlights.
*   **`tokens/space.css`**: The Rhythm.
    *   `--dp-space-1` to `16`: Rem-based scale.
    *   `--dp-topbar-height`: 52px.
    *   `--dp-sidebar-width`: 240px.

### 2.2 Recipes (The Molecules)
*   **`recipes/glass.css`**: The "Deep Glass" System.
    *   `.glass`: Surface.
    *   `.glass-deep`: Recessed/Darker areas (Sidebar).
    *   `.glass-bar`: Top/Bottom bars.
    *   `.glass-glow`: Active states.
*   **`recipes/inputs.css`**:
    *   `.glass-input`: Translucent form fields.
    *   `.glass-button`: Interactive elements with bevels.

---

## 3. Implementation Checklist

### 3.1 Directory Structure
```bash
interfaces/desktop/
├── src-tauri/
│   ├── Cargo.toml               # Engine Dependency ONLY
│   └── src/
│       ├── lib.rs              # App Builder
│       ├── commands/           # chat.rs, capture.rs
│       └── main.rs
├── src/
│   ├── styles/                  # The Design System
│   │   ├── tokens/              # colors, space, type
│   │   ├── recipes/             # glass, inputs, cards
│   │   └── utilities/           # layout, text
│   ├── lib/
│   │   ├── layouts/             # Dumb Shells (AppFrame)
│   │   ├── domains/             # Smart Logic (Chat, WiredFront)
│   │   └── primitives/          # Atomic UI (Button, Icon)
│   └── routes/
│       ├── +layout.svelte       # AppFrame Instance
│       ├── +page.svelte         # Chat Domain
│       ├── wiredfront/          # WiredFront Domain (Tab)
│       └── pixvix-overlay/      # PixVix Domain (Window)
```

### 3.2 Step-by-Step Execution

#### Phase 1: Config & Backend
- [ ] **Config:** `package.json` (Svelte 5), `vite.config.ts`, `svelte.config.js`.
- [ ] **Rust Core:** `src-tauri/Cargo.toml` (Link `../../systems/engine`).
- [ ] **Rust Commands:** `src-tauri/src/commands/chat.rs`.

#### Phase 2: Design System (Styles)
- [ ] Write `src/styles/tokens/colors.css` (OKLCH).
- [ ] Write `src/styles/recipes/glass.css` (The critical aesthetic).
- [ ] Write `src/styles/index.css` (Barrel).

#### Phase 3: Dumb Components (Layouts)
- [ ] `AppFrame.svelte`: The CSS Grid Shell `(Sidebar | Main | Status)`.
- [ ] `ChatFrame.svelte`: The Message List + Input container.

#### Phase 4: Domain Integration
- [ ] `src/routes/+page.svelte`: Mounts `ChatFrame`. Connects to Tauri `chat`.
- [ ] `src/routes/wiredfront/+page.svelte`: Mounts `WiredHubFrame`.
- [ ] `src/routes/pixvix-overlay/+page.svelte`: The transparent capture window.

---

## 4. Acceptance Rules
1.  **Zero Drift:** Do not add routes unless explicitly asked.
2.  **Svelte 5:** Use `$state` for local UI state.
3.  **Glass:** Ensure the `.glass` classes match the User's "Deep Glass" vision.
4.  **Structure:** `domains/` hold logic, `layouts/` hold shells.
