<!--
	@component InputGroup
	@kind input-group
	@layer components
	Hook (ARIA) + StyleMacro (visual).
-->
<script lang="ts">
import { useInputGroup } from "$lib/design/primitives/input-group/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { InputGroupComponentProps } from "./types.js";
let { size = "md", disabled = false, prefix, suffix, children, class: className, ...rest }: InputGroupComponentProps = $props();
const ig = $derived(useInputGroup({ disabled }));
const styleId = "input-group-default";
</script>
<StyleMacro kind="input-group" style={styleId}>
	<div {...ig.root} data-kind="input-group" data-slot="root" class={cn("flex items-center rounded-md border", disabled && "opacity-50 pointer-events-none", className)} {...rest}>
		{#if prefix}<div data-kind="input-group" data-slot="prefix" class="flex items-center px-3">{@render prefix()}</div>{/if}
		<div data-kind="input-group" data-slot="input" class="flex-1 min-w-0">{@render children?.()}</div>
		{#if suffix}<div data-kind="input-group" data-slot="suffix" class="flex items-center px-3">{@render suffix()}</div>{/if}
	</div>
</StyleMacro>
