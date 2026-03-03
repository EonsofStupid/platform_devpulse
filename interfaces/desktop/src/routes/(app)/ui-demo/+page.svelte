<!--
	@file UI Demo — ColdLight Design System Showcase
	Demonstrates structureless primitives, styled components, recipes, and tokens.
-->
<script lang="ts">
	import { Button, type ButtonIntent, type ButtonSize } from "$lib/design/index.js";

	const intents: ButtonIntent[] = ["primary", "secondary", "ghost", "danger"];
	const sizes: ButtonSize[] = ["sm", "md", "lg"];
</script>

<div class="min-h-screen bg-surface-base p-8 text-text-primary">
	<header class="mb-12">
		<h1 class="text-3xl font-bold text-teal-200 mb-2">ColdLight Design System</h1>
		<p class="text-text-muted">Structureless primitives. SD5 token-driven recipes. Zero runtime contract overhead.</p>
	</header>

	<!-- Button Component -->
	<section class="mb-12">
		<h2 class="text-xl font-semibold text-teal-300 mb-6">Button</h2>

		<!-- Intents -->
		<div class="mb-8">
			<h3 class="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">Intents</h3>
			<div class="flex flex-wrap gap-4">
				<Button intent="primary" size="md">Primary</Button>
				<Button intent="secondary" size="md">Secondary</Button>
				<Button intent="ghost" size="md">Ghost</Button>
				<Button intent="danger" size="md">Danger</Button>
			</div>
		</div>

		<!-- Sizes -->
		<div class="mb-8">
			<h3 class="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">Sizes</h3>
			<div class="flex flex-wrap items-center gap-4">
				<Button intent="primary" size="sm">Small</Button>
				<Button intent="primary" size="md">Medium</Button>
				<Button intent="primary" size="lg">Large</Button>
			</div>
		</div>

		<!-- States -->
		<div class="mb-8">
			<h3 class="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">States</h3>
			<div class="flex flex-wrap items-center gap-4">
				<Button intent="primary" size="md" disabled>Disabled</Button>
				<Button intent="primary" size="md" loading>Loading</Button>
				<Button intent="primary" size="md" pressed={true}>Pressed</Button>
				<Button intent="primary" size="md" pressed={false}>Unpressed</Button>
			</div>
		</div>

		<!-- All Intents x Sizes Matrix -->
		<div class="mb-8">
			<h3 class="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">Intent x Size Matrix</h3>
			<div class="grid grid-cols-4 gap-4">
				{#each intents as intent}
					{#each sizes as size}
						<Button {intent} {size}>{intent} {size}</Button>
					{/each}
				{/each}
			</div>
		</div>

		<!-- Data Attributes (for dev inspection) -->
		<div class="mb-8">
			<h3 class="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">Data Attributes (inspect in DevTools)</h3>
			<div class="flex flex-wrap gap-4">
				<Button intent="primary" size="md" data-id="test-button">data-id="test-button"</Button>
				<Button intent="secondary" size="md" pressed={true} data-id="toggle-btn">Toggle (pressed)</Button>
			</div>
			<p class="text-xs text-text-muted mt-2">
				Inspect elements: data-kind="button", data-slot="root", data-state, data-id
			</p>
		</div>
	</section>
</div>
