<!--
  @file primitives/dialog/Close.svelte
  @layer primitives

  Dialog close - button that closes the dialog.

  Data Attributes:
  - data-kind="dialog"
  - data-slot="close"
-->
<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { DialogCloseProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: DialogCloseProps = $props();

  stripStyleProp(rest, "Dialog.Close");
</script>

<Dialog.Close
  class={className}
  data-kind="dialog"
  data-slot="close"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Dialog.Close>
