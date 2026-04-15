/**
 * @file Loading Content Catalog — DYK, KDROPS, T&T.
 * @module @devpulse/domains/clyffy/learning
 *
 * Layman-safe rotating content for loading spinners, model swaps,
 * download waits, and any other "please wait" surface. Three kinds:
 *
 * - **DYK** — Did You Know? One-line fun facts about AI / models /
 *   the DevPulse stack. Entertainment with a pinch of education.
 * - **KDROPS** — Knowledge Drops. Slightly longer, more substantive
 *   — real insight into how a feature works, why it's designed a
 *   certain way, what tradeoffs it makes.
 * - **T&T** — Tips & Tricks. User-actionable advice. "Press X for
 *   Y", "you can reassign models without restarting", etc.
 *
 * Content lives as a static array so Vite tree-shakes unused kinds
 * automatically. Future kernel-backed version will stream these from
 * libSQL / SurrealDB so Clyffy can adapt based on what the user is
 * doing (contextual DYK: "Did you know the model you just loaded
 * was trained on...").
 *
 * Layman-safe rule: NO kernel vocabulary in content strings. No
 * `HMM`, `BM25`, `CAG`, `reranker`, `RRF`. Use the public signal
 * vocabulary from `ip-protection.md`.
 */

/** Content kind discriminator. */
export type LoadingContentKind = "dyk" | "kdrops" | "tnt";

/** A single rotating content entry. */
export interface LoadingContentEntry {
	/** Stable id for dedupe within a session. */
	id: string;
	/** Which kind of content this is. */
	kind: LoadingContentKind;
	/** Short label shown as a chip / badge ("Did You Know", etc.). */
	label: string;
	/** The body text. Keep DYK under ~140 chars, KDROPS under ~280,
	 *  T&T under ~180. Longer content gets truncated at render. */
	content: string;
	/** Optional secondary text — example, counter-example, "learn more" pointer. */
	detail?: string;
	/** Category tags used by the contextual picker to bias selection. */
	tags?: string[];
}

// ── The catalog ─────────────────────────────────────────────────

