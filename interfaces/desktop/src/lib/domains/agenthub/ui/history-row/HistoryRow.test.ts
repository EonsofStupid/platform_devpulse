import { expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import "../../../../../app.css";
import type { FoundSession } from "$lib/sys/generated/bindings.js";
import HistoryRow from "./HistoryRow.svelte";

it("selects an orphan by keyboard and paints selection through generated CSS", async () => {
	const session: FoundSession = {
		providerId: "codex",
		locator: "artifact",
		nativeId: "native",
		kind: "subAgent",
		parentNativeId: "absent",
		parentLocator: null,
		parentResolution: "missing",
		title: "Review the workspace",
		workspace: "D:/project",
		startedAt: "",
		modifiedAt: 1,
		bytes: 12,
	};
	const onSelect = vi.fn();
	const { container, rerender } = render(HistoryRow, {
		props: { session, providerName: "Codex", selected: false, onSelect },
	});
	const button = container.querySelector("button");
	if (!button) throw new Error("Missing session button");
	expect(button.getAttribute("style")).toBeNull();
	expect(button.textContent).toContain("Parent not found");
	const before = getComputedStyle(button).borderLeftColor;
	button.focus();
	await userEvent.keyboard("{Enter}");
	expect(onSelect).toHaveBeenCalledOnce();
	await rerender({ selected: true });
	expect(button.getAttribute("aria-current")).toBe("true");
	expect(getComputedStyle(button).borderLeftColor).not.toBe(before);
});
