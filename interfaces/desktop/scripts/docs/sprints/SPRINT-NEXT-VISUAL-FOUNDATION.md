# Sprint: Visual Foundation — Hardcoded Audit + Chrome Tabs + Widget Varieties + Tauri Windows

## Prerequisites (completed this session)
- [x] DTCG preset pipeline → 319 presets with real resolved values (outputReferences: false)
- [x] S2-style annotation scanner → ui-catalog.json as SSOT
- [x] ChatBubble component + 5 chat blocks + GovernanceControls block
- [x] Chat route reauthored from central library
- [x] collect-element-seed-defs.mjs scans components/ + blocks/ + layouts/
- [x] SEED-PRESETS.md captures full token inventory

## Task 1: Hardcoded Audit — DevPulse + App Layout

### 1.1 Scan every .svelte in routes/(app)/ and lib/layouts/app/
For each file:
- Grep for raw hex (#), rgba(), oklch(), hardcoded px values in style attrs
- Grep for Tailwind arbitrary values that should be tokens: bg-[#...], text-[#...], shadow-[0_0_...]
- Grep for inline `style="..."` attributes with visual values
- Capture EVERY hardcoded value into SEED-PRESETS.md
- Replace with token var() references

### 1.2 Files to audit
- `lib/layouts/app/Frame.svelte` — structural grid, verify all borders use tokens
- `lib/layouts/app/TopBar.svelte` — verify all visual values are token-driven
- `lib/layouts/app/Sidebar.svelte` — verify nav items use Button from library
- `lib/layouts/app/StatusBar.svelte` — status dots, glow shadows
- `lib/layouts/app/ChatOverlay.svelte` — overlay panel
- `lib/layouts/app/BootOverlay.svelte` — boot screen
- `routes/(app)/devpulse/+page.svelte` — dashboard widgets
- `routes/(app)/devpulse/community/+page.svelte`
- `routes/(app)/devpulse/projects/+page.svelte`
- `routes/(app)/devpulse/settings/+page.svelte`
- `routes/(app)/devpulse/stats/+page.svelte`
- `routes/(app)/devforge/+page.svelte`
- `routes/(app)/maestro/+page.svelte`
- `routes/(app)/overmind/+page.svelte`
- `routes/(app)/wiredfront/+page.svelte`

### 1.3 Expected output
- Updated SEED-PRESETS.md with any NEW hardcoded values found
- All hardcoded values replaced with token references
- DTCG preset JSON files updated if new presets are needed
- pnpm ds:tokens:build passes clean

---

## Task 2: Chrome Tabs Component

### 2.1 What it looks like (from DASHBOARD-REFERENCE-01.png)
- Tab bar sits ON TOP of the glass container
- Active tab has the SAME background as the container below — they merge visually into one surface
- Inactive tabs are darker, slightly recessed
- Tab corners are rounded at the TOP only (border-radius: 8px 8px 0 0)
- Where the active tab meets the container, there's a slight CURVE (like browser chrome tabs)
- The tab bar overflows behind the container — the container surface continues under the inactive tabs
- Teal underline glow on the active tab

### 2.2 Implementation
- Component: `components/chrome-tabs/` — NEW component kind
  - `ChromeTabs.svelte` (root — tab bar container)
  - `ChromeTab.svelte` (individual tab trigger)
  - `types.ts`
  - `index.ts`
  - `context.ts` (active tab state)
- Primitive: extends existing `tabs` primitive (ARIA tablist/tab/tabpanel pattern)
- The SVG curve where active tab meets container: CSS pseudo-elements or SVG path
- StyleMacro with `tabs-chrome` preset (already created)

### 2.3 Props
```typescript
interface ChromeTabsProps extends UIBaseProps {
  tabs: Array<{ id: string; label: string; icon?: Component }>;
  activeTab: string;
  onTabChange?: (tabId: string) => void;
}
```

### 2.4 Structure
```html
<div data-kind="chrome-tabs" data-slot="root" class="relative">
  <!-- Tab bar (sits above container) -->
  <div data-slot="bar" class="flex relative z-10">
    {#each tabs as tab}
      <button data-slot="tab" data-active={active} class="rounded-t-lg ...">
        {tab.label}
      </button>
    {/each}
  </div>
  <!-- Container (content panel that merges with active tab) -->
  <div data-slot="panel" class="relative z-0 rounded-b-lg rounded-tr-lg ...">
    {@render children?.()}
  </div>
</div>
```

---

## Task 3: Widget Varieties

### 3.1 Widget types needed (from references)
Each widget is a BLOCK composed from central library components:

| Widget Type | Composed From | Content |
|-------------|--------------|---------|
| StatWidget | Card + Stat + Text | Single metric display |
| GaugeWidget | Card + Heading + RadialGauge | Circular gauge |
| ChartWidget | Card + Heading + SparkLine | Line/area chart |
| BarWidget | Card + Heading + Progress (multiple) | Horizontal bar chart |
| TableWidget | Card + Heading + Table | Data table |
| ListWidget | Card + Heading + List | Scrollable list |
| ControlWidget | Card + Heading + Slider/Toggle/Select | Settings/controls |

### 3.2 Each widget type gets:
- Its own `.svelte` file in `blocks/widgets/`
- Annotations for the scanner
- Preset JSON in `tokens/src/presets/`
- ChromeTabs integration (tabs prop shows chrome-style tab bar)

### 3.3 Widget container pattern
Every widget uses Card as root → StyleMacro resolves the visual treatment.
ChromeTabs sits above Card when tabs are present.
Content area flexes to fill available space.
Footer is optional (Separator + content).

---

## Task 4: Tauri Window Configuration

### 4.1 Main window (app shell)
- Resizable, draggable title bar region
- `data-tauri-drag-region` on TopBar
- Min size constraints
- Proper window decorations config in `tauri.conf.json`

### 4.2 Chat window (separate)
- Fixed 450x600 (or resizable)
- `data-tauri-drag-region` on chat header
- Always-on-top option
- IPC bridge to main window

### 4.3 Resizable panels
- Sidebar: draggable right edge (collapsed 48px → expanded 224px)
- Context panel: draggable left edge (collapsed 0px → expanded 288px)
- Use `resize: horizontal` CSS or a ResizeHandle component
- Container queries for responsive content within panels

### 4.4 ResizeHandle component — NEW
```
components/resize-handle/
  ResizeHandle.svelte
  types.ts
  index.ts
```
- Pure behavior primitive: pointer drag, resize observer
- data-kind="resize-handle" for styling via StyleMacro
- Emits onResize(newSize) callback

---

## Task 5: Fix Remaining svelte-check Errors

### 5.1 Root causes (from earlier audit)
- ~30 test files importing deleted `./contract.js`
- ~50 ClassValue type mismatches (BaseProps.class fix may resolve)
- ~38 props type conflicts (BaseProps vs HTMLAttributes)
- Slider null guards
- ColorSwatchPickerItem parse error
- Various import path issues

### 5.2 Approach
- Fix BaseProps.class type first (root cause for 50+ errors)
- Remove contract imports from test files (keep non-contract tests)
- Fix remaining one by one, verifying count drops after each

---

## Task 6: Verify Visual Output

### 6.1 Browser verification checklist
- [ ] DevPulse dashboard: widgets have glass surface, teal glow borders, depth shadows
- [ ] Chat: thread list shows active state with teal glow, bubbles have glass treatment
- [ ] TopBar: glass background with blur
- [ ] Sidebar: icon buttons with glow on active
- [ ] StatusBar: status dots with glow
- [ ] Circuit board backdrop visible through glass surfaces
- [ ] Chrome tabs merge visually with container below
- [ ] RadialGauge has teal arc with glow
- [ ] SparkLine has colored series with glow trails

### 6.2 DevTools verification
- [ ] `:root` has `--style-*` vars with real oklch values
- [ ] `[data-macro-id]` divs have `style` attrs with `--cl-*` vars
- [ ] `[data-kind]` elements have `background-color`, `box-shadow`, `border` applied
- [ ] No `transparent` or `inherit` where colors should be

---

## Task 7: Reauthor ChatOverlay Using Central Library

ChatOverlay at `lib/layouts/app/ChatOverlay.svelte` duplicates the entire chat UI with raw HTML, `v-*` encoding classes, and invalid props on Button/Input (`glow`, `frame`, `radius`, `preset`, `surface`).

### Fix:
- Replace message rendering with `ChatThread` block
- Replace input area with `ChatInput` block
- Keep draggable behavior (pointer events) — wrap ChatPanel in draggable container
- Remove all `v-*` encoding classes and raw HTML boxes
- Remove all invalid props from Button/Input

---

## Task 8: DevForge — VSCode Sub-Service Integration

### Current state (audited 2026-03-24):
- **Rust backend**: `DevForgeService` EXISTS at `systems/devpulse-engine/src/platform/services/devforge.rs`
  - Spawns `code-oss` as managed child process under Job Object
  - Binary expected at `deps/code-oss/` (the full fork exists in that directory)
  - Config: `devforge_enabled: false` (disabled by default)
  - Port-based with `--without-connection-token`
  - Proper boot/shutdown/ping lifecycle
- **Frontend**: `routes/(app)/devforge/+page.svelte` — Widget blocks with FAKE data
  - No IPC calls to DevForge service
  - No iframe/webview embedding of VSCode
  - `lib/domains/app/devforge/pages/DevDashboard.svelte` — EMPTY stub

### What needs to happen:
1. **Enable DevForge in config** — set `devforge_enabled: true` or make it toggleable
2. **Add Tauri IPC commands** for DevForge service:
   - `devforge_status` — is the VSCode process running?
   - `devforge_start` — spawn it if not running
   - `devforge_stop` — kill the process
   - `devforge_port` — get the port it's running on
3. **Embed VSCode in DevForge page** — iframe or Tauri webview pointing to `localhost:{port}`
4. **Build DevForge dashboard** from central library:
   - Widget: "Build Pipeline" — shows CI/CD status (future: connect to real build system)
   - Widget: "Terminal" — embedded terminal (future: connect to shell)
   - Widget: "IDE" — embedded VSCode webview
   - Widget: "Packages" — npm/cargo dependency viewer
5. **Domain service** — `lib/domains/app/devforge/services/devforge.service.ts`:
   - `fetchDevForgeStatus()` — IPC call
   - `startDevForge()` — IPC call
   - `stopDevForge()` — IPC call
6. **Domain runes** — `lib/domains/app/devforge/runes/devforge.runes.svelte.ts`:
   - `devforgeState.running`, `devforgeState.port`, `devforgeState.error`

---

## Task 9: TopBar + Sidebar Cleanup

### TopBar:
- Search dropdown uses `v-*` encoding classes + raw `box({})` → replace with `Card` component
- Remove any remaining invalid props

### Sidebar:
- Submenu popup uses `v-*` encoding classes + raw `box({})` → replace with `Card` component
- Everything else is clean ✅

---

## FULL AUDIT SUMMARY (2026-03-24)

### What's REAL and working:
- DevPulse service: fetches from LibSQL, DuckDB, OS metrics via IPC ✅
- Chat: `invoke("load_recent")`, `invoke("send_message")` — real IPC ✅
- StatusBar: shows real subsystem states with latencies ✅
- Platform boot: real service discovery, health checks, job object process management ✅
- DevForge Rust service: spawns code-oss, manages lifecycle ✅ (disabled)

### What's FAKE / stub:
- DevForge frontend: Widget blocks with hardcoded fake data ✗
- Maestro frontend: Widget blocks with fake data (no Candle LLM yet) ✗
- OverMind frontend: Widget blocks with fake data ✗
- WiredFront frontend: Widget blocks with fake data ✗

### What NEEDS REAUTHOR:
- ChatOverlay: raw HTML → ChatPanel block
- TopBar search dropdown: `v-*` box → Card
- Sidebar submenu popup: `v-*` box → Card
- DevForge page: fake data → real IPC + embedded VSCode

---

## Execution Order
1. Reauthor ChatOverlay (Task 7) — use ChatPanel block, remove raw HTML
2. TopBar + Sidebar cleanup (Task 9) — Card for popups
3. Chrome tabs component (Task 2) — new component + preset
4. Widget varieties (Task 3) — 7 widget type blocks
5. DevForge VSCode integration (Task 8) — enable service, IPC, embed
6. Tauri windows (Task 4) — drag regions, resize, multi-window
7. Fix svelte-check errors (Task 5) — systematic cleanup
8. Visual verification (Task 6) — browser + DevTools confirmation
