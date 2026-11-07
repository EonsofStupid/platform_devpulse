<!--
	@component ButtonLabel
	@description Structural shell for button label text.
	Contract: kind="button", slot="label", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ButtonLabelProps } from "./types.js";

let { children, class: className, ...rest }: ButtonLabelProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ButtonLabel");
</script>

<span
	{...rest}
	data-kind="button"
	data-slot="label"
	class={cn(className)}
>
	{@render children?.()}
</span>
