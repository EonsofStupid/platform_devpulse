/**
 * @file primitives/avatar/index.ts
 * @kind avatar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Avatar primitive barrel export.
 * Contract lives HERE — with the implementation (locked 2026-02-21).
 */

export { contract } from "./contract.js";
export { avatarSlots, avatarStateTokens, avatarSlotStates } from "./types.js";
export type {
	AvatarRootProps,
	AvatarImageProps,
	AvatarFallbackProps,
	AvatarSlot,
	AvatarState,
} from "./types.js";
