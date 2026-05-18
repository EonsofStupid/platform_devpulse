/**
 * Per-devtool accent registry — maps each devtool `id` to a ColdLight
 * brand-accent name.
 *
 * # Why a registry, not per-page literals
 *
 * Devtools all share the same chrome ([`ServiceDevtoolShell`]); the
 * only thing that should differ in their look is *which* accent paints
 * the active-tab underline, the icon, and the badge. Storing the
 * mapping in one file means a visual editor (or a stylesheet refresh)
 * can rebind the whole devtools surface without touching the route
 * files.
 *
 * # Keying
 *
 * Keys here MUST match `DevtoolMeta.id` from
 * [`registry.ts`](../registry.ts). The id is the leaf
 * folder name in the route tree (`/devtools/system/datastores/libsql`
 * → id `libsql`). Renaming a devtool means updating both files.
 *
 * # How a route page uses it
 *
 * ```svelte
 * <script lang="ts">
 *   import { ServiceDevtoolShell, SERVICE_ACCENTS } from
 *     "$lib/devtools/_shared/index.js";
 * </script>
 *
 * <ServiceDevtoolShell
 *   title="SurrealDB"
 *   axis="stores"
 *   accent={SERVICE_ACCENTS.surrealdb}
 *   backdrop="surrealdb"
 *   ...
 * />
 * ```
 *
 * Pages can also pass a literal (`accent="violet"`) — the registry is
 * the canonical source, the literal is a shortcut.
 *
 * The brand-accent names mirror the semantic-accent tokens authored
 * in [`tokens/src/semantic/accent/accent.tokens.json`] — every name
 * listed in [`BrandAccent`] is guaranteed to have a matching
 * `--accent-{name}-{main,glow,fill}` CSS variable triplet at runtime.
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
 * Devtool `id` → ColdLight brand-accent. Keys match `DevtoolMeta.id`
 * verbatim — see [`registry.ts`](../registry.ts).
 *
 * # Selection rationale
 *
 * Each tier-bucket gets a coherent palette so a screenshot of any
 * devtool reads as "datastore" / "cache" / "runtime" / "capability"
 * at a glance:
 *
 * - **System / Datastores** lean cool & jewel-toned: blue, gold, violet, green, cyan
 * - **System / Caches**     lean frost-clean: frost
 * - **System / Retrieval**  lean cyber: cyber
 * - **System / Observability** lean signal-coloured: green
 * - **System / IDE**        lean magenta
 * - **Clyffy / Ears**       lean cool/warm contrast: blue, coral, purple
 * - **Clyffy / Mouth**      lean magenta
 * - **Clyffy / Eyes**       lean salmon
 * - **Clyffy / Memory**     lean vivid: purple, violet
 * - **Clyffy / Providers**  lean coral
 * - **Runtimes**            lean warm & saturated: teal, ember, hotpink, salmon
 *
 * Color collisions across unrelated buckets are acceptable — the eye
 * never sees them in the same view.
 */
export const SERVICE_ACCENTS = {
	// ── System / Datastores ──────────────────────────────────
	libsql: "blue",
	duckdb: "gold",
	surrealdb: "violet",
	qdrant: "cyber",
	mongodb: "green",
	"project-db": "cyan",

	// ── System / Caches ──────────────────────────────────────
	moka: "frost",

	// ── System / Retrieval ───────────────────────────────────
	rro: "cyber",

	// ── System / Observability ───────────────────────────────
	telemetry: "green",

	// ── System / IDE ─────────────────────────────────────────
	devforge: "magenta",

	// ── Clyffy / Ears ────────────────────────────────────────
	stt: "blue",
	"streaming-asr": "coral",
	sts: "purple",

	// ── Clyffy / Mouth ───────────────────────────────────────
	tts: "magenta",

	// ── Clyffy / Eyes ────────────────────────────────────────
	vision: "salmon",

	// ── Clyffy / Memory ──────────────────────────────────────
	cortex: "purple",
	"persona-graph": "violet",
	intelligence: "cyber",

	// ── Clyffy / Governance ──────────────────────────────────
	policy: "electric",

	// ── Clyffy / Providers ───────────────────────────────────
	claude: "coral",

	// ── Runtimes / Orchestrator ──────────────────────────────
	slots: "teal",

	// ── Runtimes / Inference ─────────────────────────────────
	candle: "ember",
	"llama-cpp": "hotpink",
	ollama: "salmon",
} as const satisfies Record<string, BrandAccent>;

/**
 * Type-safe lookup helper. Falls back to [`DEFAULT_SERVICE_ACCENT`]
 * for unknown ids (e.g. a devtool added before the registry is
 * updated).
 */
