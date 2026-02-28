<!--
	@component Spacer
	@file primitives/spacer/Spacer.svelte
	@kind spacer
	@layer primitives
	@package @devpulse/coldlight

	Structureless spacer primitive — presentational element with data attributes only.
	Contract: kind="spacer", slot="root"

	Zero ARIA. Zero behavior. Zero styling. No children.
	- ARIA applied by:    components/spacer/Spacer.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/spacer/contract.ts
-->
<script lang="ts">
	import type { SpacerProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { class: className, ...rest }: SpacerProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Spacer"); });
</script>

<div data-kind="spacer" data-slot="root" class={cn(className)} {...rest}></div>
