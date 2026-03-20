<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'ColdLight/Button',
		tags: ['autodocs'],
		argTypes: {
			intent: {
				control: 'select',
				options: ['primary', 'secondary', 'ghost', 'danger'],
				description: 'Visual intent — maps to a named preset',
			},
			size: {
				control: 'select',
				options: ['sm', 'md', 'lg'],
				description: 'Size — height, padding, font size',
			},
			disabled: {
				control: 'boolean',
				description: 'Disabled state — aria-disabled + pointer-events-none',
			},
			loading: {
				control: 'boolean',
				description: 'Loading state — aria-busy + visual indicator',
			},
			label: {
				control: 'text',
				description: 'Button text content',
			},
		},
		args: {
			intent: 'primary',
			size: 'md',
			disabled: false,
			loading: false,
			label: 'Save Changes',
		},
	});
</script>

<script lang="ts">
	import Button from '$lib/design/components/button/Button.svelte';
	import type { ButtonIntent, ButtonSize } from '$lib/design/components/button/button.types.js';
</script>

<!-- Default — interactive with all controls -->
<!-- @ts-ignore Storybook CSF args typing -->
<Story name="Default" let:args>
	{@const a = args as { intent: ButtonIntent; size: ButtonSize; disabled: boolean; loading: boolean; label: string }}
	<div class="p-12 bg-[#050708] min-h-[200px] flex items-center justify-center">
		<Button
			intent={a.intent}
			size={a.size}
			disabled={a.disabled}
			loading={a.loading}
		>
			{a.label}
		</Button>
	</div>
</Story>

<!-- All Intents — side by side comparison -->
<Story name="All Intents">
	<div class="p-12 bg-[#050708] min-h-[200px] flex items-center gap-4 flex-wrap">
		{#each ['primary', 'secondary', 'ghost', 'danger'] as intent (intent)}
			<Button intent={intent as ButtonIntent}>
				{intent.charAt(0).toUpperCase() + intent.slice(1)}
			</Button>
		{/each}
	</div>
</Story>

<!-- All Sizes -->
<Story name="All Sizes">
	<div class="p-12 bg-[#050708] min-h-[200px] flex items-center gap-4">
		{#each ['sm', 'md', 'lg'] as size (size)}
			<Button size={size as ButtonSize}>
				Size {size}
			</Button>
		{/each}
	</div>
</Story>

<!-- States -->
<Story name="States">
	<div class="p-12 bg-[#050708] min-h-[200px] flex items-center gap-4">
		<Button>Normal</Button>
		<Button disabled>Disabled</Button>
		<Button loading>Loading...</Button>
	</div>
</Story>

<!-- 8-Axis Composite Effects -->
<Story name="Composite Effects">
	<div class="p-12 bg-[#050708] min-h-[400px] flex flex-col gap-8">
		<p class="text-sm text-zinc-500 font-mono">8-Axis Visual Encoding — each button uses different preset axis values</p>

		<div class="flex items-center gap-4">
			<Button size="lg" intent="primary">Glass + Glow + Bevel</Button>
			<Button size="lg" intent="secondary">Subtle Depth</Button>
			<Button size="lg" intent="ghost">Ghost</Button>
			<Button size="lg" intent="danger">Danger</Button>
		</div>

		<div class="flex items-center gap-4">
			<Button size="lg" glow="purple" surface="glass-void">Custom Glow</Button>
			<Button size="lg" depth="z4" bevel="medium">Deep Bevel</Button>
			<Button size="lg" surface="glass-frost">Frost Surface</Button>
		</div>
	</div>
</Story>
