<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Shards/Button',
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
				description: 'Structural size — handled by recipe',
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
	import { cn } from '$lib/design/utils/cn.js';
	import { buttonRecipe, type ButtonSize } from '$lib/design/components/button/recipe.js';
	import { createButton } from '$lib/design/api/dsadapters/coldlight/_internal/button/index.js';

	const INTENT_STYLES: Record<string, string> = {
		primary: [
			'bg-[var(--glass-deep)]',
			'backdrop-blur-[12px]',
			'shadow-[var(--shadow-z2),var(--bevel-soft),var(--glow-teal)]',
			'border border-[var(--border-strong)]',
			'transition-all duration-150',
			'text-[var(--color-mint-200)]',
			'hover:shadow-[var(--shadow-z3),var(--bevel-medium),var(--glow-teal)]',
			'hover:brightness-110',
			'active:shadow-[var(--shadow-z1),var(--bevel-subtle)]',
			'active:brightness-95',
			'rounded-lg',
		].join(' '),
		secondary: [
			'bg-[var(--glass-smoke)]',
			'backdrop-blur-[8px]',
			'shadow-[var(--shadow-z1),var(--bevel-subtle)]',
			'border border-[var(--border-subtle)]',
			'transition-all duration-150',
			'text-[var(--color-mint-300)]',
			'hover:shadow-[var(--shadow-z2),var(--bevel-soft)]',
			'hover:brightness-110',
			'active:brightness-95',
			'rounded-lg',
		].join(' '),
		ghost: [
			'bg-transparent',
			'border border-transparent',
			'transition-colors duration-150',
			'text-[var(--color-mint-400)]',
			'hover:bg-[var(--glass-void)]',
			'hover:border-[var(--border-subtle)]',
			'active:bg-[var(--glass-deep)]',
			'rounded-lg',
		].join(' '),
		danger: [
			'bg-[var(--glass-deep)]',
			'backdrop-blur-[12px]',
			'shadow-[var(--shadow-z2),var(--bevel-soft),var(--glow-ember)]',
			'border border-[var(--border-strong)]',
			'transition-all duration-150',
			'text-red-300',
			'hover:shadow-[var(--shadow-z3),var(--bevel-medium),var(--glow-ember)]',
			'hover:brightness-110',
			'active:shadow-[var(--shadow-z1),var(--bevel-subtle)]',
			'active:brightness-95',
			'rounded-lg',
		].join(' '),
	};

	const INTENTS = ['primary', 'secondary', 'ghost', 'danger'] as const;
	const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

	function getIntentStyle(intent: string): string {
		return INTENT_STYLES[intent] ?? INTENT_STYLES.primary;
	}

	const defaultBuilder = createButton({ disabled: () => false });
	const disabledBuilder = createButton({ disabled: () => true });
	const loadingBuilder = createButton({ disabled: () => false, loading: () => true });
</script>

<!-- Default — interactive with all controls -->
<!-- @ts-ignore Storybook CSF args -->
<Story name="Default" let:args>
	<div class="p-12 bg-[#050708] min-h-[200px] flex items-center justify-center">
		<button
			class={cn(buttonRecipe((args as any).size as ButtonSize), getIntentStyle((args as any).intent))}
			data-kind="button"
			data-slot="root"
			data-state={(args as any).disabled ? 'disabled' : (args as any).loading ? 'loading' : 'idle'}
			disabled={(args as any).disabled}
			aria-disabled={(args as any).disabled ? 'true' : undefined}
			aria-busy={(args as any).loading ? 'true' : undefined}
		>
			{(args as any).label}
		</button>
	</div>
</Story>