const ENTRIES: readonly LoadingContentEntry[] = [
	// ── Did You Know? ────────────────────────────────────────
	{
		id: "dyk.gguf-mmap",
		kind: "dyk",
		label: "Did You Know?",
		content:
			"GGUF models are loaded via memory-mapping — the file stays on disk and the OS pages parts of it into RAM only as they're needed. That's how a 14GB model runs in 2GB of RAM.",
		tags: ["gguf", "memory", "internals"],
	},
	{
		id: "dyk.safetensors-safe",
		kind: "dyk",
		label: "Did You Know?",
		content:
			"The 'safe' in safetensors means the format can't execute arbitrary code on load. Older formats could ship a pickled Python payload that ran when you opened the file.",
		tags: ["safetensors", "security"],
	},
	{
		id: "dyk.quant-bits",
		kind: "dyk",
		label: "Did You Know?",
		content:
			"A Q4_K_M quantization keeps ~4 bits per weight on average, cutting a 14B model from 28GB to about 8GB — usually with less than 1% quality loss on real benchmarks.",
		tags: ["quantization", "gguf"],
	},
	{
		id: "dyk.tokens-to-words",
		kind: "dyk",
		label: "Did You Know?",
		content:
			"Modern BPE tokenizers split English at roughly 0.75 tokens per word. A 32K context window holds about 24,000 words — roughly a 100-page book.",
		tags: ["tokenizer", "context"],
	},
	{
		id: "dyk.moe-active",
		kind: "dyk",
		label: "Did You Know?",
		content:
			"Mixture-of-Experts models like Qwen3 30B-A3B have 30 billion parameters total but only activate 3 billion per token. That's why they're fast: you're running a 3B model through a 30B haystack.",
		tags: ["moe", "qwen3", "phi3"],
	},
	{
		id: "dyk.kv-cache",
		kind: "dyk",
		label: "Did You Know?",
		content:
			"Every word in the conversation so far lives in the model's working memory. That's why long conversations get slower — the model is reviewing more history with each new word it writes.",
		tags: ["context", "inference"],
	},
	{
		id: "dyk.rope",
		kind: "dyk",
		label: "Did You Know?",
		content:
			"Models remember word order using a clever rotation trick called RoPE — rotary position embeddings. Each position gets a unique phase on a high-dimensional clock.",
		tags: ["internals", "architecture"],
	},
	{
		id: "dyk.temperature",
		kind: "dyk",
		label: "Did You Know?",
		content:
			"Temperature 0 makes a model deterministic — it picks the single most likely next word every time. Temperature 1 lets it sample from its full probability distribution. Creativity knob = randomness knob.",
		tags: ["sampling", "temperature"],
	},

	// ── Knowledge Drops ──────────────────────────────────────
	{
		id: "kdrops.candle-vs-llamacpp",
		kind: "kdrops",
		label: "Knowledge Drop",
		content:
			"DevPulse runs GGUF models through Candle, a pure-Rust inference library. Candle gets you memory safety, cross-platform builds, and zero DLL hell. The tradeoff is slightly slower than a hand-tuned llama.cpp build.",
		detail: "That's why we also keep a llama.cpp FFI path — for the heaviest benchmarks.",
		tags: ["candle", "gguf", "architecture"],
	},
	{
		id: "kdrops.slots",
		kind: "kdrops",
		label: "Knowledge Drop",
		content:
			"Slots are DevPulse's abstraction over 'which model does what'. Each slot has a role (brain, voice, minion) and a capability (chat, STT, embedding). You can swap the model behind a slot without changing the rest of the system.",
		tags: ["slots", "architecture"],
	},
	{
		id: "kdrops.minions",
		kind: "kdrops",
		label: "Knowledge Drop",
		content:
			"Minions are small specialist models that handle low-latency tasks — memory lookup, quick classification, wake-word detection. When they hit a question too hard, they escalate to the main brain.",
		tags: ["minions", "architecture"],
	},
	{
		id: "kdrops.rro",
		kind: "kdrops",
		label: "Knowledge Drop",
		content:
			"RRO is DevPulse's context engine — the thing that decides what memories, files, and past conversations should be in front of the model when it answers you. It runs in the background while you type.",
		tags: ["rro", "context"],
	},
	{
		id: "kdrops.vram-budget",
		kind: "kdrops",
		label: "Knowledge Drop",
		content:
			"DevPulse plans VRAM across every loaded slot as a single shared budget. Loading a new model can unload an idle one automatically if the new one doesn't fit. The planner aims for 10% headroom so nothing OOMs at the boundary.",
		tags: ["vram", "scheduling"],
	},
	{
		id: "kdrops.sts-pipeline",
		kind: "kdrops",
		label: "Knowledge Drop",
		content:
			"The Speech-to-Speech pipeline chains four slots: wake word → streaming transcription → the brain → voice synthesis. Each arrow is an internal message channel, so the whole thing is composable and inspectable.",
		tags: ["sts", "voice", "architecture"],
	},

	// ── Tips & Tricks ────────────────────────────────────────
	{
		id: "tnt.sidebar-toggle",
		kind: "tnt",
		label: "Tip",
		content: "Click the hamburger menu or press Ctrl+B to toggle the sidebar.",
		tags: ["ui", "shortcuts"],
	},
	{
		id: "tnt.devtools-shortcut",
		kind: "tnt",
		label: "Tip",
		content:
			"Ctrl+Shift+Z opens the DevTools panel — config inspector, lane tracing, and the model control window.",
		tags: ["ui", "shortcuts", "devtools"],
	},
	{
		id: "tnt.hot-swap",
		kind: "tnt",
		label: "Tip",
		content:
			"You can swap a slot's model at runtime without restarting. DevPulse blocks inference to that slot during the swap and emits progress events — the UI shows you what's happening.",
		tags: ["slots", "workflow"],
	},
	{
		id: "tnt.wake-word",
		kind: "tnt",
		label: "Tip",
		content:
			"When the 24/7 voice mode is on, the wake word is always running in the background on the CPU. It uses less than 50MB of memory and about 1% of a CPU core — you won't notice it.",
		tags: ["sts", "voice"],
	},
	{
		id: "tnt.gguf-recommend",
		kind: "tnt",
		label: "Tip",
		content:
			"If a safetensors model isn't loading, check the same repo on HuggingFace for a GGUF version — DevPulse's GGUF path covers more architectures than the safetensors path.",
		tags: ["gguf", "safetensors", "troubleshooting"],
	},
	{
		id: "tnt.auto-config",
		kind: "tnt",
		label: "Tip",
		content:
			"The first-run wizard auto-configures model sizes based on your hardware tier. You can manually switch tiers anytime in Settings → Models.",
		tags: ["setup", "hardware"],
	},
];

/** Read-only catalog accessor. */
export function allEntries(): readonly LoadingContentEntry[] {
	return ENTRIES;
}

/** Subset by kind. */
export function entriesByKind(kind: LoadingContentKind): LoadingContentEntry[] {
	return ENTRIES.filter((e) => e.kind === kind);
}

/** Subset by tag (any overlap). */
export function entriesByTag(tag: string): LoadingContentEntry[] {
	return ENTRIES.filter((e) => e.tags?.includes(tag));
}

/** Lookup by id. */
export function entryById(id: string): LoadingContentEntry | undefined {
	return ENTRIES.find((e) => e.id === id);
}
