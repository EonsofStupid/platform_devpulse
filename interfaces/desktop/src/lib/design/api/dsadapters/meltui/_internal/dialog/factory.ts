/**
 * @file api/adapters/meltui/_internal/dialog/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Dialog Factory — ONLY file that imports from `melt` for dialog.
 * Wraps melt v0.44 Dialog class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import { Dialog, type DialogProps } from "melt/builders";

export type MeltDialogInstance = Dialog;
export type MeltDialogConfig = DialogProps;

/**
 * Create a MeltUI Dialog instance.
 * This is the ONLY place `Dialog` from `melt/builders` is instantiated.
 */
export function createMeltDialog(config?: MeltDialogConfig): MeltDialogInstance {
	return new Dialog(config);
}
