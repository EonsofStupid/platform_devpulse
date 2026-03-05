<!--
	@component NavItem
	@kind nav-item
	@layer components

	ColdLight NavItem — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA. useColdLight() resolves visual props.
-->
<script lang="ts">
	import type { NavItemComponentProps } from "./types.js";
	import { createNavItem } from "$lib/design/api/dsadapters/coldlight/_internal/nav-item/index.js";
	import NavItemRoot from "$lib/design/primitives/nav-item/NavItem.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { navItemRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		active = false,
		disabled = false,
		href,
		size = "md",
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
		// Rest spread
		...rest
	}: NavItemComponentProps = $props();

	const builder = createNavItem({
		active: () => active,
		disabled: () => disabled,
		href: () => href,
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? (active ? "nav-active" : "nav-item"),
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const classes = $derived(
		cn(navItemRecipe({ size }), visual.segments, visual.radius, className),
	);

	const dataState = $derived(
		disabled ? "disabled" : active ? "active" : "idle",
	);
</script>

<NavItemRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-state={dataState}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</NavItemRoot>
