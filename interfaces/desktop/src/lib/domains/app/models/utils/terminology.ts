/**
 * @file Terminology translation — maps technical AI terms to plain English.
 * @module @devpulse/domains/app/models/utils/terminology
 *
 * Every technical term has 3 levels of explanation:
 * Level 0 (new user): No jargon at all
 * Level 1 (learning): Jargon with explanation
 * Level 2 (comfortable): Jargon only
 */

/** User competency level for terminology adaptation. */
export type CompetencyLevel = 0 | 1 | 2;

/** Translate quantization level to user-friendly label. */
export function translateQuant(
	quant: string | null | undefined,
	level: CompetencyLevel = 0,
): string {
	if (!quant) return "Standard";
	const q = quant.toUpperCase();

	if (level === 2) return q;

	if (q.includes("Q2") || q.includes("Q3") || q.includes("IQ1") || q.includes("IQ2")) {
		return level === 0 ? "Optimized for speed (lighter)" : `Optimized for speed (${q})`;
	}
	if (q.includes("Q4")) {
		return level === 0 ? "Balanced speed and quality" : `Balanced (${q})`;
	}
	if (q.includes("Q5") || q.includes("Q6")) {
		return level === 0 ? "Optimized for quality" : `High quality (${q})`;
	}
	if (q.includes("Q8") || q.includes("F16") || q.includes("F32")) {
		return level === 0 ? "Maximum quality (uses more memory)" : `Maximum quality (${q})`;
	}
	return level === 0 ? "Standard" : q;
}

/** Translate context length to pages of conversation. */
export function translateContext(contextLength: number, level: CompetencyLevel = 0): string {
	if (contextLength <= 0) return "Unknown";
	const pages = Math.round(contextLength / 1500);
	if (level === 2) return `${contextLength} tokens`;
	if (level === 1) return `~${pages} pages (${contextLength} tokens)`;
	return `Can remember about ${pages} pages of conversation`;
}

/** Translate temperature to creativity label. */
export function translateTemperature(temp: number, level: CompetencyLevel = 0): string {
	if (level === 2) return `${temp.toFixed(2)}`;
	if (temp <= 0.2) return level === 0 ? "Very precise" : `Very precise (${temp})`;
	if (temp <= 0.5) return level === 0 ? "Focused" : `Focused (${temp})`;
	if (temp <= 0.8) return level === 0 ? "Balanced" : `Balanced (${temp})`;
	if (temp <= 1.2) return level === 0 ? "Creative" : `Creative (${temp})`;
	return level === 0 ? "Very creative" : `Very creative (${temp})`;
}

/** Translate VRAM usage to user-friendly label. */
export function translateVram(usedMb: number, totalMb: number, level: CompetencyLevel = 0): string {
	if (totalMb <= 0) return "No graphics card detected — using CPU";
	const pct = Math.round((usedMb / totalMb) * 100);
	if (level === 2) return `${usedMb} / ${totalMb} MB VRAM (${pct}%)`;
	if (level === 1) return `Using ${pct}% of graphics card (${usedMb}/${totalMb} MB)`;
	return `Using ${pct}% of your graphics card`;
}

/** Translate device preference to user-friendly label. */
export function translateDevice(device: string, level: CompetencyLevel = 0): string {
	if (level === 2) return device;
	switch (device) {
		case "Gpu":
			return level === 0 ? "Runs on graphics card" : "GPU (graphics card)";
		case "Cpu":
			return level === 0 ? "Runs on CPU (uses regular RAM)" : "CPU (system memory)";
		case "GpuWithCpuFallback":
			return level === 0 ? "Graphics card preferred, CPU if needed" : "GPU with CPU fallback";
		case "Any":
			return level === 0 ? "Automatic" : "Auto (best available)";
		default:
			return device;
	}
}

/** Translate model format to user-friendly label. */
export function translateFormat(format: string, level: CompetencyLevel = 0): string {
	if (level === 2) return format;
	switch (format) {
		case "Gguf":
			return level === 0 ? "Ready to use" : "GGUF (quantized, efficient)";
		case "SafeTensors":
			return level === 0 ? "Full quality" : "SafeTensors (full precision)";
		case "Onnx":
			return level === 0 ? "Optimized" : "ONNX (cross-platform optimized)";
		case "SherpaDir":
			return level === 0 ? "Voice model" : "Sherpa (voice processing)";
		default:
			return format;
	}
}

