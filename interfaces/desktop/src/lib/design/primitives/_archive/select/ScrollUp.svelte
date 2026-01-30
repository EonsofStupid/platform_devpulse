<!--
  @file primitives/select/ScrollUp.svelte
  @layer primitives

  Select scroll up - indicator shown when content can scroll up.

  Data Attributes:
  - data-kind="select"
  - data-slot="scroll-up"
-->
<script lang="ts">
  import { Select } from "meltui";
  import type { SelectScrollUpProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: SelectScrollUpProps = $props();

  stripStyleProp(rest, "Select.ScrollUp");
</script>

<Select.ScrollUpButton
  class={className}
  data-kind="select"
  data-slot="scroll-up"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Select.ScrollUpButton>
