<!--
	@component AlertTitle
	@description Structural shell for alert title.
	Contract: kind="alert", slot="title", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { AlertTitleProps } from "./types.js";

let { children, class: className, ...rest }: AlertTitleProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AlertTitle");
</script>

<h5
	{...rest}
	data-kind="alert"
	data-slot="title"
	class={cn(className)}
>
	{@render children?.()}
</h5>
