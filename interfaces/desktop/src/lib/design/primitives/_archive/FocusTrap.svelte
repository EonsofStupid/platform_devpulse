<!--
  @file primitives/FocusTrap.svelte
  @layer primitives

  Traps focus within container. Essential for modals/dialogs.
  Handles Escape key to release trap.

  A11y Acceptance: Can exit with Escape, focus returns to trigger
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLDivElement>, BaseProps {
    /** Whether trap is active */
    active?: boolean;
    /** Element to return focus to on deactivation */
    returnFocusTo?: HTMLElement | null;
    /** Allow escape key to deactivate */
    escapeDeactivates?: boolean;
    children?: Snippet;
    /** Called when trap deactivates */
    onDeactivate?: () => void;
  }

  let {
    active = true,
    returnFocusTo,
    escapeDeactivates = true,
    children,
    onDeactivate,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "FocusTrap");

  let containerRef = $state<HTMLDivElement>();
  let previousActiveElement = $state<HTMLElement | null>(null);

  // Store previous focus when activating
  $effect(() => {
    if (active && typeof document !== "undefined") {
      previousActiveElement = document.activeElement as HTMLElement;

      // Focus first focusable element
      const focusables = getFocusableElements();
      if (focusables.length > 0) {
        focusables[0].focus();
      }
    }
  });

  // Return focus when deactivating
  $effect(() => {
    if (!active && previousActiveElement) {
      const target = returnFocusTo ?? previousActiveElement;
      target?.focus();
    }
  });

  function getFocusableElements(): HTMLElement[] {
    if (!containerRef) return [];

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(containerRef.querySelectorAll<HTMLElement>(selector));
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!active) return;

    if (e.key === "Escape" && escapeDeactivates) {
      e.preventDefault();
      onDeactivate?.();
      return;
    }

    if (e.key === "Tab") {
      const focusables = getFocusableElements();
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
</script>

<div
  bind:this={containerRef}
  class={className}
  data-kind="primitive"
  data-name="FocusTrap"
  data-part="root"
  data-active={active || undefined}
  data-id={id}
  onkeydown={handleKeyDown}
  {...rest}
>
  {@render children?.()}
</div>
