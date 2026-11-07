/**
 * @file Command Primitive Context
 * @description Svelte context for compound command coordination.
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:command");

/** Command context shape */
export type CommandContext = {
	readonly value: string;
};

/** Set command context — called by Command root */
export function setCommandContext(ctx: CommandContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get command context — called by Command sub-components */
export function getCommandContext(): CommandContext {
	return getContext<CommandContext>(CTX_KEY);
}
