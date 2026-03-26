/**
 * @file Widget Block — Barrel Export
 * @kind widget
 * @layer blocks
 * @package @devpulse/coldlight
 */

// SVG data-viz components — re-exported from central library for backward compat
export { RadialGauge } from "$lib/design/components/radial-gauge/index.js";
export { SparkLine } from "$lib/design/components/spark-line/index.js";
export type {
	WidgetContentProps,
	WidgetFooterProps,
	WidgetHeaderProps,
	WidgetProps,
	WidgetSize,
	WidgetTab,
	WidgetTabsProps,
} from "./types.js";
export { default as Widget } from "./Widget.svelte";
export { default as WidgetContent } from "./WidgetContent.svelte";
export { default as WidgetFooter } from "./WidgetFooter.svelte";
export { default as WidgetHeader } from "./WidgetHeader.svelte";
export { default as WidgetTabs } from "./WidgetTabs.svelte";
