<!--
	@component Checkbox
	@description Structural shell for checkbox primitive.
	Contract: kind="checkbox", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { CheckboxProps } from "./types.js";
	import { setCheckboxContext } from "./context.js";

	let {
		checked = $bindable(false),
		indeterminate = $bindable(false),
		children,
		class: className,
		...rest
	}: CheckboxProps = $props();

	setCheckboxContext({
		get checked() {
			return checked;
		},
		get indeterminate() {
			return indeterminate;
		},
	});

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Checkbox");

	function dataState(): string | undefined {
		if (indeterminate) return "indeterminate";
		if (checked) return "checked";
		return undefined;
	}
</script>

<button
	{...rest}
	data-kind="checkbox"
	data-slot="root"
	data-state={dataState()}
	class={cn(className)}
>
	{@render children?.()}
</button>
