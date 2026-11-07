<script lang="ts">
	/**
	 * GlassPanel - Deep cyber glass container
	 * Uses global glass recipes from styles/recipes/glass.css
	 * Supports layered depth, animated glows, and cyberpunk effects
	 */
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		/** Glass intensity variant */
		variant?: 'default' | 'deep' | 'intense' | 'float' | 'card' | 'modal';
		/** Depth layer for z-index stacking */
		layer?: 0 | 1 | 2 | 3;
		/** Animated glow border */
		glow?: boolean | 'fast' | 'medium' | 'slow';
		/** Cyberpunk effects */
		effects?: Array<'scanlines' | 'scan' | 'edge' | 'corners' | 'flicker'>;
		/** Interactive state */
		state?: 'loading' | 'error' | 'success' | 'warning' | 'disabled';
		/** Custom hue tint (0-360) */
		tint?: number;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		children,
		variant = 'default',
		layer,
		glow = false,
		effects = [],
		state,
		tint,
		class: className = ''
	}: Props = $props();

	// Map variant to global recipe class
	const variantClass = $derived({
		default: 'glass',
		deep: 'glass-deep',
		intense: 'glass-intense',
		float: 'glass-float',
		card: 'glass-card',
		modal: 'glass-modal'
	}[variant] || 'glass');

	// Build layer class
	const layerClass = $derived(layer !== undefined ? `glass-layer-${layer}` : '');

	// Build glow class
	const glowClass = $derived(
		glow === true ? 'glass-glow' :
		glow === 'fast' ? 'glass-glow glass-glow-fast' :
		glow === 'medium' ? 'glass-glow glass-glow-medium' :
		glow === 'slow' ? 'glass-glow glass-glow-slow' : ''
	);

	// Build effect classes
	const effectClasses = $derived(
		effects.map(e => {
			switch (e) {
				case 'scanlines': return 'glass-scanlines';
				case 'scan': return 'glass-scan';
				case 'edge': return 'glass-edge-top';
				case 'corners': return 'glass-corners';
				case 'flicker': return 'glass-flicker';
				default: return '';
			}
		}).filter(Boolean).join(' ')
	);

	// Build state class
	const stateClass = $derived(state ? `glass-${state}` : '');

	// Combine all classes
	const classes = $derived(
		[variantClass, layerClass, glowClass, effectClasses, stateClass, className]
			.filter(Boolean)
			.join(' ')
	);

	// Custom tint style
	const tintStyle = $derived(tint !== undefined ? `--glass-tint: ${tint};` : '');
</script>

<div class={classes} style={tintStyle || undefined}>
	{@render children()}
</div>
