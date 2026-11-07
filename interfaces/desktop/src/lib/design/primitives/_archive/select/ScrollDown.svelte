<!--
  @file primitives/select/ScrollDown.svelte
  @layer primitives

  Select scroll down - indicator shown when content can scroll down.

  Data Attributes:
  - data-kind="select"
  - data-slot="scroll-down"
-->
<script lang="ts">
import { Select } from "meltui";
import { stripStyleProp } from "../types.js";
import type { SelectScrollDownProps } from "./types.js";

let {
	children,
	class: className = "",
	"data-id": dataId,
	...rest
}: SelectScrollDownProps = $props();

stripStyleProp(rest, "Select.ScrollDown");
</script>

<Select.ScrollDownButton
  class={className}
  data-kind="select"
  data-slot="scroll-down"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Select.ScrollDownButton>
