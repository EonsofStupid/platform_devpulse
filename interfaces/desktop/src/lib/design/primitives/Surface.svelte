<!--
  @file src/lib/design/primitives/Surface.svelte
  @name Surface.svelte
  @module @devpulse/design/primitives/Surface
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
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** Surface material */
        variant?: "glass" | "solid" | "mode";
        /** Bevel intensity */
        bevel?: "none" | "subtle" | "soft" | "medium" | "thick";
        /** Shadow depth (0-5) */
        depth?: 0 | 1 | 2 | 3 | 4 | 5;
        /** Backdrop blur */
        blur?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
        /** Border style */
        border?: "none" | "subtle" | "soft" | "medium" | "strong" | "mode";
        /** Glow effect */
        glow?: "none" | "mode" | "teal" | "purple" | "ember";
        /** Animation */
        animate?: "none" | "pulse" | "breathe";
        /** Border radius */
        radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
        /** Pass-through class */
        class?: string;
        /** Mode color override (HSL) */
        modeColor?: string;
        /** Content */
        children: Snippet;
    }

    let {
        variant = "glass",
        bevel = "soft",
        depth = 2,
        blur = "xl",
        border = "subtle",
        glow = "none",
        animate = "none",
        radius = "lg",
        modeColor,
        class: className = "",
        children,
    }: Props = $props();

    // Token mapping
    const bevelMap: Record<string, string> = {
        none: "none",
        subtle: "var(--bevel-outset-subtle)",
        soft: "var(--bevel-outset-soft)",
        medium: "var(--bevel-outset-medium)",
        thick: "var(--bevel-outset-thick)",
    };

    const depthMap: Record<number, string> = {
        0: "var(--shadow-z0)",
        1: "var(--shadow-z1)",
        2: "var(--shadow-z2)",
        3: "var(--shadow-z3)",
        4: "var(--shadow-z4)",
        5: "var(--shadow-z5)",
    };

    const blurMap: Record<string, string> = {
        none: "var(--blur-none)",
        xs: "var(--blur-xs)",
        sm: "var(--blur-sm)",
        md: "var(--blur-md)",
        lg: "var(--blur-lg)",
        xl: "var(--blur-xl)",
        "2xl": "var(--blur-2xl)",
    };

    const borderMap: Record<string, string> = {
        none: "none",
        subtle: "var(--border-subtle)",
        soft: "var(--border-soft)",
        medium: "var(--border-medium)",
        strong: "var(--border-strong)",
        mode: "var(--border-mode-glow)",
    };

    const glowMap: Record<string, string> = {
        none: "none",
        mode: "var(--shadow-glow-mode)",
        teal: "var(--shadow-glow-teal)",
        purple: "var(--shadow-glow-purple)",
        ember: "var(--shadow-glow-ember)",
    };

    const radiusMap: Record<string, string> = {
        none: "var(--radius-none)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
    };

    // Compute combined shadow (reactive)
    const computedShadow = $derived(
        glow !== "none"
            ? `${bevelMap[bevel]}, ${depthMap[depth]}, ${glowMap[glow]}`
            : `${bevelMap[bevel]}, ${depthMap[depth]}`,
    );
</script>

<div
    class="surface {variant} {animate !== 'none'
        ? `animate-${animate}`
        : ''} {className}"
    style:--mode-color={modeColor}
    style:--surface-blur={blurMap[blur]}
    style:--surface-shadow={computedShadow}
    style:--surface-border={borderMap[border]}
    style:--surface-radius={radiusMap[radius]}
>
    <div class="content">
        {@render children()}
    </div>
</div>

<style>
    .surface {
        position: relative;
        isolation: isolate;
        border-radius: var(--surface-radius);
        border: var(--surface-border);
        box-shadow: var(--surface-shadow);
        transition: all var(--duration-normal) var(--ease-out);
        overflow: hidden;
    }

    /* Glass Variant */
    .surface.glass {
        background: var(--surface-glass-void);
        backdrop-filter: blur(var(--surface-blur));
    }

    /* Solid Variant */
    .surface.solid {
        background: var(--surface-solid-void);
    }

    /* Mode Variant (Color-Reactive) */
    .surface.mode {
        background: color-mix(
            in oklch,
            var(--mode-color) 10%,
            var(--surface-glass-void)
        );
        backdrop-filter: blur(var(--surface-blur));
    }

    /* Content Layer */
    .content {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
    }

    /* Animations */
    .animate-pulse {
        animation: pulse-glow var(--duration-pulse) infinite ease-in-out;
    }
    .animate-breathe {
        animation: breathe 3s infinite ease-in-out;
    }
</style>
