<!--
	@component CommandInput
	@description Structural shell for command search input.
	Contract: kind="command", slot="input", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { CommandInputProps } from "./types.js";

let { class: className, ...rest }: CommandInputProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "CommandInput");
</script>

<input
	{...rest}
	data-kind="command"
	data-slot="input"
	class={cn(className)}
/>
