<!--
	@component RadioGroup
	@description Structural shell for radio-group primitive.
	Contract: kind="radio-group", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { setRadioGroupContext } from "./context.js";
import type { RadioGroupProps } from "./types.js";

let {
	value = $bindable(undefined),
	children,
	class: className,
	...rest
}: RadioGroupProps = $props();

setRadioGroupContext({
	get value() {
		return value;
	},
});

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "RadioGroup");
</script>

<div
	{...rest}
	data-kind="radio-group"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</div>
