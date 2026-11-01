<!--
	@component BannerRoot
	@file primitives/banner/Banner.svelte
	@kind banner
	@layer primitives
	@package @devpulse/coldlight

	Structureless banner primitive — semantic HTML element with data attributes only.
	Contract: kind="banner", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/banner/Banner.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/banner/contract.ts
-->
<script lang="ts">
	import type { BannerProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: BannerProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Banner.Root");
</script>

<div
	data-kind="banner"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
