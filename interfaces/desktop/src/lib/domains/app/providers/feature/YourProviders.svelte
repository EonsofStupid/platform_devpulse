<!--
	@file YourProviders.svelte
	@module @devpulse/domains/app/providers/feature

	Your AI providers, one card each: installed or not, the installed version
	against the latest, whether you are signed in, the vendor's own Update and
	Sign in, Install connector when one is needed, and Try it — one question
	asked the way DevPulse talks to it, with the real answer. Each runs only
	when you click it. Everything shown is Rust's `providers` state; text
	comes from the copy catalog.

	Sign in opens the provider's sign-in steps (plan 0001 B3.7): copy its own
	command, paste it into a terminal or open one here, finish in its own
	prompt; the card turns signed in by itself.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import * as CodeBlock from "@devpulse/coldlight/components/code";
import { Heading } from "@devpulse/coldlight/components/heading";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { StatusDot } from "@devpulse/coldlight/components/status-dot";
import { Text } from "@devpulse/coldlight/components/text";
import type { YourAiCopy } from "$lib/sys/bindings/copy/index.js";
import { fill } from "$lib/sys/copy/index.js";
import type {
	ProviderAction,
	ProviderActionRun,
	ProviderReport,
} from "$lib/sys/generated/bindings.js";
import { providersState } from "../data-access/providers.state.svelte.js";
import SignInSteps from "../ui/sign-in-steps/SignInSteps.svelte";

let { copy }: { copy: YourAiCopy } = $props();

$effect(() => providersState.start());

const current = $derived(providersState.current);
const report = $derived(current?.report ?? null);
const subscriptions = $derived(
	report?.providers.filter((p) => p.kind === "subscription_agent") ?? [],
);
const apps = $derived(report?.providers.filter((p) => p.kind === "desktop_app") ?? []);
const idle = $derived(
	!providersState.busy && !current?.checking && (current?.running ?? null) === null,
);

const dot = (p: ProviderReport) =>
	!p.installed
		? ("offline" as const)
		: p.signedIn === "yes"
			? ("ready" as const)
			: ("pending" as const);

function signedInText(p: ProviderReport): string {
	if (p.signedIn === "yes") return copy.signed_in;
	if (p.signedIn === "no") return copy.signed_out;
	return copy.signed_in_unknown;
}

const running = (p: ProviderReport, action: ProviderAction): boolean =>
	current?.running?.providerId === p.id && current.running.action === action;
const lastFor = (p: ProviderReport) =>
	current?.lastAction?.providerId === p.id ? current.lastAction : null;

const secondsFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const answeredText = (last: ProviderActionRun): string =>
	fill(copy.answered, { seconds: secondsFormat.format(last.elapsedMs / 1000) });

const connectorReady = (p: ProviderReport): boolean => p.connector?.installed ?? true;

/** What the open sign-in's copy button did, for which provider. */
let copied = $state<{ id: string; ok: boolean } | null>(null);
const copiedFor = (p: ProviderReport): "idle" | "copied" | "failed" =>
	copied?.id !== p.id ? "idle" : copied.ok ? "copied" : "failed";

function signIn(p: ProviderReport): void {
	copied = null;
	if (p.signInCommand) {
		providersState.openSignIn(p.id);
	} else {
		void providersState.act(p.id, "signIn");
	}
}
</script>

