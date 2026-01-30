<!--
  @file primitives/dialog/Portal.svelte
  @layer primitives

  Dialog portal - renders children outside DOM hierarchy.

  Data Attributes:
  - data-kind="dialog"
  - data-slot="portal"
-->
<script lang="ts">
  import { Dialog } from "meltui";
  import type { DialogPortalProps } from "./types.js";

  let {
    to,
    disabled = false,
    children,
    "data-id": dataId,
  }: DialogPortalProps = $props();
</script>

<Dialog.Portal {to} {disabled}>
  <div
    data-kind="dialog"
    data-slot="portal"
    data-id={dataId}
  >
    {#if children}
      {@render children()}
    {/if}
  </div>
</Dialog.Portal>
