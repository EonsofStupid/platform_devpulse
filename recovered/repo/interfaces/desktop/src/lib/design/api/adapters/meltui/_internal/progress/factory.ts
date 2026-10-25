/**
 * @file api/adapters/meltui/_internal/progress/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Progress Factory — ONLY file that imports from `melt` for progress.
 * Wraps melt v0.44 Progress class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/meter/
 */

import { Progress, type ProgressProps } from "melt/builders";

export type MeltProgressInstance = Progress;
export type MeltProgressConfig = ProgressProps;

/**
 * Create a MeltUI Progress instance.
 * This is the ONLY place `Progress` from `melt/builders` is instantiated.
 */
export function createMeltProgress(config?: MeltProgressConfig): MeltProgressInstance {
	return new Progress(config);
}
