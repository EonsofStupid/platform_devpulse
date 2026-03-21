/**
 * @file Badge Recipe
 * @kind badge
 * @layer components
 *
 * Props → standard Tailwind v4 utility classes.
 * Variant maps to semantic color tokens.
 * Size maps to structural dimension classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type BadgeRecipeProps = { variant?: string; size?: string };

const SIZE_MAP: Record<string, string> = {
	sm: "px-1.5 py-0.5 text-xs",
	md: "px-2 py-0.5 text-xs",
	lg: "px-2.5 py-1 text-sm",
	xl: "px-3 py-1 text-sm",
};

const VARIANT_MAP: Record<string, string> = {
	neutral: "bg-[var(--surface-elevated)] text-text-secondary border-border-subtle",
	accent: "bg-[var(--color-teal-500)]/10 text-[var(--color-teal-400)] border-[var(--color-teal-500)]/20",
	informative: "bg-[var(--color-purple-500)]/10 text-[var(--color-purple-400)] border-[var(--color-purple-500)]/20",
	positive: "bg-[var(--color-teal-500)]/10 text-[var(--color-teal-400)] border-[var(--color-teal-500)]/20",
	notice: "bg-[var(--color-purple-500)]/10 text-[var(--color-purple-400)] border-[var(--color-purple-500)]/20",
	negative: "bg-[var(--color-red-500)]/10 text-[var(--color-red-400)] border-[var(--color-red-500)]/20",
};

const BASE = "inline-flex items-center gap-1 rounded-full border font-medium";

export function badgeRecipe(props: BadgeRecipeProps = {}): string {
	const variant = VARIANT_MAP[props.variant ?? "neutral"] ?? VARIANT_MAP.neutral;
	const size = SIZE_MAP[props.size ?? "md"] ?? SIZE_MAP.md;
	return cn(BASE, variant, size);
}
