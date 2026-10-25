<!--
  @file src/lib/design/components/GlassPanel.svelte
  @layer components

  @description
  Core glass surface component for COLD LIGHT design system.
  Renders a translucent panel with backdrop blur, bevel effects, and optional glow.
  Uses dp-surface + data-* attributes for recipe-driven styling.

  @props
  - variant: "void" | "deep" | "smoke" | "frost" - Glass surface darkness
  - blur: "sm" | "md" | "lg" | "xl" - Backdrop blur intensity
  - glow: "off" | "teal" | "purple" | "magenta" | "ember" | "frost" - Outer glow color
  - radius: "sm" | "md" | "lg" | "xl" - Border radius
  - padding: "none" | "sm" | "md" | "lg" - Internal padding
  - class: string - Additional CSS classes

  @vpb-editable variant, blur, glow, radius, padding
  @since 1.0.0
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** Glass surface variant (VPB dropdown) */
        variant?: "void" | "deep" | "smoke" | "frost";
        /** Backdrop blur intensity (VPB dropdown) */
        blur?: "sm" | "md" | "lg" | "xl";
        /** Outer glow color (VPB dropdown) */
        glow?: "off" | "teal" | "purple" | "magenta" | "ember" | "frost";
        /** Border radius (VPB dropdown) */
        radius?: "sm" | "md" | "lg" | "xl";
        /** Internal padding (VPB dropdown) */
        padding?: "none" | "sm" | "md" | "lg";
        /** Additional CSS classes */
        class?: string;
        /** Content slot */
        children: Snippet;
    }

    let {
        variant = "void",
        blur = "lg",
        glow = "off",
        radius = "md",
        padding = "md",
        class: className = "",
        children,
    }: Props = $props();
</script>

<div
    class="dp-surface {className}"
    data-surface="glass"
    data-role="panel"
    data-variant={variant}
    data-blur={blur}
    data-glow={glow === "off" ? undefined : glow}
    data-radius={radius}
    data-padding={padding}
>
    {@render children()}
</div>
