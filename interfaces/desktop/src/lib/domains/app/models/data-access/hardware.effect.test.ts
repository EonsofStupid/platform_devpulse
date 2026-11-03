/**
 * @file Subscribing from an `$effect` must not make that effect depend on the
 * store. The fabric replays a state signal's current value during `on()`, so
 * the store's handler ran inside the subscriber's effect: `apply` read and wrote
 * `metrics` there, the effect re-ran, re-subscribed and was replayed to again,
 * until Svelte stopped the page and the app showed "DevPulse failed to start".
 * It needs a full snapshot already read and a subscriber arriving after it, so
 * it came and went. The real fabric, the real state and a real effect, here.
 */
import { flushSync } from "svelte";
import { expect, it, vi } from "vitest";
import type { HardwareMetrics, Signal } from "$lib/sys/generated/bindings.js";

const metrics: HardwareMetrics = {
	cpu_name: "Fixture CPU",
	cpu_cores: 8,
	cpu_usage_percent: 25,
	ram_total_mb: 32768,
	ram_used_mb: 8192,
	ram_available_mb: 24576,
	gpu_name: "Fixture GPU",
	gpu_error: null,
	gpu_vram_total_mb: 16384,
	gpu_vram_used_mb: 4096,
	gpu_vram_free_mb: 12288,
	gpu_utilization_percent: 10,
	gpu_temperature_c: 40,
	process_ram_mb: 256,
	process_vram_mb: 0,
};

const mocks = vi.hoisted(() => ({
	attached: [] as string[],
	fetch: vi.fn(),
	snapshot: vi.fn(),
}));

vi.mock("$lib/sys/generated/bindings.js", () => ({
	commands: {
		setSignalInterest: vi.fn().mockResolvedValue(undefined),
		getSignalState: mocks.snapshot,
		autoConfigure: vi.fn().mockResolvedValue({ status: "ok", data: "{}" }),
	},
	events: { signalBroadcast: { listen: vi.fn().mockResolvedValue(() => {}) } },
}));
vi.mock("./hardware.service.js", () => ({ fetchHardwareMetrics: mocks.fetch }));
vi.mock("$lib/sys/logger.js", () => ({
	logDebug: (_target: string, message: string) => {
		if (message.startsWith("attached")) mocks.attached.push(message);
	},
	logError: vi.fn(),
	logInfo: vi.fn(),
	logWarn: vi.fn(),
}));

import { subscribeInEffect } from "./hardware.effect.fixture.svelte.js";
import { hardwareState } from "./hardware.state.svelte.js";

function stateSignal(type: "hardware" | "boot", data: unknown, revision: number): Signal {
	return {
		header: { id: type, correlation_id: null, timestamp: 0, source: "System", revision },
		payload: { type, data },
	} as unknown as Signal;
}

it("a subscriber arriving after the full snapshot subscribes once", async () => {
	mocks.fetch.mockResolvedValue({ ...metrics, disk_free_mb: 1024 });
	mocks.snapshot.mockResolvedValue({
		epoch: "run",
		revision: 2,
		signals: [
			stateSignal("hardware", { status: "available", metrics }, 1),
			stateSignal("boot", { phase: "ready" }, 2),
		],
	});

	// The dashboard: the fabric fills up and the full snapshot is read.
	const dashboard = hardwareState.subscribe("devpulse-dashboard");
	await vi.waitFor(() => expect(hardwareState.metrics).not.toBeNull());
	await vi.waitFor(() => expect(hardwareState.loading).toBe(false));
	dashboard();
	mocks.attached.length = 0;

	// The status bar, the way it subscribes.
	const destroy = subscribeInEffect("statusbar");
	try {
		flushSync();
		expect(mocks.attached).toEqual(["attached (reason: statusbar)"]);
		expect(hardwareState.cpuUsagePercent).toBe(25);
	} finally {
		destroy();
	}
});
