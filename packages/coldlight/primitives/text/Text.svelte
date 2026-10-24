<!--
  @component Text
  @kind text
  @layer primitive
  @category display
  @description Polymorphic text element. Renders as span, p, strong, em, small, or div.
  @element svelte:element
  @slots root
  @spec text.spec.ts
-->
<script lang="ts">
import { enforceSlot } from "#coldlight/schema/enforce.js";
import { cn } from "#coldlight/utils/cn.js";
import { textSpec } from "./text.spec.js";
import type { TextPrimitiveProps } from "./types.js";

let { children, class: className, as = "span", ...rest }: TextPrimitiveProps = $props();

let rootEl: HTMLElement | undefined = $state();

$effect(() => {
	if (import.meta.env.DEV && rootEl) {
		enforceSlot(rootEl, textSpec, "root");
	}
});
</script>

<svelte:element
	this={as}
	bind:this={rootEl}
	data-kind="text"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</svelte:element>
