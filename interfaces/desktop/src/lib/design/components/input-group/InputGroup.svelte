<!--
	@component Input Group
	@kind input-group
	@layer component
	@category structural
	@description Container that visually and semantically groups an input with addons like icons or buttons
	@container true
	@containerSlots root
	@compound true
	@blockCategory form
	@defaultStyle input-group-default
	@styleIds input-group-default
	@requiredAxes border, borderRadius
	@slots root:all, prepend:none, input:none, append:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { useInputGroup } from "$lib/design/behaviors/input-group/index.js";
import { inputGroupAnatomy } from "$lib/design/primitives/input-group/index.js";
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import type { InputGroupComponentProps } from "./types.js";

let {
	preset = "default",
	size = "md",
	disabled = false,
	prefix,
	suffix,
	children,
	class: className,
	...rest
}: InputGroupComponentProps = $props();
const ig = $derived(useInputGroup({ disabled }));
const m = $derived(resolveMacro({ kind: "input-group", preset }));
</script>
<div {...inputGroupAnatomy.attrs.root} {...ig.root} {...m.dataAttrs} style={cssVarString(m.cssVars)} class={cn("flex items-center rounded-md border", disabled && "opacity-50 pointer-events-none", className)} {...rest}>
	{#if prefix}<div data-kind="input-group" data-slot="prefix" class="flex items-center px-3">{@render prefix()}</div>{/if}
	<div data-kind="input-group" data-slot="input" class="flex-1 min-w-0">{@render children?.()}</div>
	{#if suffix}<div data-kind="input-group" data-slot="suffix" class="flex items-center px-3">{@render suffix()}</div>{/if}
</div>
