<!--
  @file src/lib/design/primitives/Surface.svelte
  @layer primitives

  @description
  Base surface primitive for COLD LIGHT design system.
  Provides configurable glass/solid surfaces with bevel, shadow, blur, and glow.
  Uses data-* attributes for styling (Bits UI pattern).

  @props
  - variant: "glass" | "solid" | "matte" - Surface material
  - bevel: "off" | "subtle" | "soft" | "medium" - Bevel intensity
  - depth: 0 | 1 | 2 | 3 | 4 - Shadow depth level
  - blur: "off" | "sm" | "md" | "lg" | "xl" - Backdrop blur
  - glow: "off" | "teal" | "purple" | "magenta" | "ember" - Glow color
  - radius: "none" | "sm" | "md" | "lg" | "xl" | "full" - Border radius

  @vpb-editable variant, bevel, depth, blur, glow, radius
  @since 1.0.0
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** Surface material (VPB dropdown) */
        variant?: "glass" | "solid" | "matte";
        /** Bevel intensity (VPB dropdown) */
        bevel?: "off" | "subtle" | "soft" | "medium";
        /** Shadow depth level (VPB dropdown) */
        depth?: 0 | 1 | 2 | 3 | 4;
        /** Backdrop blur (VPB dropdown) */
        blur?: "off" | "sm" | "md" | "lg" | "xl";
        /** Glow color (VPB dropdown) */
        glow?: "off" | "teal" | "purple" | "magenta" | "ember";
        /** Border radius (VPB dropdown) */
        radius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
        /** Additional CSS classes */
        class?: string;
        /** Content slot */
        children: Snippet;
    }

    let {
        variant = "glass",
        bevel = "soft",
        depth = 2,
        blur = "lg",
        glow = "off",
        radius = "lg",
        class: className = "",
        children,
    }: Props = $props();
</script>

<div
    class="dp-surface {className}"
    data-variant={variant}
    data-bevel={bevel}
    data-depth={depth}
    data-blur={blur}
    data-glow={glow}
    data-radius={radius}
>
    <div class="dp-surface__content">
        {@render children()}
    </div>
</div>

<style>
    .dp-surface {
        position: relative;
        isolation: isolate;
        border: var(--dp-border-soft);
        transition: all var(--dp-transition-normal);
        overflow: hidden;
    }

    /* Variants */
    .dp-surface[data-variant="glass"] {
        background: var(--dp-glass-void);
    }
    .dp-surface[data-variant="solid"] {
        background: var(--dp-matte-dark);
    }
    .dp-surface[data-variant="matte"] {
        background: var(--dp-matte-mid);
        border: var(--dp-border-matte);
    }

    /* Blur */
    .dp-surface[data-blur="sm"] {
        backdrop-filter: blur(var(--dp-blur-sm));
        -webkit-backdrop-filter: blur(var(--dp-blur-sm));
    }
    .dp-surface[data-blur="md"] {
        backdrop-filter: blur(var(--dp-blur-md));
        -webkit-backdrop-filter: blur(var(--dp-blur-md));
    }
    .dp-surface[data-blur="lg"] {
        backdrop-filter: blur(var(--dp-blur-lg));
        -webkit-backdrop-filter: blur(var(--dp-blur-lg));
    }
    .dp-surface[data-blur="xl"] {
        backdrop-filter: blur(var(--dp-blur-xl));
        -webkit-backdrop-filter: blur(var(--dp-blur-xl));
    }

    /* Bevel */
    .dp-surface[data-bevel="subtle"] {
        box-shadow: inset 1px 1px 0 var(--dp-bevel-light);
    }
    .dp-surface[data-bevel="soft"] {
        box-shadow: var(--dp-bevel-outset);
    }
    .dp-surface[data-bevel="medium"] {
        box-shadow: inset 2px 2px 0 var(--dp-bevel-light-strong), inset -2px -2px 0 var(--dp-bevel-dark-strong);
    }

    /* Depth (adds to existing shadows) */
    .dp-surface[data-depth="1"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z1);
    }
    .dp-surface[data-depth="2"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2);
    }
    .dp-surface[data-depth="3"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z3);
    }
    .dp-surface[data-depth="4"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z4);
    }

    /* Glow */
    .dp-surface[data-glow="teal"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2), var(--dp-glow-teal);
    }
    .dp-surface[data-glow="purple"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2), var(--dp-glow-purple);
    }
    .dp-surface[data-glow="magenta"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2), var(--dp-glow-magenta);
    }
    .dp-surface[data-glow="ember"] {
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2), var(--dp-glow-ember);
    }

    /* Radius */
    .dp-surface[data-radius="none"] {
        border-radius: var(--dp-radius-none);
    }
    .dp-surface[data-radius="sm"] {
        border-radius: var(--dp-radius-sm);
    }
    .dp-surface[data-radius="md"] {
        border-radius: var(--dp-radius-md);
    }
    .dp-surface[data-radius="lg"] {
        border-radius: var(--dp-radius-lg);
    }
    .dp-surface[data-radius="xl"] {
        border-radius: var(--dp-radius-xl);
    }
    .dp-surface[data-radius="full"] {
        border-radius: var(--dp-radius-full);
    }

    /* Content layer */
    .dp-surface__content {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
    }
</style>
