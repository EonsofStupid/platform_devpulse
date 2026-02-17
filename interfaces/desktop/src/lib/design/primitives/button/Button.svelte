<!--
	@component ButtonRoot
	@description Structureless button — semantic HTML element with data attributes.
	Contract: kind="button", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	Component layer adds ARIA, state, and recipes.
-->
<script lang="ts">
	import type { ButtonRootProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: ButtonRootProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Button.Root");
</script>

<button
	data-kind="button"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</button>
