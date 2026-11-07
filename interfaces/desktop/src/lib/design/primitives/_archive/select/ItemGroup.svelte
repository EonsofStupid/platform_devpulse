<!--
  @file primitives/select/ItemGroup.svelte
  @layer primitives

  Select item group - groups related options together.

  Data Attributes:
  - data-kind="select"
  - data-slot="item-group"
-->
<script lang="ts">
import { Select } from "meltui";
import { stripStyleProp } from "../types.js";
import type { SelectItemGroupProps } from "./types.js";

let {
	children,
	class: className = "",
	"data-id": dataId,
	...rest
}: SelectItemGroupProps = $props();

stripStyleProp(rest, "Select.ItemGroup");
</script>

<Select.Group
  class={className}
  data-kind="select"
  data-slot="item-group"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Select.Group>
