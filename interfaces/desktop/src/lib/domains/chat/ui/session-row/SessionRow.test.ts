import { expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import "../../../../../app.css";
import SessionRow from "./SessionRow.svelte";

const session = { id: "review", title: "Review implementation", updatedAt: 0 };

it("selects by keyboard and paints selection through generated CSS", async () => {
	const onClick = vi.fn();
	const { container, rerender } = render(SessionRow, {
		props: { session, active: false, onClick },
	});
	const button = container.querySelector("button");
	if (!button) throw new Error("Session button is missing");
	expect(button.getAttribute("style")).toBeNull();
	const before = getComputedStyle(button).borderLeftColor;
	button.focus();
	await userEvent.keyboard("{Enter}");
	expect(onClick).toHaveBeenCalledOnce();
	await rerender({ active: true });
	expect(button.getAttribute("aria-current")).toBe("true");
	expect(getComputedStyle(button).borderLeftColor).not.toBe(before);
	expect(getComputedStyle(button).borderLeftWidth).toBe("4px");
	await rerender({ active: false });
	expect(getComputedStyle(button).borderLeftColor).toBe(before);
});

it("disabled rows cannot invoke selection", async () => {
	const onClick = vi.fn();
	const { container } = render(SessionRow, {
		props: { session, active: false, disabled: true, onClick },
	});
	const button = container.querySelector("button");
	if (!button) throw new Error("Session button is missing");
	button.click();
	expect(button.disabled).toBe(true);
	expect(onClick).not.toHaveBeenCalled();
});
