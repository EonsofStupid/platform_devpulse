<script lang="ts">
	/**
	 * MaestroIcon - Animated SVG icon for Maestro assistant
	 * Spins when ruminating, glows with accent color
	 */
	interface Props {
		ruminating?: boolean;
		size?: number;
	}

	let { ruminating = false, size = 18 }: Props = $props();
</script>

<div class="maestro-icon" class:ruminating>
	<svg width={size} height={size} viewBox="0 0 32 32" fill="none">
		<circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" fill="none" />
		<circle cx="16" cy="16" r="6" fill="currentColor" />
		<path d="M16 2v6M16 24v6M2 16h6M24 16h6" stroke="currentColor" stroke-width="2" />
	</svg>
</div>

<style>
	.maestro-icon {
		color: var(--dp-accent-primary);
		display: flex;
		filter: drop-shadow(0 0 6px oklch(from var(--dp-accent-primary) l c h / 0.5));
		transition: color 0.3s ease, filter 0.3s ease;
	}

	.maestro-icon.ruminating {
		animation: spin 3s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
