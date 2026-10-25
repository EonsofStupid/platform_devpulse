/**
 * @file Dialog Transport Slots
 * @description MeltUI elements → ColdLight slots. 1:1 typed mapping.
 * MeltUI "portalled" → ColdLight "portal". All other names pass through.
 */

import type { DialogSlot } from "$lib/design/taxonomy/kinds/primitives/dialog/types.js";
import type { SlotStore } from "../../_transport/types.js";
import type { MeltDialogInstance } from "../factory.js";

/** MeltUI element names returned by createDialog */
const MELT_ELEMENTS = [
  "trigger", "overlay", "content", "title", "description", "close", "portalled",
] as const;

type MeltDialogElement = (typeof MELT_ELEMENTS)[number];

/** MeltUI element → ColdLight slot. "portalled" → "portal", rest pass through. */
const ELEMENT_TO_SLOT: Record<MeltDialogElement, Exclude<DialogSlot, "root">> = {
  trigger: "trigger",
  overlay: "overlay",
  content: "content",
  title: "title",
  description: "description",
  close: "close",
  portalled: "portal",
} as const;

/** Extract typed ColdLight slot stores from a MeltUI dialog instance */
export function extractSlots(
  instance: MeltDialogInstance,
): Record<Exclude<DialogSlot, "root">, SlotStore> {
  return {
    trigger: instance.elements.trigger,
    portal: instance.elements.portalled,
    overlay: instance.elements.overlay,
    content: instance.elements.content,
    title: instance.elements.title,
    description: instance.elements.description,
    close: instance.elements.close,
  };
}
