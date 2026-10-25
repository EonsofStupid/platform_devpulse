/**
 * @file ColdLight Dialog Adapter
 * @description Public adapter surface for dialog primitive runtime.
 *
 * Re-exports the dialog factory from the internal meltui adapter.
 * Primitives import from HERE, never from meltui directly.
 * This is the sole leakage point - one controlled re-export.
 */

export {
  createMeltDialog as createDialogBuilder,
  type MeltDialogInstance as DialogBuilderInstance,
  type MeltDialogConfig as DialogBuilderConfig,
} from "$lib/design/api/adapters/meltui/_internal/dialog/factory";
