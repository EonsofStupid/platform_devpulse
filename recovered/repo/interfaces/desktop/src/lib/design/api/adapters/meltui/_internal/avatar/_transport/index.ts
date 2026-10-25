/**
 * @file api/adapters/meltui/_internal/avatar/_transport/index.ts
 * @package @devpulse/coldlight
 */

export { createAvatarTransport } from "./factory.js";
export type {
	AvatarTransport,
	AvatarTransportConfig,
	AvatarTransportStates,
	AvatarLoadingStatus,
} from "./types.js";
