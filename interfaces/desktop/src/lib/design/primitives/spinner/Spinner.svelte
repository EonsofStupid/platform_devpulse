<!--
	@component Spinner
	@description Structural shell for spinner primitive.
	Contract: kind="spinner", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { SpinnerProps } from "./types.js";

	let { children, class: className, ...rest }: SpinnerProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Spinner");
</script>

<span
	{...rest}
	data-kind="spinner"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</span>
