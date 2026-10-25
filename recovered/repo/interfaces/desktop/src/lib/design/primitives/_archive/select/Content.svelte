<!--
  @file primitives/select/Content.svelte
  @layer primitives

  Select content - positioned listbox container.

  ARIA (handled by Bits UI):
  - role="listbox"
  - aria-multiselectable (when type="multiple")

  Data Attributes:
  - data-kind="select"
  - data-slot="content"
  - data-state="open" | "closed"
  - data-side (from Bits UI)
  - data-align (from Bits UI)
-->
<script lang="ts">
import { Select } from "meltui";
import { cn, stripStyleProp } from "../types.js";
import type { SelectContentProps, SelectState } from "./types.js";

let {
	children,
	class: className = "",
	"data-id": dataId,
	// Positioning
	side = "bottom",
	sideOffset = 4,
	align = "start",
	alignOffset,
	arrowPadding,
	avoidCollisions = true,
	collisionPadding = 8,
	...rest
}: SelectContentProps = $props();

stripStyleProp(rest, "Select.Content");
</script>

<Select.Content
  {side}
  {sideOffset}
  {align}
  {alignOffset}
  {arrowPadding}
  {avoidCollisions}
  {collisionPadding}
  {...rest}
>
  {#snippet child({ props, open })}
    {@const dataState: SelectState = open ? "open" : "closed"}
    <div
      {...props}
      class={cn(props.class, className)}
      data-kind="select"
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
</Select.Content>
