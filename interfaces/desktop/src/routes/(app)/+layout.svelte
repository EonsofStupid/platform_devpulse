<script lang="ts">
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { page } from "$app/state";
import { presentationState } from "$lib/domains/app/devpulse/index.js";
import { onboardingState } from "$lib/domains/app/onboarding/index.js";
import Frame from "$lib/layouts/app/Frame.svelte";

let { children } = $props();

const onboardingHref = resolve("/onboarding");

// First run is Rust's state; while it is open, it is what shows.
$effect(() => onboardingState.start());
$effect(() => {
	if (onboardingState.isOpen && page.url.pathname !== onboardingHref) {
		void goto(onboardingHref, { replaceState: true });
	}
});

// Load the advanced builder only when requested, in development and release.
let vpb = $state<Promise<typeof import("$lib/sys/debug/vpb/index.js")> | null>(null);
let vpbOpen = $state(false);

function onKeydown(e: KeyboardEvent) {
	if (presentationState.advanced && e.ctrlKey && e.shiftKey && e.key === "B") {
		vpb ??= import("$lib/sys/debug/vpb/index.js");
		e.preventDefault();
		vpbOpen = !vpbOpen;
	}
}
$effect(() => {
	if (!presentationState.advanced) vpbOpen = false;
});
</script>

<svelte:window onkeydown={onKeydown} />

<Frame>
	{@render children()}
</Frame>

{#if vpb}
	{#await vpb then { Vpb }}
		<Vpb bind:open={vpbOpen} />
	{/await}
{/if}
