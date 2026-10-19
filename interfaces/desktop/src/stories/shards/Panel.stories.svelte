<script module>
import { defineMeta } from "@storybook/addon-svelte-csf";

const { Story } = defineMeta({
	title: "Blocks/Panel",
	tags: ["autodocs"],
	argTypes: {
		title: {
			control: "text",
			description: "Panel header title",
		},
		surface: {
			control: "select",
			options: ["glass-void", "glass-deep", "glass-smoke", "glass-frost", "matte-dark"],
			description: "Surface axis — backdrop fill + blur",
		},
		depth: {
			control: "select",
			options: ["z0", "z1", "z2", "z3", "z4"],
			description: "Depth axis — elevation shadow",
		},
		bevel: {
			control: "select",
			options: ["off", "subtle", "soft", "medium", "pronounced", "deep"],
			description: "Bevel axis — neumorphic inset shadows",
		},
		glow: {
			control: "select",
			options: ["off", "teal", "purple", "magenta", "ember", "frost", "cyber"],
			description: "Glow axis — emission halo",
		},
	},
	args: {
		title: "Glass Panel",
		surface: "glass-deep",
		depth: "z2",
		bevel: "soft",
		glow: "teal",
	},
});
</script>

<script lang="ts">
	import { Button } from "@devpulse/coldlight/components/button";
	import { cn } from "@devpulse/coldlight/utils";

	const SURFACE_MAP: Record<string, string> = {
		'glass-void': 'bg-[var(--glass-void)] backdrop-blur-[1.25rem]',
		'glass-deep': 'bg-[var(--glass-deep)] backdrop-blur-[1rem]',
		'glass-smoke': 'bg-[var(--glass-smoke)] backdrop-blur-[0.75rem]',
		'glass-frost': 'bg-[var(--glass-frost)] backdrop-blur-[1.25rem]',
		'matte-dark': 'bg-[var(--matte-dark)]',
	};

	const DEPTH_MAP: Record<string, string> = {
		z0: '',
		z1: 'shadow-[var(--shadow-z1)]',
		z2: 'shadow-[var(--shadow-z2)]',
		z3: 'shadow-[var(--shadow-z3)]',
		z4: 'shadow-[var(--shadow-z4)]',
	};

	const BEVEL_MAP: Record<string, string> = {
		off: '',
		subtle: 'shadow-[var(--bevel-subtle)]',
		soft: 'shadow-[var(--bevel-soft)]',
		medium: 'shadow-[var(--bevel-medium)]',
		pronounced: 'shadow-[var(--bevel-pronounced)]',
		deep: 'shadow-[var(--bevel-deep)]',
	};

	const GLOW_MAP: Record<string, string> = {
		off: '',
		teal: 'shadow-[var(--glow-teal)]',
		purple: 'shadow-[var(--glow-purple)]',
		magenta: 'shadow-[var(--glow-magenta)]',
		ember: 'shadow-[var(--glow-ember)]',
		frost: 'shadow-[var(--glow-frost)]',
		cyber: 'shadow-[var(--glow-cyber)]',
	};
</script>

