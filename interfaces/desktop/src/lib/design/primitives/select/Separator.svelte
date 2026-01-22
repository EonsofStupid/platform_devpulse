<!--
  @file primitives/select/Separator.svelte
  @layer primitives

  Select separator - visual divider between items/groups.

  Data Attributes:
  - data-kind="select"
  - data-slot="separator"
-->
<script lang="ts">
  import type { SelectSeparatorProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    class: className = "",
    "data-id": dataId,
    ...rest
  }: SelectSeparatorProps = $props();

  stripStyleProp(rest, "Select.Separator");
</script>

<div
  role="separator"
  class={className}
  data-kind="select"
  data-slot="separator"
  data-id={dataId}
  {...rest}
/>
