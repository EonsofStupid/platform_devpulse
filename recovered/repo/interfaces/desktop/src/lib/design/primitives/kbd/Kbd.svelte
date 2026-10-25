<!--
	@component Kbd
	@file primitives/kbd/Kbd.svelte
	@kind kbd
	@layer primitives
	@package @devpulse/coldlight

	Keyboard key indicator primitive — semantic HTML element with data attributes only.
	Contract: kind="kbd", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/kbd/Kbd.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/kbd/contract.ts
-->
<script lang="ts">
	import type { KbdProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: KbdProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Kbd"); });
</script>

<kbd data-kind="kbd" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</kbd>
