<!--
  @file Model Setup
  @route /model-loader/models
  @domain models

  Set Up Your AI: the kernel's recommendations for this computer, a brain
  chooser across every preset, and every role slot by slot. Loading the plan
  reads only; a download starts from a button you press. The page owns the plan
  loading and the links; ModelsStep owns the rest.
-->
<script lang="ts">
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import {
	type AutoConfig,
	fetchRecommendations,
	type HardwareTier,
	listAllPresets,
	loadWizardCopy,
	ModelsStep,
	selectPreset,
	type WizardCopyData,
} from "#lib/domains/app/models/index.js";
import { logError, logInfo } from "#lib/sys/logger.js";
import { hrefOf, routeAt } from "#lib/sys/routing/index.js";
import { platformState } from "#lib/sys/runes/platformState.svelte.js";
import { goto } from "$app/navigation";

const browse = routeAt("/model-loader/browse");
const customize = routeAt("/model-loader/customize");
const activate = routeAt("/model-loader/activate");
const profile = routeAt("/model-loader/profile");

let copy = $state<WizardCopyData | null>(null);
let allPresets = $state<AutoConfig[]>([]);
let loadingRecs = $state(false);
let recsError = $state<string | null>(null);
let switchingTier = $state<HardwareTier | null>(null);

// The kernel computes presets once the platform has booted; reading `isReady`
// re-runs this when boot completes.
let loaded = false;
$effect(() => {
	if (!platformState.isReady || loaded) return;
	loaded = true;
	void loadPresetsAndRecs();
});

async function loadPresetsAndRecs(): Promise<void> {
	loadingRecs = true;
	recsError = null;
	logInfo("wizard.modelsPage", "loadPresetsAndRecs() start");
	try {
		// Fire these in parallel; they don't depend on each other.
		const [wizardCopy, presets] = await Promise.all([
			loadWizardCopy(),
			listAllPresets(),
			fetchRecommendations(),
		]);
		copy = wizardCopy;
		allPresets = presets;
	} catch (e) {
		recsError = e instanceof Error ? e.message : String(e);
		logError("wizard.modelsPage", `loadPresetsAndRecs() FAILED: ${recsError}`);
	} finally {
		loadingRecs = false;
	}
}

async function handleTierSwitch(tier: HardwareTier): Promise<void> {
	if (switchingTier !== null) return;
	switchingTier = tier;
	try {
		await selectPreset(tier);
	} finally {
		switchingTier = null;
	}
}

function open(node: ReturnType<typeof routeAt>): void {
	if (node) void goto(hrefOf(node), { reset: false });
}
</script>

{#if copy?.downloads}
	<ModelsStep
		copy={copy.models}
		downloadsCopy={copy.downloads}
		{allPresets}
		loadingRecommendations={loadingRecs}
		recommendationsError={recsError}
		{switchingTier}
		onSelectTier={handleTierSwitch}
		onRetryRecommendations={loadPresetsAndRecs}
		onContinue={() => open(activate)}
		onBack={() => open(profile)}
		onCustomize={() => open(customize)}
		onBrowse={() => open(browse)}
	/>
{:else if recsError}
	<InlineMessage tone="error">{recsError}</InlineMessage>
{:else}
	<div class="flex justify-center p-6"><Spinner size="md" tone="accent" /></div>
{/if}
