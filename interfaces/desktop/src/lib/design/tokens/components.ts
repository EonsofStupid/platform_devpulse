/**
 * @file src/lib/design/tokens/components.ts
 * @layer tokens
 *
 * Tier 3: Component Tokens — scoped to primitive kinds.
 * Values MUST reference Tier 1 or Tier 2 tokens.
 *
 * NOT every primitive needs component tokens.
 * Layout primitives (box, flex, stack, grid, center, spacer) use spacing tokens directly.
 * Typography primitives (text, heading, prose) use text tokens directly.
 * Structural primitives (form-field, form, label, nav, list) inherit from parents.
 * Input variants (textarea, number-input, search-input, pin-input, tags-input,
 *   color-input, date-field) inherit from `input` tokens.
 * Overlay variants (sheet, alert-dialog, popover, command-palette, link-preview)
 *   inherit from `dialog` tokens.
 * Menu variants (dropdown-menu, context-menu, menubar) inherit from `menu` tokens.
 *
 * Run `pnpm ds:tokens:build` to regenerate CSS from this file.
 *
 * @since 1.1.0
 */

export const components = {
	// ── Interactive ────────────────────────────────────────────────────────────
	button: {
		bg: "var(--surface-primary)",
		"bg-hover": "var(--surface-elevated)",
		border: "var(--border-subtle)",
		"border-focus": "var(--border-focus)",
	},
	checkbox: {
		bg: "var(--surface-primary)",
		"bg-checked": "var(--color-teal-500)",
		border: "var(--border-emphasis)",
		"border-focus": "var(--border-focus)",
	},
	switch: {
		bg: "var(--surface-muted)",
		"bg-checked": "var(--color-teal-500)",
		thumb: "var(--text-primary)",
	},
	toggle: {
		bg: "var(--surface-primary)",
		"bg-pressed": "var(--surface-elevated)",
		border: "var(--border-subtle)",
	},
	slider: {
		track: "var(--surface-muted)",
		range: "var(--color-teal-500)",
		thumb: "var(--surface-elevated)",
		"thumb-border": "var(--border-focus)",
	},
	progress: {
		track: "var(--surface-muted)",
		bar: "var(--color-teal-500)",
	},

	// ── Form ──────────────────────────────────────────────────────────────────
	input: {
		bg: "var(--surface-overlay)",
		"bg-focus": "var(--surface-elevated)",
		border: "var(--border-subtle)",
		"border-focus": "var(--border-focus)",
	},
	select: {
		bg: "var(--surface-overlay)",
		"bg-hover": "var(--surface-elevated)",
		border: "var(--border-subtle)",
		"border-focus": "var(--border-focus)",
	},
	combobox: {
		bg: "var(--surface-overlay)",
		border: "var(--border-subtle)",
		"border-focus": "var(--border-focus)",
		"option-hover": "var(--surface-elevated)",
		"option-selected-bg": "var(--color-teal-900)",
		"option-selected-text": "var(--color-teal-300)",
	},
	"radio-group": {
		bg: "var(--surface-primary)",
		"bg-checked": "var(--color-teal-500)",
		border: "var(--border-emphasis)",
		"border-focus": "var(--border-focus)",
	},

	// ── Data Display ──────────────────────────────────────────────────────────
	badge: {
		bg: "var(--surface-elevated)",
		border: "var(--border-subtle)",
	},
	card: {
		bg: "var(--surface-primary)",
		border: "var(--border-soft)",
		depth: "var(--depth-raised)",
	},
	avatar: {
		bg: "var(--surface-muted)",
		border: "var(--border-subtle)",
	},
	table: {
		"header-bg": "var(--surface-elevated)",
		"row-bg": "var(--surface-primary)",
		"row-hover": "var(--surface-overlay)",
		border: "var(--border-subtle)",
	},
	skeleton: {
		bg: "var(--surface-muted)",
		shine: "var(--surface-elevated)",
	},
	kbd: {
		bg: "var(--surface-elevated)",
		border: "var(--border-soft)",
	},

	// ── Feedback ──────────────────────────────────────────────────────────────
	alert: {
		bg: "var(--surface-overlay)",
		border: "var(--border-soft)",
	},
	toast: {
		bg: "var(--surface-elevated)",
		border: "var(--border-soft)",
		depth: "var(--depth-overlay)",
	},
	banner: {
		bg: "var(--surface-muted)",
		border: "var(--border-subtle)",
	},
	callout: {
		bg: "var(--surface-overlay)",
		border: "var(--border-soft)",
	},
	spinner: {
		color: "var(--color-teal-400)",
	},

	// ── Container ─────────────────────────────────────────────────────────────
	panel: {
		bg: "var(--surface-primary)",
		border: "var(--border-soft)",
		"header-border": "var(--border-subtle)",
		depth: "var(--depth-panel)",
	},
	sidebar: {
		bg: "var(--surface-primary)",
		border: "var(--border-subtle)",
	},

	// ── Overlay ───────────────────────────────────────────────────────────────
	dialog: {
		bg: "var(--surface-overlay)",
		border: "var(--border-soft)",
		"border-focus": "var(--border-focus)",
		depth: "var(--depth-modal)",
		overlay: "var(--color-void-950)",
	},
	popover: {
		bg: "var(--surface-overlay)",
		border: "var(--border-soft)",
		depth: "var(--depth-overlay)",
	},
	tooltip: {
		bg: "var(--surface-elevated)",
		border: "var(--border-subtle)",
	},

	// ── Navigation ────────────────────────────────────────────────────────────
	tabs: {
		bg: "var(--surface-primary)",
		border: "var(--border-subtle)",
		"border-focus": "var(--border-focus)",
		"tab-hover": "var(--surface-elevated)",
		"tab-active": "var(--surface-overlay)",
		indicator: "var(--color-teal-400)",
	},
	accordion: {
		bg: "var(--surface-primary)",
		border: "var(--border-subtle)",
		"trigger-hover": "var(--surface-elevated)",
	},
	menu: {
		bg: "var(--surface-overlay)",
		border: "var(--border-soft)",
		"item-hover": "var(--surface-elevated)",
		depth: "var(--depth-overlay)",
	},
	breadcrumb: {
		separator: "var(--text-muted)",
	},
	pagination: {
		bg: "var(--surface-primary)",
		"bg-active": "var(--surface-elevated)",
		border: "var(--border-subtle)",
	},
	// ── Shell ────────────────────────────────────────────────────────────────
	"app-shell": {
		bg: "var(--surface-primary)",
		"bg-start": "var(--color-void-950)",
		"bg-end": "var(--color-obsidian-950)",
		"frame-border": "var(--border-soft)",
		"frame-bevel": "var(--depth-panel)",
	},
	"top-bar": {
		bg: "var(--surface-primary)",
		border: "var(--border-subtle)",
		"search-bg": "var(--surface-overlay)",
	},
	"status-bar": {
		bg: "var(--surface-primary)",
		border: "var(--border-subtle)",
	},

	// ── Chat ─────────────────────────────────────────────────────────────────
	"chat-frame": {
		bg: "var(--surface-overlay)",
		"bg-start": "var(--color-void-950)",
		"bg-end": "var(--color-obsidian-950)",
		border: "var(--border-soft)",
		"idle-opacity": "0.35",
		"engaged-opacity": "1",
	},
	"chat-topbar": {
		bg: "var(--surface-primary)",
		border: "var(--border-subtle)",
		"tab-active": "var(--color-teal-400)",
		"tab-hover": "var(--surface-elevated)",
	},
	"chat-dashboard": {
		bg: "var(--surface-primary)",
		"message-user-bg": "var(--surface-elevated)",
		"message-ai-bg": "var(--surface-overlay)",
		"message-system-bg": "var(--surface-muted)",
	},
	"chat-footer": {
		bg: "var(--surface-primary)",
		border: "var(--border-subtle)",
		"input-bg": "var(--surface-overlay)",
		"voice-active": "var(--color-teal-400)",
	},
	"chat-context-panel": {
		bg: "var(--surface-primary)",
		"node-color": "var(--color-teal-400)",
		"edge-color": "var(--color-teal-700)",
		"label-color": "var(--text-muted)",
	},
	"chat-status": {
		"thinking-color": "var(--color-teal-400)",
		"connected-color": "var(--color-teal-500)",
		"disconnected-color": "var(--color-ember-400)",
	},
	"chat-mode-selector": {
		"mode-developer": "var(--color-teal-400)",
		"mode-planning": "var(--color-purple-400)",
		"mode-image": "var(--color-ember-400)",
		"mode-general": "var(--text-muted)",
	},

	// ── Widgets (Dashboard) ──────────────────────────────────────────────────
	widget: {
		bg: "var(--surface-primary)",
		border: "var(--border-soft)",
		"header-bg": "var(--surface-elevated)",
		"header-border": "var(--border-subtle)",
		"title-color": "var(--text-link)",
		"tab-hover": "var(--text-link)",
		divider: "var(--border-subtle)",
	},
	gauge: {
		bg: "var(--surface-primary)",
		"ring-stroke": "var(--color-teal-500)",
		"ring-track": "var(--surface-muted)",
		"label-color": "var(--text-secondary)",
		"value-color": "var(--text-primary)",
	},
	chart: {
		bg: "var(--surface-primary)",
		"grid-color": "var(--border-subtle)",
		"line-primary": "var(--color-teal-400)",
		"line-secondary": "var(--color-purple-400)",
		"line-accent": "var(--color-ember-400)",
	},

	// ── Accent Color Maps (SVG widgets) ─────────────────────────────────────
	// Per-accent main/glow/fill for sparklines, gauges, and dashboard stats.
	// Structured as accent-{color}-{role}. Consumed by SVG stroke/fill attributes.
	"accent-teal": {
		main: "var(--color-teal-400)",
		glow: "oklch(from var(--color-teal-500) l c h / 0.5)",
		fill: "oklch(from var(--color-teal-500) l c h / 0.15)",
	},
	"accent-purple": {
		main: "var(--color-purple-400)",
		glow: "oklch(from var(--color-purple-500) l c h / 0.5)",
		fill: "oklch(from var(--color-purple-500) l c h / 0.15)",
	},
	"accent-magenta": {
		main: "var(--color-magenta-400)",
		glow: "oklch(from var(--color-magenta-500) l c h / 0.5)",
		fill: "oklch(from var(--color-magenta-500) l c h / 0.15)",
	},
	"accent-ember": {
		main: "var(--color-ember-400)",
		glow: "oklch(from var(--color-ember-500) l c h / 0.5)",
		fill: "oklch(from var(--color-ember-500) l c h / 0.15)",
	},
	"accent-frost": {
		main: "var(--color-frost-400)",
		glow: "oklch(from var(--color-frost-500) l c h / 0.5)",
		fill: "oklch(from var(--color-frost-500) l c h / 0.15)",
	},
	"accent-cyber": {
		main: "var(--color-cyber-400, oklch(0.64 0.16 160))",
		glow: "oklch(0.55 0.18 160 / 0.5)",
		fill: "oklch(0.55 0.18 160 / 0.15)",
	},

	// SVG structural tokens
	"svg-track": {
		stroke: "var(--interaction-hover)",
		"tick-stroke": "var(--interaction-selected)",
	},
	"text-glow": {
		sm: "0 0 8px",
		md: "0 0 12px",
	},

	// ── VPB (Visual Property Board — dev debug tool) ─────────────────────────
	// VPB dogfoods ColdLight. Every color comes through tokens.
	vpb: {
		bg: "oklch(0.08 0.02 220 / 0.95)",
		"panel-bg": "oklch(0.1 0.02 220 / 0.9)",
		border: "var(--border-divider)",
		"border-faint": "var(--border-divider-faint)",
		"label-color": "var(--text-muted)",
		"label-dim": "var(--color-neutral-500)",
		"value-color": "var(--text-secondary)",
		"text-bright": "var(--text-primary)",
		"text-dim": "var(--color-neutral-600)",
		"btn-bg": "var(--interaction-hover)",
		"btn-border": "var(--border-divider)",
		"btn-hover": "oklch(1 0 0 / 0.08)",
		"btn-active-bg": "oklch(0.5 0.15 180 / 0.2)",
		"btn-active-border": "oklch(0.6 0.15 180 / 0.4)",
		"btn-active-color": "var(--color-teal-300)",
		"accent-teal": "var(--color-teal-600)",
		"accent-teal-bright": "var(--color-teal-300)",
		"accent-ember": "oklch(0.8 0.2 60)",
		"accent-warning": "oklch(0.7 0.08 20)",
		"swatch-bg": "var(--interaction-hover)",
		"swatch-hover-border": "var(--interaction-selected)",
		"swatch-active-border": "var(--text-primary)",
		"tick-color": "var(--color-neutral-500)",
		"tick-active": "var(--color-teal-700)",
		"slider-accent": "var(--color-teal-600)",
		"tag-teal-bg": "oklch(0.5 0.12 180 / 0.2)",
		"tag-teal-color": "var(--color-teal-300)",
		"tag-teal-border": "oklch(0.5 0.12 180 / 0.3)",
		"tag-ember-bg": "oklch(0.5 0.15 20 / 0.1)",
		"tag-ember-color": "oklch(0.75 0.12 20)",
		"tag-ember-border": "oklch(0.5 0.15 20 / 0.3)",
		"tag-purple-bg": "oklch(0.5 0.1 290 / 0.15)",
		"tag-purple-color": "oklch(0.7 0.1 290)",
		"tag-gold-bg": "oklch(0.5 0.15 60 / 0.15)",
		"tag-gold-color": "oklch(0.7 0.12 60)",
		"tag-neutral-bg": "var(--interaction-hover)",
		"tag-neutral-color": "var(--text-muted)",
		"tag-green-bg": "oklch(0.5 0.1 150 / 0.15)",
		"tag-green-border": "oklch(0.5 0.1 150 / 0.25)",
		"tag-green-color": "oklch(0.75 0.08 150)",
		"code-bg": "oklch(1 0 0 / 0.08)",
		"code-border": "oklch(1 0 0 / 0.12)",
		"code-color": "var(--color-teal-300)",
		"encoding-teal": "var(--color-teal-300)",
		"encoding-purple": "oklch(0.6 0.06 280)",
		"encoding-green": "oklch(0.7 0.08 140)",
		"graph-bg": "oklch(0.06 0.01 220)",
		"graph-node-color": "oklch(0.3 0.1 180)",
		"graph-node-bg": "oklch(0.12 0.02 220 / 0.95)",
		"graph-node-border": "oklch(1 0 0 / 0.12)",
		"graph-node-hover-border": "oklch(0.5 0.1 180 / 0.4)",
		"graph-node-selected-border": "var(--color-teal-600)",
		"graph-node-selected-glow": "oklch(0.5 0.15 180 / 0.25)",
		"graph-node-kind-color": "oklch(0.85 0.08 180)",
		"graph-node-slot-color": "var(--text-muted)",
		"graph-node-type-color": "oklch(0.5 0.1 290)",
		"graph-edge-stroke": "oklch(0.4 0.1 180)",
		"graph-edge-label-color": "oklch(0.6 0.08 180)",
		"graph-edge-label-bg": "oklch(0.1 0.02 220 / 0.85)",
		"error-bg": "oklch(0.4 0.15 30 / 0.9)",
		"error-color": "oklch(0.9 0.1 50)",
		"error-border": "oklch(0.5 0.15 30 / 0.5)",
		"error-dot": "oklch(0.7 0.2 30)",
	},
} as const;
