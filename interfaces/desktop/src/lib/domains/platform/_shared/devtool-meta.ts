/**
 * @file DevtoolMeta — canonical metadata for every `/devtools/*` page.
 *
 * Two-axis taxonomy lives in this single struct:
 *
 *  • DISPLAY axis  — `tier` + `clyffy_bucket` drive the dashboard
 *    groupings ("System / Clyffy / Model Loader" with Clyffy
 *    further sliced by sense bucket).
 *  • RUNTIME axis  — `runtime_id` + `capability` let the future
 *    `/devtools/runtimes` aggregation page slice the same metadata
 *    against the engine's slot/runtime state.
 *
 * Single source of truth: every devtool page is registered exactly
 * once in `devtool-registry.ts`. Pages may also import their own
 * `DevtoolMeta` via `getDevtoolMeta(id)` so labels/blurbs/icons stay
 * in one place rather than being duplicated in each `+page.svelte`.
 *
 * @example
 * ```ts
 * import { getDevtoolMeta } from "$lib/domains/platform/_shared";
 * const meta = getDevtoolMeta("tts");
 * // → { id: "tts", tier: "clyffy", clyffy_bucket: "mouth", … }
 * ```
 */

import type { HelpCircle } from "lucide-svelte";

/**
 * Top-tier dashboard category. Pre-release we ship exactly three —
 * `system` (platform infrastructure), `clyffy` (the assistant's senses
 * + cognition), `model_loader` (slot manager + inference runtimes).
 */
export type DevtoolTier = "system" | "clyffy" | "model_loader";

/**
 * Sub-bucket within the Clyffy tier — represents a specific sense or
 * cognitive faculty of the assistant.
 *
 * REQUIRED when `tier === "clyffy"`. The dashboard groups Clyffy
 * pages by bucket so adding new senses (a2ui interactions, llguidance,
 * kvcache, …) is a registry edit, not a layout change.
 */
export type ClyffyBucket =
	| "ears" // listening — stt, sts, sherpa
	| "mouth" // speaking — tts, voice cloning
	| "eyes" // seeing — vision encoders
	| "brain" // reasoning, councils, escalation
	| "memory" // cortex, knowledge graph
	| "providers"; // external API providers (claude, …)

/** Lifecycle state — `"planned"` renders the tile dashed + dimmed. */
export type DevtoolStatus = "ready" | "planned";

/**
 * The minimum prop shape we read off a lucide-svelte icon. All
 * lucide icons share the same component signature; pinning the
 * type to `typeof HelpCircle` lets the registry hold heterogeneous
 * icons without the `Component<any>` escape hatch.
 */
export type LucideIcon = typeof HelpCircle;

export interface DevtoolMeta {
	/** Stable id — matches the leaf route folder name. */
	id: string;
	/** Absolute route from the dashboard root. */
	route: string;
	/** User-facing label rendered on the dashboard tile. */
	label: string;
	/** One-line blurb rendered below the label. */
	blurb: string;
	/** Lucide icon component to render on the tile. */
	icon: LucideIcon;

	/** Top-tier dashboard category. */
	tier: DevtoolTier;
	/** REQUIRED when `tier === "clyffy"`. */
	clyffy_bucket?: ClyffyBucket;
	/**
	 * Runtime crate / engine the devtool primarily documents. Set for
	 * pure runtime-axis devtools (candle, llama_cpp_embedded, ollama)
	 * AND for capability devtools that map 1-to-1 to a runtime
	 * (sherpa → sherpa-onnx-asr). Drives the future
	 * `/devtools/runtimes` aggregation page.
	 */
	runtime_id?: string;
	/**
	 * Slot capability handle this devtool drives. Matches kernel slot
	 * ids verbatim (`voice.stt`, `voice.tts`, `vision.embedder`,
	 * `chat.brain`). Drives the capability event channel that the
	 * engine fires on `LoaderEvent::CapabilityRebound`.
	 */
	capability?: string;

	/** Lifecycle state — `"planned"` renders dashed + dimmed. */
	status?: DevtoolStatus;
}

/**
 * Render-friendly grouping of registered devtools, produced by
 * `groupByTier(registry)`. The dashboard mounts one
 * `<TierSection>` per `TierGroup`, and inside the Clyffy tier one
 * `<BucketSection>` per `ClyffyBucketGroup`.
 */
