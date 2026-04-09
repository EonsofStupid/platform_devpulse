<script lang="ts">
import { X } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import Text from "$lib/design/components/text/Text.svelte";

interface Props {
	open: boolean;
	title: string;
	summary: string;
	points: string[];
	imageSrc?: string;
	imageAlt?: string;
	onClose: () => void;
}

let {
	open,
	title,
	summary,
	points,
	imageSrc = "/imgs/mascot/clyffy-df-icon.png",
	imageAlt = "Clyffy",
	onClose,
}: Props = $props();

function handleOverlayKeydown(event: KeyboardEvent): void {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		onClose();
	}
}

function handleOverlayClick(event: MouseEvent): void {
	if (event.target === event.currentTarget) {
		onClose();
	}
}
</script>

{#if open}
	<div
		class="popup-overlay"
		role="button"
		tabindex="0"
		aria-label="Close help popup"
		onclick={handleOverlayClick}
		onkeydown={handleOverlayKeydown}
	>
		<div
			class="popup-card"
			role="dialog"
			aria-modal="true"
			aria-label={title}
			tabindex="-1"
		>
			<div class="popup-head">
				<div class="popup-title-wrap">
					<img src={imageSrc} alt={imageAlt} class="popup-img" />
					<Text size="base" weight="bold">{title}</Text>
				</div>
				<Button preset="ghost" size="sm" onclick={onClose} aria-label="Close help">
					<X size={14} />
				</Button>
			</div>

			<Text size="sm" color="secondary">{summary}</Text>

			<ul class="popup-points">
				{#each points as point (point)}
					<li>{point}</li>
				{/each}
			</ul>

			<div class="popup-actions">
				<Button preset="primary" size="sm" onclick={onClose}>Got it</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.popup-overlay {
		position: fixed;
		inset: 0;
		background: rgba(4, 8, 16, 0.72);
		backdrop-filter: blur(2px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		z-index: 200;
	}

	.popup-card {
		width: min(32rem, 95vw);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		border-radius: 0.75rem;
		border: 1px solid var(--border-subtle, #1a2030);
		background: var(--surface-base, #0c1220);
		padding: 1rem;
		box-shadow: 0 16px 32px rgba(0, 0, 0, 0.45);
	}

	.popup-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.popup-title-wrap {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.popup-img {
		width: 1.8rem;
		height: 1.8rem;
		object-fit: contain;
	}

	.popup-points {
		margin: 0;
		padding-left: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		color: var(--text-secondary, #b5bfd2);
		font-size: 0.8125rem;
	}

	.popup-actions {
		display: flex;
		justify-content: flex-end;
	}
</style>
