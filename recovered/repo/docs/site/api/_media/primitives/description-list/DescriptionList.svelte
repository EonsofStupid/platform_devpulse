<!--
	@component DescriptionList
	@file primitives/description-list/DescriptionList.svelte
	@kind description-list
	@layer primitives
	@package @devpulse/coldlight

	Structureless description-list primitive — semantic HTML element with data attributes only.
	Contract: kind="description-list", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/description-list/DescriptionList.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/description-list/contract.ts
-->
<script lang="ts">
	import type { DescriptionListProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: DescriptionListProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "DescriptionList");
</script>

<dl data-kind="description-list" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</dl>
