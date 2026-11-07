<!--
	@component ProgressIndicator
	@description Structural shell for progress indicator (fill bar).
	Contract: kind="progress", slot="indicator", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ProgressIndicatorProps } from "./types.js";

let { children, class: className, ...rest }: ProgressIndicatorProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ProgressIndicator");
</script>

<div
	{...rest}
	data-kind="progress"
	data-slot="indicator"
	class={cn(className)}
>
	{@render children?.()}
</div>
