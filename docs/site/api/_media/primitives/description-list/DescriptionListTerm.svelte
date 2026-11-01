<!--
	@component DescriptionListTerm
	@file primitives/description-list/DescriptionListTerm.svelte
	@kind description-list
	@layer primitives
	@package @devpulse/coldlight

	Structureless description-list term primitive — semantic HTML element with data attributes only.
	Contract: kind="description-list", slot="term"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/description-list/DescriptionList.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/description-list/contract.ts
-->
<script lang="ts">
	import type { DescriptionListTermProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: DescriptionListTermProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "DescriptionListTerm");
</script>

<dt data-kind="description-list" data-slot="term" class={cn(className)} {...rest}>
	{@render children?.()}
</dt>
