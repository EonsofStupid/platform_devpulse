/**
 * @file Dialog Transport States
 * @description MeltUI states → ColdLight state tokens. 1:1 typed mapping.
 */

import type { DialogState } from "$lib/design/taxonomy/kinds/primitives/dialog/types.js";
import type { MeltDialogInstance } from "../factory.js";
import type { DialogTransportStates } from "./types.js";

/** MeltUI state names exposed by createDialog */
const MELT_STATES = ["open"] as const;

type MeltDialogState = (typeof MELT_STATES)[number];

/** MeltUI state → ColdLight state token */
const STATE_TO_TOKEN: Record<MeltDialogState, DialogState> = {
  open: "open",
} as const;

/** Extract typed ColdLight state stores from a MeltUI dialog instance */
export function extractStates(instance: MeltDialogInstance): DialogTransportStates {
  return {
    open: instance.states.open,
  };
}
