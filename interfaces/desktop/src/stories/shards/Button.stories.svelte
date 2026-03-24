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

	/**
	 * DTCG token chain demonstrated in this file:
	 *
	 * button.json (DTCG)
	 *   → preset.button.primary.$value.glow = "{glow.teal}"
	 *   → SD5 resolves to CSS: --glow-teal: 0px 0px 20px 0px #00907666
	 *   → variants.css: v-g1 { --shadow-glow: var(--glow-teal) }
	 *   → [data-kind] { box-shadow: var(--shadow-depth), var(--shadow-bevel), var(--shadow-glow), var(--shadow-frame) }
	 *
	 * Component just passes intent="primary" → useColdLight resolves preset → emits v-* classes.
	 * Zero hardcoded CSS anywhere in this file.
	 */
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
			<Button size="lg" intent="primary">Custom Glow</Button>
			<Button size="lg" intent="secondary">Deep Bevel</Button>
			<Button size="lg" intent="ghost">Frost Surface</Button>
		</div>
	</div>
</Story>

<!--
	DTCG Composite Token Consumption
	=================================
	Shows Button consuming individual 8-axis token props directly.
	Each prop maps to a DTCG token reference in button.json:

	  surface="glass-deep"   → {surface.overlay}     → --glass-deep (oklch)  → v-s3
	  depth="z3"             → {shadow.z3}            → --shadow-z3 (composite) → v-d3
	  bevel="medium"         → {bevel.medium}         → --bevel-medium (4-layer inset) → v-b3
	  glow="magenta"         → {glow.magenta}         → --glow-magenta (20px emission) → v-g3

	The component calls useColdLight() which resolves these through
	registry/resolve-visual.ts → emits v-* segment classes.
	variants.css sets CSS custom properties per segment.
	[data-kind] base rule composites all 4 shadow layers into one box-shadow.
-->
<Story name="DTCG Composite Tokens">
	<div class="p-12 bg-[#050708] min-h-[500px] flex flex-col gap-10">
		<div>
			<p class="text-sm text-zinc-500 font-mono mb-4">DTCG Token Resolution Chain — each row overrides one axis at a time</p>

			<!-- Row 1: Intent variants -->
			<p class="text-xs text-zinc-600 font-mono mb-2">intent: primary → secondary → ghost → danger</p>
			<div class="flex items-center gap-4 mb-6">
				<Button intent="primary">Primary</Button>
				<Button intent="secondary">Secondary</Button>
				<Button intent="ghost">Ghost</Button>
				<Button intent="danger">Danger</Button>
			</div>

			<!-- Row 2: Size variants -->
			<p class="text-xs text-zinc-600 font-mono mb-2">size: sm → md → lg</p>
			<div class="flex items-center gap-4 mb-6">
				<Button size="sm">Small</Button>
				<Button size="md">Medium</Button>
				<Button size="lg">Large</Button>
			</div>

			<!-- Row 3: Combined intent + size -->
			<p class="text-xs text-zinc-600 font-mono mb-2">Combined: intent + size composition</p>
			<div class="flex items-center gap-4">
				<Button intent="primary" size="lg">
					Primary Large
				</Button>
				<Button intent="secondary" size="lg">
					Secondary Large
				</Button>
				<Button intent="danger" size="lg">
					Danger Large
				</Button>
			</div>
		</div>
	</div>
</Story>

<!--
	Block Composition
	=================
	Shows Button as it would appear inside a VPB block.
	BlockNode stores: kind + recipe + props (no CSS, no classes).
	The renderer resolves visual from props via useColdLight().

	This story simulates what VPB renders:
	  BlockNode { kind: "button", recipe: "button.glass.void", props: { surface: "glass-deep", glow: "teal" } }
	  → Button component receives props
	  → useColdLight() resolves to v-* classes
	  → variants.css applies token-backed CSS
