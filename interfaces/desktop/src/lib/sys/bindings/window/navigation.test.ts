import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { resolve } from "$app/paths";
import type { RouteNode } from "$lib/sys/routing/index.js";

const mocks = vi.hoisted(() => ({
	label: "chat",
	goto: vi.fn(),
	listen: vi.fn(),
	emitTo: vi.fn(),
	emit: vi.fn(),
	open: vi.fn(),
}));
vi.mock("@tauri-apps/api/window", () => ({ getCurrentWindow: () => ({ label: mocks.label }) }));
vi.mock("@tauri-apps/api/event", () => ({
	listen: mocks.listen,
	emitTo: mocks.emitTo,
	emit: mocks.emit,
}));
vi.mock("$app/navigation", () => ({ goto: mocks.goto }));
vi.mock("$lib/sys/generated/bindings.js", () => ({ commands: { openWindow: mocks.open } }));
vi.mock("$lib/sys/routing/index.js", () => ({
	findRoute: (path: string) =>
		path === resolve("/overmind/agenthub")
			? { path, routeId: "/(app)/overmind/agenthub", hasPage: true }
			: undefined,
	hrefOf: (route: RouteNode) => route.path,
}));

import { openMainPage, startMainNavigation } from "./navigation.js";

const route = { path: resolve("/overmind/agenthub") } as RouteNode;
const detach = vi.fn();
beforeEach(() => {
	vi.resetAllMocks();
	mocks.label = "chat";
	mocks.listen.mockResolvedValue(detach);
	mocks.open.mockResolvedValue({ status: "ok" });
	mocks.emit.mockResolvedValue(undefined);
	mocks.emitTo.mockResolvedValue(undefined);
});
afterEach(() => vi.useRealTimers());

it("keeps chat in place, registers the reply first and waits for the matching main-window acknowledgement", async () => {
	const pending = openMainPage(route, "session & 1");
	await vi.waitFor(() => expect(mocks.emitTo).toHaveBeenCalledOnce());
	expect(mocks.open).toHaveBeenCalledWith("Main");
	expect(mocks.goto).not.toHaveBeenCalled();
	expect(mocks.listen.mock.invocationCallOrder[0]).toBeLessThan(
		mocks.emitTo.mock.invocationCallOrder[0],
	);
	const request = mocks.emitTo.mock.calls[0][2];
	expect(request).toMatchObject({
		path: resolve("/overmind/agenthub"),
		conversation: "session & 1",
		source: "chat",
	});
	const reply = mocks.listen.mock.calls[0][1];
	reply({ payload: { id: "unrelated", error: null } });
	expect(detach).not.toHaveBeenCalled();
	reply({ payload: { id: request.id, error: null } });
	await pending;
	expect(detach).toHaveBeenCalledTimes(2);
});

it("reports navigation failures and removes its reply listener", async () => {
	const pending = openMainPage(route);
	const rejected = expect(pending).rejects.toThrow("Page could not load");
	await vi.waitFor(() => expect(mocks.emitTo).toHaveBeenCalledOnce());
	mocks.listen.mock.calls[0][1]({
		payload: { id: mocks.emitTo.mock.calls[0][2].id, error: "Page could not load" },
	});
	await rejected;
	expect(detach).toHaveBeenCalledTimes(2);
});

it("times out without leaking a late listener or issuing a late navigation", async () => {
	vi.useFakeTimers();
	let attach!: (stop: () => void) => void;
	mocks.listen.mockImplementation(
		() =>
			new Promise((resolve) => {
				attach = resolve;
			}),
	);
	const rejected = expect(openMainPage(route)).rejects.toThrow("did not respond");
	await vi.advanceTimersByTimeAsync(10_000);
	await rejected;
	attach(detach);
	await Promise.resolve();
	expect(detach).toHaveBeenCalledOnce();
	expect(mocks.emitTo).not.toHaveBeenCalled();
});

it("routes only registered app pages in main and encodes the conversation context", async () => {
	mocks.label = "main";
	await openMainPage(route, "session & 1");
	expect(mocks.goto).toHaveBeenCalledWith(
		`${resolve("/overmind/agenthub")}?conversation=session+%26+1`,
	);
	await expect(
		openMainPage({ ...route, path: resolve("/chat") as RouteNode["path"] }),
	).rejects.toThrow("main application");
	expect(mocks.emitTo).not.toHaveBeenCalled();
});

it("acknowledges the main route result and cleans up a receiver attached after unmount", async () => {
	mocks.label = "main";
	const stop = startMainNavigation(vi.fn());
	const receive = mocks.listen.mock.calls[0][1];
	receive({
		payload: {
			id: "request",
			source: "chat",
			path: route.path,
			conversation: null,
			expires: Date.now() + 1000,
		},
	});
	await vi.waitFor(() =>
		expect(mocks.emitTo).toHaveBeenCalledWith("chat", "devpulse:navigate-main-result", {
			id: "request",
			error: null,
		}),
	);
	stop();
	expect(detach).toHaveBeenCalledOnce();
	let attach!: (value: () => void) => void;
	mocks.listen.mockImplementation(
		() =>
			new Promise((resolve) => {
				attach = resolve;
			}),
	);
	const lateStop = startMainNavigation(vi.fn());
	lateStop();
	const lateDetach = vi.fn();
	attach(lateDetach);
	await Promise.resolve();
	expect(lateDetach).toHaveBeenCalledOnce();
});

it("redelivers to a newly opened main window once its receiver is ready", async () => {
	const pending = openMainPage(route);
	await vi.waitFor(() => expect(mocks.emitTo).toHaveBeenCalledOnce());
	const request = mocks.emitTo.mock.calls[0][2];
	const ready = mocks.listen.mock.calls.find(([name]) => name === "devpulse:navigate-main-ready");
	if (!ready) throw new Error("Missing window readiness listener");
	ready[1]({ payload: undefined });
	expect(mocks.emitTo).toHaveBeenLastCalledWith("main", "devpulse:navigate-main", request);
	expect(mocks.emitTo).toHaveBeenCalledTimes(2);
	mocks.listen.mock.calls[0][1]({ payload: { id: request.id, error: null } });
	await pending;
	expect(detach).toHaveBeenCalledTimes(2);
});

it("does not apply duplicate deliveries of the same navigation request", async () => {
	mocks.label = "main";
	const stop = startMainNavigation(vi.fn());
	const receive = mocks.listen.mock.calls[0][1];
	const request = {
		payload: {
			id: "same",
			source: "chat",
			path: route.path,
			conversation: null,
			expires: Date.now() + 1000,
		},
	};
	receive(request);
	receive(request);
	await vi.waitFor(() => expect(mocks.emitTo).toHaveBeenCalledOnce());
	expect(mocks.goto).toHaveBeenCalledOnce();
	stop();
});
