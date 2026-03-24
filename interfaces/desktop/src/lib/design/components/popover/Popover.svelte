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

const styleId = "popover-default";

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
