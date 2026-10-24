/**
 * @file Architecture test: IP boundary, read from the term list
 *
 * The term list — `systems/devpulse-engine/ip/kernel_terms.toml` — is the
 * single source: its `enforcement` switch and its hard-severity `kernel`
 * terms. This test reads both, as the pre-commit hook
 * (`scripts/hooks/ip-boundary-check.sh`) does, and catches across the whole
 * frontend what slips past the hook (e.g. `--no-verify`).
 *
 * Owner 2026-10-19: "keep the configuration so it can be used but for now I
 * want everything public". With the switch "off" the scan reports as
 * skipped; set it "on" and every hard term is enforced again.
 *
 * A term matches where a word starts, case-sensitively, as in the hook: it
 * catches the term alone or as an identifier prefix (`RROService`), not
 * inside an unrelated word ("RRO" in "ERROR").
 *
 * Known uses in existing UI code are baselined (paths below).
 */
import { type Dirent, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "smol-toml";
import { describe, expect, it } from "vitest";

const TERMS_FILE = join(__dirname, "../../../../systems/devpulse-engine/ip/kernel_terms.toml");

type TermEntry = { kernel?: unknown; severity?: unknown };
type TermList = { enforcement?: unknown; terms?: TermEntry[] };

const termList = parse(readFileSync(TERMS_FILE, "utf8")) as TermList;
const enforced = termList.enforcement === "on";
const hardTerms = (termList.terms ?? [])
	.filter((t) => t.severity === "hard" && typeof t.kernel === "string" && t.kernel !== "")
	.map((t) => t.kernel as string);
const escapeRegex = (term: string): string => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const TERM_REGEXES = hardTerms.map(
	(term) => [term, new RegExp(`\\b${escapeRegex(term)}`)] as const,
);

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

	it("reads its switch and its terms from the term list", () => {
		expect(["on", "off"]).toContain(termList.enforcement);
		expect(hardTerms.length).toBeGreaterThan(0);
	});

	it.skipIf(!enforced)(
		"no hard term in non-baselined frontend source (enforcement on in kernel_terms.toml)",
		() => {
			const violations: Array<{ file: string; line: number; term: string; text: string }> = [];

			for (const file of files) {
				const relPath = relative(srcRoot, file);
				if (isBaselined(relPath)) continue;

				const lines = readFileSync(file, "utf-8").split("\n");
				for (let i = 0; i < lines.length; i++) {
					for (const [term, regex] of TERM_REGEXES) {
						if (regex.test(lines[i])) {
							violations.push({ file: relPath, line: i + 1, term, text: lines[i].trim() });
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
		},
	);

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
