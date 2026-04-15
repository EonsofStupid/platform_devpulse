<!--
	@component LoadingBlock
	@kind loading-block
	@layer component
	@category feedback
	@description Canonical "please wait" panel. A centered spinner
	              with an optional title, subtitle, progress bar,
	              and — when the wait is long enough — a rotating
	              DYK / KDROPS / T&T card. This is the ONE component
	              every in-container wait state should use; never
	              hand-roll a spinner + title + subtitle combo.
	@container true
	@compound true
	@blockCategory feedback
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { Text } from "$lib/design/components/text/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { stack } from "$lib/design/utils/stack/index.js";
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
	/**
	 * Render a rotating DYK / KDROPS / T&T card below the block.
	 * Only set this for waits that reliably take longer than ~3 s —
	 * short waits should stay clean.
	 *
	 * Accepts the full `LoadingContentCard` prop set via the `contentProps`
	 * slot so the consumer can bias topic, kind, or rotation speed.
	 */
	showContent?: boolean;
	/** Forwarded to the inner `LoadingContentCard` when `showContent` is true. */
	contentKind?: "dyk" | "kdrops" | "tnt";
	/** Forwarded to the inner `LoadingContentCard` — topic tag. */
	contentTag?: string;
	/** Forwarded to the inner `LoadingContentCard` — rotation interval. */
	contentRotateMs?: number;
	/** Optional slot for custom body content below the subtitle and
	 *  above the loading card (progress bars, step lists, etc.). */
	children?: Snippet;
	/** Extra container classes. Structural only. */
	class?: string;
}

let {
	title,
	subtitle,
	spinnerSize = "lg",
	tone = "accent",
	showContent = false,
	contentKind,
	contentTag,
	contentRotateMs = 8000,
	children,
	class: className,
}: Props = $props();

// Dynamic import — `LoadingContentCard` lives in the clyffy domain
// and shouldn't be a hard dependency of the design system. We only
// load it when the consumer explicitly asks for it.
let LoadingContentCard: typeof import("$lib/domains/clyffy/index.js").LoadingContentCard | null =
	$state(null);

$effect(() => {
	if (!showContent || LoadingContentCard) return;
	void import("$lib/domains/clyffy/index.js").then((m) => {
		LoadingContentCard = m.LoadingContentCard;
	});
});
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

	{#if showContent && LoadingContentCard}
		{@const Card = LoadingContentCard}
		<div class="w-full max-w-[28rem] mt-2">
			<Card kind={contentKind} tag={contentTag} rotateEveryMs={contentRotateMs} />
		</div>
	{/if}
</div>
