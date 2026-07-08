#!/usr/bin/env node
/**
 * Knowledge Library — MD → JSON converter.
 *
 * Reads MD files in `docs/knowledge_library/` (one per content type), parses
 * the canonical entry shape, and merges into the embedded JSON artifacts
 * under `kernel/devpulse-clyffy/src/cortex/knowledge/data/`. The kernel
 * loads these via `include_str!` at compile time, so a `cargo build` after
 * running this script picks up the new content.
 *
 * MD entry shape (canonical, per docs/knowledge_library/00_MASTER_SPEC.md):
 *
 *     ### DYK-gen-001 | history | beginner
 *     **Did you know** ... full body ...
 *     **Source:** optional citation
 *     **Tags:** comma, separated, list
 *
 * Per-type files this converter knows about:
 *   docs/knowledge_library/01_DID_YOU_KNOW.md  →  did_you_know.json   (type: dyk)
 *   docs/knowledge_library/02_KNOWLEDGE_DROPS.md → knowledge_drops.json (type: kdrop) [if present]
 *   docs/knowledge_library/03_FRUSTRATIONS.md  →  frustrations.json   (type: frust) [if present]
 *   docs/knowledge_library/04_INSIGHTS.md      →  insights.json       (type: insight) [if present]
 *   docs/knowledge_library/05_GLOSSARY.md      →  glossary.json       (type: gloss) [if present]
 *
 * General entries (`tool: null`) are appended to whatever tool-specific
 * entries already exist in the JSON. IDs are namespace-isolated:
 * MD entries use `dyk-gen-NNN`, hand-authored JSON uses `dyk-NNN`. No
 * collision between authoring sources.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const MD_DIR = resolve(ROOT, "docs", "knowledge_library");
// The engine's knowledge data is the SSOT (loader.rs include_str!s these
// files). This previously pointed at the kernel crate's pre-rename
// `cortex/` path — doubly dead: the module became `connectome/` and the
// kernel is Clyffy's (lives in the clyffyos repo, not here).
const JSON_DIR = resolve(
	ROOT,
	"systems",
	"devpulse-engine",
	"src",
	"platform",
	"knowledge",
	"data",
);

/** MD filename → (type, json filename, default category). */
const TYPE_MAP = {
	"01_DID_YOU_KNOW.md": { type: "dyk", json: "did_you_know.json" },
	"02_KNOWLEDGE_DROPS.md": { type: "kdrop", json: "knowledge_drops.json" },
	"03_FRUSTRATIONS.md": { type: "frust", json: "frustrations.json" },
	"04_INSIGHTS.md": { type: "insight", json: "insights.json" },
	"05_GLOSSARY.md": { type: "gloss", json: "glossary.json" },
};

/**
 * Parse one MD file into entry objects. Section headers map to category;
 * each entry's third header field is the tier. ID + body + tags + source
 * (optional) are required fields. Throws on malformed entries so silent
 * data loss can't happen.
 */
