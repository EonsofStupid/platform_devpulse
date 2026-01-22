<!--
  @file primitives/select/ItemText.svelte
  @layer primitives

  Select item text - text wrapper for custom item content.
  ColdLight owns this component - no bits-ui equivalent.

  Data Attributes:
  - data-kind="select"
  - data-slot="item-text"
-->
<script lang="ts">
  import type { SelectItemTextProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: SelectItemTextProps = $props();

  stripStyleProp(rest, "Select.ItemText");
</script>

<span
  class={className}
  data-kind="select"
  data-slot="item-text"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</span>
