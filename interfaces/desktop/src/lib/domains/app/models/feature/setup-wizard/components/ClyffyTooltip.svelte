<!--
  @file ClyffyTooltip.svelte
  @domain models/setup-wizard

  Branded "?" help tooltip that pulls its copy from the Rust SSOT
  via `WizardCopy.clyffy_tooltips[copyKey]`. Replaces every raw `?`
  icon on the setup overlay with a live popover that shows the
  layman explanation + a Clyffy mascot sprite.

  **Why this lives here and not in `design/components/`**: it's a
  domain component tied to the `ClyffyTooltipsCopy` struct shipped
  by the model-loader kernel. The generic `Tooltip` primitive lives
  under `design/components/tooltip/` and is wrapped here.

  **Pattern**
  - Svelte 5 runes, $props destructured, `{@render}` snippets.
  - ARIA tooltip pattern via the underlying `Tooltip` primitive:
    `role="tooltip"` on content + `aria-describedby` wiring on the
    trigger is handled by the `useTooltip` behaviour hook.
  - Hover + keyboard focus both open the tooltip (primitive default).
  - Escape closes (primitive default).
  - Copy keys are a typed `keyof ClyffyTooltipsCopy` — typos fail
    `pnpm svelte-check` at build time.

  **Parent contract**
    interface Props {
      copyKey: keyof ClyffyTooltipsCopy;
      copy: ClyffyTooltipsCopy;
      label?: string;       // aria-label on the trigger button
      size?: "sm" | "md";   // icon size
    }
-->
<script lang="ts">
import { Tooltip, TooltipContent, TooltipTrigger } from "@devpulse/coldlight/components/tooltip";
import { HelpCircle } from "lucide-svelte";

import type { ClyffyTooltipsCopy } from "../wizard.types.js";

interface Props {
	/** Which tooltip key to render. Typed against the Rust struct. */
	copyKey: keyof ClyffyTooltipsCopy;
	/** The full `clyffy_tooltips` section from `WizardCopy`. */
	copy: ClyffyTooltipsCopy;
	/**
	 * Accessible label on the trigger button. Defaults to
	 * "Learn about {copyKey}" — override for cleaner layman text
	 * when the surrounding context already explains the topic.
	 */
	label?: string;
	/** Icon size. `"sm"` (14 px) for inline adjacent text, `"md"` (18 px) for standalone. */
	size?: "sm" | "md";
}

let { copyKey, copy, label, size = "sm" }: Props = $props();

const body = $derived(copy[copyKey] ?? "");
const iconPx = $derived(size === "sm" ? 14 : 18);
const ariaLabel = $derived(label ?? `Learn about ${String(copyKey).replace(/_/g, " ")}`);
</script>

<Tooltip>
	<TooltipTrigger>
		<button
			type="button"
			class="clyffy-tip-trigger"
			aria-label={ariaLabel}
		>
			<HelpCircle size={iconPx} aria-hidden="true" />
		</button>
	</TooltipTrigger>
	<TooltipContent>
		<div class="clyffy-tip-body">
			<img
				src="/imgs/mascot/clyffy-df-icon.png"
				alt=""
				aria-hidden="true"
				class="clyffy-tip-mascot"
			/>
			<p class="clyffy-tip-text">{body}</p>
		</div>
	</TooltipContent>
</Tooltip>

<style>
	.clyffy-tip-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		margin: 0 0.25rem;
		border: none;
		background: transparent;
		color: var(--text-secondary, #8b9bb8);
		border-radius: 999px;
		cursor: help;
		transition: color var(--duration-fast, 150ms);
	}
	.clyffy-tip-trigger:hover,
	.clyffy-tip-trigger:focus-visible {
		color: var(--accent-cyan-main, #58c4e6);
		outline: none;
	}
	.clyffy-tip-trigger:focus-visible {
		box-shadow: 0 0 0 0.125rem color-mix(in oklch, var(--accent-cyan-main, #58c4e6) 50%, transparent);
	}

	.clyffy-tip-body {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		max-width: 18rem;
		padding: 0.375rem 0.5rem;
	}
	.clyffy-tip-mascot {
		flex-shrink: 0;
		width: 1.75rem;
		height: 1.75rem;
		object-fit: contain;
	}
	.clyffy-tip-text {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--text-primary, #e6eaf3);
	}
</style>
