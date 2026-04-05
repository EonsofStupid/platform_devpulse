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
