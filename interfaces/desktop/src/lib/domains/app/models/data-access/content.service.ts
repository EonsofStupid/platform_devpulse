/**
 * @file Content Service
 * @module @devpulse/domains/app/models/data-access/content
 *
 * Loads wizard content from bundled JSON or devpulse.app API.
 * Bundled JSON is the fallback — works offline.
 */

import { logInfo, logWarn } from "$lib/sys/logger.js";

/** Root content structure matching wizard-content.json. */
export interface WizardContent {
	version: number;
	welcome: {
		greeting: string;
		subtitle: string;
		cta: string;
	};
	scanning: {
		title: string;
		messages: string[];
		results: Record<string, string>;
	};
	recommendations: {
		title: string;
		subtitle: string;
		slotLabels: Record<string, { name: string; desc: string }>;
		fitLabels: Record<string, string>;
		cta: string;
		manual: string;
	};
	downloading: {
		title: string;
		subtitle: string;
		etaFormat: string;
		messages: string[];
	};
	knowledgeDrops: Array<{ title: string; body: string }>;
	verifying: {
		title: string;
		subtitle: string;
		slotVerifying: string;
		slotReady: string;
	};
	ready: {
		title: string;
		subtitle: string;
		cta: string;
	};
	errors: Record<string, string>;
}

let cached: WizardContent | null = null;

/** Load wizard content — API first, bundled fallback. */
export async function loadWizardContent(): Promise<WizardContent> {
	if (cached) return cached;

	// Try devpulse.app API for fresh content (when online)
	try {
		const res = await fetch("https://devpulse.app/api/v1/wizard-content", {
			signal: AbortSignal.timeout(5000),
		});
		if (res.ok) {
			cached = (await res.json()) as WizardContent;
			logInfo("content", "Loaded wizard content from devpulse.app API");
			return cached;
		}
	} catch {
		logWarn("content", "devpulse.app API unreachable — using bundled content");
	}

	// Fall back to bundled JSON
	try {
		const res = await fetch("/content/wizard-content.json");
		cached = (await res.json()) as WizardContent;
		logInfo("content", "Loaded wizard content from bundled JSON");
		return cached;
	} catch (e) {
		logWarn("content", `Failed to load bundled content: ${e}`);
		// Return minimal fallback so the wizard doesn't crash
		return getMinimalFallback();
	}
}

/** Minimal hardcoded fallback if both API and JSON fail. */
function getMinimalFallback(): WizardContent {
	return {
		version: 0,
		welcome: {
			greeting: "Hi! I'm Clyffy.",
			subtitle: "Let me set up your AI.",
			cta: "Let's Go",
		},
		scanning: {
			title: "Checking your computer...",
			messages: ["Scanning hardware..."],
			results: {
				gpuFound: "GPU detected.",
				noGpu: "No GPU — using CPU.",
				tierHigh: "Powerful setup.",
				tierMedium: "Good setup.",
				tierLow: "Basic setup.",
				tierCpu: "CPU mode.",
			},
		},
		recommendations: {
			title: "Recommended models",
			subtitle: "Tailored for your hardware.",
			slotLabels: {},
			fitLabels: { green: "Fits", yellow: "Tight", red: "Too big", gray: "CPU" },
			cta: "Set Me Up",
			manual: "Configure manually",
		},
		downloading: {
			title: "Downloading...",
			subtitle: "One-time setup.",
			etaFormat: "About {minutes} min left",
			messages: ["Downloading AI models..."],
		},
		knowledgeDrops: [],
		verifying: {
			title: "Testing...",
			subtitle: "Verifying your AI works.",
			slotVerifying: "Testing {slotName}...",
			slotReady: "{slotName} ready!",
		},
		ready: {
			title: "Ready!",
			subtitle: "Your AI is online.",
			cta: "Start",
		},
		errors: {},
	};
}
