<!--
	@component Log
	@kind log
	@layer component
	@category display
	@description Entries that arrive in order, newest last, in a named live region that keeps to the newest line until you scroll away
	@slots root:all, list:none, line:none, time:none, level:none, source:none, text:none
-->
<script lang="ts">
import { logAnatomy, logLevelTone, useLog } from "#coldlight/behaviors/display/log/index.js";
import { styleAttrs } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { mergeProps } from "#coldlight/utils/merge-props.js";
import { LOG_DEFAULTS } from "./log.generated.js";
import type { LogProps } from "./types.js";

let {
	lines,
	label,
	following,
	defaultFollowing,
	onFollowingChange,
	variant = LOG_DEFAULTS.variant,
	surface,
	empty,
	class: className,
	...rest
}: LogProps = $props();

const log = useLog({
	get label() {
		return label;
	},
	get "aria-labelledby"() {
		return rest["aria-labelledby"] ?? undefined;
	},
	get count() {
		return lines.length;
	},
	get following() {
		return following;
	},
	get defaultFollowing() {
		return defaultFollowing;
	},
	onFollowingChange: (next) => onFollowingChange?.(next),
});
</script>

<div
	{...mergeProps(log.root, styleAttrs({ kind: "log", variant, surface }), rest)}
	use:log.attachRoot
	class={cn("overflow-y-auto", className)}
>
	{#if lines.length === 0 && empty}
		{@render empty()}
	{:else}
		<ol {...log.list} class="m-0 flex list-none flex-col p-2">
			{#each lines as line, i (line.id ?? i)}
				<li {...logAnatomy.attrs.line} class="flex gap-2 py-1">
					{#if line.time}
						<span {...logAnatomy.attrs.time} class="shrink-0">{line.time}</span>
					{/if}
					{#if line.level}
						<span {...logAnatomy.attrs.level} data-tone={logLevelTone(line.level)} class="shrink-0">
							{line.level}
						</span>
					{/if}
					{#if line.source}
						<span {...logAnatomy.attrs.source} class="max-w-48 shrink-0 truncate">{line.source}</span>
					{/if}
					<span {...logAnatomy.attrs.text} class="min-w-0 flex-1 whitespace-pre-wrap break-words">{line.text}</span>
				</li>
			{/each}
		</ol>
	{/if}
</div>
