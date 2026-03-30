<!--
	@component Sheet
	@kind sheet
	@layer component
	@category structural
	@description Slide-in panel from a screen edge for secondary content or navigation
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
	@container true
	@containerSlots content, footer
	@compound true
	@blockCategory layout
	@defaultStyle sheet-default
	@styleIds sheet-default
	@requiredAxes backgroundColor, shadow, border
	@slots root:all, overlay:none, content:none, header:none, body:none, footer:none, close:none
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
import { useSheet } from "$lib/design/behaviors/sheet/use-sheet.svelte.js";
import { sheetAnatomy } from "$lib/design/primitives/sheet/index.js";
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import type { SheetComponentProps, SheetSide, SheetSize } from "./types.js";

const SIZE_CLASSES: Record<SheetSide, Record<SheetSize, string>> = {
	left: { sm: "w-64", md: "w-80", lg: "w-96", xl: "w-[480px]", full: "w-full" },
	right: { sm: "w-64", md: "w-80", lg: "w-96", xl: "w-[480px]", full: "w-full" },
	top: { sm: "h-32", md: "h-48", lg: "h-64", xl: "h-96", full: "h-full" },
	bottom: { sm: "h-32", md: "h-48", lg: "h-64", xl: "h-96", full: "h-full" },
};

const SIDE_CLASSES: Record<SheetSide, string> = {
	left: "inset-y-0 left-0",
	right: "inset-y-0 right-0",
	top: "inset-x-0 top-0",
	bottom: "inset-x-0 bottom-0",
};

let {
	size = "md",
	side = "right",
	open = false,
	onOpenChange,
	label,
	closeOnEscape = true,
	closeOnOutsideClick = true,
	preset = "default",
	trigger,
	children,
	class: className,
	...rest
}: SheetComponentProps = $props();

const hook = useSheet({
	get open() {
		return open;
	},
	onOpenChange: (v) => onOpenChange?.(v),
	get side() {
		return side;
	},
	get closeOnEscape() {
		return closeOnEscape;
	},
	get closeOnOutsideClick() {
		return closeOnOutsideClick;
	},
});

const m = $derived(resolveMacro({ kind: "sheet", preset }));
</script>

{#if trigger}
	<button
		{...sheetAnatomy.attrs.trigger}
		{...hook.trigger}
		use:hook.attachTrigger
		{...m.dataAttrs}
	>
		{@render trigger()}
	</button>
{/if}

{#if hook.open}
		<div
			{...sheetAnatomy.attrs.overlay}
			{...hook.overlay}
			use:hook.attachOverlay
			{...m.dataAttrs}
			class="fixed inset-0 z-50"
		></div>
		<div
			{...sheetAnatomy.attrs.content}
			{...hook.content}
			use:hook.attachContent
			{...rest}
			{...m.dataAttrs}
			style={cssVarString(m.cssVars)}
			data-side={side}
			class={cn(
				"fixed z-50 flex flex-col",
				SIDE_CLASSES[side],
				SIZE_CLASSES[side]?.[size] ?? SIZE_CLASSES.right.md,
				className)}
			{...rest}
		>
			{@render children?.()}
			<button
				{...sheetAnatomy.attrs.close}
				{...hook.close}
				{...m.dataAttrs}
				class="absolute top-4 end-4 cursor-pointer opacity-70 hover:opacity-100"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
					stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
					class="size-4" aria-hidden="true">
					<path d="M18 6 6 18" /><path d="m6 6 12 12" />
				</svg>
			</button>
		</div>
{/if}
