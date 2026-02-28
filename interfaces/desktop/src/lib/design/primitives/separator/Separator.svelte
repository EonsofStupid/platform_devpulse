<!--
	@component Separator
	@file primitives/separator/Separator.svelte
	@kind separator
	@layer primitives
	@package @devpulse/coldlight

	Structureless separator primitive — semantic HTML element with data attributes only.
	Contract: kind="separator", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/separator/Separator.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/separator/contract.ts
-->
<script lang="ts">
	import type { SeparatorProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { class: className, ...rest }: SeparatorProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Separator"); });
</script>

<hr data-kind="separator" data-slot="root" class={cn(className)} {...rest} />
