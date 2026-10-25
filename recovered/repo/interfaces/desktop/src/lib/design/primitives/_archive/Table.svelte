<!--
  @file primitives/Table.svelte
  @layer primitives

  Semantic table with proper caption and header scope.
  For complex data tables, use DataTable primitive instead.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "./types.js";
import { stripStyleProp } from "./types.js";

interface Props extends OmitStyle<HTMLTableElement>, BaseProps {
	/** Table caption (required for accessibility) */
	caption?: string;
	/** Hide caption visually (still read by SR) */
	captionHidden?: boolean;
	/** Table head slot */
	head?: Snippet;
	/** Table body slot */
	children?: Snippet;
	/** Table foot slot */
	foot?: Snippet;
}

let {
	caption,
	captionHidden = false,
	head,
	children,
	foot,
	class: className = "",
	"data-id": id,
	...rest
}: Props = $props();

stripStyleProp(rest, "Table");
</script>

<table
  class={className}
  data-kind="primitive"
  data-name="Table"
  data-part="root"
  data-id={id}
  {...rest}
>
  {#if caption}
    <caption class:sr-only={captionHidden} data-part="caption">
      {caption}
    </caption>
  {/if}

  {#if head}
    <thead data-part="head">
      {@render head()}
    </thead>
  {/if}

  <tbody data-part="body">
    {@render children?.()}
  </tbody>

  {#if foot}
    <tfoot data-part="foot">
      {@render foot()}
    </tfoot>
  {/if}
</table>
