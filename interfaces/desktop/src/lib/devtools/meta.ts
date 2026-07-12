/**
 * @file DevtoolMeta — canonical metadata for every `/devtools/*` page.
 *
 * # Two-axis taxonomy
 *
 * Every devtool is described on two axes:
 *
 *  • DISPLAY axis  — `tier` + `bucket` drive the dashboard groupings
 *    ("System / Clyffy / Runtimes" with each tier sub-bucketed).
 *  • RUNTIME axis  — `runtime_id` + `capability` let the future
 *    `/devtools/runtimes` aggregation page slice the same metadata
 *    against the engine's slot/runtime state.
 *
 * # Hierarchy is normalized
 *
 * Every tier is bucketed — there is no "flat" tier. The bucket name
 * is part of the route path, so the URL hierarchy mirrors the
 * dashboard hierarchy exactly:
 *
 * ```
 * /devtools/system/datastores/libsql      ← tier: system,   bucket: datastores
 * /devtools/clyffy/ears/stt               ← tier: clyffy,   bucket: ears
 * /devtools/runtimes/inference/candle     ← tier: runtimes, bucket: inference
 * ```
 *
 * # Single source of truth
 *
 * Every devtool page is registered exactly once in
 * `registry.ts`. Pages may also import their own metadata via
 * `findDevtoolMeta(DEVTOOL_REGISTRY, "<id>")` so labels/blurbs/icons
 * stay in one place rather than being duplicated in each `+page.svelte`.
 *
 * @example
 * ```ts
 * import { DEVTOOL_REGISTRY, findDevtoolMeta } from
 *   "$lib/devtools/index.js";
 * const meta = findDevtoolMeta(DEVTOOL_REGISTRY, "tts");
 * // → { id: "tts", tier: "clyffy", bucket: "mouth", … }
 * ```
 */

import type { HelpCircle } from "lucide-svelte";

/**
 * Top-tier dashboard category.
 *
 * - `system`   — platform infrastructure (datastores, caches, retrieval,
 *   observability, IDE host)
 * - `clyffy`   — the assistant's senses + cognition (ears, mouth, eyes,
 *   memory, brain, providers)
 * - `runtimes` — slot orchestrator + inference engines
 */
export type DevtoolTier = "system" | "clyffy" | "runtimes";

/**
 * System-tier bucket.
 *
 * - `datastores`    — persistent stores: relational, analytical, graph,
 *   document, vector. Survive a restart.
 * - `caches`        — ephemeral key-value memory. Eviction-tuned, OK to
 *   lose. Operationally distinct from datastores.
 * - `observability` — telemetry, lane tracing, metrics.
 * - `ide`           — embedded developer environments (DevForge).
 *
 * Retrieval (the RRO trifecta) lives under `clyffy/reasoning/`, not
 * `system/retrieval/`, because the trifecta is part of Clyffy's
 * cognitive surface — see `project_devtool_modular_layout.md`.
 */
export type SystemBucket = "datastores" | "caches" | "observability" | "ide";

/**
 * Clyffy-tier bucket — a sense or cognitive faculty of the assistant.
 *
 * - `ears`      — listening: STT, streaming ASR, speech-to-speech entry
 * - `mouth`     — speaking: TTS, voice cloning
 * - `eyes`      — seeing: vision encoders
 * - `memory`    — cortex, persona graph, knowledge lookup
 * - `reasoning` — RRO trifecta (embedder + encoder + vector store)
 *   composed as the retrieval-augmented reasoning surface
 * - `brain`     — reasoning, councils, escalation (currently empty —
 *   reserved for the brain-tier devtools as they land)
 * - `governance` — constrained decoding (llguidance) + agent↔user
 *   wire (AG-UI) + generative-UI payload schema (A2UI). The "what
 *   the agent is allowed to emit" surface, with friendly grammar
 *   authoring + Clyffy explainer.
 * - `providers` — external API providers (Claude, …)
 */
export type ClyffyBucket =
	| "ears"
	| "mouth"
	| "eyes"
	| "memory"
	| "reasoning"
	| "brain"
	| "governance"
	| "providers";

/**
 * Runtimes-tier bucket.
 *
 * - `orchestrator` — slot manager: the system that routes models to
 *   runtimes, governs VRAM, swaps capabilities.
 * - `inference`    — the runtimes themselves: Candle, llama.cpp, Ollama.
 */
export type RuntimesBucket = "orchestrator" | "inference";

/** Lifecycle state — `"planned"` renders the tile dashed + dimmed. */
export type DevtoolStatus = "ready" | "planned";

