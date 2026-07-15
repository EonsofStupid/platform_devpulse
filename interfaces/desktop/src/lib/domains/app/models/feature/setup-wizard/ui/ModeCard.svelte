<!--
	@file ModeCard.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/ui/mode-card

	Connection-mode card — a typed wizard variant off the base Card
	block. ONE chrome (wizard-elevated well); layman guidance only —
	discovery covers every mode. Tooltip on mouseover (ARIA tooltip
	pattern, zero-chrome behavioral trigger).

	Effects are UNIVERSAL: the hover lift/press values live in the
	`wizard-elevated-hover` / `wizard-elevated-active` token leaves
	(wizard.tokens.json → emitted runtime CSS). The scoped rules below
	are end-of-cascade OVERWRITES that BIND those emitted vars —
	reference, never restate (operator law 2026-07-14). Selected state
	is the one sanctioned Lock #6 connect-blue overlay, moved verbatim
	from EndpointView.
-->
<script lang="ts">
import { Card } from "$lib/design/components/card/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/design/components/tooltip/index.js";
import type { ModeCardProps } from "../util/wizard.types.js";

let {
	icon: Icon,
	label,
	hint,
	tooltip,
	selected,
	disabled = false,
	onselect,
}: ModeCardProps = $props();
</script>

<Tooltip>
	<TooltipTrigger class="mode-card-trigger">
		<Card
			as="button"
			preset="wizard-elevated"
			class="mode-card"
			aria-pressed={selected}
			data-selected={selected ? "true" : undefined}
			{disabled}
			onclick={onselect}
		>
			<Icon size={18} class="mode-icon" />
			<Heading level={3} size="sm">{label}</Heading>
			<Text size="xs" color="muted">{hint}</Text>
		</Card>
	</TooltipTrigger>
	<TooltipContent preset="stark">{tooltip}</TooltipContent>
</Tooltip>

<style>
	/* Layout + end-of-cascade bindings of UNIVERSAL values only. */
	:global(.mode-card-trigger) {
		display: flex;
		width: 100%;
		min-width: 0;
	}

	:global(.mode-card) {
		flex-direction: column;
		align-items: flex-start;
		gap: clamp(0.375rem, 0.8cqi, 0.5rem);
		width: 100%;
		padding: clamp(0.875rem, 1.6cqi, 1.125rem);
		text-align: left;
		cursor: pointer;
	}

	/* Hover lift — BINDS the wizard-elevated-hover token leaf (values
	   live once, in the emitted runtime CSS). */
	:global(.mode-card:hover:not(:disabled)) {
		box-shadow: var(--preset-wizard-elevated-hover-box-shadow);
		border-color: var(--preset-wizard-elevated-hover-border-color);
	}

	/* Press-in — BINDS the wizard-elevated-active leaf. */
	:global(.mode-card:active:not(:disabled)) {
		box-shadow: var(--preset-wizard-elevated-active-box-shadow);
	}

	/* Selected — the ONE sanctioned Lock #6 connect-blue overlay
	   (moved verbatim from EndpointView, 2026-07-14). */
	:global(.mode-card[data-selected]) {
		background-color: var(--glass-blue);
		border-color: color-mix(in oklch, var(--cta-main) 55%, var(--border-subtle));
		box-shadow: 0 0.1875rem 0.75rem 0 oklch(0 0 0 / 0.4), 0 0 1.25rem 0 var(--accent-blue-glow, oklch(0.68 0.14 240 / 0.35));
	}

	:global(.mode-card:focus-visible) {
		outline: var(--border-width-thin) solid var(--cta-main);
		outline-offset: var(--outline-offset-md);
	}

	:global(.mode-icon) {
		color: var(--cta-main);
	}
</style>
