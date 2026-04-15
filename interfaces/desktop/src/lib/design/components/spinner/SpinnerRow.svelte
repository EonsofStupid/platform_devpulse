<!--
	@component SpinnerRow
	@kind spinner-row
	@layer component
	@category feedback
	@description Inline spinner + label — the canonical "X is
	              happening" strip. Replaces every hand-rolled
	              `<Loader2 class="animate-spin" /> Loading...`
	              pattern across the codebase.
	@container true
	@compound true
	@blockCategory feedback
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { cn } from "$lib/design/utils/cn.js";
import Spinner from "./Spinner.svelte";
import type { SpinnerSize, SpinnerTone } from "./types.js";

interface Props {
	/** Size preset. Passed through to the inner `Spinner`. */
	size?: SpinnerSize;
	/** Color tint. Passed through to the inner `Spinner`. */
	tone?: SpinnerTone;
	/**
	 * Label shown to the right of the spinner. Prefer the `children`
	 * snippet for rich content (e.g. with a progress count); fall
	 * back to this string for the common plain-text case.
	 */
	label?: string;
	/** Extra container classes. Structural only — no color or
	 *  animation overrides. */
	class?: string;
	/**
	 * Rich label as a snippet. Use when you need `<Text>` props
	 * (weight, color) or mixed content (e.g. "Downloading" + a
	 * byte-count span). Overrides `label` when present.
	 */
	children?: Snippet;
}

let { size = "sm", tone = "default", label, class: className, children }: Props = $props();
</script>

<div
	class={cn("inline-flex items-center gap-2 motion-reduce:[&_svg]:animate-none", className)}
	data-kind="spinner-row"
	data-slot="root"
	data-size={size}
	data-tone={tone}
	role="status"
	aria-live="polite"
	aria-busy="true"
>
	<Spinner {size} {tone} />
	{#if children}
		{@render children()}
	{:else if label}
		<span class="text-[color:var(--text-secondary)]">{label}</span>
	{/if}
</div>
