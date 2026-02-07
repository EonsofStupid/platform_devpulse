<!--
	@component Progress
	@description Structural shell for progress primitive (track).
	Contract: kind="progress", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ProgressProps } from "./types.js";

let { children, class: className, ...rest }: ProgressProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Progress");
</script>

<div
	{...rest}
	data-kind="progress"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</div>
