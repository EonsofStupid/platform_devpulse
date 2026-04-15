<!--
	@component Spinner
	@kind spinner
	@layer component
	@category content
	@description Canonical loading indicator for indeterminate waits.
	              THE single spinner surface — every other "spinning
	              thing" in the codebase should compose this (via
	              `SpinnerRow`, `LoadingBlock`, `LoadingOverlay`) or
	              render it directly with props.
	@container false
	@compound false
	@blockCategory feedback
	@defaultStyle spinner-default
	@styleIds spinner-default
	@requiredAxes color, animation
	@slots root:all
-->
<script lang="ts">
import { spinnerAnatomy, useSpinner } from "$lib/design/behaviors/display/spinner/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { SpinnerProps, SpinnerSize, SpinnerTone } from "./types.js";

/**
 * Size → tailwind `size-*` utility. Kept as a const map so the
 * tailwind compiler can statically see every class name (arbitrary
 * string keys would not get purged correctly).
 */
const SIZE: Record<SpinnerSize, string> = {
	xs: "size-3",
	sm: "size-4",
	md: "size-6",
	lg: "size-8",
	xl: "size-10",
};

/**
 * Tone → CSS custom property reference used by the glue CSS.
 * The spinner's `currentColor` inherits from `--spinner-tone` which
 * we set via `style:--spinner-tone={...}` on the root. No raw hex,
 * no inline `style="color: ..."`, no tailwind arbitrary values.
 */
const TONE_VAR: Record<SpinnerTone, string> = {
	default: "var(--text-primary)",
	muted: "var(--text-muted)",
	accent: "var(--accent-teal-main)",
	success: "var(--signal-success)",
	warning: "var(--signal-warning)",
	error: "var(--signal-error)",
};

/** Label font-size mapping — tracks the spinner size. */
const LABEL_SIZE: Record<SpinnerSize, string> = {
	xs: "text-[0.6875rem]",
	sm: "text-xs",
	md: "text-sm",
	lg: "text-sm",
	xl: "text-base",
};

let {
	active = true,
	size = "md",
	preset = "default",
	tone = "default",
	label,
	class: className,
	...rest
}: SpinnerProps = $props();

const spinner = $derived(useSpinner({ active }));
const m = $derived(renderForge({ kind: "spinner", preset }));
const toneVar = $derived(TONE_VAR[tone] ?? TONE_VAR.default);
const sizeClass = $derived(SIZE[size] ?? SIZE.md);
const labelClass = $derived(LABEL_SIZE[size] ?? LABEL_SIZE.md);

/** When `label` is set, wrap spinner + label in a layout container.
 *  xs/sm/md → inline row. lg/xl → centered stack. */
const hasLabel = $derived(Boolean(label && label.length > 0));
const stackDirection = $derived(size === "lg" || size === "xl" ? "col" : "row");
</script>

{#if active}
	{#if hasLabel}
		<div
			class={cn(
				"inline-flex items-center gap-2 motion-reduce:[&_svg]:animate-none",
				stackDirection === "col" && "flex-col gap-2",
				className,
			)}
			data-kind="spinner"
			data-slot="labeled"
			data-tone={tone}
			data-size={size}
			style:--spinner-tone={toneVar}
			role="status"
			aria-live="polite"
			aria-busy="true"
			aria-label={label}
		>
			<svg
				class={cn("animate-spin shrink-0 text-[color:var(--spinner-tone)]", sizeClass)}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
				<path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
			</svg>
			<span class={cn(labelClass, "text-[color:var(--text-secondary)]")}>{label}</span>
		</div>
	{:else}
		<div
			{...spinnerAnatomy.attrs.root}
			{...spinner.root}
			{...m.dataAttrs}
			style={cssVarString({ ...m.cssVars, "--spinner-tone": toneVar })}
			data-state={active ? "active" : "idle"}
			data-tone={tone}
			data-size={size}
			class={cn(
				"inline-flex items-center justify-center animate-spin text-[color:var(--spinner-tone)] motion-reduce:animate-none",
				sizeClass,
				className,
			)}
			{...rest}
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				class="size-full"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
				<path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
			</svg>
		</div>
	{/if}
{/if}
