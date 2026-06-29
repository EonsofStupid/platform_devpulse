/**
 * @file RRD encoder swap service — typed Tauri command wrapper.
 * @module @devpulse/devtools/clyffy/reasoning/rrd/data-access
 *
 * Wraps the `connectome_swap_encoder` Tauri command (authored under
 * `interfaces/desktop/src-tauri/src/commands/connectome/`). The kernel
 * routes the call through the RRD daemon's `pause → drain →
 * validate → swap → resume` protocol; phase events fire on the
 * `platform:rrd-phase-transition` channel that `rrdState` already
 * subscribes to, so the dialog renders live state without any
 * extra wiring here.
 *
 * Returned `SwapReport` carries the post-swap dimension (so the UI
 * can verify the new encoder matches the prior one's geometry), the
 * wall-clock elapsed time (drives the success Badge), and a list of
 * phase names the daemon emitted (sanity check that the protocol
 * actually fired vs being silently no-op).
 *
 * ## Pending kernel side
 *
 * The matching `connectome_swap_encoder` Tauri command + its kernel
 * implementation (`ConnectomeBurnAdapter::swap`) land together in the
 * Phase 2 batch (drop-slot + route-through-daemon). Until that
 * batch lands, clicking the dialog's "Confirm swap" surfaces a
 * "command not found" runtime error — the UI flow is fully
 * authored, only the backend wire is open. This is intentional;
 * authoring half the wire as a stub would violate the
 * `feedback_authored_code_must_be_wired` memory rule (no stubs
 * that return placeholder shapes).
 */

import { invoke } from "@tauri-apps/api/core";

/** Mirrors the Rust `SwapReport` struct on the Tauri command side. */
export interface SwapReport {
	/** Output dimension of the new encoder (e.g. 1024 for Harrier 0.6B). */
	dim: number;
	/** Total wall-clock the daemon held the maintenance window, in ms. */
	elapsed_ms: number;
	/**
	 * Phase names the daemon emitted, in order — `pause_requested`,
	 * `drain_complete`, `validate_pass`, `commit`, `resume_complete`
	 * is the canonical sequence on a healthy swap.
	 */
	phases_observed: string[];
}

/**
 * Swap the live encoder weights to the file at `weightsPath`.
 *
 * Throws if the path doesn't resolve, the validate step rejects the
 * new weights, or the daemon's drain times out. Callers should hold
 * the dialog open + render the in-flight spinner until this resolves
 * — under the hood the kernel is pausing query traffic the whole time.
 */
export async function swapEncoderWeights(weightsPath: string): Promise<SwapReport> {
	return invoke<SwapReport>("connectome_swap_encoder", { weightsPath });
}
