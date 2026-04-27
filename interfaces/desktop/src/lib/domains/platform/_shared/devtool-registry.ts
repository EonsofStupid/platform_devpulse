/**
 * @file Devtool registry — single source of truth for all 21
 *       `/devtools/*` pages.
 *
 * Adding a new devtool: append one entry below. The dashboard root
 * picks it up automatically; the future `/devtools/runtimes` page
 * picks up entries with `runtime_id` set.
 *
 * Why a single registry instead of per-page meta declarations?
 *  • Layout decisions (tier, bucket) live next to one another so
 *    coverage gaps surface visually (e.g. "no devtools have
 *    `clyffy_bucket: brain` yet — that's a planning signal").
 *  • The `/devtools` dashboard, the `/devtools/runtimes` aggregation
 *    page, and any future "All Capabilities" view all read this one
 *    array — there's nothing else to keep in sync.
 *  • Each `+page.svelte` can still read its own meta via
 *    `findDevtoolMeta(DEVTOOL_REGISTRY, "<id>")` so labels/blurbs
 *    aren't duplicated.
 */

import {
	Boxes,
	BrainCircuit,
	Cpu,
	Database,
	Eye,
	FileText,
	Gauge,
	GitBranch,
	HardDrive,
	Headphones,
	LineChart,
	Mic,
	Network,
	Package,
	PlugZap,
	Radio,
	ServerCog,
	Sparkles,
	Volume2,
	Workflow,
} from "lucide-svelte";

import type { DevtoolMeta } from "./devtool-meta.js";

/**
 * The 21 routed devtools, registered in display-axis order.
 *
 * Order within this array does not affect rendering — `groupByTier`
 * sorts by tier and bucket. Keeping system → clyffy → model_loader
 * here just makes the file scan-able.
 */
export const DEVTOOL_REGISTRY: DevtoolMeta[] = [
	// ── System tier ──────────────────────────────────────────
	{
		id: "cache",
		route: "/devtools/cache",
		label: "Cache",
		blurb: "In-memory KV (Moka). Capacity, TTL, hit-rate.",
		icon: HardDrive,
		tier: "system",
	},
	{
		id: "duckdb",
		route: "/devtools/duckdb",
		label: "DuckDB",
		blurb: "Analytics engine. Telemetry spans, OLAP queries.",
		icon: LineChart,
		tier: "system",
	},
	{
		id: "libsql",
		route: "/devtools/libsql",
		label: "LibSQL",
		blurb: "System + User relational stores. WAL, schema, queries.",
		icon: Database,
		tier: "system",
	},
	{
		id: "mongodb",
		route: "/devtools/mongodb",
		label: "MongoDB",
		blurb: "Document store for docs + images via GridFS.",
		icon: FileText,
		tier: "system",
		status: "planned",
	},
	{
		id: "project_db",
		route: "/devtools/project_db",
		label: "Project DB",
		blurb: "Per-project LibSQL. Lazy-loaded, on-demand.",
		icon: FileText,
		tier: "system",
	},
	{
		id: "rro",
		route: "/devtools/rro",
		label: "RRO / Vector",
		blurb: "Qdrant vector store + dense encoder.",
		icon: Workflow,
		tier: "system",
	},
	{
		id: "surreal",
		route: "/devtools/surreal",
		label: "SurrealDB",
		blurb: "Knowledge graph. 3 namespaces. HTTP :8822.",
		icon: Network,
		tier: "system",
	},
	{
		id: "surreal-sidecar",
		route: "/devtools/surreal/sidecar",
		label: "SurrealDB Process",
		blurb: "Child-process lifecycle for SurrealDB server.",
		icon: ServerCog,
		tier: "system",
	},
	{
		id: "telemetry",
		route: "/devtools/telemetry",
		label: "Telemetry",
		blurb: "OTel spans, lane baselines, exporter config.",
		icon: Gauge,
		tier: "system",
	},
	{
		id: "devforge",
		route: "/devtools/devforge",
		label: "DevForge",
		blurb: "REH server health, extensions, update channel.",
		icon: GitBranch,
		tier: "system",
	},

	// ── Clyffy tier ──────────────────────────────────────────
	// Ears
	{
		id: "stt",
		route: "/devtools/stt",
		label: "Speech-to-Text",
		blurb: "Whisper transcription with VAD.",
		icon: Mic,
		tier: "clyffy",
		clyffy_bucket: "ears",
		capability: "voice.stt",
		runtime_id: "whisper-onnx",
	},
	{
		id: "sherpa",
		route: "/devtools/sherpa",
		label: "Streaming ASR",
		blurb: "Sherpa streaming + wake-word detection.",
		icon: Radio,
		tier: "clyffy",
		clyffy_bucket: "ears",
		runtime_id: "sherpa-onnx-asr",
	},
	{
		id: "sts",
		route: "/devtools/sts",
		label: "Speech-to-Speech",
		blurb: "Cascaded loop — wake → STT → brain → TTS.",
		icon: Headphones,
		tier: "clyffy",
		// STS spans ears+brain+mouth; bucket under ears as the entry point.
		clyffy_bucket: "ears",
	},
	// Mouth
	{
		id: "tts",
		route: "/devtools/tts",
		label: "Voice Synthesis",
		blurb: "Qwen3-TTS preset speakers + zero-shot voice cloning.",
		icon: Volume2,
		tier: "clyffy",
		clyffy_bucket: "mouth",
		capability: "voice.tts",
		runtime_id: "qwen3-tts-candle",
	},
	// Eyes
	{
		id: "vision",
		route: "/devtools/vision",
		label: "Vision Encoder",
		blurb: "SigLIP2 image embeddings — 1152-dim L2.",
		icon: Eye,
		tier: "clyffy",
		clyffy_bucket: "eyes",
		capability: "vision.embedder",
		runtime_id: "siglip2-onnx",
	},
	// Memory
	{
		id: "cortex",
		route: "/devtools/cortex",
		label: "Knowledge Engine",
		blurb: "Prompt builder, memory lookup, councils.",
		icon: Sparkles,
		tier: "clyffy",
		clyffy_bucket: "memory",
		status: "planned",
	},
	// Providers
	{
		id: "claude",
		route: "/devtools/claude",
		label: "Claude Integration",
		blurb: "MCP server, subscription lane, API providers, councils.",
		icon: PlugZap,
		tier: "clyffy",
		clyffy_bucket: "providers",
	},

	// ── Model Loader tier ────────────────────────────────────
	{
		id: "models",
		route: "/devtools/models",
		label: "Slot Manager",
		blurb: "Slot assignment, downloads, VRAM budget.",
		icon: BrainCircuit,
		tier: "model_loader",
	},
	{
		id: "candle",
		route: "/devtools/candle",
		label: "Candle",
		blurb: "Native-tensor runtime. GGUF + SafeTensors.",
		icon: Cpu,
		tier: "model_loader",
		runtime_id: "candle",
	},
	{
		id: "llama_cpp_embedded",
		route: "/devtools/llama_cpp_embedded",
		label: "llama.cpp",
		blurb: "In-process GGUF runtime. Light path — CPU-friendly.",
		icon: Package,
		tier: "model_loader",
		runtime_id: "llama-cpp-2",
	},
	{
		id: "ollama",
		route: "/devtools/ollama",
		label: "Ollama",
		blurb: "Backup runtime — kept available for fallback.",
		icon: Boxes,
		tier: "model_loader",
		runtime_id: "ollama-external",
	},
];
