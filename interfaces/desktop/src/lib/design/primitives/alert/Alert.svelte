<!--
	@component Alert
	@description Structural shell for alert primitive (root container).
	Contract: kind="alert", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { AlertProps } from "./types.js";

	let { children, class: className, ...rest }: AlertProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Alert");
</script>

<div
	{...rest}
	data-kind="alert"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</div>
