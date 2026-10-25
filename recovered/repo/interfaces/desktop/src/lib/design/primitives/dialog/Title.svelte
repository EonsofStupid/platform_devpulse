<!--
  @file primitives/dialog/Title.svelte
  @layer primitives

  Dialog title - accessible heading for the dialog.
  Automatically linked to Content via aria-labelledby.

  Data Attributes:
  - data-kind="dialog"
  - data-slot="title"
-->
<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { DialogTitleProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    level = 2,
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: DialogTitleProps = $props();

  stripStyleProp(rest, "Dialog.Title");
</script>

<Dialog.Title
  {level}
  class={className}
  data-kind="dialog"
  data-slot="title"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Dialog.Title>
