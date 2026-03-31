# Chat + Dashboard Audit Checklist

> Zero shortcuts. Every item must be verified on disk and in browser.
> This is the SSOT for what needs to exist before chat and dashboard are "done."

---

## A. CRITICAL BUGS (blocks everything)

### A0. Style Resolver ↔ Glue CSS Mismatch — ROOT CAUSE OF NO STYLING
**This is WHY there's no color, no borders, no depth.**

The resolver (`resolve.ts` line 80) outputs:
```
--cl-border: "0.0625rem solid oklch(0.55 0.1 180 / 0.2)"   ← composite shorthand
```

But `macro-base.css` consumes it as:
```css
[data-cl-surface] { border-color: var(--cl-border, transparent); }  ← expects color only
[data-cl-frame]   { border-width: var(--border-width, 0); }      ← never set by resolver
```

Result: `border-color` gets an INVALID value (shorthand in a color property) → browser discards it → **no borders anywhere**. And `--border-width` is never set → falls back to `0` → **zero-width borders**.

**FIX OPTIONS (pick one):**
1. Split `--cl-border` in resolver into `--border-color`, `--border-width`, `--border-style` and update macro-base.css to consume them
2. Keep `--cl-border` composite but use it as `border: var(--cl-border)` shorthand in macro-base.css (single property)

**Option 1 is correct** — aligns with how CSS properties work. Three separate vars, three separate CSS properties.

Additional resolver issues to audit:
- [ ] `--cl-backdrop`: resolver wraps in `blur()` but token value might already include `blur()` → double wrapping?
- [ ] `-bg` on `[data-cl-surface]`: sets `background-color` — verify var() chain resolves to real oklch value
- [ ] `--box-shadow` on `[data-cl-surface]`: sets `box-shadow` — verify shadow token has valid CSS value
- [ ] `--cl-color` vs `--cl-fg`: both set to same value, but `[data-cl-text]` reads `--cl-fg` falling back to `--cl-color` — redundant but not broken

### A1. Chat Frame Sizing — BROKEN
- [ ] `--chat-height: 3.75rem` (60px) makes `clamp()` return min height — massive empty space below chat
- [ ] ChatFrame sets its own `width: clamp(...)` / `height: clamp(...)` but it's the SOLE content in a Tauri window — should be `width: 100%; height: 100vh` and let the window be the boundary
- [ ] `--chat-sidebar-width: 3.5rem` (56px) — too narrow for mode buttons, text gets cut off
- [ ] `--chat-context-width: 12rem` (192px) — in a 450px window with 56px sidebar, only ~200px for messages
- [ ] FIX: ChatFrame must fill its window. Remove hardcoded clamp sizing. Use `width: 100%; height: 100vh;`
- [ ] FIX: Update `chat-layout.json` DTCG tokens: `--chat-height` should not be 3.75rem

### A2. Chat Window Not Draggable — BROKEN
- [ ] ZERO files have `data-tauri-drag-region` attribute
- [ ] Tauri window created with `decorations(false)` — no native titlebar = no drag handle
- [ ] FIX: Add `data-tauri-drag-region` to ChatTopBar root element
- [ ] FIX: Ensure ChatTopBar buttons (minimize, close) are NOT inside the drag region (or use `data-tauri-no-drag`)

### A3. Chat Content Doesn't Scale — NO FLUID
- [ ] Chat grid uses static rem tokens — no clamp() fluid scaling on grid tracks
- [ ] Sidebar, context panel, footer all fixed rem — don't adapt to window resize
- [ ] FIX: Grid tracks should use `minmax()` or `clamp()` that respond to container
- [ ] FIX: Content area must be `1fr` (it is), but sidebar/context need fluid min/max

---

## B. STYLE RESOLUTION (why it looks unstyled)

### B1. Token Cascade — Verify End-to-End
- [ ] `app.css` imports `$lib/design/index.css` — VERIFIED
- [ ] `design/index.css` imports `styles/index.css` + `theme/index.css` + `generated/macro-base.css` — VERIFIED
- [ ] `styles/index.css` declares `@layer tokens.primitives, tokens.semantic, tokens.components` — VERIFIED
- [ ] `components.generated.css` contains `--preset-neuro-elevated-*` tokens on `:root` — VERIFIED
- [ ] `macro-base.css` paints from `--cl-*` vars via `[data-cl-surface]` etc — VERIFIED
- [ ] **BUT**: Separate Tauri webview for chat loads the SAME SvelteKit app at `/chat` — root layout imports `app.css` — tokens SHOULD load
- [ ] VERIFY IN BROWSER: Open DevTools in chat window → inspect any element → are `--cl-*` vars resolving to real values or empty?
- [ ] VERIFY IN BROWSER: Does `[data-cl-surface]` selector match any elements?

