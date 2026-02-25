/**
 * @file api/adapters/meltui/_internal/radiogroup/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI RadioGroup Factory — ONLY file that imports from `melt` for radio group.
 * Wraps melt v0.44 RadioGroup class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 */

import { RadioGroup, type RadioGroupProps } from "melt/builders";

export type MeltRadioGroupInstance = RadioGroup;
export type MeltRadioGroupConfig = RadioGroupProps;

/**
 * Create a MeltUI RadioGroup instance.
 * This is the ONLY place `RadioGroup` from `melt/builders` is instantiated.
 */
export function createMeltRadioGroup(config?: MeltRadioGroupConfig): MeltRadioGroupInstance {
	return new RadioGroup(config);
}
