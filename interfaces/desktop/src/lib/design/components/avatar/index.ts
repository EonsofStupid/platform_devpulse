export { default as Root } from "./Avatar.svelte";
export { default as Image } from "./AvatarImage.svelte";
export { default as Fallback } from "./AvatarFallback.svelte";
export { contract as avatarComponentContract } from "./contract.js";
export type {
	AvatarIds,
	AvatarLoadStatus,
	AvatarStatusChangeDetails,
	AvatarRootProps,
	AvatarImageProps,
	AvatarFallbackProps,
} from "./types.js";