### B2. Preset Resolution — PARTIALLY FIXED
- [ ] `preset="default"` → resolves to `neuro-elevated` via intent map fallback — WORKS
- [ ] `preset="primary"` → resolves to `glass-deep` — WORKS
- [ ] `preset="glass"` → NOW resolves to `glass-deep` (was falling to neuro-elevated) — FIXED
- [ ] `preset="ghost"` → resolves to `flat-minimal` — WORKS
- [ ] VERIFY: `--preset-glass-deep-background-color` exists in generated CSS — YES (line 229)
- [ ] VERIFY: Each chat component gets different preset → different visual treatment

### B3. Widget Visual Diversity — ALL SAME
- [ ] Dashboard widgets all use `preset="glass"` or `preset="default"` — they all resolve to neuro-elevated or glass-deep
- [ ] Store Health and Developer Stats both use `preset="default"` — identical styling
- [ ] Activity Timeline uses `preset="glass"` — same glass-deep as Clyffy Control
- [ ] FIX: Each widget should use a DIFFERENT preset to create visual hierarchy:
  - Clyffy Control: `preset="glass-deep"` (primary gauge, prominent)
  - System Overview: `preset="glass-minimal"` (secondary gauges, lighter)
  - Developer Stats: `preset="neuro-elevated"` (solid, card-like)
  - Activity Timeline: `preset="glass-deep"` (data viz, glassy)
  - Store Health: `preset="neuro-deep"` (inset, recessed)
  - Recent Projects: `preset="neuro-minimal"` (flat list, minimal)

---

## C. CHAT ARCHITECTURE (per references CHAT-REFERENCE-01/02)

### C1. Chat Layout Zones (5-zone grid)
- [ ] **TopBar**: "DEVPULSE" hub label left, "CORTEX MEMORY" title center/right, minimize/close buttons right
- [ ] TopBar must have `data-tauri-drag-region` for window dragging
- [ ] **Mode Selector** (left strip): DEV / PLAN / IMG / GEN buttons — small icon strip
- [ ] Mode selector: onclick shows overlay/dropdown to pick mode — NOT a navigation
- [ ] **Dashboard** (center): Scrollable message area — ChatThread renders here
- [ ] **Context Panel** (right): Cortex network graph visualization — separate component, can be collapsed/expanded/detached
- [ ] **Footer**: Input field + send button + voice indicator
- [ ] ALL zones must use ColdLight components with resolveMacro

### C2. Chat Domain Layer — DONE (verify)
- [ ] `domains/chat/types/chat.types.ts` — ChatMessage, BlockChatMessage, ChatThread, ChatMode
- [ ] `domains/chat/services/chat.service.ts` — loadMessages(), sendMessage() via invoke
- [ ] `domains/chat/runes/chat.runes.svelte.ts` — ChatState singleton class
- [ ] `domains/chat/index.ts` — barrel exports
- [ ] Route page `(chat)/chat/+page.svelte` does NOT call invoke — imports from domain only
- [ ] Shell `layouts/chat/.../Frame.svelte` wires ChatFooter.onSend to chatState.sendMessage

### C3. Route Awareness
- [ ] Chat knows what platform route is active (devpulse, overmind, etc.) via `globalState.current_domain`
- [ ] TopBar displays current domain name
- [ ] Mode can change per domain context
- [ ] FUTURE: User can type commands in chat to navigate (e.g., "go to overmind")

### C4. Cortex Visualizer — NOT BUILT
- [ ] Currently just `<Text>Cortex visualization</Text>` — placeholder
- [ ] Reference shows: network graph with nodes and edges
- [ ] Should be: SVG/Canvas network graph component
- [ ] Must be: detachable (popup window or widget), mountable (right panel, footer, header)
- [ ] NOT blocking chat from rendering — can be placeholder initially but must have real component slot

---

## D. DASHBOARD ARCHITECTURE

### D1. Dashboard Domain → Route Flow — VERIFY
- [ ] `domains/app/devpulse/services/devpulse.service.ts` calls invoke("fetch_dashboard")
- [ ] `domains/app/devpulse/runes/devpulse.runes.svelte.ts` — DevPulseState singleton
- [ ] Route page `(app)/devpulse/+page.svelte` reads devpulseState, renders widgets
- [ ] `$effect` triggers `devpulseState.refresh()` after `platformState.isReady`
- [ ] All data comes from Rust backend via IPC — real data, not mocks

### D2. Dashboard Widgets — Rendering But Visually Flat
- [ ] RadialGauge: renders SVG, uses resolveSvgMacro — WORKS but all gauges look same
- [ ] SparkLine: renders SVG — WORKS
- [ ] Widget (block): composes Card + Heading + Tabs — WORKS but all use same preset
- [ ] Store Health: uses platformState.health — REAL DATA, renders correctly
- [ ] Developer Stats: uses devpulseState.data.user — REAL DATA
- [ ] FIX: Assign diverse presets per widget (see B3 above)
- [ ] FIX: Each widget should have distinct motion/transition (breathe, pulse, glow variations)

