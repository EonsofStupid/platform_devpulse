/** @file Hardware measurements must stop presenting stale readings after collection fails. */
import { expect, it, vi } from "vitest";
import type {
	HardwareInfo,
	HardwareMetrics,
	HardwareSnapshot,
} from "$lib/sys/generated/bindings.js";

const mocks = vi.hoisted(() => ({
	handlers: new Map<string, (snapshot: HardwareSnapshot | { phase: "ready" }) => void>(),
	fetch: vi.fn(),
	configure: vi.fn(),
}));
vi.mock("$lib/sys/events/signal-fabric.js", () => ({
	signalFabric: {
		on: (kind: string, handler: (snapshot: HardwareSnapshot | { phase: "ready" }) => void) => {
			mocks.handlers.set(kind, handler);
			return () => mocks.handlers.delete(kind);
		},
	},
}));
vi.mock("./hardware.service.js", () => ({ fetchHardwareMetrics: mocks.fetch }));
vi.mock("$lib/sys/generated/bindings.js", () => ({ commands: { autoConfigure: mocks.configure } }));
vi.mock("$lib/sys/logger.js", () => ({ logDebug: vi.fn(), logError: vi.fn(), logInfo: vi.fn() }));

import { hardwareState } from "./hardware.state.svelte.js";

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

it("clears current readings on a failed signal and recovers on a successful one", () => {
	const off = hardwareState.subscribe("test");
	try {
		const receive = mocks.handlers.get("hardware");
		expect(receive).toBeDefined();
		receive?.({ status: "available", metrics });
		expect(hardwareState.ramTotalMb).toBe(32768);
		expect(hardwareState.hasGpu).toBe(true);
		receive?.({ status: "unavailable", error: "OS counters unavailable" });
		expect(hardwareState.ramTotalMb).toBeNull();
		expect(hardwareState.vramTotalMb).toBeNull();
		expect(hardwareState.metrics).toBeNull();
		expect(hardwareState.tier).toBeNull();
		expect(hardwareState.error).toBe("OS counters unavailable");
		receive?.({ status: "available", metrics });
		expect(hardwareState.error).toBeNull();
		expect(hardwareState.vramTotalMb).toBe(16384);
	} finally {
		off();
	}
});

it("clears current readings when the initial IPC refresh fails", async () => {
	mocks.fetch.mockRejectedValueOnce(new Error("Measurements unavailable"));
	await hardwareState.refresh("test");
	expect(hardwareState.ramTotalMb).toBeNull();
	expect(hardwareState.hasSnapshot).toBe(false);
	expect(hardwareState.error).toBe("Measurements unavailable");
});

it("does not let an older IPC read overwrite a newer unavailable signal", async () => {
	let complete: ((value: HardwareInfo) => void) | undefined;
	mocks.fetch.mockReturnValueOnce(
		new Promise<HardwareInfo>((resolve) => {
			complete = resolve;
		}),
	);
	const off = hardwareState.subscribe("race test");
	try {
		const pending = hardwareState.refresh("race test");
		mocks.handlers.get("hardware")?.({ status: "unavailable", error: "New collection failed" });
		complete?.({
			...metrics,
			cpu_threads: null,
			disk_free_mb: null,
			cuda_version: null,
			nvml_available: true,
			model_dir: "fixture",
		});
		await pending;
		expect(hardwareState.error).toBe("New collection failed");
		expect(hardwareState.ramTotalMb).toBeNull();
		expect(hardwareState.metrics).toBeNull();
	} finally {
		off();
	}
});

it("reloads full hardware details after live measurements recover", async () => {
	const full: HardwareInfo = {
		...metrics,
		cpu_threads: null,
		disk_free_mb: 2048,
		cuda_version: null,
		nvml_available: true,
		model_dir: "fixture",
	};
	mocks.fetch.mockResolvedValue(full);
	mocks.configure.mockResolvedValue({ status: "ok", data: '{"tier":"high"}' });
	const off = hardwareState.subscribe("recovery test");
	try {
		mocks.handlers.get("boot")?.({ phase: "ready" });
		await expect.poll(() => hardwareState.hasSnapshot).toBe(true);
		mocks.handlers.get("hardware")?.({ status: "unavailable", error: "OS counters unavailable" });
		expect(hardwareState.diskFreeMb).toBeNull();
		mocks.handlers.get("hardware")?.({ status: "available", metrics });
		await expect.poll(() => hardwareState.diskFreeMb).toBe(2048);
		await expect.poll(() => hardwareState.tier).toBe("high");
		expect(hardwareState.error).toBeNull();
	} finally {
		off();
	}
});
