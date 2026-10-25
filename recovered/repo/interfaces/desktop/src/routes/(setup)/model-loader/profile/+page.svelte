<script lang="ts">
import { goto } from "$app/navigation";
import { ProjectSetupStep } from "$lib/domains/app/models/features/setup-wizard/index.js";

function handleBack(): void {
	void goto("/model-loader/activate");
}

function handleContinue(): void {
	void goto("/model-loader/complete");
}
</script>

<ProjectSetupStep onBack={handleBack} onContinue={handleContinue} />
