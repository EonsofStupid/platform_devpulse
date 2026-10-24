<!--
	@file ContainersSetup.svelte
	@module @devpulse/domains/app/containers/feature

	Containers for your projects, in three sections: what this machine has
	(detected), three questions only you can answer, and the recommendation —
	Docker or Podman, with every reason and its source — followed by its steps,
	each run only when you click it, with the tool's real output. Everything
	shown is Rust's `containers` state; text comes from the copy catalog.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Callout } from "@devpulse/coldlight/components/callout";
import { Card } from "@devpulse/coldlight/components/card";
import * as CodeBlock from "@devpulse/coldlight/components/code";
import { Heading } from "@devpulse/coldlight/components/heading";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import {
	RadioGroup,
	RadioGroupItem,
	RadioGroupLabel,
} from "@devpulse/coldlight/components/radio-group";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { StatusDot } from "@devpulse/coldlight/components/status-dot";
import { Text } from "@devpulse/coldlight/components/text";
import { untrack } from "svelte";
import type { ContainersCopy } from "$lib/sys/bindings/copy/index.js";
import { fill } from "$lib/sys/copy/index.js";
import type { EngineReport, Point, Step, StepKind, Usage } from "$lib/sys/generated/bindings.js";
import { containersState } from "../data-access/containers.state.svelte.js";

let { copy }: { copy: ContainersCopy } = $props();

$effect(() => containersState.start());

const current = $derived(containersState.current);
const report = $derived(current?.report ?? null);
const advice = $derived(current?.advice ?? null);

const USAGES: Usage[] = [
	"personal",
	"education",
	"openSource",
	"smallBusiness",
	"largeOrganization",
	"government",
];

// The draft starts from your stored answers, once they arrive.
let usage = $state<Usage | null>(null);
let needsGpu = $state<boolean | null>(null);
let prefersApp = $state<boolean | null>(null);
$effect(() => {
	const stored = current?.answers;
	untrack(() => {
		if (stored && usage === null) {
			usage = stored.usage;
			needsGpu = stored.needsGpu;
			prefersApp = stored.prefersApp;
		}
	});
});

const answered = $derived(usage !== null && needsGpu !== null && prefersApp !== null);
const unchanged = $derived(
	current?.answers?.usage === usage &&
		current?.answers?.needsGpu === needsGpu &&
		current?.answers?.prefersApp === prefersApp,
);

function save(): void {
	if (usage === null || needsGpu === null || prefersApp === null) return;
	void containersState.answer({ usage, needsGpu, prefersApp });
}

const yesNo = (value: boolean | null): string => (value === null ? "" : value ? "yes" : "no");

function text(point: Point): string {
	const values = Object.fromEntries(
		Object.entries(point.values).filter(
			(entry): entry is [string, string] => entry[1] !== undefined,
		),
	);
	return fill(copy.points[point.code] ?? point.code, values);
}

function engineLine(engine: EngineReport): string {
	if (!engine.installed) return copy.engine_missing;
	const version = engine.engineVersion ?? engine.clientVersion ?? "";
	return fill(engine.running ? copy.engine_running : copy.engine_stopped, { version });
}

const dot = (engine: EngineReport) =>
	engine.running
		? ("ready" as const)
		: engine.installed
			? ("pending" as const)
			: ("offline" as const);

const stepName = (kind: StepKind): string => copy.steps[kind] ?? kind;
const same = (a: Step | null | undefined, b: Step): boolean =>
	a !== null && a !== undefined && a.kind === b.kind && a.product === b.product;
</script>

