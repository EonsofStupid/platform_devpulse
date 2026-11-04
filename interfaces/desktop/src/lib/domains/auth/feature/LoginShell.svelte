<!--
	@feature LoginShell
	@module @devpulse/domains/auth/feature

	Auth gate UI — rendered by the root layout when `authState.phase`
	is anything other than `signed-in`. Two modes:

	1. `signed-out` / `pending` — sign-in form, "Create one" toggle
	   that swaps to sign-up.
	2. `not-configured` — "Supabase isn't set up yet" empty state with
	   a link to the Cloud settings devtool so the operator can paste
	   their anon key.

	Composed from ColdLight primitives — no hand-painted form chrome.
	Layout-only CSS (positioning + fluid-clamp gaps via `--space-*`).

	ARIA: APG form pattern. `TextField` wires labels, descriptions, and
	invalid state via the `useTextField` behavior. The error region is
	a `<Text role="alert">` so AT users hear failures immediately.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { TextField } from "@devpulse/coldlight/components/text-field";
import { Lock, Mail, Settings } from "lucide-svelte";
import { copyState } from "#lib/sys/copy/index.js";
import { type AuthCopy, commands } from "#lib/sys/generated/bindings.js";
import { authState } from "../index.js";

interface Props {
	class?: string;
}

let { class: className }: Props = $props();

type FormMode = "sign-in" | "sign-up";

let mode = $state<FormMode>("sign-in");
let email = $state("");
let password = $state("");
let confirmPassword = $state("");

const copy = $derived(copyState.catalog?.auth ?? emptyAuthCopy());

const heading = $derived(mode === "sign-in" ? copy.sign_in_heading : copy.sign_up_heading);
const subtitle = $derived(mode === "sign-in" ? copy.sign_in_subtitle : copy.sign_up_subtitle);
const submitLabel = $derived.by(() => {
	if (authState.busy) {
		return mode === "sign-in" ? copy.sign_in_submit_busy_label : copy.sign_up_submit_busy_label;
	}
	return mode === "sign-in" ? copy.sign_in_submit_label : copy.sign_up_submit_label;
});
const submitAria = $derived(
	mode === "sign-in" ? copy.sign_in_submit_aria : copy.sign_up_submit_aria,
);

const errorMessage = $derived.by(() => {
	const err = authState.lastError;
	if (!err) return null;
	switch (err.kind) {
		case "credentials-required":
			return copy.error_credentials_required;
		case "passwords-dont-match":
			return copy.error_passwords_dont_match;
		case "invalid-credentials":
			return copy.error_invalid_credentials;
		case "network":
			return copy.error_network;
		case "supabase-not-configured":
			return copy.error_supabase_not_configured;
		default:
			return copy.error_unknown_template.replace("{error}", err.detail ?? "");
	}
});

let credsStatusUrl = $state<string | null>(null);
$effect(() => {
	if (authState.phase !== "not-configured") return;
	commands.getSupabaseCredentialsStatus().then((res) => {
		if (res.status === "ok") {
			credsStatusUrl = res.data.url;
		}
	});
});

async function handleSubmit(event: SubmitEvent): Promise<void> {
	event.preventDefault();
	if (authState.busy) return;
	if (mode === "sign-in") {
		await authState.signIn(email, password);
	} else {
		await authState.signUp(email, password, confirmPassword);
	}
}

function swapMode(): void {
	mode = mode === "sign-in" ? "sign-up" : "sign-in";
	authState.lastError = null;
	password = "";
	confirmPassword = "";
}

/** Blank text until the catalog loads (the root layout loads it once for every window). */
function emptyAuthCopy(): AuthCopy {
	return {
		sign_in_heading: "",
		sign_in_subtitle: "",
		sign_in_submit_label: "",
		sign_in_submit_aria: "",
		sign_in_submit_busy_label: "",
		sign_up_heading: "",
		sign_up_subtitle: "",
		sign_up_submit_label: "",
		sign_up_submit_aria: "",
		sign_up_submit_busy_label: "",
		sign_up_confirmation_heading: "",
		sign_up_confirmation_body_template: "",
		email_label: "",
		email_placeholder: "",
		email_aria: "",
		password_label: "",
		password_placeholder: "",
		password_aria: "",
		confirm_password_label: "",
		confirm_password_placeholder: "",
		confirm_password_aria: "",
		to_sign_up_link_label: "",
		to_sign_in_link_label: "",
		sign_out_label: "",
		sign_out_aria: "",
		error_credentials_required: "",
		error_passwords_dont_match: "",
		error_invalid_credentials: "",
		error_network: "",
		error_supabase_not_configured: "",
		error_unknown_template: "",
	};
}
</script>

