<!--
  @file primitives/select/Viewport.svelte
  @layer primitives

  Select viewport - scrollable container for items.

  Data Attributes:
  - data-kind="select"
  - data-slot="viewport"
-->
<script lang="ts">
  import { Select } from "bits-ui";
  import type { SelectViewportProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: SelectViewportProps = $props();

  stripStyleProp(rest, "Select.Viewport");
</script>

<Select.Viewport
  class={className}
  data-kind="select"
  data-slot="viewport"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Select.Viewport>