### D3. StatusBar — VERIFY
- [ ] `layouts/app/StatusBar.svelte` — does it exist? Does it render?
- [ ] Should show: current route, connection status, performance metrics
- [ ] Uses ColdLight components

### D4. Sidebar — TOO NARROW
- [ ] Collapsed sidebar is `w-12` (48px) — just icons
- [ ] Expanded sidebar is `w-56` (224px) — with text labels
- [ ] Current: sidebar starts collapsed, toggle button at bottom
- [ ] Issue: collapsed state is too narrow for icon-only buttons — icons get clipped
- [ ] FIX: Collapsed sidebar should be `w-14` (56px) minimum for proper icon display

---

## E. FLUID SCALING

### E1. clamp() Fluid Ranges
- [ ] Space scale in `generated-scales.tokens.json` uses `clamp(min, vw-based, max)` — VERIFIED
- [ ] Text sizes need fluid clamp where appropriate
- [ ] Chat grid tracks need fluid min/max (not static rem)
- [ ] Dashboard grid should respond to viewport — currently `grid-cols-12 gap-4` (static)
- [ ] Aspect-ratio utility needs proper clamp range for responsive gauges

### E2. Container Queries (future)
- [ ] Widgets should respond to their container, not viewport
- [ ] SvelteKit + Tailwind 4 supports `@container` queries
- [ ] NOT blocking — but design tokens should anticipate this

---

## F. TAURI INTEGRATION

### F1. Window Management
- [ ] Chat window: `decorations(false)`, `transparent(true)`, `always_on_top(true)` — VERIFIED in Rust
- [ ] MISSING: `data-tauri-drag-region` on ChatTopBar
- [ ] MISSING: Resize behavior — content must reflow with window resize
- [ ] Chat window size: 450x600 initial — should this be larger? Reference shows wider window

### F2. IPC Commands — ALL EXIST
- [ ] `send_message` — registered in lib.rs
- [ ] `load_recent` — registered in lib.rs
- [ ] `open_chat_window` — registered in lib.rs
- [ ] `close_window` — registered in lib.rs
- [ ] `fetch_dashboard` — registered in lib.rs
- [ ] `get_process_metrics` — registered in lib.rs

---

## G. SVELTE 5 RUNES COMPLIANCE

### G1. Verified Clean
- [ ] Zero `export let` in routes or domains
- [ ] Zero `writable()`/`readable()` stores
- [ ] Zero `$:` reactive declarations
- [ ] All rune classes use `$state<T>()` with explicit types
- [ ] All computed values use `$derived()` or getters
- [ ] All side effects use `$effect()`
- [ ] All props via `$props()`
- [ ] All snippets via `{#snippet}` / `{@render}`

### G2. Domain Boundary
- [ ] Zero `invoke()` calls in route pages — VERIFIED
- [ ] Two `invoke()` calls in layouts (window management) — ACCEPTABLE
- [ ] All domain IPC goes through service layer — VERIFIED
- [ ] Route pages import from domain barrel exports only — VERIFIED

---

## H. ACCESSIBILITY (FULL COMPLIANCE)

- [ ] ChatFrame: `role="dialog"`, `aria-label="Clyffy Chat"`, `aria-modal="false"` — DONE
- [ ] ChatFooter: `role="form"`, `aria-label="Send message"` — DONE
- [ ] ChatSidebar: `role="navigation"`, `aria-label="Chat modes"` — DONE
- [ ] ChatDashboard: `role="log"`, `aria-live="polite"` — DONE
- [ ] ChatTopBar: `role="banner"` — DONE
- [ ] ChatContextPanel: `aria-label="Cortex memory"` — DONE
- [ ] ALL interactive elements have keyboard bindings — NEEDS AUDIT
- [ ] Focus trap in chat window — NOT IMPLEMENTED
- [ ] Focus visible ring on all buttons — NEEDS VERIFY
- [ ] Color contrast ≥ 4.5:1 — NEEDS VERIFY (oklch values need contrast check)

---

## PRIORITY ORDER

1. **A1** — Fix chat frame sizing (fills window, not clamped to tiny size)
2. **A2** — Add drag region to chat topbar
3. **A3** — Fluid grid tracks
4. **B3** — Diverse widget presets (visual hierarchy)
5. **C4** — Cortex visualizer component (at least a real SVG placeholder)
6. **D4** — Sidebar width fix
7. **E1** — Fluid scaling tokens
8. **Rest** — Verify and fix remaining items
