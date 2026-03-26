<!--
  @file TokenDebugOverlay.svelte
  @description Runtime CSS token diagnostic — scans DOM for every var() reference
  and flags which ones resolve to empty/missing values.

  Shows a floating panel with:
  - Total CSS vars found vs resolved vs MISSING
  - Per-element breakdown of missing vars
  - Clickable to highlight the element

  Usage: Drop into any layout. Toggle with Ctrl+Shift+D.
-->
<script lang="ts">
import { onMount } from "svelte";

interface VarReport {
	element: string;
	selector: string;
	property: string;
	varName: string;
	resolved: string;
	status: "ok" | "empty" | "missing";
}

let visible = $state(false);
let scanning = $state(false);
let results = $state<VarReport[]>([]);
let summary = $derived({
	total: results.length,
	ok: results.filter((r) => r.status === "ok").length,
	empty: results.filter((r) => r.status === "empty").length,
	missing: results.filter((r) => r.status === "missing").length,
});
let missing = $derived(results.filter((r) => r.status !== "ok"));
let filterText = $state("");
let filtered = $derived(
	filterText
		? missing.filter(
				(r) =>
					r.varName.includes(filterText) ||
					r.element.includes(filterText) ||
					r.property.includes(filterText),
			)
		: missing,
);

// Group by var name for dedup view
let groupedByVar = $derived(() => {
	const map = new Map<string, { count: number; property: string; resolved: string; status: string }>();
	for (const r of missing) {
		const existing = map.get(r.varName);
		if (existing) {
			existing.count++;
		} else {
			map.set(r.varName, { count: 1, property: r.property, resolved: r.resolved, status: r.status });
		}
	}
	return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
});

