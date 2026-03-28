<!--
  @component HeadingPrimitive
  @kind heading
  @slot root

  Renders semantic <h1>-<h6> based on level prop.
  VPB identifies via data-kind="heading" + data-level.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { HeadingPrimitiveProps } from "./types.js";

let { children, class: className, level = 2, ...rest }: HeadingPrimitiveProps = $props();
</script>

{#if level === 1}
<h1 data-kind="heading" data-slot="root" data-level={level} class={cn(className)} {...rest}>{@render children?.()}</h1>
{:else if level === 2}
<h2 data-kind="heading" data-slot="root" data-level={level} class={cn(className)} {...rest}>{@render children?.()}</h2>
{:else if level === 3}
<h3 data-kind="heading" data-slot="root" data-level={level} class={cn(className)} {...rest}>{@render children?.()}</h3>
{:else if level === 4}
<h4 data-kind="heading" data-slot="root" data-level={level} class={cn(className)} {...rest}>{@render children?.()}</h4>
{:else if level === 5}
<h5 data-kind="heading" data-slot="root" data-level={level} class={cn(className)} {...rest}>{@render children?.()}</h5>
{:else}
<h6 data-kind="heading" data-slot="root" data-level={level} class={cn(className)} {...rest}>{@render children?.()}</h6>
{/if}
