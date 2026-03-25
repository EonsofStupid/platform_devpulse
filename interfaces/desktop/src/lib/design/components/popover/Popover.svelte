<!--
	@component Popover
	@kind popover
	@layer component
	@category structural
	@description Floating panel anchored to a trigger element for displaying contextual content
	@container true
	@containerSlots content
	@compound true
	@blockCategory layout
	@defaultStyle popover-default
	@styleIds popover-default
	@requiredAxes backgroundColor, border, borderRadius, shadow
	@slots root:all, trigger:none, content:none, arrow:none, close:none
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
import { usePopover } from "$lib/design/primitives/popover/use-popover.svelte.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setPopoverContext } from "./context.js";
import type { PopoverProps } from "./types.js";

let {
	open,
	onOpenChange,
	closeOnEscape = true,
	closeOnOutsideClick = true,
	intent = "default",
	trigger,
	content,
	children,
	class: className,
}: PopoverProps = $props();

const hook = usePopover({
	get open() { return open; },
	onOpenChange: (v) => onOpenChange?.(v),
	get closeOnEscape() { return closeOnEscape; },
	get closeOnOutsideClick() { return closeOnOutsideClick; },
});

const styleId = $derived(`popover-${intent}`);

setPopoverContext({
	get hook() { return hook; },
});
</script>

<div data-kind="popover" data-slot="root" class={cn("relative inline-block", className)}>
	{#if trigger}
		<button {...hook.trigger} data-kind="popover" data-slot="trigger">
			{@render trigger()}
		</button>
	{/if}

	{#if hook.open}
		<StyleMacro kind="popover" style={styleId}>
			<div
				{...hook.content}
				use:hook.attachContent
				data-kind="popover"
				data-slot="content"
				data-state="open"
				class="absolute z-50 mt-2 rounded-md border"
			>
				{#if content}
					{@render content()}
				{/if}
			</div>
		</StyleMacro>
	{/if}

	{@render children?.()}
</div>
