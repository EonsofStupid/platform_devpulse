<!--
  @file primitives/sheet/Description.svelte
  @layer primitives

  Sheet description - accessible description for the sheet.
  Automatically linked to Content via aria-describedby.

  Data Attributes:
  - data-kind="sheet"
  - data-slot="description"
-->
<script lang="ts">
import { Dialog } from "meltui";
import { stripStyleProp } from "../types.js";
import type { SheetDescriptionProps } from "./types.js";

let {
	children,
	class: className = "",
	"data-id": dataId,
	...rest
}: SheetDescriptionProps = $props();

stripStyleProp(rest, "Sheet.Description");
</script>

<Dialog.Description
  class={className}
  data-kind="sheet"
  data-slot="description"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Dialog.Description>
