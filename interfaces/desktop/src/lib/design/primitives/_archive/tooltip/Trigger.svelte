<!--
  @file primitives/tooltip/Trigger.svelte
  @layer primitives

  Tooltip trigger - element that activates tooltip on hover/focus.

  ARIA (handled by Bits UI):
  - aria-describedby (points to content when open)

  Data Attributes:
  - data-kind="tooltip"
  - data-slot="trigger"
-->
<script lang="ts">
import { Tooltip } from "meltui";
import { stripStyleProp } from "../types.js";
import type { TooltipTriggerProps } from "./types.js";

let { children, class: className = "", "data-id": dataId, ...rest }: TooltipTriggerProps = $props();

stripStyleProp(rest, "Tooltip.Trigger");
</script>

<Tooltip.Trigger
  class={className}
  data-kind="tooltip"
  data-slot="trigger"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Tooltip.Trigger>