-->
<Story name="Block Composition">
	<div class="p-12 bg-[#050708] min-h-[500px] flex flex-col gap-8">
		<p class="text-sm text-zinc-500 font-mono">VPB Block Simulation — button inside a surface block, all token-driven</p>

		<!-- Simulated Panel block containing buttons -->
		<div
			class="rounded-xl p-6 w-[480px] v-s3 v-d2 v-b2 v-g1 v-f1 v-t1 border border-[var(--border-subtle)]"
			data-kind="panel"
			data-slot="root"
		>
			<div data-kind="panel" data-slot="header" class="mb-4">
				<h3 class="text-lg font-semibold text-zinc-100">Confirm Action</h3>
				<p class="text-sm text-zinc-400 mt-1">This panel and its buttons are fully token-driven. No hardcoded CSS.</p>
			</div>

			<div data-kind="panel" data-slot="body" class="space-y-3 mb-6">
				<div class="flex items-center gap-3">
					<div class="w-2 h-2 rounded-full v-g1" data-kind="indicator" data-slot="root"></div>
					<span class="text-sm text-zinc-300">Panel: surface=glass-deep, depth=z2, bevel=soft, glow=teal</span>
				</div>
				<div class="flex items-center gap-3">
					<div class="w-2 h-2 rounded-full v-g1" data-kind="indicator" data-slot="root"></div>
					<span class="text-sm text-zinc-300">Buttons: inherit context, override intent via preset</span>
				</div>
			</div>

			<div data-kind="panel" data-slot="footer" class="flex gap-3 justify-end">
				<Button intent="ghost">Cancel</Button>
				<Button intent="secondary">Save Draft</Button>
				<Button intent="primary">Confirm</Button>
			</div>
		</div>

		<!-- Simulated Card block with danger action -->
		<div
			class="rounded-xl p-6 w-[480px] v-s3 v-d3 v-b3 v-g4 v-f1 v-t1 border border-[var(--border-strong)]"
			data-kind="card"
			data-slot="root"
		>
			<div data-kind="card" data-slot="header" class="mb-4">
				<h3 class="text-lg font-semibold text-red-300">Destructive Action</h3>
				<p class="text-sm text-zinc-400 mt-1">Card with ember glow — danger context propagated to button</p>
			</div>

			<div data-kind="card" data-slot="footer" class="flex gap-3 justify-end">
				<Button intent="ghost">Go Back</Button>
				<Button intent="danger">Delete Project</Button>
			</div>
		</div>
	</div>
</Story>

<!--
	Default Preset Resolution
	=========================
	Button with ZERO props shows the full default resolution chain:

	  1. Kind definition (kind-definitions.ts): defaultPreset = "btn-primary"
	  2. Preset registry (presets.ts): btn-primary → surface=glass-deep, depth=z2, bevel=soft, glow=teal
	  3. useColdLight() resolves via registry/resolve-visual.ts
	  4. Emits: "v-s3 v-d2 v-b2 v-g1 v-f1 v-t1"
	  5. variants.css applies CSS custom properties per segment
	  6. [data-kind] base rule composites into box-shadow

	The developer writes: <Button>Save</Button>
	ColdLight resolves everything. Zero configuration needed.
-->
<Story name="Default Resolution">
	<div class="p-12 bg-[#050708] min-h-[400px] flex flex-col gap-8">
		<div>
			<p class="text-sm text-zinc-500 font-mono mb-2">Zero props — full default resolution chain</p>
			<p class="text-xs text-zinc-600 font-mono mb-6">
				Kind default: btn-primary → surface=glass-deep, depth=z2, bevel=soft, glow=teal → v-s3z0d2b2g1f1m0t1
			</p>
			<div class="flex items-center gap-8">
				<!-- This is what a developer actually writes. Nothing else needed. -->
				<Button>Save Changes</Button>

				<div class="text-xs text-zinc-600 font-mono space-y-1">
					<p>← That button has zero explicit props.</p>
					<p>Intent defaults to "primary".</p>
					<p>Size defaults to "md".</p>
					<p>Preset resolves to btn-primary.</p>
					<p>8-axis encoding: v-s3z0d2b2g1f1m0t1</p>
					<p>All from DTCG JSON → SD5 → CSS vars → v-* utilities.</p>
				</div>
			</div>
		</div>

		<div>
			<p class="text-sm text-zinc-500 font-mono mb-2">Each intent has its own full default chain</p>
			<div class="flex items-center gap-4">
				<div class="flex flex-col items-center gap-2">
					<Button intent="primary">Primary</Button>
					<code class="text-[10px] text-zinc-600">v-s3z0d2b2g1f1m0t1</code>
				</div>
				<div class="flex flex-col items-center gap-2">
					<Button intent="secondary">Secondary</Button>
					<code class="text-[10px] text-zinc-600">v-s2z0d1b1g0f1m0t1</code>
				</div>
				<div class="flex flex-col items-center gap-2">
					<Button intent="ghost">Ghost</Button>
					<code class="text-[10px] text-zinc-600">v-s0z0d0b0g0f0m0t1</code>
				</div>
				<div class="flex flex-col items-center gap-2">
					<Button intent="danger">Danger</Button>
					<code class="text-[10px] text-zinc-600">v-s3z0d2b2g4f1m0t1</code>
				</div>
			</div>
		</div>
	</div>
</Story>
