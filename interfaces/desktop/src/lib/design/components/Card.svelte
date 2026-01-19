<!--
  @file src/lib/design/components/Card.svelte
  @layer components

  @description
  Content container component for COLD LIGHT design system.
  Renders a glass surface card with optional glow and interactivity.
  Uses data-* attributes for styling (Bits UI pattern).

  @props
  - variant: "default" | "interactive" - Card behavior
  - padding: "sm" | "md" | "lg" - Inner padding
  - glow: "off" | "teal" | "purple" | "magenta" | "ember" - Glow color
  - class: string - Additional CSS classes

  @vpb-editable variant, padding, glow
  @since 1.0.0
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** Card behavior variant (VPB dropdown) */
        variant?: "default" | "interactive";
        /** Inner padding (VPB dropdown) */
        padding?: "sm" | "md" | "lg";
        /** Glow color (VPB dropdown) */
        glow?: "off" | "teal" | "purple" | "magenta" | "ember";
        /** Additional CSS classes */
        class?: string;
        /** Content slot */
        children: Snippet;
    }

    let {
        variant = "default",
        padding = "md",
        glow = "off",
        class: className = "",
        children,
    }: Props = $props();
</script>

<article
    class="dp-card {className}"
    data-variant={variant}
    data-padding={padding}
    data-glow={glow}
>
    {@render children()}
</article>

<style>
    .dp-card {
        background: var(--dp-glass-void);
        backdrop-filter: blur(var(--dp-blur-lg));
        -webkit-backdrop-filter: blur(var(--dp-blur-lg));
        border: var(--dp-border-soft);
        border-radius: var(--dp-radius-lg);
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2);
        transition: all var(--dp-transition-normal);
    }

    /* Padding */
    .dp-card[data-padding="sm"] {
        padding: var(--dp-space-3);
    }
    .dp-card[data-padding="md"] {
        padding: var(--dp-space-4);
    }
    .dp-card[data-padding="lg"] {
        padding: var(--dp-space-6);
    }

    /* Interactive */
    .dp-card[data-variant="interactive"]:hover {
        transform: translateY(-2px);
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z4);
    }

    /* Glows */
    .dp-card[data-glow="teal"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2), var(--dp-glow-teal);
    }
    .dp-card[data-glow="purple"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2), var(--dp-glow-purple);
    }
    .dp-card[data-glow="magenta"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2), var(--dp-glow-magenta);
    }
    .dp-card[data-glow="ember"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2), var(--dp-glow-ember);
    }
</style>
