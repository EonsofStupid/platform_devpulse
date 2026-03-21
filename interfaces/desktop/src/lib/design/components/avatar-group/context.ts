/**
 * @file AvatarGroup Context
 * @kind avatar-group
 * @layer components
 *
 * Avatar reads this context to inherit group size.
 * If no AvatarGroup parent, Avatar uses its own size prop.
 */

import { getContext, hasContext, setContext } from "svelte";

export interface AvatarGroupContext {
	readonly size: number;
}

const CTX = Symbol("coldlight-avatar-group");

export function setAvatarGroupContext(ctx: AvatarGroupContext): void {
	setContext(CTX, ctx);
}

export function getAvatarGroupContext(): AvatarGroupContext | undefined {
	if (!hasContext(CTX)) return undefined;
	return getContext<AvatarGroupContext>(CTX);
}
