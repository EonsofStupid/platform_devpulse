<!--
  @file primitives/select/Select.test.svelte
  @layer primitives

  Test wrapper for Select primitive.
  Provides controlled props for vitest-browser-svelte tests.
-->
<script lang="ts">
import * as Select from "./index.js";
import type { SelectItem, SelectType } from "./types.js";

interface Props {
	open?: boolean;
	value?: string | string[];
	onOpenChange?: (open: boolean) => void;
	onValueChange?: (value: string | string[]) => void;
	type?: SelectType;
	items?: SelectItem[];
	disabled?: boolean;
	loop?: boolean;
	name?: string;
	required?: boolean;
	"data-id"?: string;
	// Content props
	side?: "top" | "right" | "bottom" | "left";
	align?: "start" | "center" | "end";
	sideOffset?: number;
	// Item props
	showGroups?: boolean;
	showArrow?: boolean;
	showScrollButtons?: boolean;
}

let {
	open = $bindable(false),
	value = $bindable(""),
	onOpenChange,
	onValueChange,
	type = "single",
	items = [
		{ value: "apple", label: "Apple" },
		{ value: "banana", label: "Banana" },
		{ value: "cherry", label: "Cherry" },
	],
	disabled = false,
	loop = false,
	name,
	required = false,
	"data-id": dataId,
	side = "bottom",
	align = "start",
	sideOffset = 4,
	showGroups = false,
	showArrow = false,
	showScrollButtons = false,
}: Props = $props();

const fruits = [
	{ value: "apple", label: "Apple" },
	{ value: "banana", label: "Banana" },
	{ value: "cherry", label: "Cherry" },
];

const vegetables = [
	{ value: "carrot", label: "Carrot" },
	{ value: "broccoli", label: "Broccoli" },
];
</script>

<Select.Root
  bind:open
  {onOpenChange}
  bind:value
  {onValueChange}
  {type}
  {items}
  {disabled}
  {loop}
  {name}
  {required}
  data-id={dataId}
>
  <Select.Trigger data-testid="trigger">
    {#if value && typeof value === "string"}
      {items.find((i) => i.value === value)?.label ?? "Select..."}
    {:else if Array.isArray(value) && value.length > 0}
      {value.length} selected
    {:else}
      Select an option
    {/if}
  </Select.Trigger>

  <Select.Portal>
    <Select.Content {side} {align} sideOffset={sideOffset} data-id={dataId}>
      {#snippet children({ open: isOpen })}
        {#if showScrollButtons}
          <Select.ScrollUp>↑</Select.ScrollUp>
        {/if}

        <Select.Viewport>
          {#if showGroups}
            <Select.ItemGroup>
              <Select.GroupLabel>Fruits</Select.GroupLabel>
              {#each fruits as item}
                <Select.Item value={item.value} textValue={item.label}>
                  {#snippet children({ selected, highlighted })}
                    <Select.ItemText>{item.label}</Select.ItemText>
                    {#if selected}
                      <span>✓</span>
                    {/if}
                  {/snippet}
                </Select.Item>
              {/each}
            </Select.ItemGroup>

            <Select.Separator />

            <Select.ItemGroup>
              <Select.GroupLabel>Vegetables</Select.GroupLabel>
              {#each vegetables as item}
                <Select.Item value={item.value} textValue={item.label}>
                  {#snippet children({ selected, highlighted })}
                    <Select.ItemText>{item.label}</Select.ItemText>
                    {#if selected}
                      <span>✓</span>
                    {/if}
                  {/snippet}
                </Select.Item>
              {/each}
            </Select.ItemGroup>
          {:else}
            {#each items as item}
              <Select.Item value={item.value} disabled={item.disabled} textValue={item.label}>
                {#snippet children({ selected, highlighted })}
                  <Select.ItemText>{item.label}</Select.ItemText>
                  {#if selected}
                    <span data-testid="check">✓</span>
                  {/if}
                {/snippet}
              </Select.Item>
            {/each}
          {/if}
        </Select.Viewport>

        {#if showScrollButtons}
          <Select.ScrollDown>↓</Select.ScrollDown>
        {/if}

        {#if showArrow}
          <Select.Arrow />
        {/if}
      {/snippet}
    </Select.Content>
  </Select.Portal>
</Select.Root>
