<!--
  @file src/lib/design/components/GlassPanel.svelte
  @name GlassPanel.svelte
  @module @devpulse/design/components/GlassPanel
  @layer lib

  @description
  [TODO: Describe this component's purpose]

  @props
  - [TODO: propName]: [type] - [description]

  @dependencies
  - [TODO: List imports]

  @consumers
  - [TODO: List who uses this component]

  @vpb-editable [TODO: List editable props]
  @since 1.0.0
-->
<!--
    GlassPanel - Core composable glass surface
    ARIA: role="region" when needed
    Uses OKLCH tokens only
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        variant?: "void" | "deep" | "smoke" | "frost";
        blur?: "sm" | "md" | "lg" | "xl";
        glow?: "none" | "teal" | "purple" | "pink" | "ember";
        radius?: "sm" | "md" | "lg" | "xl";
        class?: string;
        children: Snippet;
    }

    let {
        variant = "void",
        blur = "lg",
        glow = "none",
        radius = "md",
        class: className = "",
        children,
    }: Props = $props();
</script>

<div
    class="glass-panel variant-{variant} blur-{blur} radius-{radius} {className}"
    class:glow-teal={glow === "teal"}
    class:glow-purple={glow === "purple"}
    class:glow-pink={glow === "pink"}
    class:glow-ember={glow === "ember"}
>
    {@render children()}
</div>

<style>
    .glass-panel {
        position: relative;
        border: var(--border-soft);
        box-shadow: var(--bevel-outset), var(--shadow-z2);
        transition: all var(--duration-normal) var(--ease-out);
    }

    /* Variants */
    .variant-void {
        background: var(--glass-void);
    }
    .variant-deep {
        background: var(--glass-deep);
    }
    .variant-smoke {
        background: var(--glass-smoke);
    }
    .variant-frost {
        background: var(--glass-frost);
    }

    /* Blur */
    .blur-sm {
        backdrop-filter: blur(var(--blur-sm));
    }
    .blur-md {
        backdrop-filter: blur(var(--blur-md));
    }
    .blur-lg {
        backdrop-filter: blur(var(--blur-lg));
    }
    .blur-xl {
        backdrop-filter: blur(var(--blur-xl));
    }

    /* Radius */
    .radius-sm {
        border-radius: var(--radius-sm);
    }
    .radius-md {
        border-radius: var(--radius-md);
    }
    .radius-lg {
        border-radius: var(--radius-lg);
    }
    .radius-xl {
        border-radius: var(--radius-xl);
    }

    /* Glows */
    .glow-teal {
        box-shadow: var(--bevel-outset), var(--shadow-z2), var(--glow-teal);
    }
    .glow-purple {
        box-shadow: var(--bevel-outset), var(--shadow-z2), var(--glow-purple);
    }
    .glow-pink {
        box-shadow: var(--bevel-outset), var(--shadow-z2), var(--glow-pink);
    }
    .glow-ember {
        box-shadow: var(--bevel-outset), var(--shadow-z2), var(--glow-ember);
    }
</style>
