/**
 * @file Dialog Transport Types
 * @description Typed transport interface for dialog.
 * Mirrors taxonomy/dialog/types.ts — taxonomy declares vocabulary, transport satisfies it.
 */

import type { Writable } from "svelte/store";
import type { DialogSlot } from "$lib/design/taxonomy/kinds/primitives/dialog/types.js";
import type { TransportAdapter } from "../../_transport/types.js";

/** Dialog-specific state stores exposed by transport */
export type DialogTransportStates = {
  readonly open: Writable<boolean>;
};

/** Typed dialog transport — slots keyed by ColdLight DialogSlot (minus renderless "root") */
export type DialogTransport = TransportAdapter<
  Exclude<DialogSlot, "root">,
  DialogTransportStates
>;

/** Config accepted by createDialogTransport */
export interface DialogTransportConfig {
  defaultOpen?: boolean;
  preventScroll?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  portal?: string | HTMLElement | null;
  forceVisible?: boolean;
}
