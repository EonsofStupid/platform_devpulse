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
import { cn } from "$lib/design/utils/cn.js";
import { enforceSlot } from "$lib/design/schema/enforce.js";
import { textSpec } from "./text.spec.js";
import type { TextProps } from "./types.js";

let { children, class: className, as = "span", ...rest }: TextProps = $props();

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
