/**
 * @file Z-Index Tokens — stacking order
 * @module @devpulse/coldlight/tokens/layout/z-index
 * @layer tokens/tier-1
 */

export const z = {
	base: "0",
	raised: "10",
	dropdown: "100",
	sticky: "200",
	overlay: "300",
	modal: "400",
	popover: "500",
	toast: "600",
	tooltip: "700",
} as const;
