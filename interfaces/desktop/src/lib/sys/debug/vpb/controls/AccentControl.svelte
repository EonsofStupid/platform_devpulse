<!--
	@file AccentControl — Color swatch picker
	@layer vpb
-->
<script lang="ts">
	const ACCENT_TOKENS = ["teal", "purple", "magenta", "ember", "frost"] as const;

	let { value, onchange }: { value: string; onchange: (v: string) => void } = $props();

	const ACCENT_COLORS: Record<string, string> = {
		teal: "var(--color-teal-600)",
		purple: "var(--color-purple-600)",
		magenta: "var(--color-magenta-500)",
		ember: "var(--color-ember-400)",
		frost: "var(--color-frost-400)",
	};
</script>

<div class="vpb-ctrl">
	<span class="vpb-ctrl__label">Accent</span>
	<div class="vpb-ctrl__swatches">
		{#each ACCENT_TOKENS as token}
			<button
				class="vpb-ctrl__swatch"
				class:vpb-ctrl__swatch--active={value === token}
				style="--swatch-color: {ACCENT_COLORS[token] ?? 'var(--color-neutral-500)'}"
				onclick={() => onchange(token)}
				title={token}
			>
				<span class="vpb-ctrl__swatch-dot"></span>
			</button>
		{/each}
	</div>
</div>

<style>
	.vpb-ctrl { display: flex; flex-direction: column; gap: 4px; }
	.vpb-ctrl__label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vpb-label-color); }
	.vpb-ctrl__swatches { display: flex; gap: 4px; }
	.vpb-ctrl__swatch { width: 32px; height: 28px; border: 2px solid transparent; border-radius: 4px; background: var(--vpb-btn-bg); cursor: pointer; display: flex; align-items: center; justify-content: center; }
	.vpb-ctrl__swatch:hover { border-color: var(--vpb-swatch-hover-border); }
	.vpb-ctrl__swatch--active { border-color: var(--vpb-swatch-active-border); }
	.vpb-ctrl__swatch-dot { width: 16px; height: 16px; border-radius: 50%; background: var(--swatch-color); }
</style>
