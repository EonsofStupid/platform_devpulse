/**
 * @file api/adapters/meltui/_internal/avatar/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI avatar _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createAvatarTransport from here — NEVER from melt directly.
 */

export { createAvatarTransport } from "./_transport/index.js";
export type {
	AvatarTransport,
	AvatarTransportConfig,
	AvatarTransportStates,
	AvatarLoadingStatus,
} from "./_transport/index.js";
export { createMeltAvatar, type MeltAvatarConfig, type MeltAvatarInstance } from "./factory.js";
