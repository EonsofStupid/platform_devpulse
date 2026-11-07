<!--
  @file primitives/dialog/Description.svelte
  @layer primitives

  Dialog description - accessible description for the dialog.

  ColdLight OWNS:
  - id={descriptionId} (from context, linked to Content's aria-describedby)
  - Native <p> element

  meltui provides NOTHING for Description - pure ColdLight element.

  Data Attributes:
  - data-kind="dialog"
  - data-slot="description"
-->
<script lang="ts">
import { getContext } from "svelte";
import type { DialogContext, DialogDescriptionProps } from "./types.js";
import { DIALOG_CONTEXT_KEY } from "./types.js";

let { children, class: className = "", "data-id": dataId }: DialogDescriptionProps = $props();

// ============================================
// COLDLIGHT GETS ID FROM CONTEXT
// ============================================
const ctx = getContext<DialogContext>(DIALOG_CONTEXT_KEY);
const { descriptionId } = ctx;
</script>

<!--
  ColdLight renders native paragraph element.
  ID is set explicitly by ColdLight, linked to Content's aria-describedby.
  NO meltui involvement - pure native element.
-->
<p
  id={descriptionId}
  class={className}
  data-kind="dialog"
  data-slot="description"
  data-id={dataId}
>
  {#if children}
    {@render children()}
  {/if}
</p>
