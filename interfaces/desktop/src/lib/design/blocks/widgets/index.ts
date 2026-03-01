/**
 * @file Widget Block — Barrel Export
 * @kind widget
 * @layer blocks
 * @package @devpulse/coldlight
 */

export { default as Widget } from "./Widget.svelte";
export { default as WidgetHeader } from "./WidgetHeader.svelte";
export { default as WidgetTabs } from "./WidgetTabs.svelte";
export { default as WidgetContent } from "./WidgetContent.svelte";
export { default as WidgetFooter } from "./WidgetFooter.svelte";
export { default as RadialGauge } from "./RadialGauge.svelte";
export { default as SparkLine } from "./SparkLine.svelte";
export type {
	WidgetProps,
	WidgetHeaderProps,
	WidgetTabsProps,
	WidgetContentProps,
	WidgetFooterProps,
	WidgetTab,
	WidgetSize,
} from "./types.js";