/**
 * The minimum prop shape we read off a lucide-svelte icon. All
 * lucide icons share the same component signature; pinning the
 * type to `typeof HelpCircle` lets the registry hold heterogeneous
 * icons without the `Component<any>` escape hatch.
 */
export type LucideIcon = typeof HelpCircle;

/**
 * Common fields shared by every tier variant of [`DevtoolMeta`].
 *
 * Tier-specific narrowing is layered on top via the discriminated
 * union below — you cannot construct a `DevtoolMeta` without picking
 * a `(tier, bucket)` pair that the type system actually permits.
 */
interface DevtoolCommon {
	/** Stable id — matches the leaf route folder name. */
	id: string;
	/** Absolute route from the dashboard root. Mirrors `tier/bucket/id`. */
	route: string;
	/** User-facing label rendered on the dashboard tile. */
	label: string;
	/** One-line blurb rendered below the label. */
	blurb: string;
	/** Lucide icon component to render on the tile. */
	icon: LucideIcon;
	/**
	 * Runtime crate / engine the devtool primarily documents. Set for
	 * pure runtime-axis devtools (candle, llama-cpp, ollama) AND for
	 * capability devtools that map 1-to-1 to a runtime
	 * (streaming-asr → sherpa-onnx-asr). Drives the
	 * `/devtools/runtimes` aggregation page.
	 */
	runtime_id?: string;
	/**
	 * Slot capability handle this devtool drives. Matches engine slot
	 * ids verbatim (`voice.stt`, `voice.tts`, `vision.embedder`,
	 * `chat.brain`). Drives the capability event channel that the
	 * engine fires on `LoaderEvent::CapabilityRebound`.
	 */
	capability?: string;
	/** Lifecycle state — `"planned"` renders dashed + dimmed. */
	status?: DevtoolStatus;
}

/**
 * Canonical devtool metadata — discriminated union by tier.
 *
 * Each tier admits a strict bucket type, so the registry cannot
 * accidentally place a Clyffy bucket on a System tile or vice versa.
 */
export type DevtoolMeta =
	| (DevtoolCommon & { tier: "system"; bucket: SystemBucket })
	| (DevtoolCommon & { tier: "clyffy"; bucket: ClyffyBucket })
	| (DevtoolCommon & { tier: "runtimes"; bucket: RuntimesBucket });

/** Union of every concrete bucket. Used by the renderer for indexing. */
export type AnyBucket = SystemBucket | ClyffyBucket | RuntimesBucket;

/**
 * Render-friendly grouping of registered devtools, produced by
 * `groupByTier(registry)`. The dashboard mounts one `<TierSection>`
 * per `TierGroup`, and inside each tier one `<BucketSection>` per
 * `BucketGroup`. The structure is uniform across tiers — no
 * special-casing the renderer per tier.
 */
export interface TierGroup {
	tier: DevtoolTier;
	label: string;
	/** Used by the rendering side to pick an accent class. */
	accent: "primary" | "secondary" | "success" | "warning" | "muted";
	/** Buckets in stable display order. */
	buckets: BucketGroup[];
}

export interface BucketGroup {
	bucket: AnyBucket;
	label: string;
	/** Lucide icon for the bucket header. */
	icon: LucideIcon;
	tiles: DevtoolMeta[];
}

const TIER_LABELS: Record<DevtoolTier, string> = {
	system: "System",
	clyffy: "Clyffy",
	runtimes: "Runtimes",
};

const TIER_ACCENT: Record<DevtoolTier, TierGroup["accent"]> = {
	system: "success",
	clyffy: "primary",
	runtimes: "warning",
};

const SYSTEM_BUCKET_LABELS: Record<SystemBucket, string> = {
	datastores: "Datastores",
	caches: "Caches",
	observability: "Observability",
	ide: "IDE",
};

const CLYFFY_BUCKET_LABELS: Record<ClyffyBucket, string> = {
	ears: "Ears",
	mouth: "Mouth",
	eyes: "Eyes",
	memory: "Memory",
	reasoning: "Reasoning",
	brain: "Brain",
	governance: "Governance",
	providers: "Providers",
};

const RUNTIMES_BUCKET_LABELS: Record<RuntimesBucket, string> = {
	orchestrator: "Orchestrator",
	inference: "Inference",
};

/** Stable display order for tiers in the dashboard. */
const TIER_ORDER: DevtoolTier[] = ["system", "clyffy", "runtimes"];

/** Stable display order for buckets within each tier. */
const SYSTEM_BUCKET_ORDER: SystemBucket[] = ["datastores", "caches", "observability", "ide"];
const CLYFFY_BUCKET_ORDER: ClyffyBucket[] = [
	"ears",
	"mouth",
	"eyes",
	"memory",
	"reasoning",
	"brain",
	"governance",
	"providers",
];
const RUNTIMES_BUCKET_ORDER: RuntimesBucket[] = ["orchestrator", "inference"];

