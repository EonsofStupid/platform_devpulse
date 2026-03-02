<!--
	@component SearchInput
	@kind search-input
	@layer components

	ColdLight SearchInput — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.

	Compound builder with slots: root, input, icon, clear.
	WAI-ARIA: search landmark + searchbox role.
-->
<script lang="ts">
	import type { SearchInputComponentProps } from "./types.js";
	import { createSearchInput } from "$lib/design/api/adapters/coldlight/_internal/search-input/index.js";
	import SearchInputRoot from "$lib/design/primitives/search-input/SearchInput.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import {
		searchInputRecipe,
		searchInputInputRecipe,
		searchInputIconRecipe,
		searchInputClearRecipe,
	} from "./recipe.js";

	let {
		size = "md",
		value = "",
		onValueChange,
		onClear,
		disabled = false,
		placeholder = "Search...",
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
	}: SearchInputComponentProps = $props();

	const builder = createSearchInput({
		value: () => value,
		onValueChange: (v: any) => onValueChange?.(v),
		onClear: () => onClear?.(),
		disabled: () => disabled,
		get placeholder() { return placeholder; },
		get "aria-label"() { return rest["aria-label"] ?? "Search"; },
		get "aria-describedby"() { return rest["aria-describedby"]; },
	});

	// Resolve ColdLight visual props
	const visual = useColdLight(
		() => ({
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
		}),
	);

	const rootClasses = $derived(cn(searchInputRecipe({ size }), visual.segments, visual.radius, className));
	const inputClasses = $derived(cn(searchInputInputRecipe()));
	const iconClasses = $derived(cn(searchInputIconRecipe({ size })));
	const clearClasses = $derived(cn(searchInputClearRecipe({ size })));
</script>

<SearchInputRoot {...builder.root} {...rest} class={rootClasses} data-encoding={visual.encoding || undefined}>
	<span {...builder.icon} class={iconClasses}>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-full h-full">
			<path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
		</svg>
	</span>
	<input {...builder.input} class={inputClasses} />
	<button {...builder.clear} class={clearClasses}>
		<span aria-hidden="true">&times;</span>
	</button>
	{@render children?.()}
</SearchInputRoot>
