<!--
  @file primitives/alert-dialog/Title.svelte
  @layer primitives

  AlertDialog title - accessible heading for the alert dialog.
  Automatically linked to Content via aria-labelledby.

  Data Attributes:
  - data-kind="alert-dialog"
  - data-slot="title"
-->
<script lang="ts">
  import { AlertDialog } from "bits-ui";
  import type { AlertDialogTitleProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    level = 2,
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: AlertDialogTitleProps = $props();

  stripStyleProp(rest, "AlertDialog.Title");
</script>

<AlertDialog.Title
  {level}
  class={className}
  data-kind="alert-dialog"
  data-slot="title"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</AlertDialog.Title>
