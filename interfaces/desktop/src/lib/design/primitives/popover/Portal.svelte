<!--
  @file primitives/popover/Portal.svelte
  @layer primitives

  Popover portal - renders children outside DOM hierarchy.

  Data Attributes:
  - data-primitive="popover"
  - data-slot="portal"
-->
<script lang="ts">
  import { Popover } from "bits-ui";
  import type { PopoverPortalProps } from "./types.js";

  let {
    to,
    disabled = false,
    children,
    "data-id": dataId,
  }: PopoverPortalProps = $props();
</script>

<Popover.Portal {to} {disabled}>
  <div
    data-primitive="popover"
    data-slot="portal"
    data-id={dataId}
  >
    {#if children}
      {@render children()}
    {/if}
  </div>
</Popover.Portal>
