<!--
	@component Input
	@description Structural shell for input primitive. Self-closing element.
	Contract: kind="input", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { InputProps } from "./types.js";

let { class: className, ...rest }: InputProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Input");
</script>

<input
	{...rest}
	data-kind="input"
	data-slot="root"
	class={cn(className)}
/>
