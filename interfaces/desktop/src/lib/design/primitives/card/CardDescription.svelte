<!--
	@component CardDescription
	@description Structural shell for card description.
	Contract: kind="card", slot="description", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { CardDescriptionProps } from "./types.js";

let { children, class: className, ...rest }: CardDescriptionProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "CardDescription");
</script>

<p
	{...rest}
	data-kind="card"
	data-slot="description"
	class={cn(className)}
>
	{@render children?.()}
</p>
