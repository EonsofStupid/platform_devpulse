<!--
	@component RadioGroupIndicator
	@description Structural shell for radio-group indicator.
	Contract: kind="radio-group", slot="indicator", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { getRadioGroupItemContext } from "./context.js";
import type { RadioGroupIndicatorProps } from "./types.js";

let { children, class: className, ...rest }: RadioGroupIndicatorProps = $props();
const itemCtx = getRadioGroupItemContext();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "RadioGroupIndicator");
</script>

<span
	{...rest}
	data-kind="radio-group"
	data-slot="indicator"
	data-state={itemCtx.checked ? "checked" : undefined}
	class={cn(className)}
>
	{@render children?.()}
</span>
