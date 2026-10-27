<!--
  @file UiDemoDashboard — ColdLight design system showcase.
  Rendered by (app)/ui-demo/+page.svelte.
  Demonstrates structureless primitives, styled components, recipes, and tokens.
-->
<script lang="ts">
import { BUTTON_SIZES, BUTTON_VARIANTS, Button } from "@devpulse/coldlight/components/button";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { SURFACE_FAMILIES } from "@devpulse/coldlight/renderforge";
import { ComponentPreview } from "../../ui/component-preview/index.js";

let selections = $state<Record<string, boolean>>({});
let feedback = $state(
	"Select a session or action to test its interaction. Preview actions do not run agents.",
);
</script>

<div class="min-h-screen p-4 lg:p-8">
	<header class="mb-12">
		<Heading level={1} size="2xl">ColdLight Design System</Heading>
		<Text>Generated surfaces and typed components. Compare the same live compositions across every surface family.</Text>
	</header>

	<div role="status" aria-live="polite" class="mb-6"><Text>{feedback}</Text></div>
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 mb-12">
		{#each SURFACE_FAMILIES as family}
			<ComponentPreview {family} selected={selections[family] ?? false}
				onSelect={() => { selections[family] = !selections[family]; feedback = `${family}: session ${selections[family] ? "selected" : "unselected"}`; }}
				onAction={(message) => { feedback = message; }} />
		{/each}
	</div>
	<!-- Existing Button matrix remains available below the composition review. -->
	<!-- Button Component -->
	<section class="mb-12">
		<Heading level={2} size="lg">Button</Heading>

		<!-- Variants -->
		<div class="mb-8">
			<Heading level={3} size="sm">Variants</Heading>
			<div class="flex flex-wrap gap-4">
				<Button variant="primary" size="md">Primary</Button>
				<Button variant="secondary" size="md">Secondary</Button>
				<Button variant="ghost" size="md">Ghost</Button>
				<Button variant="danger" size="md">Danger</Button>
			</div>
		</div>

		<!-- Sizes -->
		<div class="mb-8">
			<Heading level={3} size="sm">Sizes</Heading>
			<div class="flex flex-wrap items-center gap-4">
				<Button variant="primary" size="sm">Small</Button>
				<Button variant="primary" size="md">Medium</Button>
				<Button variant="primary" size="lg">Large</Button>
			</div>
		</div>

		<!-- States -->
		<div class="mb-8">
			<Heading level={3} size="sm">States</Heading>
			<div class="flex flex-wrap items-center gap-4">
				<Button variant="primary" size="md" disabled>Disabled</Button>
				<Button variant="primary" size="md" loading>Loading</Button>
				<Button variant="primary" size="md" defaultPressed={true}>Pressed</Button>
				<Button variant="primary" size="md" defaultPressed={false}>Unpressed</Button>
			</div>
		</div>

		<!-- All Variants x Sizes Matrix -->
		<div class="mb-8">
			<Heading level={3} size="sm">Variant x Size Matrix</Heading>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{#each BUTTON_VARIANTS as variant}
					{#each BUTTON_SIZES as size}
						<Button {variant} {size}>{variant} {size}</Button>
					{/each}
				{/each}
			</div>
		</div>

		<!-- Data Attributes (for dev inspection) -->
		<div class="mb-8">
			<Heading level={3} size="sm">Data Attributes (inspect in DevTools)</Heading>
			<div class="flex flex-wrap gap-4">
				<Button variant="primary" size="md" data-id="test-button">data-id="test-button"</Button>
				<Button variant="secondary" size="md" defaultPressed={true} data-id="toggle-btn">Toggle (pressed)</Button>
			</div>
			<Text size="xs" class="mt-2">
				Inspect elements: data-kind="button", data-slot="root", data-state, data-id
			</Text>
		</div>
	</section>
</div>
