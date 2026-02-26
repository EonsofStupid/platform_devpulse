<!--
	@component SearchInputRoot
	@file primitives/search-input/SearchInput.svelte
	@kind search-input
	@layer primitives
	@package @devpulse/coldlight

	Structureless search-input primitive — semantic HTML element with data attributes only.
	Contract: kind="search-input", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/search-input/SearchInput.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/search-input/contract.ts
-->
<script lang="ts">
	import type { SearchInputRootProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: SearchInputRootProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "SearchInput");
</script>

<div data-kind="search-input" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
