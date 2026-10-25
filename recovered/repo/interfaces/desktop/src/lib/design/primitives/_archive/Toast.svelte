<!--
  @file primitives/Toast.svelte
  @layer primitives

  Integration primitive: svelte-sonner wrapper for toast notifications.
  Wraps Toaster with ColdLight styling system.

  Sonner handles ARIA live region announcements internally.
-->
<script lang="ts" module>
// Re-export sonner's toast function for convenience
export { toast } from "svelte-sonner";
</script>

<script lang="ts">
  import { Toaster } from "svelte-sonner";
  import type { OmitStyle, BaseProps } from "./types.js";

  interface Props extends OmitStyle<HTMLDivElement>, BaseProps {
    /** Position of toasts */
    position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
    /** Expand toasts by default */
    expand?: boolean;
    /** Duration in milliseconds */
    duration?: number;
    /** Gap between toasts */
    gap?: number;
    /** Visible toasts limit */
    visibleToasts?: number;
    /** Close button on toasts */
    closeButton?: boolean;
    /** Rich colors mode */
    richColors?: boolean;
    /** Theme */
    theme?: "light" | "dark" | "system";
    /** Toast offset from edge */
    offset?: string | number;
    /** Container classes */
    toastOptions?: {
      class?: string;
      descriptionClass?: string;
    };
  }

  let {
    position = "bottom-right",
    expand = false,
    duration = 4000,
    gap = 14,
    visibleToasts = 3,
    closeButton = false,
    richColors = false,
    theme = "dark",
    offset = "32px",
    toastOptions = {},
    class: className = "",
    "data-id": id,
  }: Props = $props();
</script>

<div
  class={className}
  data-kind="primitive"
  data-name="Toast"
  data-part="root"
  data-id={id}
>
  <Toaster
    {position}
    {expand}
    {duration}
    {gap}
    {visibleToasts}
    {closeButton}
    {richColors}
    {theme}
    {offset}
    {toastOptions}
  />
</div>
