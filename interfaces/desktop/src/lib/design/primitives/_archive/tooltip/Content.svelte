<!--
  @file primitives/tooltip/Content.svelte
  @layer primitives

  Tooltip content - positioned floating container with role="tooltip".

  Features:
  - Floating UI positioning (Bits UI)
  - role="tooltip" (ColdLight adds this)
  - aria-hidden when closed (Bits UI)

  Data Attributes:
  - data-kind="tooltip"
  - data-slot="content"
  - data-state="open" | "closed"
  - data-side (from Bits UI)
  - data-align (from Bits UI)
-->
<script lang="ts">
import { Tooltip } from "meltui";
import { cn, stripStyleProp } from "../types.js";
import type { TooltipContentProps, TooltipState } from "./types.js";

let {
	children,
	class: className = "",
	"data-id": dataId,
	// Positioning
	side = "top",
	sideOffset = 4,
	align = "center",
	alignOffset,
	arrowPadding,
	avoidCollisions = true,
	collisionPadding = 8,
	sticky,
	hideWhenDetached,
	...rest
}: TooltipContentProps = $props();

stripStyleProp(rest, "Tooltip.Content");
</script>

<Tooltip.Content
  {side}
  {sideOffset}
  {align}
  {alignOffset}
  {arrowPadding}
  {avoidCollisions}
  {collisionPadding}
  {sticky}
  {hideWhenDetached}
  {...rest}
>
  {#snippet child({ props, open })}
    {@const dataState: TooltipState = open ? "open" : "closed"}
    <div
      {...props}
      role="tooltip"
      class={cn(props.class, className)}
      data-kind="tooltip"
      data-slot="content"
      data-state={dataState}
      data-id={dataId}
    >
      {#if typeof children === "function" && children.length > 0}
        {@render children({ open })}
      {:else if children}
        {@render children()}
      {/if}
    </div>
  {/snippet}
</Tooltip.Content>
