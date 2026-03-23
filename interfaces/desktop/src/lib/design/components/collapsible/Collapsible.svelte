<!--
	@component Collapsible (Root)
	@kind collapsible
	@layer components

	Disclosure pattern — one trigger toggles one content panel.
	Direct ARIA, no primitive needed.
	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setCollapsibleContext } from "./context.js";
import type { CollapsibleRootProps } from "./types.js";

let {
	ids,
	open: controlledOpen,
	defaultOpen = false,
	onOpenChange,
	onExitComplete,
	disabled = false,
	dir = "ltr",
	children,
	class: className,
	...rest
}: CollapsibleRootProps = $props();

let internalOpen = $state(defaultOpen);
const isOpen = $derived(controlledOpen !== undefined ? controlledOpen : internalOpen);

const triggerId = ids?.trigger ?? `collapsible-trigger-${Math.random().toString(36).slice(2, 9)}`;
const contentId = ids?.content ?? `collapsible-content-${Math.random().toString(36).slice(2, 9)}`;

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
	triggerId,
	contentId,
	toggle,
});

const rootClasses = $derived(
	cn(className));
</script>

<StyleMacro kind="collapsible" style="collapsible-default">
	<div
		id={ids?.root}
		{dir}
		data-kind="collapsible"
		data-slot="root"
		data-state={isOpen ? "open" : "closed"}
		class={rootClasses}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
