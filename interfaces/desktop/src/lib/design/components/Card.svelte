<!--
    Card - Content container
    ARIA: article role when semantic
    Uses OKLCH tokens only
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        variant?: "default" | "interactive";
        padding?: "sm" | "md" | "lg";
        glow?: "none" | "teal" | "purple" | "pink";
        class?: string;
        children: Snippet;
    }

    let {
        variant = "default",
        padding = "md",
        glow = "none",
        class: className = "",
        children,
    }: Props = $props();
</script>

<article
    class="card variant-{variant} padding-{padding} {className}"
    class:glow-teal={glow === "teal"}
    class:glow-purple={glow === "purple"}
    class:glow-pink={glow === "pink"}
>
    {@render children()}
</article>

<style>
    .card {
        background: var(--glass-void);
        backdrop-filter: blur(var(--blur-lg));
        border: var(--border-soft);
        border-radius: var(--radius-lg);
        box-shadow: var(--bevel-outset), var(--shadow-z2);
        transition: all var(--duration-normal) var(--ease-out);
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
    .variant-interactive:hover {
        transform: translateY(-2px);
        box-shadow: var(--bevel-outset), var(--shadow-z4);
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
</style>
