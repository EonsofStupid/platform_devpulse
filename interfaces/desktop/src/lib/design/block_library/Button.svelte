<!--
  @file src/lib/design/components/Button.svelte
  @layer components

  @description
  Core interactive button component for COLD LIGHT design system.
  Supports primary (gradient), secondary (glass), and ghost variants.
  Uses dp-surface + data-* attributes for recipe-driven styling.

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
    class="dp-surface {className}"
    data-surface="glass"
    data-role="button"
    data-variant={variant}
    data-size={size}
    data-glow={glow === "off" ? undefined : glow}
    {disabled}
    {onclick}
>
    {@render children()}
</button>
