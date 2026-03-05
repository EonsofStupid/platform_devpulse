<!--
	@component Sidebar
	@kind sidebar
	@layer components
	ColdLight Sidebar — builder-driven. Builder owns ARIA. Component adds recipe.
	Compound: root / trigger / header / content / footer slots.
-->
<script lang="ts">
	import type { SidebarComponentProps } from "./types.js";
	import { createSidebar } from "$lib/design/api/dsadapters/coldlight/_internal/sidebar/index.js";
	import SidebarRoot from "$lib/design/primitives/sidebar/Sidebar.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { sidebarRecipe } from "./recipe.js";

	let {
		size = "md",
		expanded = true,
		onExpandedChange,
		label,
		header,
		footer,
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
		...rest
	}: SidebarComponentProps = $props();

	const builder = createSidebar({
		get expanded() { return expanded; },
		onExpandedChange: (v: boolean) => onExpandedChange?.(v),
		get label() { return label; },
	});

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const classes = $derived(cn(sidebarRecipe({ size, expanded: builder.expanded }), visual.segments, visual.radius, className));
</script>

<SidebarRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{#if header}
		<div {...builder.header} data-kind="sidebar" data-slot="header">
			{@render header()}
		</div>
	{/if}

	<div {...builder.content} data-kind="sidebar" data-slot="content" class="flex-1 overflow-y-auto">
		{@render children?.()}
	</div>

	{#if footer}
		<div {...builder.footer} data-kind="sidebar" data-slot="footer">
			{@render footer()}
		</div>
	{/if}
</SidebarRoot>
