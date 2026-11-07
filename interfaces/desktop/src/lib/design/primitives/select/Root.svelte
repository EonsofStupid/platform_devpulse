<!--
  @file primitives/select/Root.svelte
  @layer primitives

  Select root - manages open/closed state and selection.

  Data Attributes:
  - data-kind="select"
  - data-slot="root"
  - data-state="open" | "closed"
-->
<script lang="ts">
  import { Select } from "bits-ui";
  import type { SelectRootProps, SelectState } from "./types.js";

  let {
    open = $bindable(false),
    onOpenChange,
    value = $bindable<string | string[] | undefined>(undefined),
    onValueChange,
    type = "single",
    items,
    disabled = false,
    loop = false,
    name,
    required = false,
    children,
    "data-id": dataId,
  }: SelectRootProps = $props();

  const dataState: SelectState = $derived(open ? "open" : "closed");
</script>

<div
  data-kind="select"
  data-slot="root"
  data-state={dataState}
  data-id={dataId}
>
  <Select.Root
    bind:open
    {onOpenChange}
    bind:value
    {onValueChange}
    {type}
    {items}
    {disabled}
    {loop}
    {name}
    {required}
  >
    {#if children}
      {@render children()}
    {/if}
  </Select.Root>
</div>
