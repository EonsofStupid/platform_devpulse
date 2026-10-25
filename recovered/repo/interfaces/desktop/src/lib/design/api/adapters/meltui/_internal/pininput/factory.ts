/**
 * @file api/adapters/meltui/_internal/pininput/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI PinInput Factory — ONLY file that imports from `melt` for pin input.
 * Wraps melt v0.44 PinInput class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 */

import { PinInput, type PinInputProps } from "melt/builders";

export type MeltPinInputInstance = PinInput;
export type MeltPinInputConfig = PinInputProps;

/**
 * Create a MeltUI PinInput instance.
 * This is the ONLY place `PinInput` from `melt/builders` is instantiated.
 */
export function createMeltPinInput(config?: MeltPinInputConfig): MeltPinInputInstance {
	return new PinInput(config);
}