/** Translate loading strategy to user-friendly label. */
export function translateLoading(strategy: string, level: CompetencyLevel = 0): string {
	if (level === 2) return strategy;
	switch (strategy) {
		case "Hot":
			return level === 0 ? "Always ready" : "Hot (always loaded)";
		case "Warm":
			return level === 0 ? "Loads when likely needed" : "Warm (preloaded when predicted)";
		case "OnDemand":
			return level === 0 ? "Loads when first needed" : "On-demand (lazy load)";
		default:
			if (strategy.startsWith("Signal"))
				return level === 0
					? "Loads automatically when triggered"
					: `Signal-triggered (${strategy})`;
			return strategy;
	}
}

/** Translate slot status to user-friendly label. */
export function translateStatus(status: string, level: CompetencyLevel = 0): string {
	if (level === 2) return status;
	switch (status) {
		case "loaded":
			return "Active";
		case "loading":
			return "Starting up...";
		case "downloaded":
			return "Ready to activate";
		case "not_downloaded":
			return "Not installed";
		case "not_loaded":
			return "Installed, not running";
		case "error":
			return "Something went wrong";
		case "failed":
			return "Failed to start";
		default:
			return status;
	}
}

/** Translate a loading stage name to user-friendly text. */
export function translateLoadingStage(
	stage: string,
	pct: number,
	level: CompetencyLevel = 0,
): string {
	if (level === 2) return `${stage} ${pct}%`;
	switch (stage) {
		case "Verifying":
			return level === 0 ? "Checking the model file..." : `Verifying integrity (${pct}%)`;
		case "Allocating":
			return level === 0
				? "Reserving memory on your graphics card..."
				: `Allocating VRAM (${pct}%)`;
		case "LoadingWeights":
			return level === 0 ? `Loading the brain — ${pct}% done...` : `Loading weights (${pct}%)`;
		case "LoadingTokenizer":
			return level === 0 ? "Setting up the language processor..." : `Loading tokenizer (${pct}%)`;
		case "WarmingUp":
			return level === 0 ? "Almost ready — warming up..." : `Warm-up pass (${pct}%)`;
		default:
			return level === 0 ? `Loading... ${pct}%` : `${stage} (${pct}%)`;
	}
}

/** Translate a narration event type to user-friendly text. */
export function translateNarrationEvent(
	eventType: string,
	slotId: string,
	level: CompetencyLevel = 0,
	detail?: string,
): string {
	const slot = friendlySlotName(slotId, level);

	switch (eventType) {
		case "loading-started":
			return level === 0
				? `Loading up — pulling model weights into memory...`
				: `Loading ${slot} into memory`;
		case "loading-complete":
			return level === 0
				? "Ready to go! Model is loaded and active."
				: `${slot} loaded successfully`;
		case "loading-failed":
			return level === 0
				? `Couldn't load the model — ${detail ?? "unknown error"}`
				: `${slot} FAILED: ${detail ?? "unknown"}`;
		case "download-started":
			return level === 0
				? "Downloading from HuggingFace — sit tight..."
				: `Downloading model from HF`;
		case "download-complete":
			return level === 0 ? "Download complete! Model is ready to activate." : "Download finished";
		case "download-failed":
			return level === 0
				? `Download failed — ${detail ?? "unknown error"}`
				: `Download FAILED: ${detail ?? "unknown"}`;
		case "swap-started":
			return level === 0
				? "Switching models — Clyffy will pause briefly..."
				: `Hot-swapping ${slot}`;
		case "swap-complete":
			return level === 0 ? "Model switched! Back online." : `${slot} swap complete`;
		default:
			return detail ?? eventType;
	}
}

/** Friendly slot name for narration. */
function friendlySlotName(slotId: string, level: CompetencyLevel): string {
	if (level === 2) return slotId;
	const map: Record<string, string> = {
		"chat.brain": "the AI Brain",
		"minion.shared": "the quick worker",
		"vision.embedder": "vision",
		"voice.stt": "voice input",
		"voice.tts": "voice output",
		"rag.embedder": "the search engine",
		"rag.reranker": "the relevance scorer",
	};
	return map[slotId] ?? slotId;
}
