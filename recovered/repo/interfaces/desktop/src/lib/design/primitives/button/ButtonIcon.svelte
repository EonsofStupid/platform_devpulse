<!--
	@component ButtonIcon
	@description Structural shell for button icon slot.
	Contract: kind="button", slot="icon", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ButtonIconProps } from "./types.js";

let { children, class: className, ...rest }: ButtonIconProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ButtonIcon");
</script>

<span
	{...rest}
	data-kind="button"
	data-slot="icon"
	class={cn(className)}
>
	{@render children?.()}
</span>
