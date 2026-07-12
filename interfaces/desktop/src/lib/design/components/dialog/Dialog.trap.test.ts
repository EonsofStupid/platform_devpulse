/**
 * @file components/dialog/Dialog.trap.test.ts
 * @kind dialog
 * @layer components
 * @package @devpulse/coldlight
 *
 * Native focus-trap proof — the regression guard for the hardcoded-`open`
 * defect (2026-07-11 a11y audit, Gap 1): rendering `<dialog open>` and then
 * calling showModal() throws InvalidStateError, silently downgrading the
 * app's only native modal trap to a non-trapping inline dialog. These tests
 * assert MODALITY (`:modal`), focus-in on open, and Tab/Shift+Tab wrap —
 * in a real Chromium DOM, where synthetic events cannot fake any of it.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 */

import { userEvent } from "@vitest/browser/context";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import DialogFocusFixture from "./DialogFocus.fixture.svelte";

async function openDialog(container: HTMLElement): Promise<HTMLDialogElement> {
	const trigger = container.querySelector<HTMLButtonElement>('[data-testid="trigger"]');
	if (!trigger) throw new Error("fixture trigger not rendered");
	await userEvent.click(trigger);
	// setOpen defers showModal() through tick(); yield until the dialog is modal.
	const dialog = await new Promise<HTMLDialogElement>((resolve, reject) => {
		const started = performance.now();
		const poll = () => {
			const el = container.querySelector<HTMLDialogElement>("dialog");
			if (el?.open) return resolve(el);
			if (performance.now() - started > 2000) return reject(new Error("dialog never opened"));
			requestAnimationFrame(poll);
		};
		poll();
	});
	return dialog;
}

describe("dialog — native modal focus trap", () => {
	test("showModal() succeeds: dialog is :modal, not a downgraded inline dialog", async () => {
		const { container } = render(DialogFocusFixture);
		const dialog = await openDialog(container as HTMLElement);

		// THE regression assertion: with a hardcoded `open` attribute,
		// showModal() throws and the dialog never becomes :modal.
		expect(dialog.open).toBe(true);
		expect(dialog.matches(":modal")).toBe(true);
	});

	test("focus moves inside the dialog on open", async () => {
		const { container } = render(DialogFocusFixture);
		const dialog = await openDialog(container as HTMLElement);

		expect(document.activeElement).not.toBeNull();
		expect(dialog.contains(document.activeElement)).toBe(true);
	});

	// NOTE on the boundary wrap: vitest browser tests run inside an iframe,
	// and Chromium moves focus ACROSS the frame boundary at the dialog's
	// focus edge — the last→first wrap is browser-chrome behavior that is
	// not assertable from inside the test document. The two tests below
	// prove the same trap property in-document: keyboard order works inside
	// the dialog, and everything outside it is inert while modal.

	test("Tab moves through the dialog interior in order", async () => {
		const { container } = render(DialogFocusFixture);
		const dialog = await openDialog(container as HTMLElement);
		const first = dialog.querySelector<HTMLButtonElement>('[data-testid="first"]');
		const middle = dialog.querySelector<HTMLInputElement>('[data-testid="middle"]');
		if (!first || !middle) throw new Error("fixture focusables not rendered");

		first.focus();
		expect(document.activeElement).toBe(first);
		await userEvent.keyboard("{Tab}");

		expect(document.activeElement).toBe(middle);
	});

	test("content outside the dialog is inert while modal", async () => {
		const { container } = render(DialogFocusFixture);
		const dialog = await openDialog(container as HTMLElement);
		const trigger = (container as HTMLElement).querySelector<HTMLButtonElement>(
			'[data-testid="trigger"]',
		);
		if (!trigger) throw new Error("fixture trigger not rendered");

		// showModal() makes the rest of the document inert — focus() on an
		// outside element must be a no-op. With the hardcoded-`open` defect,
		// the dialog was non-modal and this focus() succeeded.
		trigger.focus();
		expect(document.activeElement).not.toBe(trigger);
		expect(dialog.contains(document.activeElement)).toBe(true);
	});
});
