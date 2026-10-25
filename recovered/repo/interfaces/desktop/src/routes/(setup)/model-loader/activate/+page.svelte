<script lang="ts">
import { goto } from "$app/navigation";
import { ClyfActivationStep } from "$lib/domains/app/models/features/setup-wizard/index.js";

function handleBack(): void {
	void goto("/model-loader/models");
}

function handleContinue(): void {
	void goto("/model-loader/profile");
}
</script>

<ClyfActivationStep onBack={handleBack} onContinue={handleContinue} />
