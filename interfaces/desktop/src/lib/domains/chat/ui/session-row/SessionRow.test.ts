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

it("keeps the title and timestamp readable when the session rail must scroll", () => {
	const { container } = render(SessionRow, {
		props: { session, active: false, onClick: () => {} },
	});
	const row = container.querySelector("button");
	if (!row) throw new Error("Session button is missing");
	const naturalHeight = row.getBoundingClientRect().height;
	container.style.cssText = "display:flex;flex-direction:column;height:24px;overflow-y:auto";
	expect(row.getBoundingClientRect().height).toBe(naturalHeight);
	expect(container.scrollHeight).toBeGreaterThan(container.clientHeight);
	for (const text of row.children) {
		expect(text.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			row.getBoundingClientRect().bottom,
		);
	}
});
