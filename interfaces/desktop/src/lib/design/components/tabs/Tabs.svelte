<!--
	@component Tabs
	@kind tabs
	@layer components

	ColdLight Tabs root — creates ColdLightTabs adapter and provides via context.
	Compound component: sub-components consume context to render slots.

	ColdLight OWNS all ARIA. No MeltUI dependency.
	Reference: WAI-ARIA APG Tabs Pattern
-->
<script lang="ts">
	import type { TabsProps } from "./types.js";
	import { ColdLightTabs } from "$lib/design/api/dsadapters/coldlight/_internal/tabs/tabs.svelte.js";
	import { setTabsContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { getRecipe } from "$lib/design/recipes/index.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";

	let {
		value = "",
		onValueChange,
		orientation = "horizontal",
		activateOnFocus = true,
		loop = true,
		children,
		class: className,
		// ColdLight 8-axis props
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
		size,
		...rest
	}: TabsProps = $props();

	const tabs = new ColdLightTabs({
		value: () => value,
		onValueChange: (v) => onValueChange?.(v),
		orientation: () => orientation,
		activateOnFocus: () => activateOnFocus,
		loop: () => loop,
	});

	setTabsContext(tabs);

	const recipe = getRecipe("tabs.glass.void");
	const rootClass = recipe?.classes?.({} as any)?.root ?? "";

	const visual = useColdLight(() => ({ preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius, size }));
</script>

<div
	{...tabs.root}
	class={cn(rootClass, visual.segments, visual.radius, className)}
	data-kind="tabs"
	data-slot="root"
	data-encoding={visual.encoding || undefined}
	{...rest}
>
	{@render children?.()}
</div>
