/**
 * @file ColdLight Token Pipeline Configuration
 * @package @devpulse/coldlight
 *
 * Configures the Style Dictionary v5 token build pipeline.
 * SD5 DRIVES the entire design system — tokens are THE foundation.
 *
 * Declares:
 * - Source files (SSOT: tokens.ts, semantic.ts, components.ts)
 * - DTCG interchange format (W3C Design Token Community Group 1.0)
 * - 3 output platforms: css, theme, types
 * - @theme namespace mappings (SSOT for Tailwind v4 integration)
 *
 * The build script reads this config — it does NOT hardcode paths or formats.
 * Config drives everything. Code serves the config.
 */

export const TOKENS = {
	/** Style Dictionary version requirement */
	sdVersion: 5,

	/** SSOT source files — canonical token definitions (3-tier architecture) */
	sources: {
		/** Tier 1: Global design tokens (OKLCH colors, spacing, radius, etc.) */
		globals: "src/lib/design/tokens/tokens.ts",
		/** Tier 2: Semantic aliases (surface, border, depth, transition) */
		semantic: "src/lib/design/tokens/semantic.ts",
		/** Tier 3: Component-scoped tokens (per-kind overrides) */
		components: "src/lib/design/tokens/components.ts",
	},

	/** DTCG interchange file — generated from sources, consumed by SD5 */
	dtcg: {
		output: "src/lib/design/tokens/tokens.json",
		/** W3C Design Token Community Group format version */
		formatVersion: "1.0",
	},

	/**
	 * SD5 output platforms — ColdLight's 3 build targets.
	 * Each platform produces one generated file.
	 * ColdLight is the sole authority — these are ColdLight's output formats.
	 */
	platforms: {
		/** CSS custom properties → :root { --token-name: value; } */
		css: {
			enabled: true,
			output: "src/lib/design/style/tokens.css",
		},

		/** Tailwind v4 @theme block → @theme { --color-*: oklch(...); } */
		theme: {
			enabled: true,
			output: "src/lib/design/style/tailwind.css",
		},

		/** TypeScript union types + runtime arrays from tokens.enums */
		types: {
			enabled: true,
			output: "src/lib/design/style/types.ts",
		},
	},

	/**
	 * @theme namespace mappings — SSOT for Tailwind v4 integration.
	 * Maps DTCG token groups → Tailwind utility namespaces.
	 * Read by the coldlight/tailwind-theme SD5 format.
	 *
	 * Tier 2 categories (surface, border, depth) are flat — no "semantic" wrapper.
	 * This matches the DTCG structure where semantic categories spread to root.
	 */
	themeMappings: {
		// ── Tier 1: Global tokens ────────────────────────────────────────────
		glass: { namespace: "color", prefix: "glass" },
		matte: { namespace: "color", prefix: "matte" },
		color: { namespace: "color", prefix: null },
		text: { namespace: "color", prefix: "text" },
		signal: { namespace: "color", prefix: "signal" },
		radius: { namespace: "radius", prefix: null },
		shadow: { namespace: "shadow", prefix: null },
		glow: { namespace: "shadow", prefix: "glow" },
		glowSpread: { namespace: "glow-spread", prefix: null },
		bevel: { namespace: "shadow", prefix: "bevel" },
		space: { namespace: "spacing", prefix: null },
		textSize: { namespace: "font-size", prefix: null },
		blur: { namespace: "blur", prefix: null },
		duration: { namespace: "transition-duration", prefix: null },
		ease: { namespace: "transition-timing-function", prefix: null },
		font: { namespace: "font", prefix: null },
		animation: { namespace: "animate", prefix: null },
		// ── Tier 2: Semantic categories (flat — no "semantic" wrapper) ────────
		surface: { namespace: "color", prefix: "surface" },
		border: { namespace: "color", prefix: "border" },
		interaction: { namespace: "color", prefix: "interaction" },
		overlay: { namespace: "color", prefix: "overlay" },
		depth: { namespace: "shadow", prefix: "depth" },
		transition: { namespace: "transition", prefix: null },
		backdrop: { namespace: "color", prefix: "backdrop" },
		scrollbar: { namespace: "color", prefix: "scrollbar" },
	},
} as const;
