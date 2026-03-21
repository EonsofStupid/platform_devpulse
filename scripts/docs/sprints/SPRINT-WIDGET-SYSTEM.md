# SPRINT: Widget System — Sysinfo, Persona, Chrome Tabs, Dashboard Blocks

**Status**: PLANNED
**Priority**: P1 — Dashboard UX depends on real widgets with real data.
**Prerequisites**: SPRINT-PIPELINE-VALIDATION, SPRINT-TABS-FIX
**Category**: ColdLight / Blocks

---

## Problem Statement

The Widget block exists and is gold standard. But the dashboard needs purpose-built widgets for: system resource monitoring (real sysinfo data), Maestro/Clyffy persona display with profile switching, service health grids, and chrome-style tabbed interfaces that work across every domain dashboard. These must be properly authored through the ColdLight pipeline — not hacked together.

---

## Pre-Execution Research (Verified 2026-03-21)

### What Exists (Verified on Disk)

| Asset | Location | Status |
|-------|----------|--------|
| Widget block | `blocks/widgets/Widget.svelte` | GOLD STANDARD — recipe + 6 presets + useColdLight |
| WidgetHeader | `blocks/widgets/WidgetHeader.svelte` | Complete |
| WidgetTabs | `blocks/widgets/WidgetTabs.svelte` | Custom impl, NOT using real Tabs component |
| WidgetContent | `blocks/widgets/WidgetContent.svelte` | Complete |
| WidgetFooter | `blocks/widgets/WidgetFooter.svelte` | Complete |
| RadialGauge | `blocks/widgets/RadialGauge.svelte` | Standalone SVG viz, not a registered kind |
| SparkLine | `blocks/widgets/SparkLine.svelte` | Standalone SVG viz, not a registered kind |
| Widget recipe | `recipes/blocks/widget/widget.default.ts` | `widget.glass.void` |
| Widget presets | `registry/presets.ts` | 6: stat, chart, gauge, timeline, table, kpi |
| Dashboard blocks dir | `blocks/dashboards/` | EMPTY skeleton with README |
| get_process_metrics | `commands/sys/metrics.rs` | NEW — real RSS, CPU via sysinfo |
| ProcessMetrics type | `platform/metrics.rs` | NEW — memory_rss_bytes, cpu_usage_percent, pid |

### Reference Images (Verified on Disk)

| Reference | Shows |
|-----------|-------|
| DASHBOARD-REFERENCE-01.png | Liquid metal gauges, sparkline charts, neural network viz, glass panels |
| CHAT-REFERENCE-01.png | Tabbed nav (DEVELOPER/CORTEX MEMORY), conversation panel, knowledge graph, voice button |
| CHAT-REFERENCE-02.png | Same with different active tab, teal glow persona indicator |

### What's Missing

1. **SysInfoWidget** — Purpose-built for real process metrics (RSS, CPU, service health)
2. **PersonaWidget** — Shows active AI expert (Maestro/Clyffy), profile switching, status indicator
3. **ServiceHealthGrid** — Grid of all platform services with state, latency, health status
4. **Chrome tabs as reusable pattern** — WidgetTabs needs to use real Tabs component (see SPRINT-TABS-FIX)
5. **Dashboard block compositions** — DashboardMetrics, DashboardCharts, DashboardMaestro, DashboardOverview

### Persona System Design

**STOP — Owner Decision Required**

How does the Maestro/Clyffy persona system work?

**What I understand:**
- Maestro is the AI orchestrator kernel
- Clyffy is your general persona/profile for Maestro
- You want the ability to build default profiles
- The persona widget shows which expert is active
- Profile switching changes the AI's behavior/personality

**What I need to know:**
- Where is persona configuration stored? SurrealDB? Config file?
- What fields does a persona profile have? (name, avatar, system prompt, voice, color scheme?)
- Can there be multiple personas beyond Clyffy? (e.g., CodeReview persona, Debug persona)
- Does the persona affect the ColdLight styling? (e.g., Clyffy = teal glow, another = purple glow)

