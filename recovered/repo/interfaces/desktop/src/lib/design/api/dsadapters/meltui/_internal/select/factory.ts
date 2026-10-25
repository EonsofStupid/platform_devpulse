/**
 * @file api/adapters/meltui/_internal/select/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Select Factory — ONLY file that imports from `melt` for select.
 * Wraps melt v0.44 Select class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 */

import { Select, type SelectProps } from "melt/builders";

export type MeltSelectInstance<T = unknown, Multiple extends boolean = false> = Select<T, Multiple>;
export type MeltSelectConfig<T = unknown, Multiple extends boolean = false> = SelectProps<T, Multiple>;

/**
 * Create a MeltUI Select instance.
 * This is the ONLY place `Select` from `melt/builders` is instantiated.
 */
export function createMeltSelect<T = unknown, Multiple extends boolean = false>(
	config?: MeltSelectConfig<T, Multiple>,
): MeltSelectInstance<T, Multiple> {
	return new Select(config);
}
