/**
 * @file Dropdown Menu Context — Svelte context for compound component communication
 * @kind dropdown-menu
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it.
 *
 * Context shape: open state, toggle function, close function.
 * Components that need MeltUI transport will use the spatialmenu adapter.
 */

import { getContext, setContext } from "svelte";

export interface DropdownMenuContext {
	readonly open: boolean;
	readonly toggle: () => void;
	readonly close: () => void;
	readonly triggerId: string;
	readonly contentId: string;
}

const DROPDOWN_MENU_CTX = Symbol("coldlight-dropdown-menu");

export function setDropdownMenuContext(ctx: DropdownMenuContext): void {
	setContext(DROPDOWN_MENU_CTX, ctx);
}

export function getDropdownMenuContext(): DropdownMenuContext {
	return getContext<DropdownMenuContext>(DROPDOWN_MENU_CTX);
}
