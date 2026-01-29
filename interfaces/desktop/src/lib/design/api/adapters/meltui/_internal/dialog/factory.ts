/**
 * @file MeltUI Dialog Factory
 * @description Wraps MeltUI's createDialog builder.
 *
 * This is the ONLY file that imports @melt-ui/svelte for dialog.
 * Everything else goes through ColdLight's public adapter surface.
 */

import { createDialog, type CreateDialogProps } from "@melt-ui/svelte";

/** MeltUI dialog instance type (opaque to consumers) */
export type MeltDialogInstance = ReturnType<typeof createDialog>;

/** Props accepted by the MeltUI dialog builder */
export type MeltDialogConfig = CreateDialogProps;

/**
 * Create a MeltUI dialog instance.
 * This is the single entry point - primitives never call createDialog directly.
 */
export function createMeltDialog(config: MeltDialogConfig): MeltDialogInstance {
  return createDialog(config);
}
