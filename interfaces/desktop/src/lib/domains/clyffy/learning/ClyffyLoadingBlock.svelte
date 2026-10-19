<!--
	@component ClyffyLoadingBlock
	@module @devpulse/domains/clyffy

	A long wait with something to read: ColdLight's `LoadingBlock` with
	Clyffy's rotating tip card (`LoadingContentCard`) as its content. Use
	it only for waits that reliably take longer than ~3 s; short waits use
	`LoadingBlock` alone.
-->
<script lang="ts">
import { LoadingBlock } from "$lib/design/components/spinner/index.js";
import LoadingContentCard from "./LoadingContentCard.svelte";
import type { LoadingContentKind } from "./loading-content.js";

interface Props {
	/** Large title above the spinner. */
	title?: string;
	/** Muted subtitle under the title. */
	subtitle?: string;
	/** Which tips rotate (Did You Know, Knowledge Drops, tips & tricks). */
	kind?: LoadingContentKind;
	/** Topic tag the tips are drawn from. */
	tag?: string;
	/** Milliseconds each tip stays up. */
	rotateEveryMs?: number;
	/** Extra container classes. Structural only. */
	class?: string;
}

let { title, subtitle, kind, tag, rotateEveryMs, class: className }: Props = $props();
</script>

<LoadingBlock {title} {subtitle} class={className}>
	{#snippet content()}
		<LoadingContentCard {kind} {tag} {rotateEveryMs} />
	{/snippet}
</LoadingBlock>
