<!--
  @file primitives/select/Portal.svelte
  @layer primitives

  Select portal - renders children outside DOM hierarchy.

  Data Attributes:
  - data-kind="select"
  - data-slot="portal"
-->
<script lang="ts">
  import { Select } from "bits-ui";
  import type { SelectPortalProps } from "./types.js";

  let {
    to,
    disabled = false,
    children,
    "data-id": dataId,
  }: SelectPortalProps = $props();
</script>

<Select.Portal {to} {disabled}>
  <div
    data-kind="select"
    data-slot="portal"
    data-id={dataId}
  >
    {#if children}
      {@render children()}
    {/if}
  </div>
</Select.Portal>
