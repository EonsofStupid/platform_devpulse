/**
 * @file Dialog Adapter Barrel
 * @description Exports raw factory + typed transport. Single entry point.
 */

// Raw MeltUI factory (used internally by transport)
export { createMeltDialog, type MeltDialogInstance, type MeltDialogConfig } from "./factory.js";

// Typed ColdLight transport (used by components via imports.gen.ts)
export {
  createDialogTransport,
  type DialogTransport,
  type DialogTransportStates,
  type DialogTransportConfig,
} from "./_transport/index.js";
