<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Text } from "@devpulse/coldlight/components/text";
import { X } from "lucide-svelte";

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
					<div class="popup-title-copy">
						<Text size="xs" weight="bold" class="popup-kicker">Knowledge Drop</Text>
						<Text size="base" weight="bold">{title}</Text>
					</div>
				</div>
				<Button variant="ghost" size="sm" onclick={onClose} aria-label="Close help">
					<X size={14} />
				</Button>
			</div>

			<div class="popup-summary-shell">
				<Text size="sm" color="secondary">{summary}</Text>
			</div>

			<ul class="popup-points">
				{#each points as point (point)}
					<li class="popup-point">{point}</li>
				{/each}
			</ul>

			<div class="popup-actions">
				<Button variant="primary" size="sm" onclick={onClose}>Got it</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.popup-overlay {
		position: fixed;
		inset: 0;
		background: rgba(4, 8, 16, 0.72);
		backdrop-filter: blur(6px);
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
		border-radius: 1.25rem;
		border: var(--border-width-thin) solid color-mix(in oklch, var(--accent-cyan-main) 24%, var(--border-subtle));
		background:
			linear-gradient(145deg, color-mix(in oklch, var(--accent-cyan-fill) 14%, transparent), transparent 42%),
			linear-gradient(330deg, color-mix(in oklch, var(--accent-purple-fill) 12%, transparent), transparent 46%),
			var(--surface-base, #0c1220);
		padding: 1.125rem;
		box-shadow: var(--dialog-box-shadow);
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

	.popup-title-copy {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	:global(.popup-kicker) {
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--accent-cyan-main);
	}

	.popup-img {
		width: 2.25rem;
		height: 2.25rem;
		object-fit: contain;
	}

	.popup-summary-shell {
		padding: 0.875rem 1rem;
		border-radius: 0.875rem;
		background:
			linear-gradient(135deg, color-mix(in oklch, var(--accent-cyan-fill) 88%, transparent), transparent 62%),
			var(--glass-deep);
		border: var(--border-width-thin) solid color-mix(in oklch, var(--accent-cyan-main) 22%, transparent);
	}

	.popup-points {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		color: var(--text-secondary, #b5bfd2);
		font-size: 0.8125rem;
	}

	.popup-point {
		padding: 0.75rem 0.875rem;
		border-radius: 0.875rem;
		background: color-mix(in oklch, var(--glass-standard) 84%, transparent);
		border: var(--border-width-thin) solid var(--border-subtle);
	}

	.popup-actions {
		display: flex;
		justify-content: flex-end;
	}
</style>
