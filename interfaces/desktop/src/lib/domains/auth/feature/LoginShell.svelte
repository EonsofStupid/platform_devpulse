<!--
	@feature LoginShell
	@module @devpulse/domains/auth/feature

	Auth gate UI. Rendered by the root layout whenever `authState.phase`
	is anything other than `signed-in`. Two modes:

	1. `signed-out` / `pending` — sign-in form with email + password,
	   "Create one" toggle that swaps to sign-up.
	2. `not-configured` — "Supabase isn't set up yet" empty state with
	   a link to the Cloud settings devtool so the operator can paste
	   their anon key. No form here — auth requires a key first.

	ARIA: APG form pattern. Labeled inputs, error region `role="alert"`
	(hard errors) + `role="status"` `aria-live="polite"` (busy state),
	submit button disabled while in flight + label swap to busy variant.

	Tokens: --space-*, --surface-*, --text-*, --border-* exclusively.
	No raw colors, no inline hex, no inline px. Matches the
	DownloaderTokenStrip / DownloaderSearchPanel composition pattern
	already proven in the codebase.
-->
<script lang="ts">
import { Lock, Mail, Settings } from "lucide-svelte";
import { cn } from "$lib/design/utils/cn.js";
import { type AuthCopy, commands } from "$lib/sys/generated/bindings.js";
import { authState } from "../index.js";

interface Props {
	class?: string;
}

let { class: className }: Props = $props();

/**
 * Layman strings from the Rust SSOT. Loaded once at mount via
 * `get_wizard_copy`. The fallback is a synthetic empty AuthCopy that
 * lets the form skeleton render even if the copy load fails — the
 * UI shows blank labels instead of crashing, and the operator can
 * still type into the form (Supabase rejects invalid creds with a
 * clear vendor error message).
 */
let copy = $state<AuthCopy>(emptyAuthCopy());

$effect(() => {
	commands.getWizardCopy().then((res) => {
		if (res.status === "ok" && res.data.auth) {
			copy = res.data.auth;
		}
	});
});

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

type FormMode = "sign-in" | "sign-up";

let mode = $state<FormMode>("sign-in");
let email = $state("");
let password = $state("");
let confirmPassword = $state("");

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

let credsStatusUrl = $state<string | null>(null);
$effect(() => {
	if (authState.phase !== "not-configured") return;
	commands.getSupabaseCredentialsStatus().then((res) => {
		if (res.status === "ok") {
			credsStatusUrl = res.data.url;
		}
	});
});
</script>

