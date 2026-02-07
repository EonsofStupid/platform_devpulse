<!--
	@component Skeleton
	@description Structural shell for skeleton primitive.
	Contract: kind="skeleton", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { SkeletonProps } from "./types.js";

let { children, class: className, ...rest }: SkeletonProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Skeleton");
</script>

<div
	{...rest}
	data-kind="skeleton"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</div>
