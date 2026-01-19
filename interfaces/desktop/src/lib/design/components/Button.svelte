<!--
  @file src/lib/design/components/Button.svelte
  @layer components

  @description
  Core interactive button component for COLD LIGHT design system.
  Supports primary (gradient), secondary (glass), and ghost variants.
  Uses data-* attributes for styling (Bits UI pattern).

  @props
  - variant: "primary" | "secondary" | "ghost" - Button style
  - size: "sm" | "md" | "lg" - Button size
  - glow: "off" | "teal" | "purple" | "magenta" | "ember" - Glow color
  - disabled: boolean - Disabled state
  - class: string - Additional CSS classes

  @vpb-editable variant, size, glow
  @since 1.0.0
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** Button style variant (VPB dropdown) */
        variant?: "primary" | "secondary" | "ghost";
        /** Button size (VPB dropdown) */
        size?: "sm" | "md" | "lg";
        /** Glow color (VPB dropdown) */
        glow?: "off" | "teal" | "purple" | "magenta" | "ember";
        /** Disabled state */
        disabled?: boolean;
        /** Additional CSS classes */
        class?: string;
        /** Click handler */
        onclick?: () => void;
        /** Content slot */
        children: Snippet;
    }

    let {
        variant = "primary",
        size = "md",
        glow = "off",
        disabled = false,
        class: className = "",
        onclick,
        children,
    }: Props = $props();
</script>

<button
    class="dp-button {className}"
    data-variant={variant}
    data-size={size}
    data-glow={glow}
    {disabled}
    {onclick}
>
    {@render children()}
</button>

<style>
    .dp-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--dp-space-2);
        font-family: var(--dp-font-sans);
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: all var(--dp-transition-fast);
    }

    .dp-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Sizes */
    .dp-button[data-size="sm"] {
        padding: var(--dp-space-1) var(--dp-space-3);
        font-size: var(--dp-text-sm);
        border-radius: var(--dp-radius-sm);
    }
    .dp-button[data-size="md"] {
        padding: var(--dp-space-2) var(--dp-space-4);
        font-size: var(--dp-text-base);
        border-radius: var(--dp-radius-md);
    }
    .dp-button[data-size="lg"] {
        padding: var(--dp-space-3) var(--dp-space-6);
        font-size: var(--dp-text-lg);
        border-radius: var(--dp-radius-lg);
    }

    /* Variants */
    .dp-button[data-variant="primary"] {
        background: linear-gradient(135deg, var(--dp-teal-500), var(--dp-purple-500));
        color: var(--dp-text-primary);
        box-shadow: var(--dp-shadow-z2);
    }
    .dp-button[data-variant="primary"]:hover:not(:disabled) {
        box-shadow: var(--dp-shadow-z3), var(--dp-glow-teal);
        transform: translateY(-1px);
    }

    .dp-button[data-variant="secondary"] {
        background: var(--dp-glass-deep);
        backdrop-filter: blur(var(--dp-blur-md));
        -webkit-backdrop-filter: blur(var(--dp-blur-md));
        color: var(--dp-text-primary);
        border: var(--dp-border-soft);
        box-shadow: var(--dp-bevel-outset);
    }
    .dp-button[data-variant="secondary"]:hover:not(:disabled) {
        background: var(--dp-glass-smoke);
        box-shadow: var(--dp-bevel-outset), var(--dp-glow-teal);
    }

    .dp-button[data-variant="ghost"] {
        background: transparent;
        color: var(--dp-text-secondary);
    }
    .dp-button[data-variant="ghost"]:hover:not(:disabled) {
        background: var(--dp-glass-frost);
        color: var(--dp-text-primary);
    }

    /* Glow modifiers */
    .dp-button[data-glow="teal"] {
        box-shadow: var(--dp-shadow-z2), var(--dp-glow-teal);
    }
    .dp-button[data-glow="purple"] {
        box-shadow: var(--dp-shadow-z2), var(--dp-glow-purple);
    }
    .dp-button[data-glow="magenta"] {
        box-shadow: var(--dp-shadow-z2), var(--dp-glow-magenta);
    }
    .dp-button[data-glow="ember"] {
        box-shadow: var(--dp-shadow-z2), var(--dp-glow-ember);
    }

    /* Focus state */
    .dp-button:focus-visible {
        outline: 2px solid var(--dp-teal-400);
        outline-offset: 2px;
    }
</style>
