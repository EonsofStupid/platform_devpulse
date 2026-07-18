<!--
	@component Calendar
	@kind calendar
	@layer component
	@category interactive
	@description Date grid allowing single date selection with month and year navigation
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/grid/
	@container false
	@compound true
	@blockCategory form
	@defaultStyle calendar-default
	@styleIds calendar-default
	@requiredAxes backgroundColor, border, borderRadius, color, typography
	@slots root:all, header:none, grid:none, cell:none, nav:none
	@defaults {
		"background-color": "var(--surface-base)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "var(--text-primary)",
		"border-color": "var(--border-subtle)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { useCalendar } from "$lib/design/behaviors/inputs/calendar/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setCalendarContext } from "./context.js";
import type { CalendarRootProps } from "./types.js";

let {
	value,
	defaultValue = null,
	onValueChange,
	focusedValue,
	defaultFocusedValue,
	onFocusChange,
	isDateUnavailable,
	isDisabled = false,
	isReadOnly = false,
	isInvalid = false,
	minValue,
	maxValue,
	firstDayOfWeek = "sun",
	locale = "en-US",
	dir = "ltr",
	children,
	preset = "default",
	class: className,
	...rest
}: CalendarRootProps = $props();

const cal = useCalendar({
	get value() {
		return value;
	},
	get defaultValue() {
		return defaultValue;
	},
	onValueChange: (d) => onValueChange?.({ value: d.value }),
	get focusedValue() {
		return focusedValue;
	},
	get defaultFocusedValue() {
		return defaultFocusedValue;
	},
	onFocusChange: (d) => onFocusChange?.({ date: d.date }),
	get isDateUnavailable() {
		return isDateUnavailable;
	},
	get disabled() {
		return isDisabled;
	},
	get readOnly() {
		return isReadOnly;
	},
	get invalid() {
		return isInvalid;
	},
	get minValue() {
		return minValue;
	},
	get maxValue() {
		return maxValue;
	},
	get firstDayOfWeek() {
		return firstDayOfWeek;
	},
	get locale() {
		return locale;
	},
	get dir() {
		return dir;
	},
});

setCalendarContext(cal);

const m = $derived(renderForge({ kind: "calendar", preset }));
</script>

<div
	{...rest}
	{...cal.root}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class={cn(className)}
>
	{@render children?.()}
</div>
