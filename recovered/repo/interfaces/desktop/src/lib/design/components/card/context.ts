/**
 * @file Card Context — Svelte context for compound component communication
 * @kind card
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it for recipe classes, ids, orientation, dir.
 */

import { getContext, setContext } from "svelte";
import type { CardIds } from "./types.js";

export interface CardContext {
	/** Per-slot recipe class strings from the centralized recipe. */
	readonly classes: Record<string, string>;
	/** Layout orientation set by Root. */
	readonly orientation: "vertical" | "horizontal";
	/** Text/writing direction. */
	readonly dir: "ltr" | "rtl";
	/** Element IDs for composition — sub-components read their ID from here. */
	readonly ids: Partial<CardIds>;
}

const CARD_CTX = Symbol("coldlight-card");

export function setCardContext(ctx: CardContext): void {
	setContext(CARD_CTX, ctx);
}

export function getCardContext(): CardContext {
	return getContext<CardContext>(CARD_CTX);
}
