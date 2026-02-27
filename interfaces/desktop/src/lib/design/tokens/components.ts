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
} as const;
