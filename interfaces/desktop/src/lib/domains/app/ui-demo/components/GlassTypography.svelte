<!--
  @file src/lib/domains/app/ui-demo/components/GlassTypography.svelte
  @name GlassTypography.svelte
  @module @devpulse/domains/app/ui-demo/components/GlassTypography
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
    GlassTypography - Text with glass/metallic effects
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        variant?: "display" | "heading" | "subheading" | "body" | "caption";
        metallic?: boolean;
        glow?: boolean;
        children: Snippet;
    }

    let {
        variant = "body",
        metallic = false,
        glow = false,
        children,
    }: Props = $props();
</script>

{#if variant === "display"}
    <h1 class="glass-text variant-{variant}" class:metallic class:glow>
        {@render children()}
    </h1>
{:else if variant === "heading"}
    <h2 class="glass-text variant-{variant}" class:metallic class:glow>
        {@render children()}
    </h2>
{:else if variant === "subheading"}
    <h3 class="glass-text variant-{variant}" class:metallic class:glow>
        {@render children()}
    </h3>
{:else if variant === "caption"}
    <span class="glass-text variant-{variant}" class:metallic class:glow>
        {@render children()}
    </span>
{:else}
    <p class="glass-text variant-{variant}" class:metallic class:glow>
        {@render children()}
    </p>
{/if}

<style>
    .glass-text {
        font-family: var(--font-sans);
        color: var(--text-primary);
        margin: 0;
    }

    /* Variants */
    .variant-display {
        font-size: var(--text-4xl);
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1.1;
    }
    .variant-heading {
        font-size: var(--text-2xl);
        font-weight: 700;
        letter-spacing: -0.01em;
        line-height: 1.2;
    }
    .variant-subheading {
        font-size: var(--text-xl);
        font-weight: 600;
        line-height: 1.3;
    }
    .variant-body {
        font-size: var(--text-base);
        font-weight: 400;
        line-height: 1.6;
        color: var(--text-secondary);
    }
    .variant-caption {
        font-size: var(--text-sm);
        font-weight: 400;
        color: var(--text-muted);
        font-family: var(--font-mono);
    }

    /* Metallic effect - gradient shimmer */
    .metallic {
        text-shadow: var(--text-metallic);
        background: linear-gradient(
            135deg,
            var(--text-primary) 0%,
            var(--teal-300) 25%,
            var(--text-primary) 50%,
            var(--purple-300) 75%,
            var(--text-primary) 100%
        );
        background-size: 300% 300%;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: gradient-shift 10s ease-in-out infinite;
    }

    /* Glow effect */
    .glow {
        text-shadow: var(--text-glow);
    }
</style>
