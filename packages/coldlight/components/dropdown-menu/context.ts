/**
 * @file Dropdown Menu Context — Svelte context for compound component communication
 * @kind dropdown-menu
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it.
 */

import { getContext, setContext } from "svelte";
import type { UseMenuReturn } from "#coldlight/behaviors/navigation/menu/index.js";

export interface DropdownMenuContext {
	readonly hook: UseMenuReturn;
}

const DROPDOWN_MENU_CTX = Symbol("coldlight-dropdown-menu");

export function setDropdownMenuContext(ctx: DropdownMenuContext): void {
	setContext(DROPDOWN_MENU_CTX, ctx);
}

export function getDropdownMenuContext(): DropdownMenuContext {
	return getContext<DropdownMenuContext>(DROPDOWN_MENU_CTX);
}
