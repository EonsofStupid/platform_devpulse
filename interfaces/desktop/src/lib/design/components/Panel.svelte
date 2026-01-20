<!--
  @file src/lib/design/components/Panel.svelte
  @layer components

  @description
  Composable panel component for COLD LIGHT design system.
  Implements both glass (flush dual-tint) and matte (sunken content) recipes.
  Uses dp-surface + data-* attributes for recipe-driven styling.

  @props
  - variant: "glass" | "matte" - Panel surface type
  - padding: "none" | "sm" | "md" | "lg" - Inner padding
  - blur: "sm" | "md" | "lg" | "xl" - Backdrop blur intensity
  - radius: "sm" | "md" | "lg" | "xl" - Border radius
  - class: string - Additional CSS classes

  @vpb-editable variant, padding, blur, radius
  @since 1.0.0
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** Panel surface type (VPB dropdown) */
        variant?: "glass" | "matte";
        /** Inner padding (VPB dropdown) */
        padding?: "none" | "sm" | "md" | "lg";
        /** Backdrop blur intensity (VPB dropdown) */
        blur?: "sm" | "md" | "lg" | "xl";
        /** Border radius (VPB dropdown) */
        radius?: "sm" | "md" | "lg" | "xl";
        /** Additional CSS classes */
        class?: string;
        /** Content slot */
        children: Snippet;
    }

    let {
        variant = "glass",
        padding = "md",
        blur = "md",
        radius = "md",
        class: className = "",
        children,
    }: Props = $props();
</script>

<div
    class="dp-surface {className}"
    data-surface={variant}
    data-role="panel"
    data-padding={padding}
    data-blur={blur}
    data-radius={radius}
    role="region"
>
    {@render children()}
</div>