---

## Tasks

### Task 1: SysInfoWidget block
**Location**: `blocks/widgets/SysInfoWidget.svelte`

Renders real process metrics from `get_process_metrics` Tauri command:
- RSS memory gauge (real bytes → formatted GB/MB)
- CPU usage gauge (real percentage)
- PID display
- Uptime
- Per-service health status list

Uses existing RadialGauge for gauges, composes inside Widget block with proper presets.

### Task 2: ServiceHealthGrid block
**Location**: `blocks/widgets/ServiceHealthGrid.svelte`

Grid display of all platform services:
- Service name
- ServiceState (Created/Booting/Ready/Degraded/Failed)
- Ping latency (microseconds)
- Health status indicator (color dot)
- Last check timestamp

Consumes `SystemHealth` from boot state or periodic health polls.

### Task 3: PersonaWidget block
**Location**: `blocks/widgets/PersonaWidget.svelte`

Shows active AI persona:
- Persona name (Maestro/Clyffy/custom)
- Status indicator (active/idle/processing)
- Avatar or icon
- Profile switcher dropdown
- Color accent driven by persona config

### Task 4: Register new widget presets
Add to `registry/presets.ts`:
- `widget-sysinfo` — Resource monitoring preset
- `widget-health` — Service health grid preset
- `widget-persona` — AI persona display preset

### Task 5: Register new widget recipes
Add to `recipes/blocks/widget/`:
- `widget.sysinfo.ts` — Slot classes for metric layout
- `widget.health.ts` — Slot classes for health grid
- `widget.persona.ts` — Slot classes for persona display

### Task 6: Dashboard block compositions
Fill `blocks/dashboards/` with proper blocks that compose widgets:
- `DashboardMetrics.svelte` — SysInfoWidget + ServiceHealthGrid
- `DashboardMaestro.svelte` — PersonaWidget + chat summary + context load

### Task 7: Wire to real data
- SysInfoWidget calls `invoke("get_process_metrics")` on mount + interval
- ServiceHealthGrid reads from `platformState.health.subsystems`
- PersonaWidget reads persona config from SurrealDB (or config)

---

## Pattern: Named Folder Structure

Every new block follows the enterprise pattern:
```
blocks/widgets/sysinfo/
├── SysInfoWidget.svelte    # The block component
├── types.ts                # Props, data types
├── index.ts                # Public exports
```

Or if it's a sub-component of Widget:
```
blocks/widgets/
├── SysInfoWidget.svelte    # Composes Widget + RadialGauge + real data
├── ServiceHealthGrid.svelte
├── PersonaWidget.svelte
```

**STOP — Owner Decision Required**: Named folders per widget type, or flat in `blocks/widgets/`?

---

## Exit Criteria

- SysInfoWidget shows real RSS/CPU from sysinfo (not cache counts)
- ServiceHealthGrid shows all 9 services with real state + latency
- PersonaWidget shows active persona with switching
- All new blocks use Widget + recipe + preset pipeline
- Chrome tabs work via real Tabs component
- Dashboard page uses new blocks instead of manual composition

---

## Files Changed (Estimate)

| File | Action |
|------|--------|
| `blocks/widgets/SysInfoWidget.svelte` | NEW |
| `blocks/widgets/ServiceHealthGrid.svelte` | NEW |
| `blocks/widgets/PersonaWidget.svelte` | NEW |
| `blocks/widgets/types.ts` | MODIFY — add new block types |
| `blocks/dashboards/DashboardMetrics.svelte` | NEW |
| `blocks/dashboards/DashboardMaestro.svelte` | NEW |
| `registry/presets.ts` | MODIFY — add 3 presets |
| `recipes/blocks/widget/` | NEW recipe files |
| `routes/(app)/devpulse/+page.svelte` | MODIFY — use new blocks |
