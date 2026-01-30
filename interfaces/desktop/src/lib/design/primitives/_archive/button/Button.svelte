<!--
  @file primitives/button/Button.svelte
  @layer primitives

  Accessible button primitive wrapping Bits UI Button.

  ARIA Contract:
  - role="button" (implicit via native <button>)
  - aria-disabled when disabled
  - Keyboard: Enter/Space activates
  - Focus visible by default

  Data Attributes:
  - data-kind="button"
  - data-slot="root"
  - data-state="pressed" | "disabled" | undefined
  - data-id (user-defined)
-->
<script lang="ts">
  import { Button as BitsButton } from "meltui";
  import type { ButtonProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    disabled = false,
    type = "button",
    class: className = "",
    "data-id": dataId,
    ...rest
  }: ButtonProps = $props();

  // DEV-only: warn if style prop is passed
  stripStyleProp(rest, "Button");

  // Track pressed state for data-state
  let isPressed = $state(false);

  function handlePointerDown() {
    if (!disabled) isPressed = true;
  }

  function handlePointerUp() {
    isPressed = false;
  }

  // Compute data-state
  const dataState = $derived(
    disabled ? "disabled" : isPressed ? "pressed" : undefined
  );
</script>

<BitsButton.Root
  {type}
  {disabled}
  class={className}
  data-kind="button"
  data-slot="root"
  data-state={dataState}
  data-id={dataId}
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  onpointerleave={handlePointerUp}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</BitsButton.Root>