<div class="flex flex-col gap-[clamp(1rem,2.5vh,1.75rem)]">
	{#if containersState.error}
		<InlineMessage tone="error">{containersState.error}</InlineMessage>
	{/if}
	{#if current?.problem}
		<InlineMessage tone="error">{current.problem}</InlineMessage>
	{/if}

	<!-- 1. What this machine has -->
	<section class="flex flex-col gap-3" aria-label={copy.found_heading}>
		<div class="flex flex-wrap items-center justify-between gap-2">
			<Heading level={2} size="lg">{copy.found_heading}</Heading>
			<Button
				variant="secondary"
				size="sm"
				onclick={containersState.check}
				disabled={containersState.busy || current?.checking || current?.running !== null}
			>
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
				{#each report.engines as engine (engine.id)}
					<Card>
						<div class="flex flex-col gap-1 p-3">
							<div class="flex items-center gap-2">
								<StatusDot status={dot(engine)} />
								<Text weight="semibold">{engine.name}</Text>
							</div>
							<Text size="sm">{engineLine(engine)}</Text>
							{#if engine.compose}
								<Text size="xs" color="muted">{fill(copy.compose, { version: engine.compose })}</Text>
							{/if}
							{#each engine.machines as machine (machine.name)}
								<Text size="xs" color="muted">
									{fill(machine.running ? copy.machine_running : copy.machine_stopped, { name: machine.name })}
								</Text>
							{/each}
							{#if engine.installed && !engine.running && engine.problem}
								<Text size="xs" color="muted">{engine.problem}</Text>
							{/if}
						</div>
					</Card>
				{/each}
			</div>

			<div class="flex flex-wrap gap-x-4 gap-y-1">
				<!-- The OS's own long name when it gives one ("Windows 11 Pro"), else its family. -->
				<Text size="sm">{report.host.osVersion ?? copy.os[report.host.os] ?? report.host.os}</Text>
				<Text size="sm">{fill(copy.host_ram, { gb: Math.round(report.host.ramTotalMb / 1024) })}</Text>
				<Text size="sm">{fill(copy.host_cores, { count: report.host.cpuCores })}</Text>
				{#each report.host.nvidiaGpus as gpu (gpu)}
					<Text size="sm">{fill(copy.host_gpu, { name: gpu })}</Text>
				{/each}
				{#if report.host.wsl}
					<Text size="sm">
						{report.host.wsl.installed
							? fill(copy.wsl_ok, { version: report.host.wsl.version ?? "" })
							: copy.wsl_missing}
					</Text>
				{/if}
				{#if report.host.virtualization?.hypervisorPresent || report.host.virtualization?.firmwareEnabled}
					<Text size="sm">{copy.virtualization_on}</Text>
				{:else if report.host.virtualization?.firmwareEnabled === false}
					<Text size="sm">{copy.virtualization_off}</Text>
				{/if}
			</div>
		{/if}
	</section>

	<!-- 2. Three questions -->
	<section class="flex flex-col gap-3" aria-label={copy.questions_heading}>
		<Heading level={2} size="lg">{copy.questions_heading}</Heading>

		<div class="flex flex-col gap-2">
			<Text size="sm" weight="semibold">{copy.usage_label}</Text>
			<RadioGroup
				value={usage ?? ""}
				onValueChange={(v) => {
					usage = v as Usage;
				}}
				orientation="vertical"
			>
				{#each USAGES as option (option)}
					<div class="flex items-center gap-2">
						<RadioGroupItem value={option} id={`containers-usage-${option}`} />
						<RadioGroupLabel value={option}>{copy.usage[option] ?? option}</RadioGroupLabel>
					</div>
				{/each}
			</RadioGroup>
		</div>

		{#each [{ key: "gpu", label: copy.gpu_label }, { key: "app", label: copy.app_label }] as question (question.key)}
			<div class="flex flex-col gap-2">
				<Text size="sm" weight="semibold">{question.label}</Text>
				<RadioGroup
					value={yesNo(question.key === "gpu" ? needsGpu : prefersApp)}
					onValueChange={(v) => {
						if (question.key === "gpu") needsGpu = v === "yes";
						else prefersApp = v === "yes";
					}}
					orientation="horizontal"
				>
					{#each [{ v: "yes", l: copy.yes }, { v: "no", l: copy.no }] as choice (choice.v)}
						<div class="flex items-center gap-2">
							<RadioGroupItem value={choice.v} id={`containers-${question.key}-${choice.v}`} />
							<RadioGroupLabel value={choice.v}>{choice.l}</RadioGroupLabel>
						</div>
					{/each}
				</RadioGroup>
			</div>
		{/each}

		<div class="flex justify-end">
			<Button
				variant="primary"
				size="md"
				onclick={save}
				disabled={!answered || unchanged || containersState.busy}
			>
				{copy.save_answers}
			</Button>
		</div>
	</section>

	<!-- 3. The recommendation and its steps -->
	<section class="flex flex-col gap-3" aria-label={copy.advice_heading}>
		<Heading level={2} size="lg">{copy.advice_heading}</Heading>

		{#if advice?.dataProblem}
			<InlineMessage tone="warning">{advice.dataProblem}</InlineMessage>
		{/if}

		{#if advice?.blockers.length}
			<Callout variant="error">
				<div class="flex flex-col gap-2">
					<Text weight="semibold">{copy.blockers_heading}</Text>
					{#each advice.blockers as point (point.code)}
						<div class="flex flex-col">
							<Text size="sm">{text(point)}</Text>
							{#if point.source}
								<a href={point.source.url} target="_blank" rel="noreferrer"><Text size="xs">{fill(copy.source, { title: point.source.title })}</Text></a>
							{/if}
						</div>
					{/each}
				</div>
			</Callout>
		{/if}

		{#if !advice || (advice.needsAnswers && !advice.product)}
			<Text size="sm" color="muted">{copy.answer_first}</Text>
		{:else if advice.product}
			<Text size="lg" weight="semibold">
				{fill(advice.keep ? copy.keep : copy.recommend, { name: advice.product.name })}
			</Text>

			<div class="flex flex-col gap-2">
				<Text size="sm" weight="semibold">{copy.why}</Text>
				{#each advice.reasons as point (point.code)}
					<div class="flex flex-col">
						<Text size="sm">{text(point)}</Text>
						{#if point.source}
							<a href={point.source.url} target="_blank" rel="noreferrer"><Text size="xs" color="muted">{fill(copy.source, { title: point.source.title })}</Text></a>
						{/if}
					</div>
				{/each}
			</div>

			{#if advice.warnings.length}
				<Callout variant="warning">
					<div class="flex flex-col gap-2">
						<Text weight="semibold">{copy.warnings_heading}</Text>
						{#each advice.warnings as point (point.code)}
							<div class="flex flex-col">
								<Text size="sm">{text(point)}</Text>
								{#if point.source}
									<a href={point.source.url} target="_blank" rel="noreferrer"><Text size="xs">{fill(copy.source, { title: point.source.title })}</Text></a>
								{/if}
							</div>
						{/each}
					</div>
				</Callout>
			{/if}

			<div class="flex flex-col gap-3">
				<Text size="sm" weight="semibold">{copy.steps_heading}</Text>
				{#each advice.steps as step, i (`${step.kind}-${step.product}`)}
					{@const isRunning = same(current?.running, step)}
					{@const last = same(current?.lastRun?.step, step) ? current?.lastRun : null}
					<Card>
						<div class="flex flex-col gap-2 p-3">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<Text weight="semibold">{i + 1}. {stepName(step.kind)}</Text>
								<div class="flex items-center gap-2">
									{#if last}
										<StatusDot status={last.ok ? "ready" : last.guided ? "pending" : "failed"} />
										<Text size="sm">{last.guided ? copy.guided : last.ok ? copy.done : copy.failed}</Text>
									{/if}
									<Button
										variant={last?.ok ? "secondary" : "primary"}
										size="sm"
										onclick={() => containersState.runStep(step)}
										disabled={containersState.busy || current?.running !== null || current?.checking}
									>
										{#if isRunning}
											<Spinner size="xs" />
											{copy.running}
										{:else}
											{copy.run}
										{/if}
									</Button>
								</div>
							</div>
							{#if step.kind === "install" && advice.licence}
								<a href={advice.licence.url} target="_blank" rel="noreferrer">
									<Text size="xs" color="muted">{fill(copy.install_consent, { name: advice.product.name })} · {advice.licence.title}</Text>
								</a>
							{/if}
							{#if last}
								{#if last.restartNeeded}
									<InlineMessage tone="warning">{copy.restart}</InlineMessage>
								{/if}
								{#if last.commands.length}
									<CodeBlock.Root language="bash">
										<CodeBlock.Content code={last.commands.join("\n")} />
									</CodeBlock.Root>
								{/if}
								{#if last.output}
									<CodeBlock.Root>
										<CodeBlock.Content code={last.output} />
									</CodeBlock.Root>
								{/if}
							{/if}
						</div>
					</Card>
				{/each}
			</div>
		{/if}

		<Text size="xs" color="muted">{copy.later_hint}</Text>
	</section>
</div>
