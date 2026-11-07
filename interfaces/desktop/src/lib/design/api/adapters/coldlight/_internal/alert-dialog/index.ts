/**
 * @file api/adapters/coldlight/_internal/alert-dialog/index.ts
 * @package @devpulse/coldlight
 *
 * ColdLight AlertDialog _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 */

export {
    createAlertDialogTransport,
    type AlertDialogAttachments,
    type AlertDialogTransport,
    type AlertDialogTransportConfig,
    type AlertDialogTransportStates,
} from "./_transport/index.js";
export {
    ColdLightAlertDialog,
    type ColdLightAlertDialogConfig,
} from "./alert-dialog.svelte.js";
