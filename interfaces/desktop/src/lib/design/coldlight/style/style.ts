/**
 * ColdLight style() function.
 *
 * Maps ColdLight token names to CSS classes that reference SD5-generated
 * custom properties. This is the ColdLight equivalent of React Spectrum S2's
 * style macro — but without a build-time macro plugin.
 *
 * SD5 is the compiler — it generates CSS custom properties at build time.
 * This function maps semantic token names to the encoding system (v-* classes)
 * and to Tailwind utility classes for layout/spacing.
 *
 * Static usage (returns class string):
 *   const cls = style({ surface: "glass-void", depth: "z2", glow: "teal" });
 *   // → "v-s1 v-d2 v-g1"
 *
 * Conditional usage (returns function):
 *   const cls = style({
 *     surface: { default: "glass-void", isHovered: "glass-deep" },
 *     glow: { default: "teal", isPressed: "purple" },
 *   });
 *   // → (props) => resolved class string
 */

import {
	TOKEN_CATEGORY_REGISTRY,
	NAME_TO_CODE,
	type Preset,
} from "../../registry/token-categories.js";
import type { StyleProps, ConditionalValue, StateCondition } from "./types.js";

// ── Encoding axis resolution ────────────────────────────────

/** Map a semantic token ID to its encoding index within the category. */
function resolveIndex(categoryName: keyof Preset, tokenId: string): number {
	const code = NAME_TO_CODE[categoryName];
	const category = TOKEN_CATEGORY_REGISTRY.find((c) => c.code === code);
	if (!category) return 0;
	const idx = category.values.findIndex((v) => v.id === tokenId);
	return idx >= 0 ? idx : category.defaultIndex;
}

/** Generate the v-* class for a category + token ID. */
function encodingClass(categoryName: keyof Preset, tokenId: string): string {
	const code = NAME_TO_CODE[categoryName];
	const idx = resolveIndex(categoryName, tokenId);
	if (idx === 0) return ""; // default = no class needed
	return `v-${code}${idx}`;
}

// ── Spacing/sizing helpers ──────────────────────────────────

function spacingClass(prefix: string, value: string | number): string {
	if (typeof value === "number") {
		return value === 0 ? `${prefix}-0` : `${prefix}-[${value}px]`;
	}
	return `${prefix}-${value}`;
}

// ── Radius mapping ──────────────────────────────────────────

const RADIUS_MAP: Record<string, string> = {
	none: "rounded-none",
	xs: "rounded-xs",
	sm: "rounded-sm",
	md: "rounded-md",
	lg: "rounded-lg",
	xl: "rounded-xl",
	"2xl": "rounded-2xl",
	full: "rounded-full",
};

// ── Static property resolvers ───────────────────────────────

function resolveStaticProp(key: string, value: unknown): string {
	// 8-axis encoding props
	const encodingProps = ["surface", "material", "depth", "bevel", "glow", "frame", "motion", "transition"] as const;
	if (encodingProps.includes(key as typeof encodingProps[number])) {
		return encodingClass(key as keyof Preset, String(value));
	}

	// Layout props → Tailwind utilities
	switch (key) {
		case "padding": return spacingClass("p", value as string | number);
		case "paddingX": return spacingClass("px", value as string | number);
		case "paddingY": return spacingClass("py", value as string | number);
		case "margin": return spacingClass("m", value as string | number);
		case "marginX": return spacingClass("mx", value as string | number);
		case "marginY": return spacingClass("my", value as string | number);
		case "gap": return spacingClass("gap", value as string | number);
		case "borderRadius": return RADIUS_MAP[String(value)] ?? "";
		case "display": return String(value);
		case "alignItems": return `items-${value}`;
		case "justifyContent": {
			const map: Record<string, string> = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between", around: "justify-around", evenly: "justify-evenly" };
			return map[String(value)] ?? "";
		}
		case "flexDirection": {
			const map: Record<string, string> = { row: "flex-row", column: "flex-col", "row-reverse": "flex-row-reverse", "column-reverse": "flex-col-reverse" };
			return map[String(value)] ?? "";
		}
		case "position": return String(value);
		case "overflow": return `overflow-${value}`;
		case "fontSize": return `text-${value}`;
		case "fontWeight": return `font-${value}`;
		case "opacity": return typeof value === "number" ? `opacity-${Math.round((value as number) * 100)}` : "";
		case "color": return `text-[var(--color-${value})]`;
		case "backgroundColor": return `bg-[var(--color-${value})]`;
		default: return "";
	}
}

// ── Main style() function ───────────────────────────────────

function isConditional(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * ColdLight style function.
 *
 * Returns a class string (static) or a function that resolves classes at runtime (conditional).
 */
export function style(props: StyleProps): string | ((state: Partial<Record<StateCondition, boolean>>) => string) {
	const staticClasses: string[] = [];
	const conditionalProps: Array<{ key: string; conditions: Record<string, unknown> }> = [];
	let hasConditional = false;

	for (const [key, value] of Object.entries(props)) {
		if (value === undefined) continue;

		if (isConditional(value) && ("default" in value || Object.keys(value).some((k) => k.startsWith("is")))) {
			hasConditional = true;
			conditionalProps.push({ key, conditions: value as Record<string, unknown> });
			// Add the default value as a static class
			if ("default" in value) {
				const cls = resolveStaticProp(key, value.default);
				if (cls) staticClasses.push(cls);
			}
		} else {
			const cls = resolveStaticProp(key, value);
			if (cls) staticClasses.push(cls);
		}
	}

	const baseClasses = staticClasses.filter(Boolean).join(" ");

	if (!hasConditional) {
		return baseClasses;
	}

	// Return a function that resolves conditional styles at runtime
	return (state: Partial<Record<StateCondition, boolean>>) => {
		const classes = [baseClasses];

		for (const { key, conditions } of conditionalProps) {
			// Find the highest-priority matching condition
			for (const [condition, value] of Object.entries(conditions)) {
				if (condition === "default") continue;
				if (state[condition as StateCondition]) {
					const cls = resolveStaticProp(key, value);
					if (cls) classes.push(cls);
				}
			}
		}

		return classes.filter(Boolean).join(" ");
	};
}
