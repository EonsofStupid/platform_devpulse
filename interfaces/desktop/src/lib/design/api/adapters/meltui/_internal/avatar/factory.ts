/**
 * @file api/adapters/meltui/_internal/avatar/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Avatar Factory — ONLY file that imports from `melt` for avatar.
 * Wraps melt v0.44 Avatar class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 */

import { Avatar, type AvatarProps } from "melt/builders";

export type MeltAvatarInstance = Avatar;
export type MeltAvatarConfig = AvatarProps;

/**
 * Create a MeltUI Avatar instance.
 * This is the ONLY place `Avatar` from `melt/builders` is instantiated.
 */
export function createMeltAvatar(config?: MeltAvatarConfig): MeltAvatarInstance {
	return new Avatar(config);
}
