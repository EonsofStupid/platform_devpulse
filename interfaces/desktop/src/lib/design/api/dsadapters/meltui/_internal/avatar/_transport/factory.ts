/**
 * @file api/adapters/meltui/_internal/avatar/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight avatar transport from melt v0.44 Avatar.
 * Maps melt Avatar getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt avatar.image     → slots.image    (src, alt, data-melt-*)
 *   melt avatar.fallback  → slots.fallback (data-melt-*)
 *
 * State mapping:
 *   melt avatar.loadingStatus → states.loadingStatus
 */

import type { SlotAttrs } from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";
import { createMeltAvatar } from "../factory.js";
import type { AvatarTransport, AvatarTransportConfig } from "./types.js";

/**
 * Create a ColdLight avatar transport wrapping melt v0.44 Avatar.
 *
 * Usage in component:
 * ```svelte
 * const transport = createAvatarTransport({ src: "/avatar.png" });
 *
 * {#if transport.states.loadingStatus === "loaded"}
 *   <img {...transport.slots.image} />
 * {:else}
 *   <span {...transport.slots.fallback}>AB</span>
 * {/if}
 * ```
 */
export function createAvatarTransport(config?: AvatarTransportConfig): AvatarTransport {
	const avatar = createMeltAvatar({
		src: config?.src,
		delayMs: config?.delayMs,
	});

	return {
		slots: {
			get image(): SlotAttrs {
				return avatar.image as unknown as SlotAttrs;
			},
			get fallback(): SlotAttrs {
				return avatar.fallback as unknown as SlotAttrs;
			},
		},
		states: {
			get loadingStatus() {
				return avatar.loadingStatus as "loading" | "loaded" | "error";
			},
		},
	};
}
