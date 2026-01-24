<!--
  @file primitives/Spinner.svelte
  @layer primitives

  Loading spinner with REQUIRED aria-label.
  Never empty - screen readers must announce something.

  A11y Acceptance: SR announces "Loading" (or custom label) - NEVER empty
-->
<script lang="ts">
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLSpanElement>, BaseProps {
    /** REQUIRED: Label for screen readers. Defaults to "Loading" */
    "aria-label"?: string;
  }

  let {
    "aria-label": ariaLabel = "Loading",
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "Spinner");
</script>

<span
  role="status"
  aria-label={ariaLabel}
  class={className}
  data-kind="primitive"
  data-name="Spinner"
  data-part="root"
  data-id={id}
  {...rest}
></span>
