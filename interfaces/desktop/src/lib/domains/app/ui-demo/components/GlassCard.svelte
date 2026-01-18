<!--
    GlassCard - Interactive card with glass and colored shadows
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        interactive?: boolean;
        glow?: "none" | "teal" | "purple" | "blue";
        padding?: "sm" | "md" | "lg";
        children: Snippet;
    }

    let {
        interactive = false,
        glow = "none",
        padding = "md",
        children,
    }: Props = $props();
</script>

<article class="glass-card padding-{padding} glow-{glow}" class:interactive>
    <div class="card-content">
        {@render children()}
    </div>
</article>

<style>
    .glass-card {
        position: relative;
        background: var(--glass-standard);
        backdrop-filter: blur(var(--glass-standard-blur));
        border: var(--border-rise-soft);
        border-radius: var(--radius-lg);
        box-shadow: var(--bevel-raised);
        transition: all var(--duration-normal) var(--ease-out);
        overflow: hidden;
    }

    .card-content {
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

    /* Interactive */
    .interactive {
        cursor: pointer;
    }
    .interactive:hover {
        transform: translateY(-4px);
        box-shadow: var(--bevel-raised-deep);
    }

    /* Glows */
    .glow-teal {
        box-shadow: var(--bevel-raised), var(--glow-teal);
    }
    .glow-purple {
        box-shadow: var(--bevel-raised), var(--glow-purple);
    }
    .glow-blue {
        box-shadow: var(--bevel-raised), var(--glow-blue);
    }

    .interactive.glow-teal:hover,
    .interactive.glow-purple:hover,
    .interactive.glow-blue:hover {
        box-shadow: var(--bevel-raised-deep), var(--glow-teal);
    }
</style>
