<!--
  @file src/lib/domains/app/ui-demo/components/GlassContainer.svelte
  @name GlassContainer.svelte
  @module @devpulse/domains/app/ui-demo/components/GlassContainer
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
    GlassContainer - TRUE glass with transparency
    - Real backdrop-filter blur
    - Visible transparency
    - Colored bevels (slate/purple)
    - Animated gradient background support
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        variant?: "deep" | "standard" | "light" | "frost";
        animatedBg?: boolean;
        padding?: "sm" | "md" | "lg";
        class?: string;
        children: Snippet;
    }

    let {
        variant = "standard",
        animatedBg = false,
        padding = "md",
        class: className = "",
        children,
    }: Props = $props();
</script>

<div
    class="glass-container variant-{variant} padding-{padding} {className}"
    class:animated-bg={animatedBg}
>
    {#if animatedBg}
        <div class="bg-layer-1"></div>
        <div class="bg-layer-2"></div>
    {/if}
    <div class="glass-content">
        {@render children()}
    </div>
</div>

<style>
    .glass-container {
        position: relative;
        border-radius: var(--radius-lg);
        overflow: hidden;
        /* Border rise effect */
        border: var(--border-rise-soft);
        /* Bevel with colored shadows */
        box-shadow: var(--bevel-raised);
    }

    /* Glass backgrounds with REAL transparency */
    .variant-deep {
        background: var(--glass-deep);
        backdrop-filter: blur(var(--glass-deep-blur));
    }
    .variant-standard {
        background: var(--glass-standard);
        backdrop-filter: blur(var(--glass-standard-blur));
    }
    .variant-light {
        background: var(--glass-light);
        backdrop-filter: blur(var(--glass-light-blur));
    }
    .variant-frost {
        background: var(--glass-frost);
        backdrop-filter: blur(var(--glass-frost-blur));
    }

    /* Animated gradient background layers */
    .bg-layer-1,
    .bg-layer-2 {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
    }

    .bg-layer-1 {
        background: var(--gradient-bg-1);
        background-size: 400% 400%;
        animation: gradient-shift 25s ease-in-out infinite;
        opacity: 0.6;
    }

    .bg-layer-2 {
        background: var(--gradient-bg-2);
        background-size: 400% 400%;
        animation: gradient-shift 25s ease-in-out infinite reverse;
        animation-delay: -12s;
        opacity: 0.4;
        mix-blend-mode: overlay;
    }

    .glass-content {
        position: relative;
        z-index: 1;
    }

    /* Padding */
    .padding-sm {
        padding: var(--space-3);
    }
    .padding-md {
        padding: var(--space-4);
    }
    .padding-lg {
        padding: var(--space-6);
    }

    /* Deep bevel for animated background */
    .animated-bg {
        box-shadow: var(--bevel-raised-deep);
    }
</style>
