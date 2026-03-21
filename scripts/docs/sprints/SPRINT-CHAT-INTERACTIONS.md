# SPRINT: Chat Interactions — AI-Driven Interaction Component Library

**Status**: PLANNED
**Priority**: P2 — Depends on A2UI integration and widget system.
**Prerequisites**: SPRINT-A2UI-INTEGRATION, SPRINT-WIDGET-SYSTEM, SPRINT-KIND-REGISTRY
**Category**: Platform / Chat / AI

---

## Problem Statement

The chat and platform need a vast library of interaction components that AI (Maestro/Clyffy) can build and populate dynamically. The reference images show: conversation panels with message bubbles, knowledge graph visualization, tabbed navigation (DEVELOPER/CORTEX MEMORY), voice controls, code blocks with syntax highlighting, and tool output displays. These need to be ColdLight components registered in the A2UI catalog so the AI can reference them by type and the renderer produces proper UI.

---

## Pre-Execution Research (Verified 2026-03-21)

### Reference Analysis (from REFERENCES/)

**CHAT-REFERENCE-01.png shows:**
- Top nav: DEVELOPER | CORTEX MEMORY tabs (chrome-style, behind panel)
- Left sidebar: ALERTS, ALARMS, EVENTS, SYSTEM, CONTROL tabs (vertical)
- Main panel: Conversation thread with message bubbles
- Right panel: Knowledge graph (network visualization, nodes + edges)
- Bottom right: Voice button (red glow = active)
- Message format: timestamp, sender name, structured content

**CHAT-REFERENCE-02.png shows:**
- Same layout but different active tab
- Teal glow persona indicator (bottom right, different from red)
- Code blocks within messages
- Structured data display within messages

### What Exists (Verified on Disk)

| Asset | Location | Status |
|-------|----------|--------|
| Chat page | `routes/(chat)/chat/+page.svelte` | EXISTS — basic chat UI |
| Chat overlay | `layouts/app/ChatOverlay.svelte` | EXISTS — overlay panel |
| send_message command | `commands/chat/mod.rs` | EXISTS — sends to Maestro |
| Chat components | `components/chat-*` ? | NEED TO VERIFY at execution |
| Code component | `components/code/` | EXISTS — syntax highlighting |
| Knowledge graph | ? | NEED TO VERIFY |
| Voice controls | ? | NEED TO VERIFY (Kokoros disabled) |

### Interaction Component Categories Needed

Based on references and platform vision:

1. **Message Components** — Message bubble, structured content, code block, tool output, error display
2. **Navigation Components** — Chrome tabs (horizontal), sidebar tabs (vertical), breadcrumbs
3. **Data Display** — Knowledge graph viz, metric cards, status indicators, progress bars
4. **Input Components** — Chat input, voice button, file upload, command palette
5. **AI-Specific** — Thinking indicator, token counter, context meter, model selector
6. **Tool Output** — File diff viewer, terminal output, search results, table viewer

### A2UI Integration Point

Each interaction component = one entry in the A2UI catalog. Maestro emits A2UI JSON referencing the component type → renderer maps to ColdLight component → renders with full styling.

Example A2UI payload from Maestro:
```json
{
  "type": "message-bubble",
  "props": {
    "sender": "Clyffy",
    "content": "Here's the analysis...",
    "timestamp": "2026-03-21T00:30:00Z"
  },
  "children": [
    {
      "type": "code-block",
      "props": { "language": "rust", "code": "fn main() {}" }
    }
  ]
}
```

---

## Tasks

### Task 1: Audit existing chat components
Read `routes/(chat)/chat/+page.svelte` and any chat-related components. Map what exists vs what needs building.

### Task 2: Define interaction component catalog
List every component type the AI should be able to reference. This becomes the A2UI catalog entries.

**STOP — Owner Decision Required**

What interaction types does the AI need? Starting list:
- message-bubble, code-block, tool-output, error-display
- thinking-indicator, context-meter, token-counter
- knowledge-graph, file-diff, search-results, table-view
- voice-button, command-input
- metric-card, status-indicator, progress-bar

Add/remove/prioritize?

### Task 3: Build message components
Following ColdLight pipeline: contract → primitive → recipe → component.
Each component gets: named folder, types.ts, contract.ts, index.ts.

### Task 4: Build data display components
Knowledge graph visualization, metric cards, status indicators.

### Task 5: Build AI-specific components
Thinking indicator (animated), context meter (real data from inference service), token counter.

### Task 6: Register in A2UI catalog
Each new component gets a `define()` in kind-definitions and an entry in the A2UI registry mapper.

### Task 7: Wire to chat page
Update `routes/(chat)/chat/+page.svelte` to use the new components. Messages from Maestro render through A2UI renderer.

### Task 8: Voice controls
Voice button component that connects to Kokoros TTS/STT services. Disabled state when Kokoros is not loaded, active state with glow indicator when voice is active.

**Note**: Depends on Kokoros actually loading (SPRINT-PLATFORM-SERVICE-MANAGER Phase 2).

---

## Pattern: Interaction Component Structure

```
components/{kind}/
├── {Kind}.svelte          # The component
├── contract.ts            # ARIA contract
├── types.ts               # Props, slots, events
├── context.ts             # Compound context (if needed)
├── index.ts               # Public exports
```

Recipe in:
```
recipes/components/{kind}/
├── {kind}.default.ts      # Default recipe
├── types.ts               # Recipe types
├── index.ts               # Exports
```

Registered in:
- `registry/kind-definitions.ts` — kind definition
- `registry/presets.ts` — visual presets
- `a2ui/registry.ts` — A2UI catalog entry

---

## Exit Criteria

- At least 10 interaction component types built and registered
- A2UI catalog maps all interaction types to ColdLight components
- Chat page renders Maestro messages through A2UI renderer
- Voice button exists (disabled state OK if Kokoros not loaded)
- Knowledge graph viz renders with real node/edge data
- All components follow ColdLight pipeline (no shortcuts)

---

## Files Changed (Estimate)

| Category | Count |
|----------|-------|
| New component folders | ~10-15 |
| New recipe files | ~10-15 |
| Kind definitions | ~10-15 new entries |
| A2UI registry entries | ~10-15 |
| Chat page updates | 1-2 files |
| Voice button | 1 component + primitive |
