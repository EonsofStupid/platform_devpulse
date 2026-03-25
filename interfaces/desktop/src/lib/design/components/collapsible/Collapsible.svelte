<!--
	@component Collapsible
	@kind collapsible
	@layer component
	@category structural
	@description Disclosure widget that toggles visibility of a single content region
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
	@container true
	@containerSlots content
	@compound true
	@blockCategory layout
	@defaultStyle collapsible-default
	@styleIds collapsible-default
	@requiredAxes border
	@slots root:all, trigger:none, content:none
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
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setCollapsibleContext } from "./context.js";
import type { CollapsibleRootProps } from "./types.js";

let {
	ids,
	open: controlledOpen,
	defaultOpen,
	onOpenChange,
	onExitComplete,
	disabled = false,
	dir = "ltr",
	children,
	class: className,
	...rest
}: CollapsibleRootProps = $props();

let internalOpen = $state(defaultOpen ?? false);
const isOpen = $derived(controlledOpen !== undefined ? controlledOpen : internalOpen);

const fallbackTriggerId = `collapsible-trigger-${Math.random().toString(36).slice(2, 9)}`;
const fallbackContentId = `collapsible-content-${Math.random().toString(36).slice(2, 9)}`;
const triggerId = $derived(ids?.trigger ?? fallbackTriggerId);
const contentId = $derived(ids?.content ?? fallbackContentId);

function toggle() {
	if (disabled) return;
	const next = !isOpen;
	internalOpen = next;
	onOpenChange?.({ open: next });
}

setCollapsibleContext({
	get isOpen() { return isOpen; },
	get disabled() { return disabled; },
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
	get triggerId() { return triggerId; },
	get contentId() { return contentId; },
	toggle,
});
</script>

<StyleMacro kind="collapsible" style="collapsible-default">
	<div
		id={ids?.root}
		{dir}
		data-kind="collapsible"
		data-slot="root"
		data-state={isOpen ? "open" : "closed"}
		class={cn(className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
