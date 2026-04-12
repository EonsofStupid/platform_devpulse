<script lang="ts">
import type { Snippet } from "svelte";
import { DynamicBackground } from "$lib/design/components/dynamic-background/index.js";
import SetupWizardOverlay from "$lib/domains/app/models/features/setup-wizard/SetupWizardOverlay.svelte";

interface Props {
	children: Snippet;
}

let { children }: Props = $props();
</script>

<DynamicBackground variant="boot" animated />

<SetupWizardOverlay {children} />