/**
 * Per-tier bucket icon registries. Pinning icons here (not inline in
 * the registry literal) keeps `meta.ts` free of presentation
 * imports — except this one lucide barrel — and gives one place to
 * change a bucket's chrome.
 */
export interface BucketIcons {
	system: Record<SystemBucket, LucideIcon>;
	clyffy: Record<ClyffyBucket, LucideIcon>;
	runtimes: Record<RuntimesBucket, LucideIcon>;
}

/**
 * Resolve the human label for any bucket, regardless of tier.
 * Pure lookup — no runtime narrowing required at the call site.
 */
export function bucketLabel(tier: DevtoolTier, bucket: AnyBucket): string {
	switch (tier) {
		case "system":
			return SYSTEM_BUCKET_LABELS[bucket as SystemBucket];
		case "clyffy":
			return CLYFFY_BUCKET_LABELS[bucket as ClyffyBucket];
		case "runtimes":
			return RUNTIMES_BUCKET_LABELS[bucket as RuntimesBucket];
	}
}

/**
 * Group a flat registry into render-ready `TierGroup`s.
 *
 * Pure function — takes the registry and a per-tier icon map, returns
 * sorted groups + buckets. The dashboard's `$derived` block calls
 * this once per registry change.
 *
 * @param registry  Raw `DevtoolMeta[]` from `registry.ts`.
 * @param icons     Per-tier bucket icon maps. Lives outside the meta
 *   module so the meta file stays close to dependency-free.
 */
export function groupByTier(registry: DevtoolMeta[], icons: BucketIcons): TierGroup[] {
	const tierMap = new Map<DevtoolTier, TierGroup>();

	for (const tier of TIER_ORDER) {
		tierMap.set(tier, {
			tier,
			label: TIER_LABELS[tier],
			accent: TIER_ACCENT[tier],
			buckets: [],
		});
	}

	const systemByBucket = emptyBucketMap(SYSTEM_BUCKET_ORDER);
	const clyffyByBucket = emptyBucketMap(CLYFFY_BUCKET_ORDER);
	const runtimesByBucket = emptyBucketMap(RUNTIMES_BUCKET_ORDER);

	for (const meta of registry) {
		switch (meta.tier) {
			case "system":
				systemByBucket.get(meta.bucket)?.push(meta);
				break;
			case "clyffy":
				clyffyByBucket.get(meta.bucket)?.push(meta);
				break;
			case "runtimes":
				runtimesByBucket.get(meta.bucket)?.push(meta);
				break;
		}
	}

	hydrate(
		tierMap.get("system"),
		SYSTEM_BUCKET_ORDER,
		systemByBucket,
		SYSTEM_BUCKET_LABELS,
		icons.system,
	);
	hydrate(
		tierMap.get("clyffy"),
		CLYFFY_BUCKET_ORDER,
		clyffyByBucket,
		CLYFFY_BUCKET_LABELS,
		icons.clyffy,
	);
	hydrate(
		tierMap.get("runtimes"),
		RUNTIMES_BUCKET_ORDER,
		runtimesByBucket,
		RUNTIMES_BUCKET_LABELS,
		icons.runtimes,
	);

	return TIER_ORDER.map((t) => tierMap.get(t)).filter(
		(g): g is TierGroup => g !== undefined && g.buckets.length > 0,
	);
}

function emptyBucketMap<B extends string>(order: B[]): Map<B, DevtoolMeta[]> {
	const map = new Map<B, DevtoolMeta[]>();
	for (const b of order) {
		map.set(b, []);
	}
	return map;
}

function hydrate<B extends AnyBucket>(
	group: TierGroup | undefined,
	order: B[],
	tilesByBucket: Map<B, DevtoolMeta[]>,
	labels: Record<B, string>,
	icons: Record<B, LucideIcon>,
): void {
	if (!group) return;
	group.buckets = order
		.filter((b) => (tilesByBucket.get(b) ?? []).length > 0)
		.map((bucket) => ({
			bucket,
			label: labels[bucket],
			icon: icons[bucket],
			tiles: tilesByBucket.get(bucket) ?? [],
		}));
}

/**
 * Lookup helper — returns the meta for a given id, or `undefined`
 * if the id is not registered. Devtool pages use this to read their
 * own label / route / runtime_id without duplicating strings.
 */
export function findDevtoolMeta(registry: DevtoolMeta[], id: string): DevtoolMeta | undefined {
	return registry.find((m) => m.id === id);
}