{#snippet mailIcon()}
	<Mail class="login-shell__icon" aria-hidden="true" />
{/snippet}

{#snippet lockIcon()}
	<Lock class="login-shell__icon" aria-hidden="true" />
{/snippet}

<main class={className ? `login-shell ${className}` : "login-shell"}>
	<Card surface="glass" variant="deep" class="login-shell__card" label={heading || "Sign in"}>
		{#if authState.phase === "not-configured"}
			<header class="login-shell__header">
				<Settings class="login-shell__settings-icon" aria-hidden="true" />
				<Heading level={1} size="md">
					{copy.error_supabase_not_configured}
				</Heading>
				{#if credsStatusUrl}
					<Text size="xs" weight="normal" as="p">{credsStatusUrl}</Text>
				{/if}
			</header>
		{:else}
			<header class="login-shell__header">
				<Heading level={1} size="lg">{heading}</Heading>
				<Text size="sm" weight="normal" as="p">{subtitle}</Text>
			</header>

			<form class="login-shell__form" onsubmit={handleSubmit} novalidate>
				<TextField
					type="email"
					label={copy.email_label}
					placeholder={copy.email_placeholder}
					autocomplete="email"
					required
					bind:value={email}
					leading={mailIcon}
				/>

				<TextField
					type="password"
					label={copy.password_label}
					placeholder={copy.password_placeholder}
					autocomplete={mode === "sign-in" ? "current-password" : "new-password"}
					required
					bind:value={password}
					leading={lockIcon}
				/>

				{#if mode === "sign-up"}
					<TextField
						type="password"
						label={copy.confirm_password_label}
						placeholder={copy.confirm_password_placeholder}
						autocomplete="new-password"
						required
						bind:value={confirmPassword}
						leading={lockIcon}
					/>
				{/if}

				{#if errorMessage}
					<Text size="sm" weight="medium" as="p" role="alert">
						{errorMessage}
					</Text>
				{/if}

				<div class="login-shell__actions">
					<Button
						variant="primary"
						size="md"
						type="submit"
						aria-label={submitAria}
						disabled={authState.busy}
					>
						{submitLabel}
					</Button>

					<Button variant="ghost" size="sm" type="button" onclick={swapMode}>
						{mode === "sign-in" ? copy.to_sign_up_link_label : copy.to_sign_in_link_label}
					</Button>
				</div>
			</form>
		{/if}
	</Card>
</main>

<style>
	/* Layout-only. All visual chrome flows from the ColdLight Card's
	   `glass` preset and the TextField / Button preset presets. */
	.login-shell {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--space-16);
		background: var(--surface-base);
	}

	/* Card is a child component — class lands on its root DOM via
	   `cn()` but Svelte's per-file scoper can't track it. `:global()`
	   so the layout-only rule actually applies. */
	:global(.login-shell__card) {
		width: 100%;
		max-width: 24rem;
		gap: var(--space-14);
		padding: var(--space-20);
	}

	.login-shell__header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-7);
		text-align: center;
	}

	/* Lucide icon used in the not-configured empty state. `:global()` —
	   lives on the imported lucide-svelte component. */
	:global(.login-shell__settings-icon) {
		width: var(--space-20);
		height: var(--space-20);
		color: var(--accent-purple-main);
	}

	.login-shell__form {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
	}

	/* Leading/trailing icons inside TextField slot snippets. `:global()`
	   — the lucide-svelte component is the class target. */
	:global(.login-shell__icon) {
		width: var(--space-14);
		height: var(--space-14);
		color: var(--text-muted);
	}

	.login-shell__actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-7);
		margin-top: var(--space-4);
	}
</style>
