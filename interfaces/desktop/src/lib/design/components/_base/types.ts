/**
 * @file Component Base Types
 * @package @devpulse/coldlight
 *
 * Every component extends ComponentProps.
 * ComponentDef declares the component for StyleMacro + VPB.
 * Const literal + satisfies. No Zod. TypeScript validates at compile time.
 */

import type { Snippet } from "svelte";

// =============================================================================
// COMPONENT PROPS — what every component accepts
// =============================================================================

export interface ComponentProps {
	class?: string | null | undefined;
	children?: Snippet;
}

// =============================================================================
// SLOT AXES — which visual axes a slot receives
// =============================================================================

export type SlotAxes = "all" | "none" | {
	backgroundColor?: boolean;
	backgroundBlur?: boolean;
	shadow?: boolean;
	border?: boolean;
	animation?: boolean;
	transition?: boolean;
	typography?: boolean;
	gradient?: boolean;
	color?: boolean;
	borderRadius?: boolean;
	opacity?: boolean;
};

// =============================================================================
// COMPONENT DEF — const literal per component
// =============================================================================

export interface ComponentDef {
	readonly kind: string;
	readonly defaultStyleId: string;
	readonly styleIds: readonly string[];
	readonly slots: Readonly<Record<string, SlotAxes>>;
}
