<!--
  @file src/lib/design/components/Badge.svelte
  @layer components

  @description
  Status/label indicator component for COLD LIGHT design system.
  Monospace badge with accent color variants.
  Uses data-* attributes for styling (Bits UI pattern).

  @props
  - variant: "teal" | "purple" | "magenta" | "ember" | "muted" - Badge color
  - size: "sm" | "md" - Badge size

  @vpb-editable variant, size
  @since 1.0.0
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** Badge color variant (VPB dropdown) */
        variant?: "teal" | "purple" | "magenta" | "ember" | "muted";
        /** Badge size (VPB dropdown) */
        size?: "sm" | "md";
        /** Content slot */
        children: Snippet;
    }

    let { variant = "teal", size = "sm", children }: Props = $props();
</script>

<span class="dp-badge" data-variant={variant} data-size={size}>
    {@render children()}
</span>

<style>
    .dp-badge {
        display: inline-flex;
        align-items: center;
        font-family: var(--dp-font-mono);
        font-weight: 500;
        border-radius: var(--dp-radius-full);
    }

    /* Sizes */
    .dp-badge[data-size="sm"] {
        padding: var(--dp-space-1) var(--dp-space-2);
        font-size: var(--dp-text-xs);
    }
    .dp-badge[data-size="md"] {
        padding: var(--dp-space-1) var(--dp-space-3);
        font-size: var(--dp-text-sm);
    }

    /* Variants */
    .dp-badge[data-variant="teal"] {
        background: oklch(70% 0.18 var(--dp-hue-teal) / 0.2);
        color: var(--dp-teal-400);
        border: 1px solid oklch(70% 0.18 var(--dp-hue-teal) / 0.3);
    }
    .dp-badge[data-variant="purple"] {
        background: oklch(55% 0.20 var(--dp-hue-purple) / 0.2);
        color: var(--dp-purple-300);
        border: 1px solid oklch(55% 0.20 var(--dp-hue-purple) / 0.3);
    }
    .dp-badge[data-variant="magenta"] {
        background: oklch(60% 0.22 var(--dp-hue-magenta) / 0.2);
        color: var(--dp-magenta-400);
        border: 1px solid oklch(60% 0.22 var(--dp-hue-magenta) / 0.3);
    }
    .dp-badge[data-variant="ember"] {
        background: oklch(65% 0.20 var(--dp-hue-ember) / 0.2);
        color: var(--dp-ember-400);
        border: 1px solid oklch(65% 0.20 var(--dp-hue-ember) / 0.3);
    }
    .dp-badge[data-variant="muted"] {
        background: var(--dp-glass-smoke);
        color: var(--dp-text-muted);
        border: var(--dp-border-matte);
    }
</style>
