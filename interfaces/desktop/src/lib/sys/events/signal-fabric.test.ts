/**
 * @file FabricLedger — revision bookkeeping for state signals.
 *
 * Covers the cases that make late windows and lagging bridges correct:
 * events always pass; state applies only newer revisions; duplicates and
 * stale values are dropped; a snapshot from a new process run resets the copy.
 */

import { describe, expect, it } from "vitest";
import type { Signal, StateSnapshot } from "$lib/sys/generated/bindings.js";
import { FabricLedger } from "./signal-fabric.js";

function systemEvent(id: string): Signal {
	return {
		header: { id, correlation_id: null, timestamp: 0, source: "System", revision: null },
		payload: { type: "system", data: { status: "Ready", message: id } },
	};
}

function stateSignal(id: string, revision: number, message: string): Signal {
	return {
		header: { id, correlation_id: null, timestamp: 0, source: "System", revision },
		payload: { type: "system", data: { status: "Ready", message } },
	};
}

function snapshot(epoch: string, signals: Signal[]): StateSnapshot {
	const revision = signals.reduce((max, s) => Math.max(max, s.header.revision ?? 0), 0);
	return { epoch, revision, signals };
}

describe("FabricLedger", () => {
	it("always delivers events and never stores them", () => {
		const ledger = new FabricLedger();
		expect(ledger.accept(systemEvent("a"))).toBe(true);
		expect(ledger.accept(systemEvent("a"))).toBe(true);
		expect(ledger.latestOf("system")).toBeUndefined();
	});

	it("applies newer state revisions and drops stale or duplicate ones", () => {
		const ledger = new FabricLedger();
		expect(ledger.accept(stateSignal("r2", 2, "two"))).toBe(true);
		expect(ledger.accept(stateSignal("r2", 2, "two"))).toBe(false);
		expect(ledger.accept(stateSignal("r1", 1, "one"))).toBe(false);
		expect(ledger.latestOf("system")?.header.id).toBe("r2");
		expect(ledger.accept(stateSignal("r5", 5, "five"))).toBe(true);
		expect(ledger.latestOf("system")?.header.id).toBe("r5");
	});

	it("drops buffered live signals that the snapshot already superseded", () => {
		const ledger = new FabricLedger();
		const delivered = ledger.acceptSnapshot(snapshot("run-1", [stateSignal("r7", 7, "seven")]));
		expect(delivered.map((s) => s.header.id)).toEqual(["r7"]);
		expect(ledger.accept(stateSignal("r6", 6, "six"))).toBe(false);
		expect(ledger.accept(stateSignal("r8", 8, "eight"))).toBe(true);
	});

	it("resets its copy when the snapshot comes from a new process run", () => {
		const ledger = new FabricLedger();
		ledger.acceptSnapshot(snapshot("run-1", [stateSignal("old", 40, "old run")]));
		const delivered = ledger.acceptSnapshot(snapshot("run-2", [stateSignal("new", 3, "new run")]));
		expect(delivered.map((s) => s.header.id)).toEqual(["new"]);
		expect(ledger.latestOf("system")?.header.id).toBe("new");
	});

	it("re-applying the same snapshot delivers nothing new", () => {
		const ledger = new FabricLedger();
		const snap = snapshot("run-1", [stateSignal("r3", 3, "three")]);
		expect(ledger.acceptSnapshot(snap)).toHaveLength(1);
		expect(ledger.acceptSnapshot(snap)).toHaveLength(0);
	});
});
