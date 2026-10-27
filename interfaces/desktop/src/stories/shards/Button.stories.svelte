<!-- @file Button stories — real generated variants, states and compositions. -->
<script module lang="ts">
import { BUTTON_SIZES, BUTTON_VARIANTS } from "@devpulse/coldlight/components/button";
import { defineMeta } from "@storybook/addon-svelte-csf";

const { Story } = defineMeta({
	title: "ColdLight/Button",
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: BUTTON_VARIANTS,
			description: "Generated visual variant",
		},
		size: {
			control: "select",
			options: BUTTON_SIZES,
			description: "Generated height, padding and typography",
		},
		disabled: { control: "boolean" },
		loading: { control: "boolean" },
		label: { control: "text" },
	},
	args: { variant: "primary", size: "md", disabled: false, loading: false, label: "Save Changes" },
});
</script>

<script lang="ts">
import { Button, type ButtonSize, type ButtonVariant } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
</script>

<Story name="Default">
	{#snippet template(args)}
	{@const a = args as { variant: ButtonVariant; size: ButtonSize; disabled: boolean; loading: boolean; label: string }}
	<div class="p-12 min-h-48 flex items-center justify-center">
		<Button variant={a.variant} size={a.size} disabled={a.disabled} loading={a.loading}>{a.label}</Button>
	</div>
	{/snippet}
</Story>

<Story name="All Variants">
	<div class="p-12 min-h-48 flex items-center gap-4 flex-wrap">
		{#each BUTTON_VARIANTS as variant}
			<Button {variant}>{variant}</Button>
		{/each}
	</div>
</Story>

<Story name="All Sizes">
	<div class="p-12 min-h-48 flex items-center gap-4 flex-wrap">
		{#each BUTTON_SIZES as size}
			<Button {size}>Size {size}</Button>
		{/each}
	</div>
</Story>

<Story name="States">
	<div class="p-12 min-h-48 flex items-center gap-4 flex-wrap">
		<Button>Normal</Button>
		<Button disabled>Disabled</Button>
		<Button loading>Loading</Button>
		<Button defaultPressed={true}>Pressed</Button>
	</div>
</Story>

<Story name="Composite Effects">
	<div class="p-12 flex flex-col gap-8">
		<Text>Generated variants combine fill, border, shadow and typography.</Text>
		{#each BUTTON_SIZES as size}
			<div class="flex items-center gap-4 flex-wrap">
				{#each BUTTON_VARIANTS as variant}
					<Button {size} {variant}>{variant} {size}</Button>
				{/each}
			</div>
		{/each}
	</div>
</Story>

<Story name="DTCG Composite Tokens">
	<div class="p-12 flex flex-col gap-6">
		<Heading level={2}>Token resolution</Heading>
		<Text>button.tokens.json → Style Dictionary → generated CSS and typed selectors.</Text>
		<Text>Variant and size select generated rules; the component emits no inline visual declarations.</Text>
		<div class="flex flex-wrap items-center gap-4">
			{#each BUTTON_VARIANTS as variant}
				<Button {variant}>{variant}</Button>
			{/each}
		</div>
		<div class="flex flex-wrap items-center gap-4">
			{#each BUTTON_SIZES as size}
				<Button {size}>{size}</Button>
			{/each}
		</div>
		<div class="flex flex-wrap items-center gap-4">
			<Button variant="primary" size="lg">Primary Large</Button>
			<Button variant="secondary" size="lg">Secondary Large</Button>
			<Button variant="danger" size="lg">Danger Large</Button>
		</div>
	</div>
</Story>

<Story name="Block Composition">
	<div class="p-12 flex flex-col items-start gap-8">
		<Text>Real Card and Button compositions for block renderers.</Text>
		<Card surface="glass" variant="elevated" class="p-6 w-full max-w-lg gap-4">
			<Heading level={2}>Confirm Action</Heading>
			<Text>Card selects its surface family and role. Buttons retain their action variants.</Text>
			<div class="flex flex-wrap gap-3 justify-end">
				<Button variant="ghost">Cancel</Button>
				<Button variant="secondary">Save Draft</Button>
				<Button variant="primary">Confirm</Button>
			</div>
		</Card>
		<Card surface="stark" variant="glow" class="p-6 w-full max-w-lg gap-4">
			<Heading level={2}>Destructive Action</Heading>
			<Text>Danger is explicit on the action; a glowing container does not change its behavior.</Text>
			<div class="flex flex-wrap gap-3 justify-end">
				<Button variant="ghost">Go Back</Button>
				<Button variant="danger">Delete Project</Button>
			</div>
		</Card>
	</div>
</Story>

<Story name="Default Resolution">
	<div class="p-12 flex flex-col gap-8">
		<Heading level={2}>Generated defaults</Heading>
		<Text>With no props, Button reads variant="primary" and size="md" from button.generated.ts.</Text>
		<div class="flex items-center gap-8 flex-wrap">
			<Button>Save Changes</Button>
			<Text>data-kind="button" · data-variant="primary" · data-size="md"</Text>
		</div>
		<div class="flex flex-wrap items-center gap-4">
			{#each BUTTON_VARIANTS as variant}
				<div class="flex flex-col items-center gap-2">
					<Button {variant}>{variant}</Button>
					<Text size="xs">data-variant="{variant}"</Text>
				</div>
			{/each}
		</div>
	</div>
</Story>
