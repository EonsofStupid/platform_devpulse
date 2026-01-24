<!--
  @file primitives/sheet/Portal.svelte
  @layer primitives

  Sheet portal - renders children outside DOM hierarchy.

  Data Attributes:
  - data-kind="sheet"
  - data-slot="portal"
-->
<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { SheetPortalProps } from "./types.js";

  let {
    to,
    disabled = false,
    children,
    "data-id": dataId,
  }: SheetPortalProps = $props();
</script>

<Dialog.Portal {to} {disabled}>
  <div
    data-kind="sheet"
    data-slot="portal"
    data-id={dataId}
  >
    {#if children}
      {@render children()}
    {/if}
  </div>
</Dialog.Portal>
