/**
 * @file api/adapters/coldlight/_internal/alert-dialog/_transport/index.ts
 * @package @devpulse/coldlight
 */

export { createAlertDialogTransport } from "./factory.js";
export type {
    AlertDialogAttachments,
    AlertDialogTransport,
    AlertDialogTransportConfig,
    AlertDialogTransportStates,
} from "./types.js";
