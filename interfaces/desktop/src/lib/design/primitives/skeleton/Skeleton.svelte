<!--
	@component Skeleton
	@file primitives/skeleton/Skeleton.svelte
	@kind skeleton
	@layer primitives
	@package @devpulse/coldlight

	Structureless skeleton primitive — loading placeholder with data attributes only.
	Contract: kind="skeleton", slot="root"

	Zero ARIA. Zero behavior. Zero styling. No children.
	- ARIA applied by:    components/skeleton/Skeleton.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/skeleton/contract.ts
-->
<script lang="ts">
	import type { SkeletonProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { class: className, ...rest }: SkeletonProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Skeleton"); });
</script>

<div data-kind="skeleton" data-slot="root" class={cn(className)} {...rest}></div>
