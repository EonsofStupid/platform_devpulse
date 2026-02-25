/**
 * @file Dialog Context — Svelte context for compound component communication
 * @kind dialog
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it.
 */

import { getContext, setContext } from "svelte";
import type { ColdLightDialog } from "$lib/design/api/adapters/coldlight/_internal/dialog/dialog.svelte.js";

const DIALOG_CTX = Symbol("coldlight-dialog");

export function setDialogContext(dialog: ColdLightDialog): void {
	setContext(DIALOG_CTX, dialog);
}

export function getDialogContext(): ColdLightDialog {
	return getContext<ColdLightDialog>(DIALOG_CTX);
}
