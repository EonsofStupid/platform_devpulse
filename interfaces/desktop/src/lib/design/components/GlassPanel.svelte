<!--
  @file src/lib/design/components/GlassPanel.svelte
  @layer components

  @description
  Core glass surface component for COLD LIGHT design system.
  Renders a translucent panel with backdrop blur, bevel effects, and optional glow.
  Uses data-* attributes for styling (Bits UI pattern).

  @props
  - variant: "void" | "deep" | "smoke" | "frost" - Glass surface darkness
  - blur: "sm" | "md" | "lg" | "xl" - Backdrop blur intensity
  - glow: "off" | "teal" | "purple" | "magenta" | "ember" | "frost" - Outer glow color
  - radius: "sm" | "md" | "lg" | "xl" - Border radius
  - class: string - Additional CSS classes

  @vpb-editable variant, blur, glow, radius
  @since 1.0.0
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** Glass surface variant (VPB dropdown) */
        variant?: "void" | "deep" | "smoke" | "frost";
        /** Backdrop blur intensity (VPB dropdown) */
        blur?: "sm" | "md" | "lg" | "xl";
        /** Outer glow color (VPB dropdown) */
        glow?: "off" | "teal" | "purple" | "magenta" | "ember" | "frost";
        /** Border radius (VPB dropdown) */
        radius?: "sm" | "md" | "lg" | "xl";
        /** Additional CSS classes */
        class?: string;
        /** Content slot */
        children: Snippet;
    }

    let {
        variant = "void",
        blur = "lg",
        glow = "off",
        radius = "md",
        class: className = "",
        children,
    }: Props = $props();
</script>

<div
    class="dp-glass-panel {className}"
    data-variant={variant}
    data-blur={blur}
    data-glow={glow}
    data-radius={radius}
>
    {@render children()}
</div>

<style>
    .dp-glass-panel {
        position: relative;
        border: var(--dp-border-soft);
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2);
        transition: all var(--dp-transition-normal);
    }

    /* Variants */
    .dp-glass-panel[data-variant="void"] {
        background: var(--dp-glass-void);
    }
    .dp-glass-panel[data-variant="deep"] {
        background: var(--dp-glass-deep);
    }
    .dp-glass-panel[data-variant="smoke"] {
        background: var(--dp-glass-smoke);
    }
    .dp-glass-panel[data-variant="frost"] {
        background: var(--dp-glass-frost);
    }

    /* Blur */
    .dp-glass-panel[data-blur="sm"] {
        backdrop-filter: blur(var(--dp-blur-sm));
        -webkit-backdrop-filter: blur(var(--dp-blur-sm));
    }
    .dp-glass-panel[data-blur="md"] {
        backdrop-filter: blur(var(--dp-blur-md));
        -webkit-backdrop-filter: blur(var(--dp-blur-md));
    }
    .dp-glass-panel[data-blur="lg"] {
        backdrop-filter: blur(var(--dp-blur-lg));
        -webkit-backdrop-filter: blur(var(--dp-blur-lg));
    }
    .dp-glass-panel[data-blur="xl"] {
        backdrop-filter: blur(var(--dp-blur-xl));
        -webkit-backdrop-filter: blur(var(--dp-blur-xl));
    }

    /* Radius */
    .dp-glass-panel[data-radius="sm"] {
        border-radius: var(--dp-radius-sm);
    }
    .dp-glass-panel[data-radius="md"] {
        border-radius: var(--dp-radius-md);
    }
    .dp-glass-panel[data-radius="lg"] {
        border-radius: var(--dp-radius-lg);
    }
    .dp-glass-panel[data-radius="xl"] {
        border-radius: var(--dp-radius-xl);
    }

    /* Glows */
    .dp-glass-panel[data-glow="off"] {
        /* No additional glow */
    }
    .dp-glass-panel[data-glow="teal"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2), var(--dp-glow-teal);
    }
    .dp-glass-panel[data-glow="purple"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2), var(--dp-glow-purple);
    }
    .dp-glass-panel[data-glow="magenta"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2), var(--dp-glow-magenta);
    }
    .dp-glass-panel[data-glow="ember"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2), var(--dp-glow-ember);
    }
    .dp-glass-panel[data-glow="frost"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2), var(--dp-glow-frost);
    }
</style>