<!-- All Intents — side by side comparison -->
<Story name="All Intents">
	<div class="p-12 bg-[#050708] min-h-[200px] flex items-center gap-4 flex-wrap">
		{#each INTENTS as intent}
			<button
				{...defaultBuilder.root}
				class={cn(buttonRecipe('md'), getIntentStyle(intent))}
				data-kind="button"
				data-slot="root"
			>
				{intent.charAt(0).toUpperCase() + intent.slice(1)}
			</button>
		{/each}
	</div>
</Story>

<!-- All Sizes — sm, md, lg -->
<Story name="All Sizes">
	<div class="p-12 bg-[#050708] min-h-[200px] flex items-center gap-4">
		{#each SIZES as size}
			<button
				{...defaultBuilder.root}
				class={cn(buttonRecipe(size), getIntentStyle('primary'))}
				data-kind="button"
				data-slot="root"
			>
				Size {size}
			</button>
		{/each}
	</div>
</Story>

<!-- States — disabled, loading -->
<Story name="States">
	<div class="p-12 bg-[#050708] min-h-[200px] flex items-center gap-4">
		<button
			{...defaultBuilder.root}
			class={cn(buttonRecipe('md'), getIntentStyle('primary'))}
			data-kind="button"
			data-slot="root"
		>
			Normal
		</button>

		<button
			{...disabledBuilder.root}
			class={cn(buttonRecipe('md'), getIntentStyle('primary'), 'opacity-50 pointer-events-none')}
			data-kind="button"
			data-slot="root"
		>
			Disabled
		</button>

		<button
			{...loadingBuilder.root}
			class={cn(buttonRecipe('md'), getIntentStyle('primary'), 'animate-pulse')}
			data-kind="button"
			data-slot="root"
		>
			Loading...
		</button>
	</div>
</Story>

<!-- Composite Effects — shows the 8-axis system in action -->
<Story name="Composite Effects">
	<div class="p-12 bg-[#050708] min-h-[400px] flex flex-col gap-8">
		<p class="text-sm text-zinc-500 font-mono">8-Axis Visual Encoding — each button has different axis values</p>

		<div class="flex items-center gap-4">
			<button
				class={cn(
					buttonRecipe('lg'),
					'bg-[var(--glass-deep)] backdrop-blur-[12px]',
					'shadow-[var(--shadow-z2),var(--bevel-soft),var(--glow-teal)]',
					'border border-[var(--border-strong)]',
					'text-[var(--color-mint-200)]',
					'transition-all duration-150 rounded-lg',
				)}
				data-kind="button"
				data-slot="root"
				data-encoding="v-s3z0d2b2g1f1m0t1"
			>
				Glass + Glow + Bevel
			</button>

			<button
				class={cn(
					buttonRecipe('lg'),
					'bg-[var(--glass-deep)] backdrop-blur-[12px]',
					'shadow-[var(--shadow-z3),var(--bevel-medium)]',
					'border border-[var(--border-strong)]',
					'text-zinc-200',
					'transition-all duration-150 rounded-lg',
				)}
				data-kind="button"
				data-slot="root"
				data-encoding="v-s3z0d3b3g0f1m0t1"
			>
				Deep Bevel, No Glow
			</button>

			<button
				class={cn(
					buttonRecipe('lg'),
					'bg-transparent',
					'shadow-[var(--glow-purple)]',
					'border border-transparent',
					'text-purple-300',
					'transition-all duration-150 rounded-lg',
					'animate-pulse',
				)}
				data-kind="button"
				data-slot="root"
				data-encoding="v-s1z0d0b0g3f0m1t1"
			>
				Glow Only + Pulse
			</button>
		</div>

		<div class="flex items-center gap-4">
			<button
				class={cn(
					buttonRecipe('lg'),
					'bg-[var(--glass-frost)] backdrop-blur-[16px]',
					'shadow-[var(--shadow-z1),var(--bevel-subtle),var(--glow-magenta)]',
					'border border-[var(--border-subtle)]',
					'text-zinc-800',
					'transition-all duration-250 rounded-lg',
				)}
				data-kind="button"
				data-slot="root"
				data-encoding="v-s2z0d1b1g2f1m0t2"
			>
				Frost + Magenta
			</button>

			<button
				class={cn(
					buttonRecipe('lg'),
					'bg-[var(--glass-deep)] backdrop-blur-[12px]',
					'shadow-[var(--shadow-z4),var(--bevel-pronounced),var(--glow-cyber)]',
					'border border-[var(--border-strong)]',
					'text-emerald-300',
					'transition-all duration-150 rounded-lg',
				)}
				data-kind="button"
				data-slot="root"
				data-encoding="v-s3z0d4b4g1f1m0t1"
			>
				Max Depth + Cyber
			</button>

			<button
				class={cn(
					buttonRecipe('lg'),
					'bg-zinc-800',
					'text-zinc-300',
					'rounded-lg',
				)}
				data-kind="button"
				data-slot="root"
				data-encoding="v-s0z0d0b0g0f0m0t0"
			>
				Flat Baseline
			</button>
		</div>
	</div>
</Story>
