/**
 * Per-devtool accent registry — maps each route slug under
 * `/devtools/<slug>/` to a ColdLight brand-accent name.
 *
 * The brand-accent names mirror the semantic-accent tokens authored in
 * [`tokens/src/semantic/accent/accent.tokens.json`] — every name listed
 * in [`BrandAccent`] is guaranteed to have a matching `--accent-{name}-{main,glow,fill}`
 * CSS variable triplet at runtime.
 *
 * # Why a registry, not per-page literals
 *
 * Devtools all share the same chrome ([`ServiceDevtoolShell`]); the
 * only thing that should differ in their look is *which* accent paints
 * the active-tab underline, the icon, and the badge. Storing the
 * mapping in one file means a visual editor (or a stylesheet refresh)
 * can rebind the whole devtools surface without touching 21 route
 * files.
 *
 * # How a route page uses it
 *
 * ```svelte
 * <script lang="ts">
 *   import { ServiceDevtoolShell, SERVICE_ACCENTS } from
 *     "$lib/domains/platform/_shared/index.js";
 * </script>
 *
 * <ServiceDevtoolShell
 *   title="SurrealDB Sidecar"
 *   axis="stores"
 *   accent={SERVICE_ACCENTS.surreal}
 *   ...
 * />
 * ```
 *
 * Pages can also pass a literal (`accent="violet"`) — the registry is
 * the canonical source, the literal is a shortcut.
 */

/**
 * The set of ColdLight brand-accent token names. Each name resolves at
 * runtime to `--accent-{name}-main`, `--accent-{name}-glow`, and
 * `--accent-{name}-fill` CSS variables.
 *
 * Keep this list in sync with [`accent.tokens.json`].
 */
export type BrandAccent =
	| "teal"
	| "purple"
	| "magenta"
	| "ember"
	| "frost"
	| "cyber"
	| "cyan"
	| "green"
	| "hotpink"
	| "coral"
	| "blue"
	| "salmon"
	| "gold"
	| "violet"
	| "electric"
	| "azure";

/**
 * Default accent for any devtool that doesn't appear in
 * [`SERVICE_ACCENTS`]. Teal is the historical neutral.
 */
export const DEFAULT_SERVICE_ACCENT: BrandAccent = "teal";

/**
 * Devtool route-slug → ColdLight brand-accent. Slug = the directory
 * name under `interfaces/desktop/src/routes/(devtools)/devtools/`.
 *
 * # Selection rationale
 *
 * Each functional group gets a coherent palette so a screenshot of any
 * devtool reads as "data store" / "runtime" / "capability" at a glance:
 *
 * - **Stores** lean cool & jewel-toned: blue, gold, frost, cyan, violet
 * - **Runtimes** lean warm & saturated: ember, salmon, hotpink, magenta
 * - **AI capabilities** lean vivid: purple, teal, cyber, coral
 * - **Audio capabilities** lean cool/warm contrast: blue, magenta, purple
 * - **Integrations** lean signal-coloured: coral, green
 *
 * Color collisions across unrelated groups are acceptable — the eye
 * never sees them in the same view.
 */
export const SERVICE_ACCENTS = {
	// ── Stores ───────────────────────────────────────────────
	libsql: "blue",
	duckdb: "gold",
	cache: "frost",
	project_db: "cyan",
	surreal: "violet",
	mongodb: "green",

	// ── Runtimes ─────────────────────────────────────────────
	candle: "ember",
	llama_cpp_embedded: "hotpink",
	ollama: "salmon",
	devforge: "magenta",

	// ── AI capabilities ──────────────────────────────────────
	cortex: "purple",
	models: "teal",
	rro: "cyber",
	sherpa: "coral",
	vision: "salmon",

	// ── Audio capabilities ───────────────────────────────────
	stt: "blue",
	tts: "magenta",
	sts: "purple",

	// ── Integrations ─────────────────────────────────────────
	claude: "coral",
	telemetry: "green",

	// ── System ───────────────────────────────────────────────
	grammar: "gold",
} as const satisfies Record<string, BrandAccent>;

/**
 * Type-safe lookup helper. Falls back to [`DEFAULT_SERVICE_ACCENT`]
 * for unknown slugs (e.g. a devtool added before the registry is
 * updated).
 */
export function serviceAccent(slug: string): BrandAccent {
	const known = (SERVICE_ACCENTS as Record<string, BrandAccent>)[slug];
	return known ?? DEFAULT_SERVICE_ACCENT;
}

/**
 * Per-devtool BackgroundScene config — picks a subtly different
 * variation/intensity/speed per slug so two devtools never feel
 * visually identical, while staying family-coherent through the
 * shared accent system.
 *
 * Variations are distributed by service group:
 * - **Stores** lean `void-breathe` (deep, contemplative, data-at-rest)
 * - **Runtimes** lean `chrome-flow` (molten flow, computation in motion)
 * - **AI capabilities** lean `cosmic-galaxy` or `neural-pulse` (the
 *   "thinking" feeling)
 * - **Audio capabilities** lean `neural-pulse` (waveform breathing)
 * - **Integrations** lean `circuit-drift` (signal infrastructure)
 *
 * Intensity matches "marquee-ness" — the user's daily-driver devtools
 * (claude, vision, models) get strong; supporting ones get subtle.
 */