<!-- Default — interactive glass panel with buttons -->
<!-- @ts-ignore Storybook CSF args -->
<Story name="Default" let:args>
	<div class="p-16 bg-[var(--color-void-base)] min-h-[25rem] flex items-center justify-center">
		<div
			class={cn(
				'rounded-xl p-6 w-[26.25rem]',
				'border border-[var(--border-subtle)]',
				'transition-all duration-250',
				SURFACE_MAP[(args as any).surface] ?? SURFACE_MAP['glass-deep'],
				DEPTH_MAP[(args as any).depth] ?? '',
				BEVEL_MAP[(args as any).bevel] ?? '',
				GLOW_MAP[(args as any).glow] ?? '',
			)}
			data-kind="panel"
			data-slot="root"
		>
			<!-- Header slot -->
			<div data-kind="panel" data-slot="header" class="mb-4">
				<h3 class="text-lg font-semibold text-zinc-100">{(args as any).title}</h3>
				<p class="text-sm text-zinc-400 mt-1">A block-level composition using ColdLight tokens</p>
			</div>

			<!-- Body slot -->
			<div data-kind="panel" data-slot="body" class="space-y-3 mb-6">
				<div class="flex items-center gap-3">
					<div class="w-2 h-2 rounded-full bg-[var(--color-mint-400)]"></div>
					<span class="text-sm text-zinc-300">8-axis encoding drives visual output</span>
				</div>
				<div class="flex items-center gap-3">
					<div class="w-2 h-2 rounded-full bg-[var(--color-mint-400)]"></div>
					<span class="text-sm text-zinc-300">Presets are DTCG composite tokens</span>
				</div>
				<div class="flex items-center gap-3">
					<div class="w-2 h-2 rounded-full bg-[var(--color-mint-400)]"></div>
					<span class="text-sm text-zinc-300">SD5 resolves references at build time</span>
				</div>
			</div>

			<!-- Footer slot -->
			<div data-kind="panel" data-slot="footer" class="flex gap-3 justify-end">
				<Button intent="secondary">Cancel</Button>
				<Button intent="primary">Confirm</Button>
			</div>
		</div>
	</div>
</Story>

<!-- Glow Variants — same panel, different glow colors -->
<Story name="Glow Variants">
	<div class="p-16 bg-[var(--color-void-base)] min-h-[25rem] flex items-center gap-8 flex-wrap justify-center">
		{#each ['teal', 'purple', 'magenta', 'ember', 'cyber'] as color}
			<div
				class={cn(
					'rounded-xl p-5 w-[12.5rem]',
					'bg-[var(--glass-deep)] backdrop-blur-[1rem]',
					'border border-[var(--border-subtle)]',
					'shadow-[var(--shadow-z2),var(--bevel-soft)]',
					GLOW_MAP[color],
					'transition-all duration-250',
				)}
				data-kind="panel"
				data-slot="root"
			>
				<h4 class="text-sm font-semibold text-zinc-100 capitalize mb-2">{color}</h4>
				<p class="text-xs text-zinc-400">glow: {color}</p>
				<p class="text-xs text-zinc-500 font-mono mt-1">v-g{['off', 'teal', 'purple', 'magenta', 'ember', 'frost', 'cyber'].indexOf(color)}</p>
			</div>
		{/each}
	</div>
</Story>

<!-- Bevel Progression — off through deep -->
<Story name="Bevel Progression">
	<div class="p-16 bg-[var(--color-void-base)] min-h-[25rem] flex items-center gap-6 flex-wrap justify-center">
		{#each ['off', 'subtle', 'soft', 'medium', 'pronounced', 'deep'] as level}
			<div
				class={cn(
					'rounded-xl p-5 w-[11.25rem] h-[7.5rem] flex flex-col justify-between',
					'bg-[var(--glass-deep)] backdrop-blur-[1rem]',
					'border border-[var(--border-subtle)]',
					'shadow-[var(--shadow-z2)]',
					BEVEL_MAP[level],
					'transition-all duration-250',
				)}
				data-kind="panel"
				data-slot="root"
			>
				<h4 class="text-sm font-semibold text-zinc-100 capitalize">{level}</h4>
				<p class="text-xs text-zinc-500 font-mono">bevel: {level}</p>
			</div>
		{/each}
	</div>
</Story>

<!-- Depth Scale — z0 through z4 -->
<Story name="Depth Scale">
	<div class="p-16 bg-[var(--color-void-base)] min-h-[25rem] flex items-center gap-6 flex-wrap justify-center">
		{#each ['z0', 'z1', 'z2', 'z3', 'z4'] as level}
			<div
				class={cn(
					'rounded-xl p-5 w-[10rem] h-[6.25rem] flex flex-col justify-between',
					'bg-[var(--glass-smoke)] backdrop-blur-[0.75rem]',
					'border border-[var(--border-subtle)]',
					DEPTH_MAP[level],
					'transition-all duration-250',
				)}
				data-kind="panel"
				data-slot="root"
			>
				<h4 class="text-sm font-semibold text-zinc-100">{level}</h4>
				<p class="text-xs text-zinc-500 font-mono">depth: {level}</p>
			</div>
		{/each}
	</div>
</Story>
