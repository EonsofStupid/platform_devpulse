<script lang="ts">
import { CircleHelp } from "lucide-svelte";

interface Props {
	tip: string;
	label?: string;
}

let { tip, label = "What this means" }: Props = $props();
let open = $state(false);

function toggle(): void {
	open = !open;
}

function close(): void {
	open = false;
}
</script>

<div class="help-tip">
	<button
		type="button"
		class="help-trigger"
		aria-label={label}
		aria-expanded={open}
		onclick={toggle}
		onblur={close}
		title={label}
	>
		<CircleHelp size={14} />
	</button>

	{#if open}
		<div class="help-pop" role="tooltip">
			{tip}
		</div>
	{/if}
</div>

<style>
	.help-tip {
		position: relative;
		display: inline-flex;
	}

	.help-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 9999px;
		border: 1px solid var(--border-subtle, #1a2030);
		background: var(--surface-raised, rgba(15, 21, 34, 0.85));
		color: var(--text-muted, #8b93a7);
		cursor: pointer;
	}

	.help-trigger:hover {
		color: var(--text-primary, #e8ecf0);
		border-color: var(--brand-cyan, #17deef);
	}

	.help-pop {
		position: absolute;
		top: calc(100% + 0.35rem);
		right: 0;
		width: min(18rem, 70vw);
		z-index: 40;
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border-subtle, #1a2030);
		background: var(--surface-base, #0c1220);
		color: var(--text-secondary, #b5bfd2);
		font-size: 0.75rem;
		line-height: 1.4;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
	}
</style>
