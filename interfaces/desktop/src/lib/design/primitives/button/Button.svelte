<!--
  @file Button.svelte
  @layer primitives
  @kind button
  @slot root

  Button primitive — ColdLight-native ARIA, no adapter.

  ColdLight OWNS ALL ARIA:
  - aria-disabled (not native disabled — preserves focusability)
  - aria-busy (loading state)
  - aria-pressed (toggle buttons)
  - aria-label (icon-only buttons)
  - tabindex management

  ColdLight OWNS ALL DATA ATTRIBUTES:
  - data-kind="button"
  - data-slot="root" | "icon" | "label"
  - data-state (derived from disabled/loading/pressed)
  - data-variant, data-size

  Keyboard: Native <button> handles Enter/Space automatically.

  @example
  ```svelte
  <Button variant="primary" onclick={handleClick}>
    Save
  </Button>

  <Button variant="ghost" size="icon" aria-label="Settings" icon={settingsIcon} />

  <Button loading>
    Saving...
  </Button>

  <Button pressed={isToggled} onclick={() => isToggled = !isToggled}>
    Toggle
  </Button>
  ```
-->
<script lang="ts">
  import type { ButtonProps } from "./types.js";

  // ===========================================================================
  // PROPS
  // ===========================================================================

  let {
    variant = "default",
    size = "md",
    type = "button",
    disabled = false,
    loading = false,
    pressed,
    "aria-label": ariaLabel,
    class: className = "",
    onclick,
    children,
    icon,
  }: ButtonProps = $props();

  // ===========================================================================
  // DERIVED STATE
  // ===========================================================================

  const dataState = $derived(
    disabled ? "disabled" : loading ? "loading" : pressed ? "pressed" : "idle"
  );

  // ===========================================================================
  // CLICK GUARD — prevent when disabled or loading
  // ===========================================================================

  function handleClick(e: MouseEvent) {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onclick?.(e);
  }
</script>

<button
  {type}
  class={className}
  aria-disabled={disabled || loading || undefined}
  aria-busy={loading || undefined}
  aria-pressed={pressed}
  aria-label={ariaLabel}
  tabindex={disabled ? -1 : 0}
  onclick={handleClick}
  data-kind="button"
  data-slot="root"
  data-state={dataState}
  data-variant={variant}
  data-size={size}
>
  {#if icon}
    <span data-kind="button" data-slot="icon" data-state={loading ? "loading" : undefined}>
      {@render icon()}
    </span>
  {/if}
  {#if children}
    <span data-kind="button" data-slot="label">
      {@render children()}
    </span>
  {/if}
</button>
