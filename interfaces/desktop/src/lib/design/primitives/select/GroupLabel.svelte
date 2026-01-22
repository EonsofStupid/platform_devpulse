<!--
  @file primitives/select/GroupLabel.svelte
  @layer primitives

  Select group label - accessible label for item groups.

  Data Attributes:
  - data-kind="select"
  - data-slot="group-label"
-->
<script lang="ts">
  import { Select } from "bits-ui";
  import type { SelectGroupLabelProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: SelectGroupLabelProps = $props();

  stripStyleProp(rest, "Select.GroupLabel");
</script>

<Select.GroupHeading
  class={className}
  data-kind="select"
  data-slot="group-label"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Select.GroupHeading>