{#snippet card(p: ProviderReport)}
	{@const last = lastFor(p)}
	<Card>
		<div class="flex flex-col gap-2 p-3">
			<div class="flex items-center gap-2">
				<StatusDot status={dot(p)} />
				<Text weight="semibold">{p.name}</Text>
			</div>

			{#if p.installed}
				<Text size="sm">{p.version ? fill(copy.installed_version, { version: p.version }) : copy.installed}</Text>
				{#if p.latest}
					<Text size="xs" color="muted">
						{p.updateAvailable
							? fill(copy.update_available, { version: p.latest })
							: p.version
								? copy.up_to_date
								: fill(copy.latest, { version: p.latest })}
					</Text>
				{:else if p.kind === "desktop_app"}
					<Text size="xs" color="muted">{copy.app_updates_itself}</Text>
				{/if}
				{#if p.kind === "subscription_agent"}
					<Text size="sm">{signedInText(p)}</Text>
				{/if}
				{#if p.connector}
					<Text size="xs" color="muted">
						{p.connector.installed
							? p.connector.version
								? fill(copy.connector_installed, { version: p.connector.version })
								: copy.connector_ready
							: copy.connector_needed}
					</Text>
				{/if}
			{:else}
				<Text size="sm" color="muted">{copy.not_installed}</Text>
				{#if p.latest}
					<Text size="xs" color="muted">{fill(copy.latest, { version: p.latest })}</Text>
				{/if}
			{/if}

			{#if p.note}
				<Text size="xs" color="muted">{p.note}</Text>
			{/if}

			<div class="flex flex-wrap items-center gap-2">
				{#if p.installed && p.actions.includes("signIn") && p.signedIn !== "yes" && providersState.signingIn !== p.id}
					<Button variant="primary" size="sm" onclick={() => signIn(p)} disabled={!idle}>
						{#if running(p, "signIn")}<Spinner size="xs" />{copy.opening}{:else}{copy.sign_in}{/if}
					</Button>
				{/if}
				{#if p.installed && p.actions.includes("update") && p.updateAvailable}
					<Button variant="secondary" size="sm" onclick={() => providersState.act(p.id, "update")} disabled={!idle}>
						{#if running(p, "update")}<Spinner size="xs" />{copy.updating}{:else}{copy.update}{/if}
					</Button>
				{/if}
				{#if p.installed && p.actions.includes("installConnector") && !connectorReady(p)}
					<Button variant="primary" size="sm" onclick={() => providersState.act(p.id, "installConnector")} disabled={!idle}>
						{#if running(p, "installConnector")}<Spinner size="xs" />{copy.installing}{:else}{copy.install_connector}{/if}
					</Button>
				{/if}
				{#if p.installed && p.actions.includes("test") && connectorReady(p)}
					<Button variant="secondary" size="sm" onclick={() => providersState.act(p.id, "test")} disabled={!idle}>
						{#if running(p, "test")}<Spinner size="xs" />{copy.testing}{:else}{copy.test}{/if}
					</Button>
				{/if}
				<a href={p.docs} target="_blank" rel="noreferrer"><Text size="xs" color="muted">{p.installed ? copy.help : copy.docs}</Text></a>
			</div>

			{#each p.problems as problem (problem)}
				<Text size="xs" color="muted">{problem}</Text>
			{/each}

			{#if providersState.signingIn === p.id && p.signInCommand}
				<SignInSteps
					{copy}
					agent={p.name}
					command={p.signInCommand}
					copied={copiedFor(p)}
					opening={running(p, "signIn")}
					signedIn={p.signedIn === "yes"}
					watching={providersState.watchingSignIn}
					onCopied={(ok) => (copied = { id: p.id, ok })}
					onOpenTerminal={() => void providersState.act(p.id, "signIn")}
					onClose={providersState.closeSignIn}
				/>
			{/if}

			{#if last && last.action === "test"}
				<Text size="xs" color="muted">{fill(copy.asked, { prompt: copy.test_prompt })}</Text>
				<div class="flex items-center gap-2">
					<StatusDot status={last.ok ? "ready" : "failed"} />
					<Text size="xs">{last.ok ? answeredText(last) : copy.failed}</Text>
				</div>
				{#if last.ok}
					<Text size="sm">{last.output}</Text>
				{:else if last.output}
					<CodeBlock.Root>
						<CodeBlock.Content code={last.output} />
					</CodeBlock.Root>
				{/if}
			{:else if last && last.guided}
				<div class="flex items-center gap-2">
					<StatusDot status="pending" />
					<Text size="xs">{last.output}</Text>
				</div>
				<Text size="xs">{copy.guided}</Text>
				<CodeBlock.Root>
					<CodeBlock.Content code={last.command} />
				</CodeBlock.Root>
			{:else if last}
				<div class="flex items-center gap-2">
					<StatusDot status={last.ok ? "ready" : "failed"} />
					<Text size="xs">{last.ok ? copy.done : copy.failed}</Text>
				</div>
				{#if last.output}
					<CodeBlock.Root>
						<CodeBlock.Content code={last.output} />
					</CodeBlock.Root>
				{/if}
			{/if}
		</div>
	</Card>
{/snippet}

<div class="flex flex-col gap-[clamp(1rem,2.5vh,1.75rem)]">
	{#if providersState.error}
		<InlineMessage tone="error">{providersState.error}</InlineMessage>
	{/if}
	{#if current?.problem}
		<InlineMessage tone="error">{current.problem}</InlineMessage>
	{/if}
	{#each report?.catalogProblems ?? [] as problem (problem)}
		<InlineMessage tone="warning">{problem}</InlineMessage>
	{/each}

	<section class="flex flex-col gap-3" aria-label={copy.subscriptions_heading}>
		<div class="flex flex-wrap items-center justify-between gap-2">
			<Heading level={2} size="lg">{copy.subscriptions_heading}</Heading>
			<Button variant="secondary" size="sm" onclick={providersState.check} disabled={!idle}>
				{current?.checking ? copy.checking : copy.check_again}
			</Button>
		</div>
		{#if !report}
			<div class="flex items-center gap-2">
				<Spinner size="sm" tone="accent" />
				<Text size="sm" color="muted">{copy.checking}</Text>
			</div>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2">
				{#each subscriptions as p (p.id)}
					{@render card(p)}
				{/each}
			</div>
		{/if}
	</section>

	{#if apps.length}
		<section class="flex flex-col gap-3" aria-label={copy.apps_heading}>
			<Heading level={2} size="lg">{copy.apps_heading}</Heading>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each apps as p (p.id)}
					{@render card(p)}
				{/each}
			</div>
		</section>
	{/if}
</div>