export interface TierGroup {
	tier: DevtoolTier;
	label: string;
	/** Used by the rendering side to pick an accent class. */
	accent: "primary" | "secondary" | "success" | "warning" | "muted";
	/** Tiles that don't belong to a bucket — flat under the tier. */
	flat: DevtoolMeta[];
	/** Bucketed tiles — only populated for `tier === "clyffy"`. */
	buckets: ClyffyBucketGroup[];
}

export interface ClyffyBucketGroup {
	bucket: ClyffyBucket;
	label: string;
	/** Lucide icon for the bucket header. */
	icon: LucideIcon;
	tiles: DevtoolMeta[];
}

const TIER_LABELS: Record<DevtoolTier, string> = {
	system: "System",
	clyffy: "Clyffy",
	model_loader: "Model Loader",
};

const TIER_ACCENT: Record<DevtoolTier, TierGroup["accent"]> = {
	system: "success",
	clyffy: "primary",
	model_loader: "warning",
};

const BUCKET_LABELS: Record<ClyffyBucket, string> = {
	ears: "Ears",
	mouth: "Mouth",
	eyes: "Eyes",
	brain: "Brain",
	memory: "Memory",
	providers: "Providers",
};

/** Stable display order for tiers in the dashboard. */
const TIER_ORDER: DevtoolTier[] = ["clyffy", "model_loader", "system"];

/** Stable display order for buckets within Clyffy. */
const BUCKET_ORDER: ClyffyBucket[] = ["ears", "mouth", "eyes", "brain", "memory", "providers"];

/**
 * Group a flat registry into render-ready `TierGroup`s.
 *
 * Pure function — accepts the registry, returns sorted groups +
 * buckets. The dashboard's `$derived` block calls this once per
 * registry change.
 *
 * @param registry  Raw `DevtoolMeta[]` from `devtool-registry.ts`.
 * @param bucketIcons  Per-bucket icon override map. Required because
 *   we don't pin lucide icons inside this module — keeps the meta
 *   file dependency-free.
 */
export function groupByTier(
	registry: DevtoolMeta[],
	bucketIcons: Record<ClyffyBucket, LucideIcon>,
): TierGroup[] {
	const tierMap = new Map<DevtoolTier, TierGroup>();

	for (const tier of TIER_ORDER) {
		tierMap.set(tier, {
			tier,
			label: TIER_LABELS[tier],
			accent: TIER_ACCENT[tier],
			flat: [],
			buckets: [],
		});
	}

	const clyffyByBucket = new Map<ClyffyBucket, DevtoolMeta[]>();
	for (const bucket of BUCKET_ORDER) {
		clyffyByBucket.set(bucket, []);
	}

	for (const meta of registry) {
		const group = tierMap.get(meta.tier);
		if (!group) continue;
		if (meta.tier === "clyffy") {
			if (!meta.clyffy_bucket) {
				throw new Error(
					`DevtoolMeta '${meta.id}' has tier='clyffy' but no clyffy_bucket — bucket is required for Clyffy tier (see devtool-meta.ts).`,
				);
			}
			clyffyByBucket.get(meta.clyffy_bucket)?.push(meta);
		} else {
			group.flat.push(meta);
		}
	}

	const clyffy = tierMap.get("clyffy");
	if (clyffy) {
		clyffy.buckets = BUCKET_ORDER.filter((b) => (clyffyByBucket.get(b) ?? []).length > 0).map(
			(bucket) => ({
				bucket,
				label: BUCKET_LABELS[bucket],
				icon: bucketIcons[bucket],
				tiles: clyffyByBucket.get(bucket) ?? [],
			}),
		);
	}

	return TIER_ORDER.map((t) => tierMap.get(t)).filter(
		(g): g is TierGroup => g !== undefined && (g.flat.length > 0 || g.buckets.length > 0),
	);
}

/**
 * Lookup helper — returns the meta for a given id, or `undefined`
 * if the id is not registered. Devtool pages use this to read their
 * own label / route / runtime_id without duplicating strings.
 */
export function findDevtoolMeta(registry: DevtoolMeta[], id: string): DevtoolMeta | undefined {
	return registry.find((m) => m.id === id);
}
