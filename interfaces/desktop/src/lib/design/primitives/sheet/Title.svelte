<!--
  @file primitives/sheet/Title.svelte
  @layer primitives

  Sheet title - accessible heading for the sheet.
  Automatically linked to Content via aria-labelledby.

  Data Attributes:
  - data-primitive="sheet"
  - data-slot="title"
-->
<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { SheetTitleProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    level = 2,
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: SheetTitleProps = $props();

  stripStyleProp(rest, "Sheet.Title");
</script>

<Dialog.Title
  {level}
  class={className}
  data-primitive="sheet"
  data-slot="title"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Dialog.Title>
