/**
 * @file RRD phase → layman label + tone translation.
 * @module @devpulse/sys/data-access/rrd/phase-labels
 *
 * The kernel emits canonical phase identifiers (`pause_requested`,
 * `drain_complete`, `load_complete`, `validate_pass`, `swap_commit`,
 * `resume_complete`, plus failure phases) on the `platform:rrd-phase-
 * transition` channel. Those names are accurate for engineers reading
 * the daemon source, but they aren't what a dev *watching their model
 * swap in real time* wants to see.
 *
 * This module is the single seam that turns kernel phase strings into:
 * - **`label`** — short layman-friendly description ("Holding new
 *   requests…", "Loading new weights…", "New model is live")
 * - **`tone`** — semantic badge tone ("positive" | "negative" |
 *   "informative" | "neutral") — drives the existing Badge component's
 *   color, no per-call overrides needed
 * - **`subtitle`** — optional one-line context shown under the label
 *   when more detail helps; omitted when the label is self-explanatory
 *
 * ## Why this lives in TypeScript (not generated from kernel_terms.toml)
 *
 * `kernel_terms.toml` is the planned SSOT for kernel-vocabulary ↔
 * layman-label translation (see `project_cortex_surfaces.md`). That
 * pipeline (Rust SSOT → TS codegen) is a future slice. Until then this
 * file IS the SSOT for RRD phase labels — same translation map, just
 * authored in TS instead of generated from TOML. When the codegen lands,
 * this file's `PHASE_LABELS` constant gets replaced by a generated
 * import; consumers don't change.
 */

export type PhaseTone = "positive" | "negative" | "informative" | "neutral";

export interface PhaseLabel {
	/** Short layman description rendered as the badge text. */
	label: string;
	/** Semantic tone — drives the Badge component's color. */
	tone: PhaseTone;
	/** Optional one-line context shown under the label. Omitted when
	 *  the label alone tells the story. */
	subtitle?: string;
}

/**
 * Canonical kernel phase identifiers, in the order they fire on a
 * healthy swap cycle. Mirrors `kernel/rrd/src/lifecycle.rs` —
 * keep in sync when the kernel adds a new phase.
 */
export const KERNEL_PHASES = [
	"pause_requested",
	"drain_begin",
	"drain_complete",
	"drain_timeout",
	"load_complete",
	"validate_pass",
	"validate_fail",
	"swap_commit",
	"resume_complete",
	"fail",
	"ready",
] as const;

export type KernelPhase = (typeof KERNEL_PHASES)[number];

/**
 * The translation map. Every kernel phase the daemon can emit has an
 * entry — missing entries fall through to a "neutral / raw phase name"
 * default in `laymanFor` so a new kernel phase shows up readable
 * (instead of `undefined`) before this map catches up.
 */
const PHASE_LABELS: Record<KernelPhase, PhaseLabel> = {
	pause_requested: {
		label: "Holding new requests",
		tone: "informative",
		subtitle: "Letting in-flight work finish before the swap",
	},
	drain_begin: {
		label: "Finishing current thoughts",
		tone: "informative",
	},
	drain_complete: {
		label: "Reader queue cleared",
		tone: "informative",
		subtitle: "All in-flight work settled — safe to swap",
	},
	drain_timeout: {
		label: "Drain timed out — proceeding anyway",
		tone: "negative",
		subtitle: "A reader took too long to finish; the swap continues",
	},
	load_complete: {
		label: "New weights loaded into memory",
		tone: "informative",
		subtitle: "Reading the safetensors file took the most time here",
	},
	validate_pass: {
		label: "New weights pass the smoke test",
		tone: "positive",
		subtitle: "Synthetic forward pass produced finite output of the expected dimension",
	},
	validate_fail: {
		label: "New weights failed validation",
		tone: "negative",
		subtitle: "Live encoder is unchanged — the bad weights never swapped in",
	},
	swap_commit: {
		label: "New model is live",
		tone: "positive",
		subtitle: "Atomic pointer swap committed — readers see new weights from this instant",
	},
	resume_complete: {
		label: "Open for new requests",
		tone: "positive",
		subtitle: "Maintenance window closed — query traffic flowing again",
	},
	fail: {
		label: "Hot-swap failed",
		tone: "negative",
	},
	ready: {
		label: "Reasoning is ready",
		tone: "positive",
		subtitle: "Daemon constructed with initial live encoder",
	},
};

/**
 * Resolve a kernel phase string to its layman label + tone.
 *
 * Unknown phases — for example a kernel that adds a new phase before
 * this map catches up — fall through to a neutral default that renders
 * the raw phase name verbatim. That keeps the UI readable instead of
 * showing `undefined` while the translation entry is added.
 */
export function laymanFor(phase: string): PhaseLabel {
	const entry = (PHASE_LABELS as Record<string, PhaseLabel | undefined>)[phase];
	if (entry !== undefined) return entry;
	return {
		label: phase,
		tone: "neutral",
	};
}
