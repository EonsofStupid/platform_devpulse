<script lang="ts">
	/**
	 * SystemCheck - Visual YES/NO readiness indicator
	 *
	 * Shows at a glance:
	 * - Is model path set?
	 * - Are models found?
	 * - Is llm ready?
	 *
	 * ALL GREEN = "Let's go!"
	 * ANY RED = "Not ready - here's why"
	 */
	import { onMount } from "svelte";
	import { statusStore, modelsStore } from "$lib/stores";

	// Check states
	let checks = $state<
		Array<{
			id: string;
			label: string;
			status: "checking" | "pass" | "fail";
			detail: string;
		}>
	>([
		{
			id: "path",
			label: "Model Path",
			status: "checking",
			detail: "Checking...",
		},
		{
			id: "models",
			label: "Models Found",
			status: "checking",
			detail: "Checking...",
		},
		{
			id: "llm",
			label: "Llm Ready",
			status: "checking",
			detail: "Checking...",
		},
	]);

	// Overall status
	let allGreen = $derived(checks.every((c) => c.status === "pass"));
	let anyFailed = $derived(checks.some((c) => c.status === "fail"));
	let stillChecking = $derived(checks.some((c) => c.status === "checking"));

	function updateCheck(id: string, status: "pass" | "fail", detail: string) {
		checks = checks.map((c) =>
			c.id === id ? { ...c, status, detail } : c,
		);
	}

	async function runChecks() {
		// Reset to checking
		checks = checks.map((c) => ({
			...c,
			status: "checking" as const,
			detail: "Checking...",
		}));

		// Check 1: Model path configured?
		try {
			await modelsStore.init();
			const modelCount = modelsStore.vlModels.length;

			if (modelCount > 0) {
				updateCheck("path", "pass", "Path configured");
			} else {
				updateCheck("path", "fail", "No model path set");
			}
		} catch {
			updateCheck("path", "fail", "Could not check path");
		}

		// Check 2: Models found on disk?
		try {
			const available = modelsStore.vlModels.filter((m) => m.available);
			if (available.length > 0) {
				updateCheck(
					"models",
					"pass",
					`${available.length} model(s) ready`,
				);
			} else {
				updateCheck("models", "fail", "No models found on disk");
			}
		} catch {
			updateCheck("models", "fail", "Could not scan models");
		}

		// Check 3: Llm/AI ready?
		try {
			await statusStore.refresh();
			if (statusStore.aiReady) {
				updateCheck("llm", "pass", "Llm loaded");
			} else if (modelsStore.vlModels.some((m) => m.available)) {
				updateCheck("llm", "pass", "Ready to load");
			} else {
				updateCheck("llm", "fail", "No llm available");
			}
		} catch {
			updateCheck("llm", "fail", "Could not check llm");
		}
	}

	onMount(() => {
		runChecks();
	});
</script>

<div class="system-check" class:all-green={allGreen} class:has-fail={anyFailed}>
	<header class="check-header">
		<span class="check-title">System Check</span>
		<button
			class="refresh-btn"
			onclick={runChecks}
			disabled={stillChecking}
		>
			{stillChecking ? "..." : "↻"}
		</button>
	</header>

	<div class="check-list">
		{#each checks as check}
			<div
				class="check-item"
				class:pass={check.status === "pass"}
				class:fail={check.status === "fail"}
			>
				<span class="check-icon">
					{#if check.status === "checking"}
						⏳
					{:else if check.status === "pass"}
						✓
					{:else}
						✗
					{/if}
				</span>
				<span class="check-label">{check.label}</span>
				<span class="check-detail">{check.detail}</span>
			</div>
		{/each}
	</div>

	<div class="check-result">
		{#if stillChecking}
			<span class="result checking">Checking...</span>
		{:else if allGreen}
			<span class="result go">ALL GREEN - LET'S GO!</span>
		{:else}
			<span class="result stop">NOT READY</span>
		{/if}
	</div>
</div>

<style>
	.system-check {
		background: rgba(15, 23, 42, 0.8);
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 1rem;
		min-width: 280px;
	}

	.system-check.all-green {
		border-color: rgba(34, 197, 94, 0.5);
		box-shadow: 0 0 20px rgba(34, 197, 94, 0.15);
	}

	.system-check.has-fail {
		border-color: rgba(239, 68, 68, 0.5);
		box-shadow: 0 0 20px rgba(239, 68, 68, 0.15);
	}

	.check-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.check-title {
		font-weight: 600;
		font-size: 0.875rem;
		color: white;
	}

	.refresh-btn {
		width: 24px;
		height: 24px;
		padding: 0;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		font-size: 0.875rem;
	}

	.refresh-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
		color: white;
	}

	.refresh-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.check-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.check-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 6px;
		border-left: 3px solid rgba(255, 255, 255, 0.2);
	}

	.check-item.pass {
		border-left-color: #22c55e;
	}

	.check-item.fail {
		border-left-color: #ef4444;
	}

	.check-icon {
		width: 20px;
		text-align: center;
		font-size: 0.875rem;
	}

	.check-item.pass .check-icon {
		color: #22c55e;
	}

	.check-item.fail .check-icon {
		color: #ef4444;
	}

	.check-label {
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
	}

	.check-detail {
		margin-left: auto;
		font-size: 0.6875rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.check-result {
		text-align: center;
		padding: 0.75rem;
		border-radius: 8px;
	}

	.result {
		font-weight: 700;
		font-size: 0.875rem;
		letter-spacing: 0.05em;
	}

	.result.checking {
		color: #f59e0b;
	}

	.result.go {
		color: #22c55e;
		text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
	}

	.result.stop {
		color: #ef4444;
		text-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
	}
</style>
