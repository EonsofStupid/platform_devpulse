# WiredFront: Technical Reference & Vision

**Status:** LIVING_DOCUMENT
**Domain:** Media, Broadcasting, Capture.
**Parent:** DevPulse Platform.

---

## 1. The Vision: "Native In-House Collaboration"
WiredFront is **NOT** merely a wrapper for Twitch/YouTube.
It is the frontend for DevPulse's **proprietary in-house broadcasting and collaboration engine**, designed to rival systems like **Zed's collaboration layer**.

### 1.1 Core Philosophy (The "Zed" Standard)
*   **Native Performance:** GPU-accelerated rendering for streams and captures.
*   **In-House Protocol:** We are building our own signaling and transport layer for real-time developer collaboration.
*   **Zero-Latency:** The goal is instant, peer-to-peer visual context sharing, not just "streaming to the void."

### 1.2 Capabilities
1.  **The Native Engine (Primary):**
    *   Direct integration with `systems/engine` for high-performance capture.
    *   Proprietary "DevPulse Live" protocol for secure, team-based screen sharing and pairing.
2.  **External Bridges (Secondary):**
    *   Connectors for public broadcasting (AngryViber, Twitch, YouTube).
    *   These are *destinations*, not the *definition* of the tool.
3.  **Unified Asset Management:**
    *   **Pix:** Instant screenshot sharing with context.
    *   **Vix:** High-def recordings with automated AI highlights (Clyffy).

---

## 2. Architecture: "The Tab & The Tool"

### 2.1 The Tab: `src/routes/wiredfront` (The Hub)
*   **Context:** Lives *inside* the `AppFrame` shell.
*   **Layout:** Retains the global Sidebar, Topbar, and Statusbar.
*   **Function:**
    *   **Control Center:** Manage the Native Engine sessions and External Bridges.
    *   **Asset Gallery:** Intelligent grid of local and cloud assets (`libsql` backed).
    *   **Session Manager:** Join/Host Zed-like collaboration rooms.

### 2.2 The Tool: `PixVix` (The Snapper)
*   **Context:** An **Overlay Window** (Transient).
*   **Trigger:** Status Bar Icon `[O]`, Hotkey, or Hub Button.
*   **Unified Interface:** A single tool for Stick (Image) and Move (Video).
    *   **Mode A (Pix):** Precision screenshotting with automated context embedding.
    *   **Mode B (Vix):** buffer-based recording (like ShadowPlay) for capturing code execution bugs instantly.
*   **Meta-Data First:** Every capture is an "Artifact" with attached generic data (Project, Task, AI Tags).

---

## 3. The Implementation Model (Svelte 5 + Rust)

### 3.1 Directory Structure (Hypermodular)
```bash
interfaces/desktop/src/lib/domains/wiredfront/
├── components/          # Domain-specific UI
│   ├── SessionManager.svelte # Collaboration Rooms
│   ├── GalleryGrid.svelte
│   └── StreamConfig.svelte
├── stores/              # Local State
│   └── engine_socket.svelte.ts # Connection to Native Engine
└── WiredHubFrame.svelte # The Layout for the Tab
```

### 3.2 PixVix Overlay Structure
```bash
interfaces/desktop/src/lib/domains/pixvix/
├── components/
│   ├── RegionOverlay.svelte  # The GPU-accelerated selector
│   └── MetaModal.svelte     # The "Context Capture" popup
├── managers/
│   └── CapturePipeline.ts   # Rust Bridge
└── PixVixFrame.svelte      # Transparent Window
```

---

## 4. Pending Infrastructure (Maintenance Protocol)
*   **LibSQL Integration:** Required for the Session and Asset databases.
*   **Capture Engine:** Currently scaffolding the frontend; backend requires `scap` or native platform integration for the "Zed-like" performance.
