<!--
  @file primitives/InputGroup.svelte
  @layer primitives

  Groups related inputs together with role="group".
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLDivElement>, BaseProps {
    /** Optional label for the group */
    "aria-label"?: string;
    children?: Snippet;
  }

  let {
    "aria-label": ariaLabel,
    children,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "InputGroup");
</script>

<div
  role="group"
  aria-label={ariaLabel}
  class={className}
  data-kind="primitive"
  data-name="InputGroup"
  data-part="root"
  data-id={id}
  {...rest}
>
  {@render children?.()}
</div>
