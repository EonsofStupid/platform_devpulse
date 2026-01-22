<!--
  @file primitives/select/Trigger.svelte
  @layer primitives

  Select trigger - button that opens the select dropdown.

  ARIA (handled by Bits UI):
  - aria-haspopup="listbox"
  - aria-expanded="true/false"
  - aria-activedescendant (when open)

  Data Attributes:
  - data-kind="select"
  - data-slot="trigger"
-->
<script lang="ts">
  import { Select } from "bits-ui";
  import type { SelectTriggerProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    disabled,
    ...rest
  }: SelectTriggerProps = $props();

  stripStyleProp(rest, "Select.Trigger");
</script>

<Select.Trigger
  class={className}
  data-kind="select"
  data-slot="trigger"
  data-id={dataId}
  {disabled}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Select.Trigger>
