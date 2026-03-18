/**
 * @file Architecture test: IP boundary enforcement
 *
 * Verifies that no kernel terms from kernel_terms.toml appear
 * in the frontend source code. This catches violations that
 * slip past pre-commit hooks (e.g., --no-verify).
 *
 * Short terms (CAG, RRO, HMM, BM25) use word-boundary matching to
 * avoid false positives (e.g., "WCAG" contains "CAG", "ARROW" contains "RRO").
 *
 * Known violations in existing UI code are baselined — the test catches
 * NEW violations only. Baselined files will be fixed in SPRINT-LAUNCHER-UI
 * when the frontend is migrated to use public equivalents.
 *
 * SSOT: systems/devpulse-engine/ip/kernel_terms.toml
 */
import { type Dirent, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// Terms that need word-boundary matching (short, appear as substrings).
// These are matched with \b regex boundaries to avoid WCAG/ARROW/ERROR false positives.
const SHORT_TERMS = ["CAG", "RRO", "HMM", "BM25", "RKYV", "COSTAR"] as const;

// Multi-word and longer terms — safe for simple includes() matching.
const LONG_TERMS = [
	// Sub-agents
	"DIARY",
	"GUARDIAN",
	"PSYCH",
	"TEACHER",
	"SCRIBE",
	"VISION",
	"RESEARCHER",
	"ENFORCER",
	"sub-agent",
	"Minion",
	// Rumination
	"rumination",
	"rumination layer",
	"keystroke layer",
	"pause layer",
	"send layer",
	"latency budget",
	"KV cache warmth",
	// COSTAR+
	"COSTAR+",
	"Context-Objective-Style-Tone-Audience-Response",
	"vibe-speak",
	"engineer-speak",
	"translation layer",
	"provider-specific frame",
	"frame tuning",
	// Algorithms
	"Hidden Markov Model",
	"state transition matrix",
	"RRF fusion",
	"Reciprocal Rank Fusion",
	"Context-Augmented Generation",
	"RAG pipeline",
	"Retrieval-Augmented Generation",
	"zero-copy deserialization",
	"cross-encoder",
	"dense retrieval",
	"hybrid search",
	"reranking",
	"speculative decoding",
	"Reasoning Ready Object",
	// Architecture
	"Maestro",
	"Cortex",
	"Trinity",
	"OverMind",
] as const;

// NOTE: "background layer" removed — too many false positives in CSS/SVG contexts
// where "background layer" refers to visual layers, not rumination architecture.

// Build word-boundary regexes for short terms
const SHORT_TERM_REGEXES = SHORT_TERMS.map((term) => [term, new RegExp(`\\b${term}\\b`)] as const);

// Files/paths with KNOWN kernel term usage that will be migrated in
// SPRINT-LAUNCHER-UI. These are baselined — not ignored, just documented.
// New files must NEVER be added to this list without a sprint plan to fix them.
const BASELINED_PATHS = [
	// Frontend maestro dashboard (will be renamed to "Gus" dashboard)
	"domains/maestro/",
	"routes/(app)/maestro/",
	"routes/(app)/overmind/",
	"routes/(app)/devpulse/",
	"routes/(chat)/chat/",
	// System config (will use ip_term equivalents)
	"sys/cfg/maestro/",
	// Layout components (sidebar labels, chat frame)
	"layouts/app/Sidebar.svelte",
	"layouts/chat/components/shell/Frame.svelte",
	// Dev/demo pages (kernel-only, not shipped)
	"domains/app/devpulse/",
	"domains/app/ui-demo/",
];

// Directories and filenames to skip entirely
const SKIP = [
	"node_modules",
	".svelte-kit",
	"ip-boundary.test.ts",
	".cowlevel",
	".generated",
	"generated",
	"dist",
	"build",
	"coverage",
];

function collectFiles(dir: string, extensions: string[]): string[] {
	const results: string[] = [];
	let entries: Dirent[] | undefined;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return results;
	}
	for (const entry of entries) {
		if (SKIP.some((s) => entry.name.includes(s))) continue;
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...collectFiles(fullPath, extensions));
		} else if (extensions.some((ext) => entry.name.endsWith(ext))) {
			results.push(fullPath);
		}
	}
	return results;
}

function isBaselined(filePath: string): boolean {
	const normalized = filePath.replace(/\\/g, "/");
	return BASELINED_PATHS.some((bp) => normalized.includes(bp));
}

describe("IP Boundary — Frontend", () => {
	const srcRoot = join(import.meta.dirname ?? __dirname, "../../src");
	const files = collectFiles(srcRoot, [".ts", ".svelte"]);

	it("should not contain kernel terms in non-baselined frontend source", () => {
		const violations: Array<{
			file: string;
			line: number;
			term: string;
			text: string;
		}> = [];

		for (const file of files) {
			const relPath = relative(srcRoot, file);

			// Skip baselined files (known violations, will be fixed in later sprint)
			if (isBaselined(relPath)) continue;

			const content = readFileSync(file, "utf-8");
			const lines = content.split("\n");
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];

				// Check long terms with simple includes
				for (const term of LONG_TERMS) {
					if (line.includes(term)) {
						violations.push({
							file: relPath,
							line: i + 1,
							term,
							text: line.trim(),
						});
					}
				}

				// Check short terms with word-boundary regex
				for (const [term, regex] of SHORT_TERM_REGEXES) {
					if (regex.test(line)) {
						violations.push({
							file: relPath,
							line: i + 1,
							term,
							text: line.trim(),
						});
					}
				}
			}
		}

		if (violations.length > 0) {
			const report = violations
				.map((v) => `  ${v.file}:${v.line} — "${v.term}"\n    ${v.text}`)
				.join("\n");
			expect.fail(
				`IP BOUNDARY VIOLATION: ${violations.length} kernel term(s) found in frontend:\n${report}`,
			);
		}
	});

	it("should not have stale baseline entries", () => {
		// Each baselined path must still match at least one file in src/.
		// If a baseline no longer has matching files, it's stale and should
		// be removed — stale baselines hide the fact that a migration is done.
		const staleBaselines = BASELINED_PATHS.filter(
			(bp) => !files.some((f) => relative(srcRoot, f).replace(/\\/g, "/").includes(bp)),
		);

		if (staleBaselines.length > 0) {
			expect.fail(
				`Stale baseline entries (no matching files — remove from BASELINED_PATHS):\n${staleBaselines.map((bp) => `  - ${bp}`).join("\n")}`,
			);
		}
	});
});
