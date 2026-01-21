<!--
  @file primitives/dialog/Description.svelte
  @layer primitives

  Dialog description - accessible description for the dialog.
  Automatically linked to Content via aria-describedby.

  Data Attributes:
  - data-primitive="dialog"
  - data-slot="description"
-->
<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { DialogDescriptionProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: DialogDescriptionProps = $props();

  stripStyleProp(rest, "Dialog.Description");
</script>

<Dialog.Description
  class={className}
  data-primitive="dialog"
  data-slot="description"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Dialog.Description>
