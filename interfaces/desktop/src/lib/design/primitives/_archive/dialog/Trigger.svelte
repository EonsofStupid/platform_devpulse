<!--
  @file primitives/dialog/Trigger.svelte
  @layer primitives

  Dialog trigger - button that opens the dialog.

  ColdLight OWNS (set EXPLICITLY):
  - aria-haspopup="dialog"
  - aria-expanded="true/false"
  - aria-controls={contentId}

  meltui provides ONLY behavior:
  - Click handler to open dialog
  - Keyboard handler (Enter/Space) to open dialog

  Data Attributes:
  - data-kind="dialog"
  - data-slot="trigger"
-->
<script lang="ts">
  import { Dialog } from "meltui";
  import { getContext } from "svelte";
  import type { DialogTriggerProps, DialogContext } from "./types.js";
  import { DIALOG_CONTEXT_KEY } from "./types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    disabled = false,
  }: DialogTriggerProps = $props();

  // ============================================
  // COLDLIGHT GETS IDs AND STATE FROM CONTEXT
  // ============================================
  const ctx = getContext<DialogContext>(DIALOG_CONTEXT_KEY);
  const { contentId } = ctx;
  // Get open state reactively
  const isOpen = $derived(ctx.open());
</script>

<!--
  meltui Dialog.Trigger provides ONLY behavior:
  - Click handler to open dialog
  - Keyboard handler (Enter/Space) to open dialog

  We render our own button via child snippet.
  ColdLight sets ALL ARIA attributes explicitly.
  NO {...props} spreading from meltui.
-->
<Dialog.Trigger {disabled}>
  {#snippet child({ props }: { props: { onclick?: (e: MouseEvent) => void; onkeydown?: (e: KeyboardEvent) => void } })}
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-controls={contentId}
      {disabled}
      class={className}
      data-kind="dialog"
      data-slot="trigger"
      data-id={dataId}
      onclick={props.onclick}
      onkeydown={props.onkeydown}
    >
      {#if children}
        {@render children()}
      {/if}
    </button>
  {/snippet}
</Dialog.Trigger>