function parseMd(mdText, type, sourceFile) {
	const lines = mdText.split(/\r?\n/);
	const entries = [];
	let category = "general";
	let cur = null;

	const flush = () => {
		if (!cur) return;
		if (!cur.id) throw new Error(`${sourceFile}: entry missing ID`);
		if (!cur.body) throw new Error(`${sourceFile}: ${cur.id} missing body`);
		entries.push(cur);
		cur = null;
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Section header → category bucket.  Examples:
		//   "## HISTORY (12 entries)"  →  category = "history"
		//   "## CONCEPTS (20 entries)" →  category = "concepts"
		const sec = line.match(/^##\s+([A-Z][A-Z\s]*?)(?:\s*\(.*\))?\s*$/);
		if (sec) {
			flush();
			category = sec[1].trim().toLowerCase().replace(/\s+/g, "-");
			continue;
		}

		// Entry header: "### DYK-gen-001 | history | beginner"
		const hdr = line.match(/^###\s+([A-Za-z0-9_-]+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*$/);
		if (hdr) {
			flush();
			const [, id, hdrCategory, tier] = hdr;
			cur = {
				id: id.toLowerCase(),
				type,
				tool: null,
				category: hdrCategory.trim() || category,
				tier: tier.trim().toLowerCase(),
				body: "",
				source: null,
				tags: [],
			};
			continue;
		}

		if (!cur) continue;

		// Field markers must come BEFORE body accumulation — `**Source:**`
		// and `**Tags:**` would otherwise get folded into the body.
		const srcMatch = line.match(/^\*\*Source:\*\*\s+(.+)$/);
		if (srcMatch) {
			cur.source = srcMatch[1].trim();
			continue;
		}
		const tagMatch = line.match(/^\*\*Tags:\*\*\s+(.+)$/);
		if (tagMatch) {
			cur.tags = tagMatch[1]
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean);
			continue;
		}

		// Skip horizontal rules and blanks; body is everything else inside
		// the entry block.
		if (line.match(/^---+\s*$/)) continue;
		if (line.trim() === "") continue;

		cur.body += (cur.body ? " " : "") + line.trim();
	}
	flush();
	return entries;
}

/**
 * Hand-curated titles for entries that originated in the MD authoring
 * layer. Auto-synthesis on a "Did you know …" body produces choppy
 * truncations ("The term 'AI' was coined at a"); curated titles match
 * the existing 2-5 word "card title" style used by hand-authored JSON
 * entries ("What's a GGUF?", "Slots hold models").
 */
const CURATED_TITLES = {
	"dyk-gen-001": "The Dartmouth AI workshop",
	"dyk-gen-002": "The 1958 Perceptron",
	"dyk-gen-003": "Turing's 1950 Imitation Game",
	"dyk-gen-004": "Two AI winters",
	"dyk-gen-005": "Deep Blue vs Kasparov",
	"dyk-gen-006": "Backprop's four rediscoveries",
	"dyk-gen-007": "Attention Is All You Need (2017)",
	"dyk-gen-008": "From GPT-1 to GPT-4: 10,000×",
	"dyk-gen-009": "AlexNet's 2012 ImageNet upset",
	"dyk-gen-010": "Where 'robot' came from",
	"dyk-gen-011": "ELIZA, the 1966 chatbot",
	"dyk-gen-012": "LSTMs: 1997 to 2017",
	"dyk-gen-013": "What's a token?",
	"dyk-gen-014": "The context window",
	"dyk-gen-015": "What 'hallucination' means",
	"dyk-gen-016": "Temperature controls randomness",
	"dyk-gen-017": "How RAG works",
	"dyk-gen-018": "Embeddings turn text into vectors",
	"dyk-gen-019": "Chain-of-thought prompting",
	"dyk-gen-020": "Few-shot in-context learning",
	"dyk-gen-021": "Fine-tuning vs prompting",
	"dyk-gen-022": "Quantization shrinks models",
	"dyk-gen-023": "Attention scales quadratically",
	"dyk-gen-024": "LoRA: cheap fine-tuning",
	"dyk-gen-025": "Prompt injection attacks",
	"dyk-gen-026": "Mixture of experts (MoE)",
	"dyk-gen-027": "Constrained decoding",
	"dyk-gen-028": "What's the KV cache?",
	"dyk-gen-029": "Reranking with cross-encoders",
	"dyk-gen-030": "Speculative decoding",
	"dyk-gen-031": "What 'agentic' means",
	"dyk-gen-032": "Tool calling explained",
	"dyk-gen-033": "The deep-learning godfathers",
	"dyk-gen-034": "Ilya Sutskever's SSI bet",
	"dyk-gen-035": "Schmidhuber's credit war",
	"dyk-gen-036": "Karpathy's char-rnn",
	"dyk-gen-037": "Demis Hassabis at DeepMind",
	"dyk-gen-038": "The Amodeis at Anthropic",
	"dyk-gen-039": "Chollet, Keras, ARC-AGI",
	"dyk-gen-040": "LeCun's 1980s CNN",
	"dyk-gen-041": "Timnit Gebru and DAIR",
	"dyk-gen-042": "Judea Pearl on causality",
	"dyk-gen-043": "AlphaGo's Move 37",
	"dyk-gen-044": "AlphaFold solved protein folding",
	"dyk-gen-045": "GPT-3 and the scaling laws",
	"dyk-gen-046": "ChatGPT's first five days",
	"dyk-gen-047": "Stable Diffusion's open release",
};

/**
 * Strip the leading "Did you know …" / "Heads up:" / "Pro tip:" markers
 * from a body. The runtime renders its own type label ("Did You Know?")
 * above the body, so leaving the prefix in place double-prints it.
 *
 * The MD entries are written as "Did you know X? Y." — once "Did you
 * know" goes away, the first `?` is stranded mid-body. Convert that
 * first `?` to `.` so the lead sentence reads as a statement, which is
 * grammatically what it is once the question framing is stripped.
 */
function stripBodyPrefix(body) {
	const stripped = body
		.replace(/^\*\*Did you know\*\*\s*/i, "")
		.replace(/^\*\*Heads up:\*\*\s*/i, "")
		.replace(/^\*\*Pro tip:\*\*\s*/i, "")
		.replace(/^\*\*/i, "")
		.trim();
	// Convert the first stranded "?" (from the dropped "Did you know"
	// question framing) into a period.  Subsequent question marks are
	// real questions in the body and stay.
	const firstQ = stripped.indexOf("?");
	const lead = firstQ >= 0 ? stripped.slice(0, firstQ) + "." + stripped.slice(firstQ + 1) : stripped;
	// Capitalize the first alphabetic character, even if it sits inside
	// an opening quote or bracket (entries like '"prompt injection" is …'
	// otherwise stay lowercase after the prefix strip).
	return lead.replace(/^([^a-zA-Z]*)([a-z])/, (_, lead, ch) => lead + ch.toUpperCase());
}

function titleFor(id, body) {
	if (CURATED_TITLES[id]) return CURATED_TITLES[id];
	const cleaned = stripBodyPrefix(body);
	const firstSentence = cleaned.split(/[.?!]/)[0]?.trim() ?? cleaned;
	const words = firstSentence.split(/\s+/).slice(0, 8).join(" ");
	return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Convert a parsed MD entry to the runtime JSON shape. The payload shape
 * differs per type — DYK/KDrop/Frust/Insight share `{ title, body }`;
 * Glossary uses `{ term, definition }`. Default `added` is the conversion
 * date — hand-authored entries keep their original `added`.
 */
function toJson(entry) {
	const out = {
		id: entry.id,
		type: entry.type,
		tool: entry.tool,
		category: entry.category,
		tier: entry.tier,
		payload:
			entry.type === "gloss"
				? { term: entry.id, definition: stripBodyPrefix(entry.body) }
				: {
						title: titleFor(entry.id, entry.body),
						body: stripBodyPrefix(entry.body),
					},
		tags: entry.tags,
		added: new Date().toISOString().slice(0, 10),
	};
	if (entry.source) out.payload.source = entry.source;
	return out;
}

function shaOf(text) {
	return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function mergeEntries(existing, incoming) {
	// MD is authoritative for any entry it produces. Hand-authored JSON
	// entries use a separate ID namespace (`dyk-NNN` vs `dyk-gen-NNN`)
	// and never collide, so a colliding ID always means the MD has been
	// re-edited and should win — including the title.
	const byId = new Map(existing.map((e) => [e.id, e]));
	for (const e of incoming) {
		if (byId.has(e.id)) {
			// Preserve original `added` so re-runs don't tick the date.
			e.added = byId.get(e.id).added;
		}
		byId.set(e.id, e);
	}
	return [...byId.values()];
}

/**
 * Run the full convert + merge + manifest update. Returns a summary so
 * the wrapper can log a one-line audit.
 */
function build() {
	const summary = [];
	const manifestPath = resolve(JSON_DIR, "_manifest.json");
	const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

	for (const [mdName, { type, json }] of Object.entries(TYPE_MAP)) {
		const mdPath = resolve(MD_DIR, mdName);
		if (!existsSync(mdPath)) {
			summary.push(`skip  ${mdName} → ${json} (no MD file)`);
			continue;
		}
		const jsonPath = resolve(JSON_DIR, json);
		const mdText = readFileSync(mdPath, "utf8");
		const parsed = parseMd(mdText, type, mdName);
		const incoming = parsed.map(toJson);
		const existing = existsSync(jsonPath)
			? JSON.parse(readFileSync(jsonPath, "utf8"))
			: [];
		const merged = mergeEntries(existing, incoming);
		const text = `${JSON.stringify(merged, null, 2)}\n`;
		writeFileSync(jsonPath, text);
		const file = manifest.files.find((f) => f.name === json);
		if (file) {
			file.hash = shaOf(text);
			file.count = merged.length;
		}
		summary.push(
			`merge ${mdName} → ${json}  (parsed ${parsed.length}, total ${merged.length})`,
		);
	}

	manifest.version = manifest.version || "0.1.0";
	writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
	summary.push(`wrote ${manifestPath}`);
	return summary;
}

const summary = build();
for (const line of summary) console.log(line);
