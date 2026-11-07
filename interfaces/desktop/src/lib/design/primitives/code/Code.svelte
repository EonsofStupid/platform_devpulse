<!--
	@component Code
	@file primitives/code/Code.svelte
	@kind code
	@layer primitives
	@package @devpulse/coldlight

	Structureless code primitive — semantic HTML element with data attributes only.
	Contract: kind="code", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/code/Code.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/code/contract.ts
-->
<script lang="ts">
	import type { CodeProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: CodeProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Code"); });
</script>

<code data-kind="code" data-slot="root" class={cn(className)} {...rest}>{@render children?.()}</code>
