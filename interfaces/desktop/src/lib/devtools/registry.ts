/**
 * @file Devtool registry — single source of truth for every devtool
 *       page registered under `/devtools/`.
 *
 * # Adding a new devtool
 *
 * 1. Pick the right `(tier, bucket)` pair from
 *    [`DevtoolMeta`](./meta.ts). The route path is forced to
 *    mirror that hierarchy: `/devtools/{tier}/{bucket}/{id}`.
 * 2. Append one entry below in display order (system → clyffy →
 *    runtimes; within a tier, follow the bucket order).
 * 3. Create the route folder at
 *    `routes/(devtools)/devtools/{tier}/{bucket}/{id}/+page.svelte`
 *    and have it mount whichever `$lib/devtools/...` feature component
 *    owns the logic. Routes are thin shells; feature code lives in
 *    `lib/devtools/<tier>/<bucket>/<id>/feature/`.
 * 4. Add the per-route accent in
 *    [`serviceAccents.ts`](./_shared/serviceAccents.ts).
 * 5. The dashboard root picks up the new tile automatically via
 *    [`groupByTier`](./meta.ts).
 *
 * # Why a single registry instead of per-page meta declarations
 *
 *  • Layout decisions (tier, bucket) live next to one another so
 *    coverage gaps surface visually (e.g. "no devtools have
 *    `bucket: brain` yet — that's a planning signal").
 *  • The `/devtools` dashboard, the `/devtools/runtimes` aggregation
 *    page, and any future "All Capabilities" view read this one
 *    array — there's nothing else to keep in sync.
 *  • Each `+page.svelte` can still read its own meta via
 *    `findDevtoolMeta(DEVTOOL_REGISTRY, "<id>")` so labels/blurbs
 *    aren't duplicated.
 *
 * # Why URLs mirror tier/bucket
 *
 * `/devtools/system/datastores/turso` reads as a sentence — the
 * customer always knows where they are in the hierarchy. Renaming
 * a bucket is a registry edit + a folder rename, both deterministic.
 */

import {
	Boxes,
	Brain,
	BrainCircuit,
	Cpu,
	Database,
	Ear,
	Eye,
	FileText,
	Gauge,
	GitBranch,
	HardDrive,
	Headphones,
	LineChart,
	Mic,
	MonitorCog,
	Network,
	Package,
	PlugZap,
	Radio,
	RotateCw,
	Shield,
	Sparkles,
	Volume2,
	Workflow,
} from "lucide-svelte";

import type {
	BucketIcons,
	ClyffyBucket,
	DevtoolMeta,
	LucideIcon,
	RuntimesBucket,
	SystemBucket,
} from "./meta.js";

/**
 * Per-tier bucket icon registries.
 *
 * Co-located with the registry so adding a bucket is one file edit:
 * declare its label in [`meta.ts`], pick its icon here.
 */
export const DEVTOOL_BUCKET_ICONS: BucketIcons = {
	system: {
		datastores: Database,
		caches: HardDrive,
		observability: Gauge,
		ide: GitBranch,
	} satisfies Record<SystemBucket, LucideIcon>,
	clyffy: {
		ears: Ear,
		mouth: Volume2,
		eyes: Eye,
		memory: Sparkles,
		reasoning: Workflow,
		brain: Brain,
		governance: Shield,
		providers: PlugZap,
	} satisfies Record<ClyffyBucket, LucideIcon>,
	runtimes: {
		orchestrator: MonitorCog,
		inference: Cpu,
	} satisfies Record<RuntimesBucket, LucideIcon>,
};

/**
 * The routed devtools, registered in display order.
 *
 * Order in this array is the display order on the dashboard. Within
 * each tier, the order follows the bucket order declared in
 * [`meta.ts`].
 */