<main class={cn("login-shell", className)}>
	<section
		class="login-shell__card"
		aria-labelledby="login-heading"
		aria-describedby="login-subtitle"
	>
		{#if authState.phase === "not-configured"}
			<header class="login-shell__header">
				<Settings class="login-shell__header-icon" aria-hidden="true" />
				<h1 id="login-heading" class="login-shell__heading">
					{copy.error_supabase_not_configured}
				</h1>
				{#if credsStatusUrl}
					<p id="login-subtitle" class="login-shell__subtitle">{credsStatusUrl}</p>
				{/if}
			</header>
		{:else}
			<header class="login-shell__header">
				<h1 id="login-heading" class="login-shell__heading">{heading}</h1>
				<p id="login-subtitle" class="login-shell__subtitle">{subtitle}</p>
			</header>

			<form class="login-shell__form" onsubmit={handleSubmit} novalidate>
				<div class="login-shell__field">
					<label for="login-email" class="login-shell__label">{copy.email_label}</label>
					<div class="login-shell__input-row">
						<Mail class="login-shell__input-icon" aria-hidden="true" />
						<input
							id="login-email"
							type="email"
							class="login-shell__input"
							placeholder={copy.email_placeholder}
							aria-label={copy.email_aria}
							autocomplete="email"
							required
							bind:value={email}
						/>
					</div>
				</div>

				<div class="login-shell__field">
					<label for="login-password" class="login-shell__label">{copy.password_label}</label>
					<div class="login-shell__input-row">
						<Lock class="login-shell__input-icon" aria-hidden="true" />
						<input
							id="login-password"
							type="password"
							class="login-shell__input"
							placeholder={copy.password_placeholder}
							aria-label={copy.password_aria}
							autocomplete={mode === "sign-in" ? "current-password" : "new-password"}
							required
							bind:value={password}
						/>
					</div>
				</div>

				{#if mode === "sign-up"}
					<div class="login-shell__field">
						<label for="login-confirm" class="login-shell__label">
							{copy.confirm_password_label}
						</label>
						<div class="login-shell__input-row">
							<Lock class="login-shell__input-icon" aria-hidden="true" />
							<input
								id="login-confirm"
								type="password"
								class="login-shell__input"
								placeholder={copy.confirm_password_placeholder}
								aria-label={copy.confirm_password_aria}
								autocomplete="new-password"
								required
								bind:value={confirmPassword}
							/>
						</div>
					</div>
				{/if}

				{#if errorMessage}
					<output class="login-shell__error" role="alert">
						{errorMessage}
					</output>
				{/if}

				<button
					type="submit"
					class="login-shell__submit"
					aria-label={submitAria}
					disabled={authState.busy}
				>
					{submitLabel}
				</button>

				<button type="button" class="login-shell__switch" onclick={swapMode}>
					{mode === "sign-in" ? copy.to_sign_up_link_label : copy.to_sign_in_link_label}
				</button>
			</form>
		{/if}
	</section>
</main>

<style>
	.login-shell {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--space-16);
		background: var(--surface-base);
	}

	.login-shell__card {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		width: 100%;
		max-width: 24rem;
		padding: var(--space-20);
		border-radius: var(--radius-lg);
		background: var(--surface-overlay);
		border: 0.0625rem solid var(--border-subtle);
		box-shadow: 0 0.5rem 2rem var(--overlay-scrim, transparent);
	}

	.login-shell__header {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		text-align: center;
	}

	.login-shell__header-icon {
		width: var(--space-20);
		height: var(--space-20);
		margin: 0 auto;
		color: var(--accent-purple-main);
	}

	.login-shell__heading {
		margin: 0;
		font-size: var(--space-18);
		font-weight: 600;
		color: var(--text-primary);
	}

	.login-shell__subtitle {
		margin: 0;
		font-size: var(--space-12);
		color: var(--text-muted);
		font-family: var(--font-family-mono, monospace);
	}

	.login-shell__form {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
	}

	.login-shell__field {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.login-shell__label {
		font-size: var(--space-12);
		font-weight: 500;
		color: var(--text-secondary);
	}

	.login-shell__input-row {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		padding: var(--space-8) var(--space-12);
		border-radius: var(--radius-md);
		background: var(--surface-inset);
		border: 0.0625rem solid var(--border-subtle);
	}

	.login-shell__input-row:focus-within {
		border-color: var(--border-focus);
	}

	.login-shell__input-icon {
		width: var(--space-14);
		height: var(--space-14);
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.login-shell__input {
		flex: 1;
		min-width: 0;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--text-primary);
		font-size: var(--space-12);
		outline: none;
	}

	.login-shell__error {
		display: block;
		padding: var(--space-8) var(--space-12);
		border-radius: var(--radius-sm);
		background: var(--surface-inset);
		border: 0.0625rem solid var(--border-strong);
		color: var(--text-primary);
		font-size: var(--space-12);
	}

	.login-shell__submit {
		margin-top: var(--space-4);
		padding: var(--space-10) var(--space-16);
		border-radius: var(--radius-md);
		background: var(--accent-purple-main);
		color: var(--text-on-accent, var(--text-primary));
		border: none;
		font-size: var(--space-13);
		font-weight: 600;
		cursor: pointer;
	}

	.login-shell__submit:hover:not(:disabled) {
		opacity: 0.9;
	}

	.login-shell__submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.login-shell__submit:focus-visible {
		outline: 0.125rem solid var(--border-focus);
		outline-offset: 0.125rem;
	}

	.login-shell__switch {
		padding: var(--space-6);
		background: transparent;
		border: none;
		color: var(--text-muted);
		font-size: var(--space-11);
		cursor: pointer;
		text-align: center;
	}

	.login-shell__switch:hover {
		color: var(--text-primary);
	}

	.login-shell__switch:focus-visible {
		outline: 0.125rem solid var(--border-focus);
		outline-offset: 0.125rem;
		border-radius: var(--radius-sm);
	}
</style>
