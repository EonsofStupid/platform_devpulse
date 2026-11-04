/**
 * @file providers.state.test.ts
 * @module @devpulse/domains/app/providers/data-access
 * Command completion must not replace newer provider state from another window.
 */
import { expect, test, vi } from "vitest";
import type { ProvidersState, SaveConnection } from "#lib/sys/generated/bindings.js";

const mocks = vi.hoisted(() => ({
	handlers: new Map<string, (state: ProvidersState) => void>(),
	save: vi.fn(),
}));
vi.mock("#lib/sys/events/signal-fabric.js", () => ({
	signalFabric: {
		on: (kind: string, handler: (state: ProvidersState) => void) => {
			mocks.handlers.set(kind, handler);
			return () => mocks.handlers.delete(kind);
		},
	},
}));
vi.mock("./providers.service.js", () => ({
	connectionOptions: vi.fn().mockResolvedValue([]),
	saveConnection: mocks.save,
	check: vi.fn(),
	checkConnection: vi.fn(),
	checkSignedIn: vi.fn(),
	removeConnection: vi.fn(),
	testConnection: vi.fn(),
	runAction: vi.fn(),
}));

import { providersState } from "./providers.state.svelte.js";

function state(label: string): ProvidersState {
	return {
		checking: false,
		report: null,
		running: null,
		lastAction: null,
		problem: null,
		connections: {
			problem: null,
			items: [
				{
					id: "saved",
					label,
					provider: "ollama",
					endpoint: "http://localhost:12400/v1",
					revision: 1,
					hasCredential: false,
					check: null,
					textTest: null,
				},
			],
		},
	};
}
const request: SaveConnection = {
	id: "saved",
	label: "Earlier",
	provider: "ollama",
	endpoint: "http://localhost:12400/v1",
	credential: { action: "keep" },
};

test("a late save reply cannot overwrite a newer connection signal", async () => {
	let complete: ((value: ProvidersState) => void) | undefined;
	mocks.save.mockReturnValueOnce(
		new Promise<ProvidersState>((resolve) => {
			complete = resolve;
		}),
	);
	const off = providersState.start();
	try {
		mocks.handlers.get("providers")?.(state("Original"));
		const pending = providersState.saveConnection(request);
		mocks.handlers.get("providers")?.(state("Edited in another window"));
		complete?.(state("Earlier"));
		expect(await pending).toBe(true);
		expect(providersState.current?.connections?.items[0].label).toBe("Edited in another window");
		expect(providersState.busy).toBe(false);
	} finally {
		off();
	}
});

test("a refused save reports failure and preserves the last published state", async () => {
	mocks.save.mockRejectedValueOnce(new Error("Secure storage unavailable"));
	const off = providersState.start();
	try {
		mocks.handlers.get("providers")?.(state("Original"));
		expect(await providersState.saveConnection(request)).toBe(false);
		expect(providersState.current?.connections?.items[0].label).toBe("Original");
		expect(providersState.error).toBe("Secure storage unavailable");
		expect(providersState.busy).toBe(false);
	} finally {
		off();
	}
});
