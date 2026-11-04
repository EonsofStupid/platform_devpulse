import { tick } from "svelte";
import { afterEach, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import SubsystemBadge from "#lib/layouts/app/SubsystemBadge.svelte";
import { findTerm } from "#lib/sys/generated/terminology.js";
import {
	PRESENTATION_KEY,
	PresentationState,
	presentationState,
} from "../../data-access/presentation.state.svelte.js";
import PresentationSettings from "./PresentationSettings.svelte";

vi.mock("#lib/domains/clyffy/index.js", () => ({
	clyffyStatus: { activity: { text: "" }, mood: "idle" },
}));

afterEach(() => {
	presentationState.setMode("simple");
	localStorage.removeItem(PRESENTATION_KEY);
});

it("switches the shipped control and retains technical identity across reloads", async () => {
	presentationState.setMode("simple");
	const raw = findTerm("GUARDIAN");
	const { container } = await render(PresentationSettings);
	const subsystem = {
		name: "GUARDIAN",
		state: "ready" as const,
		latencyUs: 12,
		message: null,
		friendlyName: "Quality Check",
	};
	const badge = await render(SubsystemBadge, { props: { subsystem } });
	const buttons = container.querySelectorAll("button");
	expect(buttons).toHaveLength(2);
	expect(presentationState.label("GUARDIAN")).toBe("Quality Check");
	expect(badge.container.textContent).toContain("Quality Check");
	buttons[1].click();
	await tick();
	expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
	expect(presentationState.label("GUARDIAN")).toBe("Guardian Agent");
	expect(badge.container.textContent).toContain("Guardian Agent");
	expect(subsystem.name).toBe("GUARDIAN");
	expect(subsystem.state).toBe("ready");
	expect(new PresentationState(localStorage).advanced).toBe(true);
	expect(findTerm("GUARDIAN")).toEqual(raw);
	buttons[0].click();
	await tick();
	expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
	expect(presentationState.label("GUARDIAN")).toBe("Quality Check");
});

it("accepts saved changes from another window and resets when cleared", () => {
	window.dispatchEvent(
		new StorageEvent("storage", {
			key: PRESENTATION_KEY,
			newValue: "advanced",
			storageArea: localStorage,
		}),
	);
	expect(presentationState.advanced).toBe(true);
	window.dispatchEvent(
		new StorageEvent("storage", { key: null, newValue: null, storageArea: localStorage }),
	);
	expect(presentationState.mode).toBe("simple");
});

it("keeps the control usable and reports unavailable persistence", () => {
	const state = new PresentationState({
		getItem: () => "invalid-mode",
		setItem: () => {
			throw new Error("denied");
		},
	});
	expect(state.mode).toBe("simple");
	state.setMode("advanced");
	expect(state.advanced).toBe(true);
	expect(state.error).toContain("could not be saved");
	expect(state.label("custom-technical-name")).toBe("custom-technical-name");
});
