/**
 * @file primitives/alert-dialog — Structural contract for modal confirmations.
 * @package @devpulse/coldlight
 * @layer primitive
 *
 * Alert dialogs require explicit user decisions — cancel or action.
 * Uses role="alertdialog" for urgent screen reader announcements.
 */

export { alertDialogAnatomy } from "./anatomy.js";
export type { AlertDialogPrimitiveProps } from "./types.js";
