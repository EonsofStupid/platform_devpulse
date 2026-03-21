/**
 * @file CodeBlock Context — Svelte context for compound component communication
 * @kind code
 * @layer components
 *
 * Root sets context; sub-components consume it for recipe classes, ids, language, and copy.
 */

import { getContext, setContext } from "svelte";
import type { CodeBlockIds, CodeLanguage } from "./types.js";

export interface CodeBlockContext {
	/** Per-slot recipe class strings. */
	readonly classes: Record<string, string>;
	/** Element IDs for composition. */
	readonly ids: Partial<CodeBlockIds>;
	/** Text/writing direction. */
	readonly dir: "ltr" | "rtl";
	/** Language hint from Root. */
	readonly language: CodeLanguage | undefined;
	/** Filename from Root. */
	readonly filename: string | undefined;
	/** Whether line numbers are shown. */
	readonly lineNumbers: boolean;
	/** Whether the block is disabled. */
	readonly disabled: boolean;
	/** Copy handler — sub-components call this to trigger copy + callback. */
	readonly copyCode: (value?: string) => void;
}

const CODE_BLOCK_CTX = Symbol("coldlight-code-block");

export function setCodeBlockContext(ctx: CodeBlockContext): void {
	setContext(CODE_BLOCK_CTX, ctx);
}

export function getCodeBlockContext(): CodeBlockContext {
	return getContext<CodeBlockContext>(CODE_BLOCK_CTX);
}
