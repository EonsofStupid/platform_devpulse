<!--
	@component AlertDescription
	@description Structural shell for alert description.
	Contract: kind="alert", slot="description", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { AlertDescriptionProps } from "./types.js";

	let { children, class: className, ...rest }: AlertDescriptionProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AlertDescription");
</script>

<div
	{...rest}
	data-kind="alert"
	data-slot="description"
	class={cn(className)}
>
	{@render children?.()}
</div>
