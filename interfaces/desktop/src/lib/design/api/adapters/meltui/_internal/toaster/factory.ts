/**
 * @file api/adapters/meltui/_internal/toaster/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Toaster Factory — ONLY file that imports from `melt` for toaster.
 * Wraps melt v0.44 Toaster class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 */

import { Toaster, type ToasterProps } from "melt/builders";

export type MeltToasterInstance<T = unknown> = Toaster<T>;
export type MeltToasterConfig<T = unknown> = ToasterProps<T>;

/**
 * Create a MeltUI Toaster instance.
 * This is the ONLY place `Toaster` from `melt/builders` is instantiated.
 */
export function createMeltToaster<T = unknown>(config?: MeltToasterConfig<T>): MeltToasterInstance<T> {
	return new Toaster(config);
}
