/** @file Retained output stays selectable and dismissal is explicit. */
import { expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import "../../../../../app.css";
import FailedTurn from "./FailedTurn.svelte";

it("shows the error and exact stream copy without issuing actions until dismissal", async () => {
	const onDismiss = vi.fn();
	const { getByRole, getByText } = render(FailedTurn, {
		props: {
			title: "Retained answer",
			note: "Copy before closing",
			message: "History write failed",
			text: "First line\nSecond line",
			dismissLabel: "Dismiss copy",
			onDismiss,
		},
	});
	await expect.element(getByRole("alert")).toHaveTextContent("History write failed");
	expect(getByText("First line\nSecond line").element().textContent).toBe(
		"First line\nSecond line",
	);
	expect(onDismiss).not.toHaveBeenCalled();
	await getByRole("button", { name: "Dismiss copy" }).click();
	expect(onDismiss).toHaveBeenCalledOnce();
});
