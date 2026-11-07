<!--
  @file primitives/alert-dialog/Description.svelte
  @layer primitives

  AlertDialog description - accessible description for the alert dialog.
  Automatically linked to Content via aria-describedby.

  Data Attributes:
  - data-kind="alert-dialog"
  - data-slot="description"
-->
<script lang="ts">
import { AlertDialog } from "meltui";
import { stripStyleProp } from "../types.js";
import type { AlertDialogDescriptionProps } from "./types.js";

let {
	children,
	class: className = "",
	"data-id": dataId,
	...rest
}: AlertDialogDescriptionProps = $props();

stripStyleProp(rest, "AlertDialog.Description");
</script>

<AlertDialog.Description
  class={className}
  data-kind="alert-dialog"
  data-slot="description"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</AlertDialog.Description>
