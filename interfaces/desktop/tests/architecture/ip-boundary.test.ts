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
//
// The list below is the kernel-only vocabulary that must NEVER appear in
// frontend source. Several terms that were previously here have been
// removed because `LOCKED_DECISIONS.md` (Section H "Industry-locked
// terminology" + Section D "Council roster") promotes them to
// customer-facing names — keeping them blacklisted would force a
// rename across hundreds of UI files that intentionally use the
// product vocabulary.
//
// Removed (now customer-facing per locks):
//   Clyffy   — Council Conductor (locked decisions §D row 1, §H)
//   Cortex   — public Cortex surfaces per `project_cortex_surfaces`
//   Minion   — locked decisions §C-2 process model + §D Council seats
//   OverMind — sidebar route + hotkeys (`project_hotkeys` memory)
//   DIARY    — Fleece-the-sheep Council seat (locked decisions §D row 4)
//   VISION   — Siggy-the-Johnny-Crane Council seat (§D row 2)
//
// Kept (genuinely kernel-only — algorithms, dead sub-agent names,
// internal frame mechanics):
const LONG_TERMS = [
	// Dead / renamed sub-agent names — should not appear in any new code.
	// SCRIBE was renamed to Translator (`Fox`) per locked decisions §D;
	// the others sit in the kernel as old internal labels.
	"GUARDIAN",
	"PSYCH",
	"TEACHER",
	"SCRIBE",
	"RESEARCHER",
	"ENFORCER",
	"sub-agent",
	// Trinity is unconfirmed in the locked decisions; treat as kernel-only
	// until it earns a customer-facing entry.
	"Trinity",
	// Rumination algorithm internals (NOT the product surface, which is
	// the user-visible "Rumination" mode — those would need a separate
	// case-sensitive treatment if/when they land).
	"rumination",
	"rumination layer",
	"keystroke layer",
	"pause layer",
	"send layer",
	"latency budget",
	"KV cache warmth",
	// COSTAR+ prompt framework — kernel-only kernel prompts vocabulary.
	"COSTAR+",
	"Context-Objective-Style-Tone-Audience-Response",
	"vibe-speak",
	"engineer-speak",
	"translation layer",
	"provider-specific frame",
	"frame tuning",
	// Algorithms — internal names for retrieval / reranking machinery.
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
	"Reason Ready Object",
] as const;

// NOTE: "background layer" removed — too many false positives in CSS/SVG contexts
// where "background layer" refers to visual layers, not rumination architecture.

// Build word-boundary regexes for short terms
const SHORT_TERM_REGEXES = SHORT_TERMS.map((term) => [term, new RegExp(`\\b${term}\\b`)] as const);

// Files/paths with KNOWN kernel term usage. These are baselined — not
// ignored, just documented. Two categories live here:
//
//   1. Customer-facing product surfaces that use names locked in
//      `LOCKED_DECISIONS.md` (Section H "Industry-locked terminology"
//      and Section D "Council roster"). "Clyffy", "Cortex", "Minion",
//      "OverMind" are public per those locks; the test's blacklist
//      still flags them for legacy reasons. Reconciling the blacklist
//      with the locks is its own architectural slice — for now these
//      surfaces are listed here so they don't block CI.
//   2. Developer surfaces that are KERNEL-FACING BY DESIGN. The
//      `/devtools/` tree is locked to dev-diagnostic audience (see
//      `feedback_devtools_are_dev_diagnostics` — "audience is the dev,
//      customer never reaches /devtools/"), so kernel vocabulary there
//      is correct. Same for `lib/sys/data-access/rro/`, the bindings
//      modules that wrap kernel commands by their kernel names, and
//      `routes/+layout.svelte` which sets up the kernel-side runes the
//      whole shell depends on.
//
// New entries must cite which category they fall into in the comment
// next to them so a future cleanup pass can audit category-1 items
// without churning category-2.
const BASELINED_PATHS = [
	// Category 1: customer-facing product surfaces (locked names)
	"domains/clyffy/",
	"routes/(app)/clyffy/",
	"routes/(app)/overmind/",
	"routes/(app)/devpulse/",
	"routes/(chat)/chat/",
	// Category 1: legacy dev/demo pages that still use kernel terms
	"domains/app/devpulse/",
	"domains/app/ui-demo/",
	// Category 2: shell-wide layouts (status orb, sidebar labels)
	"layouts/app/Sidebar.svelte",
	"layouts/app/TopBar.svelte",
	"layouts/chat/components/shell/Frame.svelte",
	"routes/+layout.svelte",
	// Category 2: the entire devtools tree (dev-only audience per
	// feedback_devtools_are_dev_diagnostics) — both the routes and the
	// `lib/devtools/` source they mount.
	"routes/(devtools)/",
	"lib/devtools/",
	// Category 2: kernel-name TS bindings for Tauri commands
	"sys/bindings/devclyffy/",
	"sys/bindings/thinkclyffy/",
	"sys/bindings/sys/rro/",
	"sys/bindings/sys/vector/",
	// Category 2: kernel-facing system data-access layer
	"sys/data-access/rro/",
	"sys/cfg/maestro/",
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
