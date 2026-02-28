<!--
	@component DescriptionListDetail
	@file primitives/description-list/DescriptionListDetail.svelte
	@kind description-list
	@layer primitives
	@package @devpulse/coldlight

	Structureless description-list detail primitive — semantic HTML element with data attributes only.
	Contract: kind="description-list", slot="detail"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/description-list/DescriptionList.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/description-list/contract.ts
-->
<script lang="ts">
	import type { DescriptionListDetailProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: DescriptionListDetailProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "DescriptionListDetail"); });
</script>

<dd data-kind="description-list" data-slot="detail" class={cn(className)} {...rest}>
	{@render children?.()}
</dd>