export const DEVTOOL_REGISTRY: DevtoolMeta[] = [
	// ── System / Datastores ──────────────────────────────────
	{
		id: "turso",
		tier: "system",
		bucket: "datastores",
		route: "/devtools/system/datastores/turso",
		label: "Turso",
		blurb: "Relational engine. System + user stores. WAL, schema, queries.",
		icon: Database,
	},
	{
		id: "duckdb",
		tier: "system",
		bucket: "datastores",
		route: "/devtools/system/datastores/duckdb",
		label: "DuckDB",
		blurb: "Analytical engine. Telemetry spans, OLAP queries.",
		icon: LineChart,
	},
	{
		id: "surrealdb",
		tier: "system",
		bucket: "datastores",
		route: "/devtools/system/datastores/surrealdb",
		label: "SurrealDB",
		blurb: "Multi-model engine: graph + document. HTTP :8822. Sidecar lifecycle.",
		icon: Network,
	},
	{
		id: "qdrant",
		tier: "system",
		bucket: "datastores",
		route: "/devtools/system/datastores/qdrant",
		label: "Qdrant",
		blurb: "Embedded vector store · in-process · zero latency. Cross-linked from RRO.",
		icon: Boxes,
	},
	{
		id: "mongodb",
		tier: "system",
		bucket: "datastores",
		route: "/devtools/system/datastores/mongodb",
		label: "MongoDB",
		blurb: "Document engine. Docs + images via GridFS.",
		icon: FileText,
		status: "planned",
	},
	{
		id: "project-db",
		tier: "system",
		bucket: "datastores",
		route: "/devtools/system/datastores/project-db",
		label: "Project DB",
		blurb: "Per-project Turso. Lazy-loaded, on-demand.",
		icon: FileText,
	},

	// ── System / Caches ──────────────────────────────────────
	{
		id: "moka",
		tier: "system",
		bucket: "caches",
		route: "/devtools/system/caches/moka",
		label: "Moka Cache",
		blurb: "In-memory KV. Capacity, TTL, hit-rate.",
		icon: HardDrive,
	},

	// ── System / Observability ───────────────────────────────
	{
		id: "telemetry",
		tier: "system",
		bucket: "observability",
		route: "/devtools/system/observability/telemetry",
		label: "Telemetry",
		blurb: "OTel spans, lane baselines, exporter config.",
		icon: Gauge,
	},

	// ── System / IDE ─────────────────────────────────────────
	{
		id: "devforge",
		tier: "system",
		bucket: "ide",
		route: "/devtools/system/ide/devforge",
		label: "DevForge",
		blurb: "Embedded IDE host. REH server, extensions, update channel.",
		icon: GitBranch,
	},

	// ── Clyffy / Ears ────────────────────────────────────────
	{
		id: "stt",
		tier: "clyffy",
		bucket: "ears",
		route: "/devtools/clyffy/ears/stt",
		label: "Speech-to-Text",
		blurb: "Whisper transcription with VAD.",
		icon: Mic,
		capability: "voice.stt",
		runtime_id: "whisper-onnx",
	},
	{
		id: "streaming-asr",
		tier: "clyffy",
		bucket: "ears",
		route: "/devtools/clyffy/ears/streaming-asr",
		label: "Streaming ASR",
		blurb: "Sherpa streaming + wake-word detection.",
		icon: Radio,
		runtime_id: "sherpa-onnx-asr",
	},
	{
		id: "sts",
		tier: "clyffy",
		bucket: "ears",
		route: "/devtools/clyffy/ears/sts",
		label: "Speech-to-Speech",
		blurb: "Cascaded loop — wake → STT → brain → TTS.",
		icon: Headphones,
	},

	// ── Clyffy / Mouth ───────────────────────────────────────
	{
		id: "tts",
		tier: "clyffy",
		bucket: "mouth",
		route: "/devtools/clyffy/mouth/tts",
		label: "Voice Synthesis",
		blurb: "Qwen3-TTS preset speakers + zero-shot voice cloning.",
		icon: Volume2,
		capability: "voice.tts",
		runtime_id: "qwen3-tts-candle",
	},

	// ── Clyffy / Eyes ────────────────────────────────────────
	{
		id: "vision",
		tier: "clyffy",
		bucket: "eyes",
		route: "/devtools/clyffy/eyes/vision",
		label: "Vision Encoder",
		blurb: "SigLIP2 image embeddings — 1152-dim L2.",
		icon: Eye,
		capability: "vision.embedder",
		runtime_id: "siglip2-onnx",
	},

	// ── Clyffy / Memory ──────────────────────────────────────
	{
		id: "cortex",
		tier: "clyffy",
		bucket: "memory",
		route: "/devtools/clyffy/memory/cortex",
		label: "Knowledge Engine",
		blurb: "Prompt builder, memory lookup, councils.",
		icon: Sparkles,
		status: "planned",
	},
	{
		id: "intelligence",
		tier: "clyffy",
		bucket: "memory",
		route: "/devtools/clyffy/memory/intelligence",
		label: "Memory Intelligence",
		blurb: "Embedding-indexed memory + RRO archive across project namespaces.",
		icon: BrainCircuit,
	},
	{
		id: "persona-graph",
		tier: "clyffy",
		bucket: "memory",
		route: "/devtools/clyffy/memory/persona-graph",
		label: "Persona Graph",
		blurb: "Clyffy's identity in SurrealDB namespaces. Links into the engine.",
		icon: Brain,
	},

	// ── Clyffy / Reasoning ───────────────────────────────────
	{
		id: "rro",
		tier: "clyffy",
		bucket: "reasoning",
		route: "/devtools/clyffy/reasoning/rro",
		label: "RRO Trifecta",
		blurb: "Embedder + encoder + vector store. The retrieval unit.",
		icon: Workflow,
	},
	{
		id: "rrd",
		tier: "clyffy",
		bucket: "reasoning",
		route: "/devtools/clyffy/reasoning/rrd",
		label: "RRD Daemon",
		blurb: "Hot-update lifecycle — pause, drain, swap, resume on the encoder.",
		icon: RotateCw,
	},

	// ── Clyffy / Governance ──────────────────────────────────
	{
		id: "policy",
		tier: "clyffy",
		bucket: "governance",
		route: "/devtools/clyffy/governance/policy",
		label: "Agent Policy",
		blurb: "Constrained decoding + AG-UI wire + A2UI grammar. What the agent is allowed to emit.",
		icon: Shield,
	},

	// ── Clyffy / Providers ───────────────────────────────────
	{
		id: "claude",
		tier: "clyffy",
		bucket: "providers",
		route: "/devtools/clyffy/providers/claude",
		label: "Claude Integration",
		blurb: "MCP server, subscription lane, API providers, councils.",
		icon: PlugZap,
	},

	// ── Runtimes / Orchestrator ──────────────────────────────
	{
		id: "slots",
		tier: "runtimes",
		bucket: "orchestrator",
		route: "/devtools/runtimes/orchestrator/slots",
		label: "Slot Manager",
		blurb: "Slot assignment, downloads, VRAM budget.",
		icon: BrainCircuit,
	},

	// ── Runtimes / Inference ─────────────────────────────────
	{
		id: "candle",
		tier: "runtimes",
		bucket: "inference",
		route: "/devtools/runtimes/inference/candle",
		label: "Candle",
		blurb: "Native-tensor runtime. GGUF + SafeTensors.",
		icon: Cpu,
		runtime_id: "candle",
	},
	{
		id: "llama-cpp",
		tier: "runtimes",
		bucket: "inference",
		route: "/devtools/runtimes/inference/llama-cpp",
		label: "llama.cpp",
		blurb: "In-process GGUF runtime. Light path — CPU-friendly.",
		icon: Package,
		runtime_id: "llama-cpp-2",
	},
	{
		id: "ollama",
		tier: "runtimes",
		bucket: "inference",
		route: "/devtools/runtimes/inference/ollama",
		label: "Ollama",
		blurb: "Backup runtime — kept available for fallback.",
		icon: Boxes,
		runtime_id: "ollama-external",
	},
];
