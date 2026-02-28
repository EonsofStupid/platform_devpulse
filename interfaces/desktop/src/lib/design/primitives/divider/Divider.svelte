<!--
	@component Divider
	@file primitives/divider/Divider.svelte
	@kind divider
	@layer primitives
	@package @devpulse/coldlight

	Structureless divider primitive — semantic HTML element with data attributes only.
	Contract: kind="divider", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/divider/Divider.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/divider/contract.ts
-->
<script lang="ts">
	import type { DividerProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { class: className, ...rest }: DividerProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Divider"); });
</script>

<hr data-kind="divider" data-slot="root" class={cn(className)} {...rest} />
