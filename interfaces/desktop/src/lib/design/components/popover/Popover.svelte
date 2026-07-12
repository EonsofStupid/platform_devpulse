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
import { popoverAnatomy } from "$lib/design/behaviors/overlays/popover/index.js";
import { usePopover } from "$lib/design/behaviors/overlays/popover/use-popover.svelte.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setPopoverContext } from "./context.js";
import type { PopoverProps } from "./types.js";

let {
	open,
	onOpenChange,
	closeOnEscape = true,
	closeOnOutsideClick = true,
	modal = false,
	preset = "default",
	trigger,
	content,
	children,
	class: className,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledby,
}: PopoverProps = $props();

const hook = usePopover({
	get open() {
		return open;
	},
	onOpenChange: (v) => onOpenChange?.(v),
	get closeOnEscape() {
		return closeOnEscape;
	},
	get closeOnOutsideClick() {
		return closeOnOutsideClick;
	},
	get modal() {
		return modal;
	},
	get "aria-label"() {
		return ariaLabel;
	},
	get "aria-labelledby"() {
		return ariaLabelledby;
	},
});

setPopoverContext({
	get hook() {
		return hook;
	},
});

const m = $derived(renderForge({ kind: "popover", preset }));
</script>

<div data-kind="popover" class={cn("relative inline-block", className)}>
	{#if trigger}
		<button {...popoverAnatomy.attrs.trigger} {...hook.trigger}>
			{@render trigger()}
		</button>
	{/if}

	{#if hook.open}
		<div
				{...popoverAnatomy.attrs.content}
				{...hook.content}
				use:hook.attachContent
				{...m.dataAttrs}
				style={cssVarString(m.cssVars)}
				class="absolute z-50 mt-2 rounded-md border"
			>
				{#if content}
					{@render content()}
				{/if}
			</div>
	{/if}

	{@render children?.()}
</div>
