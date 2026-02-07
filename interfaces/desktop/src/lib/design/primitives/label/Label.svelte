<!--
	@component Label
	@description Structural shell for label primitive.
	Contract: kind="label", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { LabelProps } from "./types.js";

let { children, class: className, ...rest }: LabelProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Label");
</script>

<label
	{...rest}
	data-kind="label"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</label>