function scan() {
	scanning = true;
	results = [];

	const allElements = document.querySelectorAll("*");
	const varRegex = /var\(--([a-zA-Z0-9_-]+)/g;
	const seen = new Set<string>();
	const reports: VarReport[] = [];

	// 1. Check all :root custom properties
	const rootStyle = getComputedStyle(document.documentElement);
	const rootStyleSheets = [...document.styleSheets];
	const allVarNames = new Set<string>();

	// Extract var names from stylesheets
	for (const sheet of rootStyleSheets) {
		try {
			for (const rule of sheet.cssRules) {
				const text = rule.cssText;
				let match: RegExpExecArray | null;
				const regex = /var\(--([a-zA-Z0-9_-]+)/g;
				while ((match = regex.exec(text)) !== null) {
					allVarNames.add(`--${match[1]}`);
				}
			}
		} catch {
			// CORS blocked stylesheet, skip
		}
	}

	// Check each var against computed root
	for (const varName of allVarNames) {
		const value = rootStyle.getPropertyValue(varName).trim();
		const key = `root::${varName}`;
		if (seen.has(key)) continue;
		seen.add(key);

		reports.push({
			element: ":root",
			selector: ":root",
			property: "custom-property",
			varName,
			resolved: value || "(empty)",
			status: value ? "ok" : "empty",
		});
	}

	// 2. Check inline styles and computed styles on actual elements
	for (const el of allElements) {
		const elComputed = getComputedStyle(el);
		const inlineStyle = (el as HTMLElement).style?.cssText || "";

		// Check inline style var() refs — resolve against THE ELEMENT, not :root
		let match: RegExpExecArray | null;
		const regex = /var\(--([a-zA-Z0-9_-]+)/g;
		while ((match = regex.exec(inlineStyle)) !== null) {
			const varName = `--${match[1]}`;
			const value = elComputed.getPropertyValue(varName).trim();
			const tag = el.tagName.toLowerCase();
			const kind = (el as HTMLElement).dataset?.kind || (el as HTMLElement).dataset?.svgKind || "";
			const selector = kind ? `${tag}[data-kind="${kind}"]` : tag;
			const key = `${selector}::${varName}`;
			if (seen.has(key)) continue;
			seen.add(key);

			reports.push({
				element: tag,
				selector,
				property: "inline-style",
				varName,
				resolved: value || "(empty)",
				status: value ? "ok" : "empty",
			});
		}

		// Check class-based var() refs (Tailwind arbitrary values like text-[var(--foo)])
		const classList = (el as HTMLElement).className;
		if (typeof classList === "string" && classList.includes("var(--")) {
			const classRegex = /var\(--([a-zA-Z0-9_-]+)/g;
			while ((match = classRegex.exec(classList)) !== null) {
				const varName = `--${match[1]}`;
				const value = elComputed.getPropertyValue(varName).trim();
				const tag = el.tagName.toLowerCase();
				const key = `class:${tag}::${varName}`;
				if (seen.has(key)) continue;
				seen.add(key);

				reports.push({
					element: tag,
					selector: `${tag}.class`,
					property: "class-attr",
					varName,
					resolved: value || "(empty)",
					status: value ? "ok" : "empty",
				});
			}
		}
	}

	results = reports;
	scanning = false;
}

// Also scan for v-* classes that reference variant utilities
function scanVariants() {
	const allElements = document.querySelectorAll("[class*='v-']");
	const variantResults: string[] = [];

	for (const el of allElements) {
		const classes = (el as HTMLElement).className;
		if (typeof classes !== "string") continue;

		const vClasses = classes.split(/\s+/).filter((c) => /^v-[a-z]\d+$/.test(c));
		if (vClasses.length > 0) {
			const tag = el.tagName.toLowerCase();
			const kind = (el as HTMLElement).dataset?.kind || "";
			const computed = getComputedStyle(el);

			// Check if the variant classes actually produce visual changes
			const bg = computed.backgroundColor;
			const shadow = computed.boxShadow;
			const backdropFilter = computed.backdropFilter;

			if (bg === "rgba(0, 0, 0, 0)" && shadow === "none" && backdropFilter === "none") {
				variantResults.push(
					`${kind || tag} [${vClasses.join(" ")}] → NO VISUAL EFFECT (bg:transparent, shadow:none, backdrop:none)`,
				);
			}
		}
	}

	return variantResults;
}

onMount(() => {
	function handleKey(e: KeyboardEvent) {
		if (e.ctrlKey && e.shiftKey && e.key === "D") {
			visible = !visible;
			if (visible) scan();
		}
	}
	window.addEventListener("keydown", handleKey);
	return () => window.removeEventListener("keydown", handleKey);
});

let variantReport = $state<string[]>([]);

function runFullDiag() {
	scan();
	variantReport = scanVariants();
}
</script>

{#if visible}
	<div
		class="fixed top-0 right-0 z-[9999] w-[540px] h-screen overflow-y-auto font-mono text-xs"
		style="background: oklch(0.08 0.01 220 / 0.95); color: oklch(0.9 0.01 220); border-left: 2px solid oklch(0.4 0.08 173); backdrop-filter: blur(12px);"
	>
		<!-- Header -->
		<div style="padding: 12px 16px; border-bottom: 1px solid oklch(0.3 0.04 173); display: flex; justify-content: space-between; align-items: center;">
			<span style="font-size: 14px; font-weight: 700; color: oklch(0.7 0.08 173);">TOKEN DEBUG</span>
			<div style="display: flex; gap: 8px;">
				<button
					onclick={runFullDiag}
					style="padding: 4px 12px; background: oklch(0.2 0.06 173); border: 1px solid oklch(0.4 0.08 173); border-radius: 4px; color: oklch(0.9 0.08 173); cursor: pointer;"
				>
					{scanning ? "Scanning..." : "Re-scan"}
				</button>
				<button
					onclick={() => (visible = false)}
					style="padding: 4px 8px; background: oklch(0.15 0.02 220); border: 1px solid oklch(0.3 0.02 220); border-radius: 4px; color: oklch(0.6 0.02 220); cursor: pointer;"
				>
					✕
				</button>
			</div>
		</div>

		<!-- Summary -->
		<div style="padding: 12px 16px; border-bottom: 1px solid oklch(0.2 0.02 220); display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
			<div>
				<div style="color: oklch(0.5 0.02 220);">Total</div>
				<div style="font-size: 20px; font-weight: 700;">{summary.total}</div>
			</div>
			<div>
				<div style="color: oklch(0.65 0.18 145);">OK</div>
				<div style="font-size: 20px; font-weight: 700; color: oklch(0.65 0.18 145);">{summary.ok}</div>
			</div>
			<div>
				<div style="color: oklch(0.75 0.15 85);">Empty</div>
				<div style="font-size: 20px; font-weight: 700; color: oklch(0.75 0.15 85);">{summary.empty}</div>
			</div>
			<div>
				<div style="color: oklch(0.6 0.2 25);">Missing</div>
				<div style="font-size: 20px; font-weight: 700; color: oklch(0.6 0.2 25);">{summary.missing}</div>
			</div>
		</div>

		<!-- Variant visual report -->
		{#if variantReport.length > 0}
			<div style="padding: 12px 16px; border-bottom: 1px solid oklch(0.2 0.02 220);">
				<div style="color: oklch(0.75 0.15 85); font-weight: 700; margin-bottom: 8px;">
					v-* CLASSES WITH NO VISUAL EFFECT ({variantReport.length})
				</div>
				{#each variantReport as line}
					<div style="padding: 4px 0; color: oklch(0.75 0.15 85); word-break: break-all;">{line}</div>
				{/each}
			</div>
		{/if}

		<!-- Filter -->
		{#if missing.length > 0}
			<div style="padding: 8px 16px;">
				<input
					type="text"
					placeholder="Filter vars..."
					bind:value={filterText}
					style="width: 100%; padding: 6px 10px; background: oklch(0.12 0.01 220); border: 1px solid oklch(0.3 0.02 220); border-radius: 4px; color: oklch(0.9 0.01 220); font-family: inherit; font-size: inherit;"
				/>
			</div>
		{/if}

		<!-- Grouped by var name -->
		<div style="padding: 8px 16px;">
			<div style="color: oklch(0.5 0.02 220); margin-bottom: 8px; font-weight: 700;">
				EMPTY/MISSING VARS (grouped)
			</div>
			{#each groupedByVar() as [varName, info]}
				<div style="padding: 6px 8px; margin-bottom: 4px; background: oklch(0.12 0.02 25 / 0.3); border-left: 3px solid oklch(0.6 0.2 25); border-radius: 2px;">
					<div style="display: flex; justify-content: space-between;">
						<span style="color: oklch(0.8 0.15 25); font-weight: 600;">{varName}</span>
						<span style="color: oklch(0.5 0.02 220);">×{info.count}</span>
					</div>
					<div style="color: oklch(0.4 0.02 220);">resolved: {info.resolved}</div>
				</div>
			{/each}

			{#if missing.length === 0 && results.length > 0}
				<div style="padding: 16px; text-align: center; color: oklch(0.65 0.18 145);">
					All {summary.ok} CSS vars resolved successfully.
				</div>
			{/if}

			{#if results.length === 0}
				<div style="padding: 16px; text-align: center; color: oklch(0.5 0.02 220);">
					Press "Re-scan" or Ctrl+Shift+D to scan.
				</div>
			{/if}
		</div>

		<!-- Per-element detail -->
		{#if filtered.length > 0}
			<div style="padding: 8px 16px; border-top: 1px solid oklch(0.2 0.02 220);">
				<div style="color: oklch(0.5 0.02 220); margin-bottom: 8px; font-weight: 700;">
					PER-ELEMENT DETAIL ({filtered.length})
				</div>
				{#each filtered as r}
					<div style="padding: 4px 8px; margin-bottom: 2px; background: oklch(0.1 0.01 220); border-radius: 2px;">
						<span style="color: oklch(0.5 0.02 220);">{r.selector}</span>
						<span style="color: oklch(0.6 0.2 25); margin-left: 4px;">{r.varName}</span>
						<span style="color: oklch(0.35 0.02 220); margin-left: 4px;">→ {r.resolved}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
