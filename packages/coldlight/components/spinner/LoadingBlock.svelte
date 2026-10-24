<!--
	@component LoadingBlock
	@kind loading-block
	@layer component
	@category feedback
	@description Canonical "please wait" panel. A centered spinner
	              with an optional title, subtitle, progress bar,
	              and — when the wait is long enough — whatever the
	              host passes as `content` (the app's Clyffy tip card,
	              via `ClyffyLoadingBlock`). This is the ONE component
	              every in-container wait state should use; never
	              hand-roll a spinner + title + subtitle combo.
	@container true
	@compound true
	@blockCategory feedback
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { Text } from "#coldlight/components/text/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { stack } from "#coldlight/utils/stack/index.js";
import Spinner from "./Spinner.svelte";
import type { SpinnerSize, SpinnerTone } from "./types.js";

interface Props {
	/** Large title above the spinner. */
	title?: string;
	/** Muted subtitle under the title. */
	subtitle?: string;
	/** Spinner size. Default `"lg"` — appropriate for a centered block. */
	spinnerSize?: SpinnerSize;
	/** Spinner tone. Default `"accent"`. */
	tone?: SpinnerTone;
	/** Optional slot for custom body content below the subtitle and
	 *  above `content` (progress bars, step lists, etc.). */
	children?: Snippet;
	/**
	 * Something to read during a long wait, shown below the block (the
	 * app passes a rotating tip card). Only for waits that reliably take
	 * longer than ~3 s — short waits should stay clean.
	 */
	content?: Snippet;
	/** Extra container classes. Structural only. */
	class?: string;
}

let {
	title,
	subtitle,
	spinnerSize = "lg",
	tone = "accent",
	children,
	content,
	class: className,
}: Props = $props();
</script>

<div
	class={cn(
		stack({ gap: "4", align: "center" }),
		"text-center motion-reduce:[&_svg]:animate-none",
		className,
	)}
	data-kind="loading-block"
	data-slot="root"
	role="status"
	aria-live="polite"
	aria-busy="true"
>
	<Spinner size={spinnerSize} {tone} />

	{#if title}
		<Text size="base" weight="semibold" color="primary">{title}</Text>
	{/if}
	{#if subtitle}
		<Text size="sm" color="muted">{subtitle}</Text>
	{/if}

	{#if children}
		<div class="w-full">
			{@render children()}
		</div>
	{/if}

	{#if content}
		<div class="w-full max-w-[28rem] mt-2">
			{@render content()}
		</div>
	{/if}
</div>
