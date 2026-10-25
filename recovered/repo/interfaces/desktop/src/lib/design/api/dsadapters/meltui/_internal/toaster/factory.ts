/**
 * @file api/adapters/meltui/_internal/toaster/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Toaster Factory — ONLY file that imports from `melt` for toaster.
 * Wraps melt v0.44 Toaster class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * Note: Melt v0.44 ToasterProps is NOT generic. The Toaster<T> class IS generic
 * but the props don't reference T — T only appears in addToast/Toast.
 */

import { Toaster, type ToasterProps } from "melt/builders";

export type MeltToasterInstance<T = unknown> = Toaster<T>;
export type MeltToasterConfig = ToasterProps;

/**
 * Create a MeltUI Toaster instance.
 * This is the ONLY place `Toaster` from `melt/builders` is instantiated.
 */
export function createMeltToaster<T = unknown>(config?: MeltToasterConfig): MeltToasterInstance<T> {
	return new Toaster<T>(config);
}
