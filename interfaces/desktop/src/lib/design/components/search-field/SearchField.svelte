<!--
	@component Search Field
	@kind search-field
	@layer component
	@category interactive
	@description Search input with icon and clear button
	@container false
	@compound true
	@blockCategory form
	@defaultStyle search-field-default
	@styleIds search-field-default, search-field-stark, search-field-glass, search-field-flat, search-field-matte
	@requiredAxes backgroundColor, border, borderRadius, typography, color
	@slots root:all, input:none, icon:none, clear:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import {
	searchFieldAnatomy,
	useSearchField,
} from "$lib/design/behaviors/inputs/search-field/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { SearchFieldProps, SearchFieldSize } from "./types.js";

const SIZE: Record<SearchFieldSize, string> = {
	sm: "h-8 px-3 text-sm",
	md: "h-10 px-4 text-sm",
	lg: "h-12 px-4 text-base",
};

let {
	value,
	onValueChange,
	onClear,
	disabled = false,
	placeholder = "Search...",
	size = "md",
	preset = "default",
	"aria-label": ariaLabel,
	"aria-describedby": ariaDescribedby,
	class: className,
	...rest
}: SearchFieldProps = $props();

const hook = useSearchField({
	get value() {
		return value;
	},
	get onValueChange() {
		return onValueChange;
	},
	get onClear() {
		return onClear;
	},
	get placeholder() {
		return placeholder;
	},
	get disabled() {
		return disabled;
	},
	get "aria-label"() {
		return ariaLabel;
	},
	get "aria-describedby"() {
		return ariaDescribedby;
	},
});

const m = $derived(renderForge({ kind: "search-field", preset }));
</script>

<div
	{...searchFieldAnatomy.attrs.root}
	{...hook.root}
	{...rest}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class={cn("relative flex items-center", className)}
>
	<span
		{...searchFieldAnatomy.attrs.icon}
		{...hook.icon}
		class="absolute left-3 flex items-center pointer-events-none"
	>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 opacity-50">
			<path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd" />
		</svg>
	</span>

	<input
		{...searchFieldAnatomy.attrs.input}
		{...hook.input}
		class={cn(
			"w-full bg-transparent outline-none rounded-md border pl-10",
			"focus-visible:outline-2 focus-visible:outline-offset-2",
			"disabled:pointer-events-none disabled:opacity-50",
			hook.hasValue && "pr-10",
			SIZE[size] ?? SIZE.md)}
	/>

	{#if hook.hasValue}
		<button
			{...searchFieldAnatomy.attrs.clear}
			{...hook.clear}
			class="absolute right-3 flex items-center opacity-50 hover:opacity-100"
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
				<path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
			</svg>
		</button>
	{/if}
</div>