export function serviceAccent(id: string): BrandAccent {
	const known = (SERVICE_ACCENTS as Record<string, BrandAccent>)[id];
	return known ?? DEFAULT_SERVICE_ACCENT;
}

/**
 * Per-devtool BackgroundScene config — picks a subtly different
 * variation/intensity/speed per id so two devtools never feel
 * visually identical, while staying family-coherent through the
 * shared accent system.
 *
 * Variations are distributed by bucket:
 * - **Datastores** lean `void-breathe` (deep, contemplative, data-at-rest)
 * - **Caches**     lean `circuit-drift` (fast cycles)
 * - **Retrieval**  leans `circuit-drift` (signal flow)
 * - **Runtimes**   lean `chrome-flow` (molten flow, computation in motion)
 * - **Memory / Brain** lean `cosmic-galaxy` (the "thinking" feeling)
 * - **Audio**      lean `neural-pulse` (waveform breathing)
 * - **Providers + Observability** lean signal infrastructure
 *
 * Intensity matches "marquee-ness" — daily-driver devtools (claude,
 * vision, slots) get strong; supporting ones get subtle.
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
 * Devtool `id` → backdrop config. Same id surface as
 * [`SERVICE_ACCENTS`] — each devtool's accent paints the dot, this
 * config paints the ambient backdrop.
 *
 * The backdrop's palette is derived automatically from the devtool's
 * accent (via [`accentToBackdropPalette`] below) so the colour family
 * stays in sync without authors maintaining two registries.
 */
export const SERVICE_BACKDROPS = {
	// ── Datastores (data at rest — contemplative void) ───────
	libsql: { variation: "void-breathe", intensity: "subtle", speed: "slow" },
	duckdb: { variation: "void-breathe", intensity: "normal", speed: "slow" },
	surrealdb: { variation: "cosmic-galaxy", intensity: "subtle", speed: "slow" },
	qdrant: { variation: "circuit-drift", intensity: "normal", speed: "normal" },
	mongodb: { variation: "void-breathe", intensity: "subtle", speed: "slow" },
	"project-db": { variation: "void-breathe", intensity: "subtle", speed: "slow" },

	// ── Caches (fast cycles) ─────────────────────────────────
	moka: { variation: "circuit-drift", intensity: "subtle", speed: "normal" },

	// ── Retrieval (signal flow) ──────────────────────────────
	rro: { variation: "circuit-drift", intensity: "normal", speed: "normal" },

	// ── Observability (signal infrastructure) ────────────────
	telemetry: { variation: "circuit-drift", intensity: "subtle", speed: "fast" },

	// ── IDE (molten flow) ────────────────────────────────────
	devforge: { variation: "chrome-flow", intensity: "strong", speed: "fast" },

	// ── Audio (waveform breathing) ───────────────────────────
	stt: { variation: "neural-pulse", intensity: "subtle", speed: "fast" },
	"streaming-asr": { variation: "neural-pulse", intensity: "subtle", speed: "normal" },
	sts: { variation: "cosmic-galaxy", intensity: "normal", speed: "normal" },
	tts: { variation: "neural-pulse", intensity: "normal", speed: "normal" },

	// ── Vision (waveform breathing, strong) ──────────────────
	vision: { variation: "neural-pulse", intensity: "strong", speed: "normal" },

	// ── Memory + Brain (the thinking feeling) ────────────────
	cortex: { variation: "cosmic-galaxy", intensity: "strong", speed: "slow" },
	"persona-graph": { variation: "cosmic-galaxy", intensity: "normal", speed: "slow" },

	// ── Governance (live constraint enforcement, signal flow) ─
	policy: { variation: "circuit-drift", intensity: "strong", speed: "slow" },

	// ── Providers (signal infrastructure) ────────────────────
	claude: { variation: "cosmic-galaxy", intensity: "strong", speed: "slow" },

	// ── Runtimes (computation in motion — molten flow) ───────
	slots: { variation: "neural-pulse", intensity: "normal", speed: "normal" },
	candle: { variation: "chrome-flow", intensity: "normal", speed: "normal" },
	"llama-cpp": { variation: "chrome-flow", intensity: "strong", speed: "normal" },
	ollama: { variation: "chrome-flow", intensity: "subtle", speed: "normal" },
} as const satisfies Record<string, ServiceBackdrop>;

/**
 * Type-safe backdrop lookup. Falls back to [`DEFAULT_SERVICE_BACKDROP`]
 * for unknown ids.
 */
export function serviceBackdrop(id: string): ServiceBackdrop {
	const known = (SERVICE_BACKDROPS as Record<string, ServiceBackdrop>)[id];
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
