# DRY RUN: Platform Reality Sprint

Verbatim code changes per task. Questions/blockers flagged inline.

---

## Task 1.1: Recipe Barrel

### CREATE: `recipes/components/index.ts`

28 dirs have `index.ts`. 17 are empty (no recipe files). Import only the 28:

```ts
// Side-effect imports — triggers registerRecipe() for all component recipes
import "./accordion/index.js";  // WAIT — accordion has NO index.ts. SKIP.
```

**CORRECTION**: Only these 28 have index.ts:
alert, badge, banner, button, callout, card, checkbox, color-input, combobox, dialog,
form, form-field, input, input-group, label, number-input, pagination, panel,
radio-group, search-input, select, slider, switch, tabs, tags-input, textarea,
toggle, toggle-group

### EDIT: `design/index.ts` line 94

Add after line 94:
```ts
import "./recipes/components/index.js";
```

### QUESTIONS: None. Straightforward.

---

## Task 1.2: Boot-labels SSOT

### REWRITE: `sys/boot/boot-labels.ts`

Need to export:
1. `friendlyLabel(step)` — prod-safe label (existing, fix "Knowledge Graph" → "Cortex")
2. `devLabel(step)` — raw tech name for DEV_MODE
3. `getIcon(step)` — returns Lucide component reference

**QUESTION**: Can I import lucide-svelte components in a .ts file?
- lucide-svelte ships pre-compiled JS. Import should work in .ts.
- If svelte-check fails, fallback: export icon name strings, resolve in .svelte files.
- Going with component imports first.

Icon mapping:
- "Data layer" / "Trinity" → Settings (system-level)
- "Relational store" → Database (LibSQL in dev)
- "Analytics store" → BarChart3 (DuckDB in dev)
- "Graph store" → Brain (SurrealDB in dev, "Cortex" in prod)
- "Cache store" → Zap (Moka in dev)
- "RRO" → Radar (placeholder, no engine wrapper yet)

Dev labels:
- "Relational store" → "LibSQL"
- "Analytics store" → "DuckDB"
- "Graph store" → "SurrealDB"
- "Cache store" → "Moka"

Prod labels (corrected):
- "Relational store" → "Data Store"
- "Analytics store" → "Analytics Engine"
- "Graph store" → "Cortex" (was "Knowledge Graph" — WRONG)
- "Cache store" → "Memory Cache"

### EDIT: `sys/runes/platformState.svelte.ts`

- DELETE lines 31-36 (FRIENDLY_NAMES const)
- ADD import: `import { friendlyLabel } from "$lib/sys/boot/boot-labels.js";`
- Line 128-130: Replace `FRIENDLY_NAMES[event.step]` with `friendlyLabel(event.step)`

Current code (lines 128-131):
```ts
friendlyName:
    existing?.friendlyName ??
    FRIENDLY_NAMES[event.step] ??
    event.step,
```

New code:
```ts
friendlyName:
    existing?.friendlyName ??
    friendlyLabel(event.step),
```

(`friendlyLabel` already falls back to raw step name)

### QUESTIONS: None after icon import resolved.

---

## Task 1.3: StatusBar Icons

### EDIT: `layouts/app/StatusBar.svelte`

- Import `getIcon, devLabel` from boot-labels
- In boot mode (line 35-51, DEV_MODE section), add icon before subsystem name
- In health mode (line 99-104, DEV_MODE section), add icon before subsystem text

Pattern for rendering dynamic icon component in Svelte 5:
```svelte
{@const Icon = getIcon(sub.name)}
{#if Icon}
    <svelte:component this={Icon} size={12} class="shrink-0" />
{/if}
```

Boot mode change (line 47-48): Show dev label instead of raw name
```svelte
<Text size="xs" color="secondary">
    {devLabel(sub.name)}: {sub.state}{sub.latencyMs !== null ? ` ${sub.latencyMs}ms` : ''}
</Text>
```

Health mode change (line 101-103): Add icon, show dev label
```svelte
{@const Icon = getIcon(sub.name)}
<HStack gap="1" align="center">
    {#if Icon}<svelte:component this={Icon} size={12} class="text-text-muted shrink-0" />{/if}
    <Text size="xs" color="muted">
        [{devLabel(sub.name)}: {sub.state}{sub.latencyMs !== null ? ` ${sub.latencyMs}ms` : ''}]
    </Text>
</HStack>
```

### QUESTIONS: None.

---

## Task 2.x: Hub Dashboards

### BLOCKER: Widget `title` is string-only

Widget.svelte passes `title` as string to WidgetHeader. WidgetHeader renders `{title}` in a `<span>`.
To put icons in widget titles, I need to either:

**Option A**: Add `icon` prop to WidgetProps + WidgetHeaderProps (4 lines changed in types.ts, 3 lines in WidgetHeader.svelte, 1 line in Widget.svelte)
**Option B**: Use `actions` snippet on left side — doesn't work, actions is right-aligned
**Option C**: Don't put icons inside Widget title — put them in content area only

**DECISION NEEDED**: Option A is cleanest. Small change, backwards compatible. Going with it.

