/**
 * @file api/adapters/meltui/_internal/avatar/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI avatar adapter.
 * Maps melt v0.44 Avatar API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: image, fallback
 * States: loadingStatus ("loading" | "loaded" | "error")
 */

import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export type AvatarLoadingStatus = "loading" | "loaded" | "error";

export interface AvatarTransportStates {
	/** Current loading status of the avatar image */
	readonly loadingStatus: AvatarLoadingStatus;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface AvatarTransportConfig {
	/** Image source URL */
	src?: string;
	/** Delay in ms before showing the fallback. @default 0 */
	delayMs?: number;
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight avatar transport — the public contract for the melt avatar adapter.
 *
 * Slots (melt-managed): image, fallback
 * States: loadingStatus
 */
export type AvatarTransport = TransportAdapter<
	"image" | "fallback",
	AvatarTransportStates
> & {
	readonly slots: {
		readonly image: SlotAttrs;
		readonly fallback: SlotAttrs;
	};
};
