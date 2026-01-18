<!--
  @file src/lib/design/components/Badge.svelte
  @name Badge.svelte
  @module @devpulse/design/components/Badge
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
    Badge - Status/label indicator
    ARIA: status role when dynamic
    Uses OKLCH tokens only
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        variant?: "teal" | "purple" | "pink" | "ember" | "muted";
        size?: "sm" | "md";
        children: Snippet;
    }

    let { variant = "teal", size = "sm", children }: Props = $props();
</script>

<span class="badge variant-{variant} size-{size}">
    {@render children()}
</span>

<style>
    .badge {
        display: inline-flex;
        align-items: center;
        font-family: var(--font-mono);
        font-weight: 500;
        border-radius: var(--radius-full);
    }

    /* Sizes */
    .size-sm {
        padding: var(--space-1) var(--space-2);
        font-size: var(--text-xs);
    }
    .size-md {
        padding: var(--space-1) var(--space-3);
        font-size: var(--text-sm);
    }

    /* Variants */
    .variant-teal {
        background: oklch(70% 0.2 175 / 0.2);
        color: var(--teal-400);
        border: 1px solid oklch(70% 0.2 175 / 0.3);
    }
    .variant-purple {
        background: oklch(55% 0.25 280 / 0.2);
        color: var(--purple-300);
        border: 1px solid oklch(55% 0.25 280 / 0.3);
    }
    .variant-pink {
        background: oklch(65% 0.28 355 / 0.2);
        color: var(--pink-400);
        border: 1px solid oklch(65% 0.28 355 / 0.3);
    }
    .variant-ember {
        background: oklch(65% 0.2 45 / 0.2);
        color: var(--ember-400);
        border: 1px solid oklch(65% 0.2 45 / 0.3);
    }
    .variant-muted {
        background: var(--glass-smoke);
        color: var(--text-muted);
        border: var(--border-subtle);
    }
</style>