### Widget icon prop changes:

**types.ts** — Add to WidgetProps and WidgetHeaderProps:
```ts
import type { Component } from "svelte";
// Add to both interfaces:
icon?: Component;
```

**Widget.svelte** — Pass icon to WidgetHeader (line 93-99):
```svelte
<WidgetHeader {title} {icon} class={slots.header} ... />
```

**WidgetHeader.svelte** — Render icon before title:
```svelte
let { title, icon, class: className, ... }: WidgetHeaderProps = $props();

{#if icon}
    {@const Icon = icon}
    <svelte:component this={Icon} size={16} class="shrink-0 text-text-secondary" />
{/if}
{#if title}
    <span data-slot="title" class={titleClass}>{title}</span>
{/if}
```

### Hub page pattern (all 5 hubs follow same structure):

```svelte
<script lang="ts">
    import { Grid, Stack, HStack, Text, Badge } from "$lib/design/index.js";
    import { Widget } from "$lib/design/blocks/widgets/index.js";
    import { FeatureIcon1, FeatureIcon2, ... } from "lucide-svelte";
</script>

<div class="grid grid-cols-12 gap-4" data-page="{hub}-dashboard">
    <div class="col-span-N">
        <Widget title="Feature Name" icon={FeatureIcon} surface="glass-deep" ...>
            ...status/placeholder content...
        </Widget>
    </div>
</div>
```

### OverMind hub features + icons:
- Playground → FlaskConical
- Experiments → TestTube2
- Sandbox → Box
- Training → GraduationCap
- Learning → BookOpen
- Status → Activity

### WiredFront hub features + icons:
- Screenshots → Camera
- Video Editor → Video
- Audio Editor → AudioLines
- Image Editor → ImagePlus
- Streaming (Twitch/YouTube/AngryVibers) → Radio
- Notes → StickyNote
- Voice → Mic
- Storage → HardDrive

### DevForge hub features + icons:
- Build Pipeline → Hammer
- CI/CD → GitBranch
- Environments → Server
- Node CLI → Terminal
- Packages → Package

### Maestro hub features + icons (IP labels gated behind DEV_MODE):
- Orchestrator Status → Brain
- Minion Fleet → Users
- Knowledge Base (RAG/CAG/HyDE) → BookOpenCheck
- Inference Cache (KV) → Database
- Context Window → Layers

### DevPulse — just add icons to existing Widget titles:
- Maestro Control → Gauge
- System Overview → Activity
- Developer Stats → TrendingUp
- Activity Timeline → BarChart3
- Store Health → HeartPulse
- Recent Projects → FolderGit2

### QUESTIONS: None.

---

## Task 3.1-3.2: Token Boost

### Glow values in `tokens/tailwind.css` lines 110-115

Current: `0 0 20px oklch(.../ 0.6), 0 0 50px oklch(.../ 0.25)`
Boost to: `0 0 30px oklch(.../ 0.7), 0 0 60px oklch(.../ 0.35)`

The token-categories.ts references `var(--shadow-glow-*)` — no change needed there.
The actual values are in tailwind.css @theme block.

### Frame values in `token-categories.ts` lines 452-511

Current frame borders are at 0.15-0.30 opacity.
Boost:
- soft: border opacity 0.15 → 0.25
- hard: border opacity 0.25 → 0.40
- crisp: border opacity 0.30 → 0.45
- glow: border opacity 0.6 → 0.7, frame-glow spread 15px/30px → 20px/40px, opacity 0.35/0.15 → 0.45/0.25
- accent-teal: border opacity 0.55 → 0.65, frame-glow spread 10px → 20px, opacity 0.25 → 0.40
- accent-purple: border opacity 0.50 → 0.65, frame-glow spread 10px → 20px, opacity 0.25 → 0.40

After editing: `pnpm ds:tokens:build` to regenerate variants.css

### QUESTIONS: None.

---

## Summary: Zero blockers. Ready to execute.

Files to CREATE (1):
- `recipes/components/index.ts`

Files to EDIT (10):
- `design/index.ts` (1 line add)
- `sys/boot/boot-labels.ts` (full rewrite)
- `sys/runes/platformState.svelte.ts` (delete FRIENDLY_NAMES, import friendlyLabel)
- `layouts/app/StatusBar.svelte` (add icons + dev labels)
- `blocks/widgets/types.ts` (add icon prop)
- `blocks/widgets/Widget.svelte` (pass icon prop)
- `blocks/widgets/WidgetHeader.svelte` (render icon)
- `routes/(app)/overmind/+page.svelte` (full rewrite)
- `routes/(app)/wiredfront/+page.svelte` (full rewrite)
- `routes/(app)/devforge/+page.svelte` (full rewrite)
- `routes/(app)/maestro/+page.svelte` (full rewrite)
- `routes/(app)/devpulse/+page.svelte` (add icons to widgets)
- `tokens/tailwind.css` (boost glow values)
- `registry/token-categories.ts` (boost frame values)

Verification after each task: `pnpm svelte-check`
