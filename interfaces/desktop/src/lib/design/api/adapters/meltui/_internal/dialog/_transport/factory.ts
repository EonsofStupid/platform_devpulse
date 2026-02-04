/**
 * @file Dialog Transport Factory
 * @description Creates a typed ColdLight dialog transport from MeltUI.
 * Entry point for dialog adapter — returns ColdLight vocabulary, never MeltUI.
 */

import { createMeltDialog } from "../factory.js";
import { extractSlots } from "./slots.js";
import { extractStates } from "./states.js";
import type { DialogTransport, DialogTransportConfig } from "./types.js";

/**
 * Create a typed dialog transport.
 * Raw MeltUI instance created internally — never exposed.
 * Returns ColdLight-vocabulary API only.
 */
export function createDialogTransport(config?: DialogTransportConfig): DialogTransport {
  const instance = createMeltDialog({
    defaultOpen: config?.defaultOpen,
    preventScroll: config?.preventScroll,
    escapeBehavior: config?.closeOnEscape === false ? "ignore" : "close",
    closeOnOutsideClick: config?.closeOnOutsideClick,
    portal: config?.portal,
    forceVisible: config?.forceVisible,
  });

  return {
    slots: extractSlots(instance),
    states: extractStates(instance),
  };
}
