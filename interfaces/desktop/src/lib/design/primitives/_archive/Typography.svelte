<!--
  @file primitives/Typography.svelte
  @layer primitives

  Semantic typography element.
  Renders appropriate HTML element based on variant.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  type Variant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "lead" | "small" | "muted";

  interface Props extends OmitStyle<HTMLElement>, BaseProps {
    /** Typography variant */
    variant?: Variant;
    /** Override the HTML element */
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    variant = "p",
    as,
    children,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest as Record<string, unknown>, "Typography");

  // Determine element to render
  const elementMap: Record<Variant, string> = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
    p: "p",
    span: "span",
    lead: "p",
    small: "small",
    muted: "span",
  };

  const element = $derived(as ?? elementMap[variant] ?? "p");
</script>

<svelte:element
  this={element}
  class={className}
  data-kind="primitive"
  data-name="Typography"
  data-part="root"
  data-variant={variant}
  data-id={id}
  {...rest}
>
  {@render children?.()}
</svelte:element>
