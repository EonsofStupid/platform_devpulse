/**
 * @file api/adapters/meltui/_internal/accordion/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI accordion _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createAccordionTransport from here — NEVER from melt directly.
 */

export { createAccordionTransport } from "./_transport/index.js";
export type {
	AccordionItemMeta,
	AccordionItemTransport,
	AccordionItemTransportStates,
	AccordionTransport,
	AccordionTransportConfig,
	AccordionTransportStates,
} from "./_transport/index.js";
export {
	createMeltAccordion,
	type MeltAccordionConfig,
	type MeltAccordionInstance,
} from "./factory.js";
