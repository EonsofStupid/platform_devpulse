<!--
  @file primitives/select/Item.svelte
  @layer primitives

  Select item - selectable option within the listbox.

  ARIA (handled by Bits UI):
  - role="option"
  - aria-selected="true/false"
  - aria-disabled (when disabled)

  Data Attributes:
  - data-kind="select"
  - data-slot="item"
  - data-selected (presence attribute when selected)
  - data-highlighted (presence attribute when highlighted)
  - data-disabled (presence attribute when disabled)
-->
<script lang="ts">
import { Select } from "meltui";
import { cn } from "../types.js";
import type { SelectItemProps } from "./types.js";

let {
	children,
	class: className = "",
	value,
	disabled = false,
	label,
	"data-id": dataId,
}: SelectItemProps = $props();
</script>

<Select.Item {value} {disabled} {label}>
  {#snippet child({ props, selected, highlighted })}
    <!--
      meltui provides selected and highlighted booleans via child snippet.
      We set data-highlighted and data-selected explicitly using these values.
      props provides ARIA attributes and other meltui-managed attributes.
    -->
    <div
      {...props}
      class={cn(props.class, className)}
      data-kind="select"
      data-slot="item"
      data-selected={selected ? "" : undefined}
      data-highlighted={highlighted ? "" : undefined}
      data-id={dataId}
    >
      {#if typeof children === "function" && children.length > 0}
        {@render children({ selected, highlighted })}
      {:else if children}
        {@render children()}
      {/if}
    </div>
  {/snippet}
</Select.Item>
