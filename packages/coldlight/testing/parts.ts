/**
 * @file testing/parts.ts
 * @package @devpulse/coldlight
 *
 * Shared helpers for ColdLight's component tests (plan 0006, tests T1).
 *
 * - Find a kind's part the way its anatomy marks it, `[data-kind][data-slot]`,
 *   never by a role its primitive spec may not give it.
 * - Assert presence with `await expect.element(locator).toBeInTheDocument()`:
 *   `expect(locator).toBeTruthy()` always passes, since a locator is an object.
 * - Fill required snippet props with `snippetOf`, not strings.
 */

import { createRawSnippet, type Snippet } from "svelte";
import { type Locator, page } from "vitest/browser";

/** A kind's part inside a rendered container, or null when it is not rendered. */
export function partOf(container: Element, kind: string, slot = "root"): HTMLElement | null {
	return container.querySelector<HTMLElement>(`[data-kind="${kind}"][data-slot="${slot}"]`);
}

/** A locator for a kind's part, for `expect.element(…)`; throws when the part is not rendered. */
export function locatePart(container: Element, kind: string, slot = "root"): Locator {
	const element = partOf(container, kind, slot);
	if (!element) throw new Error(`no [data-kind="${kind}"][data-slot="${slot}"] rendered`);
	return page.elementLocator(element);
}

/** A snippet rendering fixed markup (one root element), for required snippet props. */
export function snippetOf(html: string): Snippet {
	return createRawSnippet(() => ({ render: () => html }));
}
