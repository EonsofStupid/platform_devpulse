<!--
  @file src/lib/design/components/Card.svelte
  @layer components

  @description
  Content container component for COLD LIGHT design system.
  Renders a glass surface card with optional glow and interactivity.
  Uses dp-surface + data-* attributes for recipe-driven styling.

  @props
  - variant: "default" | "interactive" - Card behavior
  - padding: "sm" | "md" | "lg" - Inner padding
  - glow: "off" | "teal" | "purple" | "magenta" | "ember" - Glow color
  - class: string - Additional CSS classes

  @vpb-editable variant, padding, glow
  @since 1.0.0
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** Card behavior variant (VPB dropdown) */
        variant?: "default" | "interactive";
        /** Inner padding (VPB dropdown) */
        padding?: "sm" | "md" | "lg";
        /** Glow color (VPB dropdown) */
        glow?: "off" | "teal" | "purple" | "magenta" | "ember";
        /** Additional CSS classes */
        class?: string;
        /** Content slot */
        children: Snippet;
    }

    let {
        variant = "default",
        padding = "md",
        glow = "off",
        class: className = "",
        children,
    }: Props = $props();
</script>

<article
    class="dp-surface {className}"
    data-surface="glass"
    data-role="card"
    data-padding={padding}
    data-glow={glow === "off" ? undefined : glow}
    data-interactive={variant === "interactive" ? "true" : undefined}
>
    {@render children()}
</article>
