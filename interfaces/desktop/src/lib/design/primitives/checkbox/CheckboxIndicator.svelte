<!--
	@component CheckboxIndicator
	@description Structural shell for checkbox indicator.
	Contract: kind="checkbox", slot="indicator", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { CheckboxIndicatorProps } from "./types.js";
	import { getCheckboxContext } from "./context.js";

	let { children, class: className, ...rest }: CheckboxIndicatorProps = $props();
	const ctx = getCheckboxContext();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "CheckboxIndicator");

	function dataState(): string | undefined {
		if (ctx.indeterminate) return "indeterminate";
		if (ctx.checked) return "checked";
		return undefined;
	}
</script>

<span
	{...rest}
	data-kind="checkbox"
	data-slot="indicator"
	data-state={dataState()}
	class={cn(className)}
>
	{@render children?.()}
</span>
