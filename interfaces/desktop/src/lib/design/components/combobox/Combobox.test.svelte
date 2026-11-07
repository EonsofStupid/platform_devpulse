<script lang="ts">
import * as Combobox from "./index.js";

import "$lib/design/recipes/components/combobox/index.js";
import "$lib/design/blueprints/components/combobox/index.js";

const fruits = ["Apple", "Banana", "Cherry", "Date", "Elderberry"];

interface Props {
	open?: boolean;
	value?: string;
	inputValue?: string;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
	"data-id"?: string;
}

let {
	open = $bindable(false),
	value = $bindable<string>(),
	inputValue = $bindable(""),
	closeOnEscape = true,
	closeOnOutsideClick = true,
	"data-id": dataId,
}: Props = $props();

const filtered = $derived(fruits.filter((f) => f.toLowerCase().includes(inputValue.toLowerCase())));
</script>

<Combobox.Root bind:open bind:value bind:inputValue {closeOnEscape} {closeOnOutsideClick} data-id={dataId}>
	<Combobox.Label>Pick a fruit</Combobox.Label>
	<Combobox.Input placeholder="Search fruits..." />
	<Combobox.Trigger>▼</Combobox.Trigger>
	<Combobox.Content>
		{#each filtered as fruit}
			<Combobox.Item value={fruit} label={fruit}>
				{fruit}
			</Combobox.Item>
		{/each}
		{#if filtered.length === 0}
			<Combobox.Empty>No fruits found</Combobox.Empty>
		{/if}
	</Combobox.Content>
</Combobox.Root>
