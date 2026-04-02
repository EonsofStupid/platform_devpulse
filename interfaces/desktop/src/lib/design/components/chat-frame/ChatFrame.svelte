<!--
	@component Chat Frame
	@kind chat-frame
	@layer component
	@category layout
	@description Chat window frame — single-column grid (topbar, messages, footer). Sidebar and context panel are overlays that extend out.
	@container true
	@containerSlots topbar, chat-dashboard, chat-footer
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
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
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

const m = $derived(renderForge({ kind: "chat-frame", preset: "default" }));
</script>

<div
	role="dialog"
	aria-label="Clyffy Chat"
	aria-modal="false"
	{...m.dataAttrs}
	data-slot="root"
	data-layout="chat"
	data-state={state}
	data-engaged={String(engaged)}
	data-context-collapsed={String(contextCollapsed)}
	style={cssVarString(m.cssVars)}
	class={cn("chat-frame overflow-hidden font-sans", className)}
	{...rest}
>
	{@render children()}
</div>

<style>
	/* ── Grid: single column — topbar / messages / footer ── */
	.chat-frame {
		position: relative;
		display: grid;
		grid-template-rows: var(--chat-topbar-height, 2.5rem) 1fr var(--chat-footer-height, 3.5rem);
		grid-template-columns: 1fr;
		grid-template-areas:
			"topbar"
			"dashboard"
			"footer";
		width: 100%;
		height: 100vh;
		overflow: hidden;
	}

	/* ── State: Open ────────────────────────────────────────── */
	.chat-frame:where([data-state="open"]) {
		opacity: 1;
	}

	/* ── State: Minimized ───────────────────────────────────── */
	.chat-frame:where([data-state="minimized"]) {
		height: var(--chat-topbar-height, 2.5rem);
		grid-template-rows: 1fr;
		grid-template-areas: "topbar";
	}

	.chat-frame:where([data-state="minimized"]) :global([data-slot="chat-dashboard"]),
	.chat-frame:where([data-state="minimized"]) :global([data-slot="chat-footer"]) {
		display: none;
	}

	/* ── State: Closed ──────────────────────────────────────── */
	.chat-frame:where([data-state="closed"]) {
		opacity: 0;
		pointer-events: none;
	}

	/* ── Child Slot Placement ───────────────────────────────── */
	.chat-frame :global([data-slot="topbar"]) {
		grid-area: topbar;
		min-height: 0;
	}

	.chat-frame :global([data-slot="chat-dashboard"]) {
		grid-area: dashboard;
		min-height: 0;
		overflow-y: auto;
	}

	.chat-frame :global([data-slot="chat-footer"]) {
		grid-area: footer;
		min-height: 0;
	}

	/* ── Overlays: sidebar + context extend OUT from chat ──── */
	.chat-frame :global([data-slot="mode-selector"]) {
		position: absolute;
		top: var(--chat-topbar-height, 2.5rem);
		left: 0;
		bottom: var(--chat-footer-height, 3.5rem);
		width: var(--chat-sidebar-width, 3.5rem);
		z-index: 10;
		transform: translateX(-100%);
		transition: transform 200ms ease-out;
	}

	.chat-frame :global([data-slot="mode-selector"][data-visible="true"]) {
		transform: translateX(0);
	}

	.chat-frame :global([data-slot="context-panel"]) {
		position: absolute;
		top: var(--chat-topbar-height, 2.5rem);
		right: 0;
		bottom: var(--chat-footer-height, 3.5rem);
		width: var(--chat-context-width, 12rem);
		z-index: 10;
		transform: translateX(100%);
		transition: transform 200ms ease-out;
	}

	.chat-frame :global([data-slot="context-panel"][data-collapsed="false"]) {
		transform: translateX(0);
	}

	/* ── Scrollbar ──────────────────────────────────────────── */
	.chat-frame :global([data-slot="chat-dashboard"])::-webkit-scrollbar {
		width: 0.25rem;
	}

	.chat-frame :global([data-slot="chat-dashboard"])::-webkit-scrollbar-track {
		background: transparent;
	}

	.chat-frame :global([data-slot="chat-dashboard"])::-webkit-scrollbar-thumb {
		background: var(--color-teal-700, oklch(0.45 0.08 173));
		border-radius: 0.125rem;
	}

	.chat-frame :global([data-slot="chat-dashboard"])::-webkit-scrollbar-thumb:hover {
		background: var(--color-teal-600, oklch(0.55 0.1 173));
	}
</style>
