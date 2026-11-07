/**
 * @file api/adapters/meltui/_internal/accordion/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Accordion Factory — ONLY file that imports from `melt` for accordion.
 * Wraps melt v0.44 Accordion class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

import { Accordion, type AccordionProps, type AccordionItemMeta } from "melt/builders";

export type MeltAccordionInstance<Multiple extends boolean = false> = Accordion<Multiple>;
export type MeltAccordionConfig<Multiple extends boolean = false> = AccordionProps<Multiple>;
export type { AccordionItemMeta };

/**
 * Create a MeltUI Accordion instance.
 * This is the ONLY place `Accordion` from `melt/builders` is instantiated.
 */
export function createMeltAccordion<Multiple extends boolean = false>(
	config?: MeltAccordionConfig<Multiple>,
): MeltAccordionInstance<Multiple> {
	return new Accordion(config);
}
