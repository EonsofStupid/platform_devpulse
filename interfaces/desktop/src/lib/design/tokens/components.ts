/**
 * @file src/lib/design/tokens/components.ts
 * @layer tokens
 *
 * Tier 3: Component Tokens — scoped to primitive kinds.
 * Values MUST reference Tier 1 or Tier 2 tokens.
 *
 * Run `pnpm ds:tokens:build` to regenerate CSS from this file.
 *
 * @since 1.1.0
 */

export const components = {
	button: {
		bg: "var(--surface-primary)",
		"bg-hover": "var(--surface-elevated)",
		border: "var(--border-subtle)",
		"border-focus": "var(--border-focus)",
	},
	panel: {
		bg: "var(--surface-primary)",
		border: "var(--border-soft)",
		depth: "var(--depth-panel)",
	},
	input: {
		bg: "var(--surface-overlay)",
		"bg-focus": "var(--surface-elevated)",
		border: "var(--border-subtle)",
		"border-focus": "var(--border-focus)",
	},
	badge: {
		bg: "var(--surface-elevated)",
		border: "var(--border-subtle)",
	},
	dialog: {
		bg: "var(--surface-overlay)",
		border: "var(--border-soft)",
		depth: "var(--depth-modal)",
	},
	tooltip: {
		bg: "var(--surface-elevated)",
		border: "var(--border-subtle)",
	},
} as const;
