/**
 * @file Dialog Context
 * @kind dialog
 * @layer components
 */

import { getContext, setContext } from "svelte";
import type { UseDialogReturn } from "$lib/design/primitives/dialog/dialog.types.js";
import type { DialogIds, DialogSize } from "./types.js";

export interface DialogContext {
	readonly hook: UseDialogReturn;
	readonly classes: Record<string, string>;
	readonly ids: Partial<DialogIds>;
	readonly dir: "ltr" | "rtl";
	readonly size: DialogSize;
}

const DIALOG_CTX = Symbol("coldlight-dialog");

export function setDialogContext(ctx: DialogContext): void {
	setContext(DIALOG_CTX, ctx);
}

export function getDialogContext(): DialogContext {
	return getContext<DialogContext>(DIALOG_CTX);
}
