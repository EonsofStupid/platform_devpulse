/**
 * @file Kernel RRD phase string → layman label + tone, sourced from the
 *       `kernel_terms.toml` SSOT via the generated `terminology.ts`.
 * @module @devpulse/sys/data-access/rrd/phase-labels
 *
 * The platform emits `platform:rrd-phase-transition` events carrying
 * raw kernel phase strings (`pause_requested`, `drain_complete`,
 * `validate_pass`, …) — the same identifiers `kernel/rrd/src/lifecycle.rs`
 * passes into `emit_rrd_lifecycle!`. Those strings are accurate for
 * engineers reading the daemon source but unfriendly for the devtool
 * surface a vibecoder watches their model swap in.
 *
 * `kernel_terms.toml` (at `systems/devpulse-engine/ip/kernel_terms.toml`)
 * is the universal SSOT for IP-boundary term translation — it carries
 * `engine` / `prod` / `dev` triplets for each `RRD_PHASE_*`. The TOML
 * is regenerated into `interfaces/desktop/src/lib/sys/generated/
 * terminology.ts` by `pnpm generate:terminology`. This file is a thin
 * **consumer** of that generated output, not a parallel translation
 * map — it builds a reverse lookup from `kernel_phase` (e.g.
 * `pause_requested`) to the matching `Term` by parsing the `dev` field
 * (which already carries the form `"phase: <kernel_phase>"`).
 *
 * Tone (positive / negative / informative / neutral) does NOT live in
 * the SSOT — the terminology dictionary only carries text labels. Tone
 * is a presentation concern owned by this file. When a future
 * `kernel_terms.toml` schema adds a `tone` field, this file's
 * `inferTone` mapping moves into the codegen.
 */

import { TERMS, type Term } from "$lib/sys/generated/terminology.js";

export type PhaseTone = "positive" | "negative" | "informative" | "neutral";

export interface PhaseLabel {
	/** Short layman description rendered as the badge text. */
	label: string;
	/** Semantic tone — drives the Badge component's color. */
	tone: PhaseTone;
	/** Optional one-line context shown under the label. Pulled from
	 *  the term's `prod` field when it adds meaningful detail beyond
	 *  the `engine` label; omitted when both are identical. */
	subtitle?: string;
}

/**
 * Reverse lookup table: `kernel_phase` → SSOT `Term`. Built once at
 * module load by scanning every `rrd-lifecycle` entry in `TERMS` and
 * peeling the kernel phase identifier out of its `dev` field (e.g.
 * `dev: "phase: pause_requested"` → key `"pause_requested"`).
 *
 * Doing it this way means kernel_terms.toml stays the single point of
 * authorship — adding a new RRD phase only requires editing the TOML
 * and running `pnpm generate:terminology`. This file picks it up
 * without code changes.
 */
const BY_KERNEL_PHASE: Record<string, Term> = (() => {
	const map: Record<string, Term> = {};
	for (const term of Object.values(TERMS)) {
		if (term.category !== "rrd-lifecycle") continue;
		const phaseMatch = term.dev.match(/^phase:\s+(.+)$/);
		if (phaseMatch !== null) {
			map[phaseMatch[1]] = term;
		}
	}
	return map;
})();

/**
 * Tone derivation. The SSOT doesn't carry tone (a presentation concern),
 * so this function infers it from the kernel phase identifier directly.
 * The patterns are stable across the protocol — `*_pass`, `*_commit`,
 * `*_complete` always indicate forward progress; `*_fail`, `*_timeout`,
 * bare `fail` always indicate trouble.
 */
function inferTone(kernelPhase: string): PhaseTone {
	const p = kernelPhase.toLowerCase();
	if (p === "fail" || p.endsWith("_fail")) return "negative";
	if (p.endsWith("_timeout")) return "negative";
	if (p === "ready" || p.endsWith("_pass") || p.endsWith("_commit")) return "positive";
	if (p === "resume_complete") return "positive";
	if (p.endsWith("_complete")) return "informative";
	if (p.endsWith("_requested") || p.endsWith("_begin")) return "informative";
	return "neutral";
}

/**
 * Resolve a kernel phase string to its layman label + tone.
 *
 * The `label` text reads off the term's `engine` field — the IPC-
 * boundary-safe form, layman-friendly by design ("Pause requested",
 * "Switched to new memory"). The `subtitle` reads off `prod` when it
 * adds meaningful customer-mode context beyond `engine` ("Beginning
 * maintenance", "New model now active"); identical-to-engine subtitles
 * are dropped to avoid restating the same string twice.
 *
 * Unknown phases — a kernel that adds a new phase before this map
 * catches up — fall through to a neutral default that renders the raw
 * phase name. That keeps the UI readable instead of showing
 * `undefined` while `kernel_terms.toml` catches up.
 */
export function laymanFor(phase: string): PhaseLabel {
	const term = BY_KERNEL_PHASE[phase];
	if (term === undefined) {
		return { label: phase, tone: "neutral" };
	}
	const subtitle = term.prod !== "" && term.prod !== term.engine ? term.prod : undefined;
	return {
		label: term.engine,
		tone: inferTone(phase),
		subtitle,
	};
}
