<script lang="ts">
import { onboardingState } from "#lib/domains/app/onboarding/index.js";
import Frame from "#lib/layouts/app/Frame.svelte";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { page } from "$app/state";

let { children } = $props();

const onboardingHref = resolve("onboarding");

// First run is Rust's state; while it is open, it is what shows.
$effect(() => onboardingState.start());
$effect(() => {
	if (onboardingState.isOpen && page.url.pathname !== onboardingHref) {
		void goto(onboardingHref, { replace: true });
	}
});
</script>

<Frame>
	{@render children()}
</Frame>
