<!--
	@component Sheet
	@kind sheet
	@layer components
	ColdLight Sheet — builder-driven. Builder owns ARIA. Component adds recipe.
	Compound: trigger / overlay / content / close slots.
-->
<script lang="ts">
	import type { SheetComponentProps } from "./types.js";
	import { createSheet } from "$lib/design/api/adapters/coldlight/_internal/sheet/index.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { sheetRecipe, sheetOverlayRecipe } from "./recipe.js";

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

	const builder = createSheet({
		get open() { return open; },
		onOpenChange: (v: any) => onOpenChange?.(v),
		get label() { return label; },
		get side() { return side; },
		get closeOnEscape() { return closeOnEscape; },
		get closeOnOutsideClick() { return closeOnOutsideClick; },
	});

	const contentClasses = $derived(cn(sheetRecipe({ size, side }), className));
	const overlayClasses = $derived(cn(sheetOverlayRecipe()));
</script>

<button {...builder.trigger} data-kind="sheet" data-slot="trigger">
	{@render trigger?.()}
</button>

{#if builder.open}
	<div {...builder.overlay} class={overlayClasses} data-kind="sheet" data-slot="overlay"></div>
	<div {...builder.content} {...rest} class={contentClasses} data-kind="sheet" data-slot="content">
		{@render children?.()}
		<button {...builder.close} class="absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus" data-kind="sheet" data-slot="close">
			<span aria-hidden="true">&times;</span>
		</button>
	</div>
{/if}
