<!--
	@component Sheet
	@kind sheet
	@layer components

	Slide-in panel from edge. Hook (ARIA dialog) + StyleMacro (visual).
	Focus trap, scroll lock, dismiss on escape/outside click.

	WAI-ARIA: role="dialog", aria-modal="true"
-->
<script lang="ts">
import { useSheet } from "$lib/design/primitives/sheet/use-sheet.svelte.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { SheetComponentProps, SheetSize, SheetSide } from "./types.js";

const SIZE_CLASSES: Record<SheetSide, Record<SheetSize, string>> = {
	left:   { sm: "w-64", md: "w-80", lg: "w-96", xl: "w-[480px]", full: "w-full" },
	right:  { sm: "w-64", md: "w-80", lg: "w-96", xl: "w-[480px]", full: "w-full" },
	top:    { sm: "h-32", md: "h-48", lg: "h-64", xl: "h-96", full: "h-full" },
	bottom: { sm: "h-32", md: "h-48", lg: "h-64", xl: "h-96", full: "h-full" },
};

const SIDE_CLASSES: Record<SheetSide, string> = {
	left:   "inset-y-0 left-0",
	right:  "inset-y-0 right-0",
	top:    "inset-x-0 top-0",
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
	trigger,
	children,
	class: className,
	...rest
}: SheetComponentProps = $props();

const hook = useSheet({
	get open() { return open; },
	onOpenChange: (v) => onOpenChange?.(v),
	get label() { return label; },
	get side() { return side; },
	get closeOnEscape() { return closeOnEscape; },
	get closeOnOutsideClick() { return closeOnOutsideClick; },
});

const styleId = "sheet-default";
</script>

{#if trigger}
	<button
		{...hook.trigger}
		use:hook.attachTrigger
		data-kind="sheet"
		data-slot="trigger"
	>
		{@render trigger()}
	</button>
{/if}

{#if hook.open}
	<StyleMacro kind="sheet" style={styleId}>
		<div
			{...hook.overlay}
			use:hook.attachOverlay
			data-kind="sheet"
			data-slot="overlay"
			class="fixed inset-0 z-50"
		></div>
		<div
			{...hook.content}
			use:hook.attachContent
			data-kind="sheet"
			data-slot="content"
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
				{...hook.close}
				data-kind="sheet"
				data-slot="close"
				class="absolute top-4 right-4 cursor-pointer opacity-70 hover:opacity-100"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
					stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
					class="size-4" aria-hidden="true">
					<path d="M18 6 6 18" /><path d="m6 6 12 12" />
				</svg>
			</button>
		</div>
	</StyleMacro>
{/if}
