<!--
	@component Button
	@description Structural shell for button primitive.
	Contract: kind="button", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { aria } from "$lib/design/api/actions/index.js";
import { contract } from "$lib/design/taxonomy/kinds/primitives/button/contract.js";
import { cn, stripStyleProp } from "../types.js";
import type { ButtonProps } from "./types.js";

let {
	disabled = false,
	pressed,
	loading = false,
	children,
	class: className,
	...rest
}: ButtonProps = $props();

const ariaState = $derived({
	disabled,
	pressed,
	busy: loading,
});

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Button");
</script>

<button
	{...rest}
	data-kind="button"
	data-slot="root"
	data-state={loading ? "loading" : pressed ? "pressed" : undefined}
	class={cn(className)}
	disabled={disabled || undefined}
	use:aria={{ contract, slot: "root", state: ariaState }}
>
	{@render children?.()}
</button>
