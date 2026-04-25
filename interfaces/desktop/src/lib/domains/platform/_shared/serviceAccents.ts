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
 *   accent={SERVICE_ACCENTS.surrealdb_sidecar}
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
	| "violet";

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
	surrealdb_sidecar: "violet",
	mongodb: "green",

	// ── Runtimes ─────────────────────────────────────────────
	candle: "ember",
	ollama_sidecar: "salmon",
	llama_cpp_embedded: "hotpink",
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
