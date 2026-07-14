/**
 * @file scanState — live discovery-scan rune (NO-MOCK LAW).
 * @module @devpulse/domains/app/models/feature/setup-wizard/scan-state
 *
 * Folds the REAL backend discovery stream (`clyffyDiscoveryProgress`
 * typed events from `endpoint_discovery.rs`) into a render model for
 * the ScanPanel. Every field is derived from a received event — this
 * class fabricates NOTHING: no timers, no simulated progress, no
 * optimistic states. The UI may only render attempts that happened.
 *
 * Event vocabulary (serde `tag = "kind", rename_all = "snake_case"`):
 *   `source_scanned`  — a rung finished enumerating (candidate count)
 *   `candidate_probed`— a URL was actually probed (reached: bool)
 *   `found`           — a candidate answered the capability handshake
 *   `finished`        — the ladder is done (honest totals)
 *
 * Rung truth model: a rung is `waiting` until its signal arrives;
 * `enumerated` once `source_scanned` lands; and only flips to `silent`
 * at `finished` — absence at stream-complete is truth, absence
 * mid-stream is unknown (rendered as waiting).
 */

import type { DiscoveredEndpoint, DiscoveryEvent } from "$lib/sys/generated/bindings.js";

/** Ladder order — the BACKEND's rung order; the panel renders rows in
 *  this order. Literals match `DiscoverySource`'s snake_case wire form. */
export const RUNG_ORDER = ["persisted", "configured", "localhost", "mdns", "mesh_peer"] as const;
export type RungId = (typeof RUNG_ORDER)[number];

/** Truth-state of one rung, derived ONLY from received events. */
export type RungStatus =
	| { kind: "waiting" }
	| { kind: "enumerated"; candidates: number }
	| { kind: "silent" };

/** One real probe attempt, verbatim from the wire. */
export interface ProbeLine {
	url: string;
	source: RungId;
	reached: boolean;
}

function freshRungs(): Record<RungId, RungStatus> {
	return {
		persisted: { kind: "waiting" },
		configured: { kind: "waiting" },
		localhost: { kind: "waiting" },
		mdns: { kind: "waiting" },
		mesh_peer: { kind: "waiting" },
	};
}

class ScanState {
	/** Scan lifecycle — `idle` renders nothing (the panel pops on begin). */
	phase = $state<"idle" | "searching" | "done">("idle");
	/** Per-rung truth. */
	rungs = $state<Record<RungId, RungStatus>>(freshRungs());
	/** Append-only stream of real attempts. */
	probes = $state<ProbeLine[]>([]);
	/** Verified endpoints as they materialize (dedup by url). */
	found = $state<DiscoveredEndpoint[]>([]);
	/** Honest totals — set ONLY by the `finished` event. */
	probedTotal = $state<number | null>(null);
	foundTotal = $state<number | null>(null);
	/** Real command error text, or null. */
	error = $state<string | null>(null);

	/** Reset + enter `searching`. The view calls this IMMEDIATELY
	 *  before invoking `commands.discoverClyffy()`. */
	begin(): void {
		this.phase = "searching";
		this.rungs = freshRungs();
		this.probes = [];
		this.found = [];
		this.probedTotal = null;
		this.foundTotal = null;
		this.error = null;
	}

	/** Fold ONE typed backend event into the model. */
	ingest(e: DiscoveryEvent): void {
		if (e.kind === "source_scanned") {
			this.rungs = {
				...this.rungs,
				[e.source as RungId]: { kind: "enumerated", candidates: e.candidates },
			};
		} else if (e.kind === "candidate_probed") {
			this.probes = [
				...this.probes,
				{ url: e.url, source: e.source as RungId, reached: e.reached },
			];
		} else if (e.kind === "found") {
			if (!this.found.some((f) => f.url === e.endpoint.url)) {
				this.found = [...this.found, e.endpoint];
			}
		} else if (e.kind === "finished") {
			this.foundTotal = e.found;
			this.probedTotal = e.probed;
			// Stream complete: rungs that never spoke are provably silent.
			const settled = { ...this.rungs };
			for (const rung of RUNG_ORDER) {
				if (settled[rung].kind === "waiting") {
					settled[rung] = { kind: "silent" };
				}
			}
			this.rungs = settled;
			this.phase = "done";
		}
	}

	/** The discover command returned an error — real failure, rendered. */
	fail(message: string): void {
		this.error = message;
		this.phase = "done";
	}

	/** The command's Ok payload is the authoritative final list — union
	 *  by url; streamed truth is never deleted. */
	reconcile(final: DiscoveredEndpoint[]): void {
		const merged = [...this.found];
		for (const endpoint of final) {
			if (!merged.some((f) => f.url === endpoint.url)) {
				merged.push(endpoint);
			}
		}
		this.found = merged;
	}

	/** Count of probes that answered for one rung — panel row detail. */
	answeredFor(rung: RungId): number {
		return this.probes.filter((p) => p.source === rung && p.reached).length;
	}
}

export const scanState = new ScanState();
