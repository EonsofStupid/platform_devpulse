<!--
	@component Chat Frame
	@kind chat-frame
	@layer component
	@category layout
	@description Floating chat window frame with 5-zone CSS grid layout
	@container true
	@containerSlots topbar, mode-selector, chat-dashboard, context-panel, chat-footer
	@compound true
	@blockCategory chat
	@defaultStyle chat-frame-default
	@styleIds chat-frame-default, chat-frame-stark, chat-frame-glass, chat-frame-flat, chat-frame-matte
	@requiredAxes backgroundColor, border, borderRadius, shadow, color, opacity
	@slots root:all
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.25rem 1rem oklch(0 0 0 / 0.3), 0 0 2rem oklch(0.5106 0.0979 173.17 / 0.08)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.5106 0.0979 173.17 / 0.22)",
		"border-width": "0.0625rem",
		"backdrop-filter": "blur(1rem)"
}
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ChatFrameProps } from "./types.js";

let {
	state = "open",
	engaged = false,
	contextCollapsed = false,
	style,
	children,
	class: className,
	...rest
}: ChatFrameProps = $props();

const styleId = $derived(`chat-frame-${style ?? "default"}`);
</script>

<StyleMacro kind="chat-frame" style={styleId}>
	<div
		role="dialog"
		aria-label="Maestro Chat"
		aria-modal="false"
		data-kind="chat-frame"
		data-slot="root"
		data-layout="chat"
		data-state={state}
		data-engaged={String(engaged)}
		data-context-collapsed={String(contextCollapsed)}
		class={cn("chat-frame overflow-hidden font-sans", className)}
		{...rest}
	>
		{@render children()}
	</div>
</StyleMacro>

<style>
	/* ── Grid Structure ─────────────────────────────────────── */
	/* All values from DTCG tokens via SD5 → components.generated.css */

	.chat-frame {
		display: grid;
		grid-template-rows: var(--chat-topbar-height) 1fr var(--chat-footer-height);
		grid-template-columns: var(--chat-sidebar-width) 1fr var(--chat-context-width);
		grid-template-areas:
			"topbar   topbar    topbar"
			"mode     dashboard context"
			"footer   footer    footer";
		gap: var(--chat-grid-gap);
		width: clamp(var(--chat-min-width), 35vw, var(--chat-max-width));
		height: clamp(var(--chat-min-height), var(--chat-height), 80vh);
		z-index: var(--chat-z-index);
		transition:
			opacity var(--chat-transition-duration) cubic-bezier(0.16, 1, 0.3, 1),
			transform var(--chat-transition-duration) cubic-bezier(0.16, 1, 0.3, 1);
	}

	/* ── State: Open ────────────────────────────────────────── */
	.chat-frame:where([data-state="open"]) {
		opacity: var(--chat-engaged-opacity);
		transform: translateY(0);
	}

	/* ── State: Minimized ───────────────────────────────────── */
	.chat-frame:where([data-state="minimized"]) {
		height: var(--chat-topbar-height);
		grid-template-rows: 1fr;
		grid-template-columns: 1fr;
		grid-template-areas: "topbar";
	}

	.chat-frame:where([data-state="minimized"]) :global([data-slot="mode-selector"]),
	.chat-frame:where([data-state="minimized"]) :global([data-slot="chat-dashboard"]),
	.chat-frame:where([data-state="minimized"]) :global([data-slot="context-panel"]),
	.chat-frame:where([data-state="minimized"]) :global([data-slot="chat-footer"]) {
		display: none;
	}

	/* ── State: Closed ──────────────────────────────────────── */
	.chat-frame:where([data-state="closed"]) {
		opacity: 0;
		transform: translateY(1.25rem);
		pointer-events: none;
	}

	/* ── Idle transparency ──────────────────────────────────── */
	.chat-frame:where([data-engaged="false"]) {
		opacity: var(--chat-idle-opacity);
	}

	.chat-frame:where([data-engaged="false"]):hover {
		opacity: var(--chat-engaged-opacity);
	}

	/* ── Child Slot Placement ───────────────────────────────── */
	.chat-frame :global([data-slot="topbar"]) {
		grid-area: topbar;
		min-height: 0;
	}

	.chat-frame :global([data-slot="mode-selector"]) {
		grid-area: mode;
		min-width: 0;
	}

	.chat-frame :global([data-slot="chat-dashboard"]) {
		grid-area: dashboard;
		min-width: 0;
		min-height: 0;
	}

	.chat-frame :global([data-slot="context-panel"]) {
		grid-area: context;
		min-width: 0;
		min-height: 0;
	}

	.chat-frame :global([data-slot="chat-footer"]) {
		grid-area: footer;
		min-height: 0;
	}

	/* ── Context Panel Collapsed ────────────────────────────── */
	.chat-frame:where([data-context-collapsed="true"]) {
		grid-template-columns: var(--chat-sidebar-width) 1fr;
		grid-template-areas:
			"topbar   topbar"
			"mode     dashboard"
			"footer   footer";
	}

	.chat-frame:where([data-context-collapsed="true"]) :global([data-slot="context-panel"]) {
		display: none;
	}

	/* ── Scrollbar ──────────────────────────────────────────── */
	.chat-frame :global([data-slot="chat-dashboard"])::-webkit-scrollbar {
		width: 0.25rem;
	}

	.chat-frame :global([data-slot="chat-dashboard"])::-webkit-scrollbar-track {
		background: transparent;
	}

	.chat-frame :global([data-slot="chat-dashboard"])::-webkit-scrollbar-thumb {
		background: var(--color-teal-700);
		border-radius: 0.125rem;
	}

	.chat-frame :global([data-slot="chat-dashboard"])::-webkit-scrollbar-thumb:hover {
		background: var(--color-teal-600);
	}
</style>
