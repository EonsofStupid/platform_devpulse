<!--
  @file primitives/dialog/Close.svelte
  @layer primitives

  Dialog close - button that closes the dialog.

  ColdLight OWNS:
  - Native button element

  bits-ui provides ONLY behavior:
  - Click handler to close dialog
  - Keyboard handler (Enter/Space) to close dialog

  Data Attributes:
  - data-kind="dialog"
  - data-slot="close"
-->
<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { DialogCloseProps } from "./types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    disabled = false,
  }: DialogCloseProps = $props();
</script>

<!--
  bits-ui Dialog.Close provides ONLY behavior:
  - Click handler to close dialog
  - Keyboard handler (Enter/Space) to close dialog

  We render our own button via child snippet.
  ColdLight sets ALL attributes explicitly.
-->
<Dialog.Close {disabled}>
  {#snippet child({ props }: { props: { onclick?: (e: MouseEvent) => void; onkeydown?: (e: KeyboardEvent) => void } })}
    <button
      type="button"
      {disabled}
      class={className}
      data-kind="dialog"
      data-slot="close"
      data-id={dataId}
      onclick={props.onclick}
      onkeydown={props.onkeydown}
    >
      {#if children}
        {@render children()}
      {/if}
    </button>
  {/snippet}
</Dialog.Close>