export interface ServiceBackdrop {
	variation: "circuit-drift" | "neural-pulse" | "void-breathe" | "chrome-flow" | "cosmic-galaxy";
	/** Subtle (0.06) / normal (0.12) / strong (0.18) — opacity scaling. */
	intensity: "subtle" | "normal" | "strong";
	/** Slow (25s) / normal (15s) / fast (8s) animation period. */
	speed: "slow" | "normal" | "fast";
}

/**
 * Default backdrop for devtools without a registry entry — `void-breathe`
 * subtle slow, matches the historical neutral feel.
 */
export const DEFAULT_SERVICE_BACKDROP: ServiceBackdrop = {
	variation: "void-breathe",
	intensity: "subtle",
	speed: "slow",
};

/**
 * Devtool route-slug → backdrop config. Same slug surface as
 * [`SERVICE_ACCENTS`] — each devtool's accent paints the dot, this
 * config paints the ambient backdrop.
 *
 * The backdrop's palette is derived automatically from the devtool's
 * accent (via [`accentToBackdropPalette`] below) so the colour family
 * stays in sync without authors maintaining two registries.
 */
export const SERVICE_BACKDROPS = {
	// ── Stores (data at rest — contemplative void) ───────────
	libsql: { variation: "void-breathe", intensity: "subtle", speed: "slow" },
	duckdb: { variation: "void-breathe", intensity: "normal", speed: "slow" },
	cache: { variation: "circuit-drift", intensity: "subtle", speed: "normal" },
	project_db: { variation: "void-breathe", intensity: "subtle", speed: "slow" },
	surreal: { variation: "cosmic-galaxy", intensity: "subtle", speed: "slow" },
	mongodb: { variation: "void-breathe", intensity: "subtle", speed: "slow" },

	// ── Runtimes (computation in motion — molten flow) ───────
	candle: { variation: "chrome-flow", intensity: "normal", speed: "normal" },
	llama_cpp_embedded: { variation: "chrome-flow", intensity: "strong", speed: "normal" },
	ollama: { variation: "chrome-flow", intensity: "subtle", speed: "normal" },
	devforge: { variation: "chrome-flow", intensity: "strong", speed: "fast" },

	// ── AI capabilities (the thinking feeling) ───────────────
	cortex: { variation: "cosmic-galaxy", intensity: "strong", speed: "slow" },
	models: { variation: "neural-pulse", intensity: "normal", speed: "normal" },
	rro: { variation: "circuit-drift", intensity: "normal", speed: "normal" },
	sherpa: { variation: "neural-pulse", intensity: "subtle", speed: "normal" },
	vision: { variation: "neural-pulse", intensity: "strong", speed: "normal" },

	// ── Audio capabilities (waveform breathing) ──────────────
	stt: { variation: "neural-pulse", intensity: "subtle", speed: "fast" },
	tts: { variation: "neural-pulse", intensity: "normal", speed: "normal" },
	sts: { variation: "cosmic-galaxy", intensity: "normal", speed: "normal" },

	// ── Integrations (signal infrastructure) ─────────────────
	claude: { variation: "cosmic-galaxy", intensity: "strong", speed: "slow" },
	telemetry: { variation: "circuit-drift", intensity: "subtle", speed: "fast" },

	// ── System ───────────────────────────────────────────────
	grammar: { variation: "chrome-flow", intensity: "subtle", speed: "slow" },
} as const satisfies Record<string, ServiceBackdrop>;

/**
 * Type-safe backdrop lookup. Falls back to [`DEFAULT_SERVICE_BACKDROP`]
 * for unknown slugs.
 */
export function serviceBackdrop(slug: string): ServiceBackdrop {
	const known = (SERVICE_BACKDROPS as Record<string, ServiceBackdrop>)[slug];
	return known ?? DEFAULT_SERVICE_BACKDROP;
}

/**
 * Map a [`BrandAccent`] to a [`Palette`] the BackgroundScene understands.
 * The accent palette is broader than the BG palette, so several accents
 * share a backdrop palette family. Keeps the colour family coherent
 * between the per-tab accent and the ambient backdrop.
 */
export function accentToBackdropPalette(
	accent: BrandAccent,
): "teal" | "purple" | "ember" | "cyber" | "frost" | "magenta" | "cosmic" {
	switch (accent) {
		case "teal":
		case "frost":
		case "cyan":
		case "azure":
		case "blue":
			return "teal";
		case "purple":
		case "violet":
		case "electric":
			return "cosmic";
		case "magenta":
		case "hotpink":
			return "magenta";
		case "ember":
		case "salmon":
		case "coral":
		case "gold":
			return "ember";
		case "cyber":
		case "green":
			return "cyber";
		default:
			return "cosmic";
	}
}

/**
 * Build the inline-style CSS-variable triplet that scopes
 * `--accent-service-{main,glow,fill}` to a brand accent. The shell
 * applies this to its root element so descendants can consume
 * `var(--accent-service-main)` without knowing the brand name.
 *
 * Returned shape is intentionally a string ready to drop into a
 * `style={...}` attribute — Svelte's inline-style escaping handles
 * the rest.
 */
export function serviceAccentStyle(accent: BrandAccent): string {
	return [
		`--accent-service-main: var(--accent-${accent}-main)`,
		`--accent-service-glow: var(--accent-${accent}-glow)`,
		`--accent-service-fill: var(--accent-${accent}-fill)`,
	].join("; ");
}
