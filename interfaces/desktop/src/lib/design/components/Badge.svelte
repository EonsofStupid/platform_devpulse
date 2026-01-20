<!--
  @file src/lib/design/components/Badge.svelte
  @layer components

  @description
  Status/label indicator component for COLD LIGHT design system.
  Monospace badge with accent color variants.
  Uses dp-badge + data-* attributes for recipe-driven styling.

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
