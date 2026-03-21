<!--
	@component Collapsible (Root)
	@kind collapsible
	@layer components

	Disclosure pattern — one trigger toggles one content panel.
	Direct ARIA, no primitive needed.
	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { getRecipe } from "$lib/design/recipes/index.js";
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
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
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

const recipe = getRecipe("collapsible.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept resolved props
const recipeClasses = recipe?.classes?.({} as any) ?? {};

setCollapsibleContext({
	get isOpen() { return isOpen; },
	get disabled() { return disabled; },
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
	get classes() { return recipeClasses; },
	triggerId,
	contentId,
	toggle,
});

const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
}));

const rootClasses = $derived(
	cn(recipeClasses.root, visual.segments, visual.radius, className),
);
</script>

<div
	id={ids?.root}
	{dir}
	data-kind="collapsible"
	data-slot="root"
	data-state={isOpen ? "open" : "closed"}
	data-encoding={visual.encoding || undefined}
	class={rootClasses}
	{...rest}
>
	{@render children?.()}
</div>
