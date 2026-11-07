/**
 * @file Button Recipe
 * @kind button
 * @layer components
 *
 * Props → standard Tailwind v4 utility classes.
 * Intent maps to semantic color tokens.
 * Size maps to structural dimension classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type ButtonRecipeProps = { intent?: string; size?: string };

const SIZE_MAP: Record<string, string> = {
	sm: "h-8 px-3 text-sm gap-1.5",
	md: "h-10 px-4 text-sm gap-2",
	lg: "h-12 px-6 text-base gap-2.5",
};

const INTENT_MAP: Record<string, string> = {
	primary: "bg-[var(--color-teal-600)] text-white hover:bg-[var(--color-teal-500)]",
	secondary: "bg-[var(--surface-elevated)] text-text-primary hover:bg-[var(--surface-hover)]",
	ghost: "bg-transparent text-text-secondary hover:bg-[var(--surface-hover)] hover:text-text-primary",
	danger: "bg-[var(--color-red-600)] text-white hover:bg-[var(--color-red-500)]",
};

const BASE =
	"inline-flex items-center justify-center font-medium rounded-lg cursor-pointer select-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:pointer-events-none disabled:opacity-50";

export function buttonRecipe(props: ButtonRecipeProps = {}): string {
	const size = SIZE_MAP[props.size ?? "md"] ?? SIZE_MAP.md;
	const intent = INTENT_MAP[props.intent ?? "primary"] ?? INTENT_MAP.primary;
	return cn("btn", BASE, size, intent);
}
