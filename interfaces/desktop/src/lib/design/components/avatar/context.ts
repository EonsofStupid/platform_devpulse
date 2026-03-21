import { getContext, setContext } from "svelte";
import type { AvatarIds, AvatarLoadStatus } from "./types.js";

export interface AvatarContext {
	readonly src: string | undefined;
	readonly alt: string;
	readonly fallbackText: string;
	readonly status: AvatarLoadStatus;
	readonly size: number;
	readonly isOverBackground: boolean;
	readonly dir: "ltr" | "rtl";
	readonly classes: Record<string, string>;
	readonly ids: { root: string; image: string; fallback: string };
	handleLoad(): void;
	handleError(): void;
}

const CTX = Symbol("coldlight-avatar");

export function setAvatarContext(ctx: AvatarContext): void {
	setContext(CTX, ctx);
}

export function getAvatarContext(): AvatarContext {
	return getContext<AvatarContext>(CTX);
}
