/**
 * @file Seed Families
 * @module @devpulse/domains/app/models/features/setup-wizard/seed-families
 *
 * Scripted narration variations for Clyffy.
 * Each concept has 4-5 phrasings. Core facts are locked.
 * Conversational framing varies per session to feel dynamic.
 */

export interface SeedFamily {
	id: string;
	coreFacts: string[];
	variations: string[];
	contextTriggers: string[];
}

/** Session-stable seed — same variation picked across re-renders within a session. */
const sessionSeed = Math.floor(Math.random() * 1000);

const SEED_FAMILIES = new Map<string, SeedFamily>();

function register(family: SeedFamily): void {
	SEED_FAMILIES.set(family.id, family);
}

// ── Quantization Formats ───────────────────────────────

register({
	id: "quant.q4_k_m",
	coreFacts: ["4-bit quantization", "~95% quality retention", "~25% original memory footprint"],
	variations: [
		"4-bit quant with medium precision. Keeps about 95% of the quality at a quarter of the memory. This is the daily driver.",
		"Q4_K_M \u2014 the workhorse quant. 4-bit with smart precision allocation. Nearly full quality, fraction of the VRAM.",
		"This is the one most people should use. 4-bit quantized, barely any quality loss, fits on gaming GPUs.",
		"Four-bit with medium key precision. The math nerds call it K-quant with M grouping. You call it 'fits on my 3070.'",
		"Q4_K_M. Four bits per weight, grouped for quality. If Q6 is overkill and Q2 is trash, this is the Goldilocks zone.",
	],
	contextTriggers: [
		"hover:quant_badge",
		"model_browser:quant_column",
		"slot_assignment:first_time",
	],
});

register({
	id: "quant.q6_k",
	coreFacts: ["6-bit quantization", "Better quality than Q4", "~50% more memory than Q4"],
	variations: [
		"6-bit quantization. Noticeably better than Q4 on nuanced reasoning, but uses about 50% more VRAM.",
		"Q6_K gives you measurably better output for tasks that need precision. Worth it if you have the headroom.",
		"Six bits per weight. The step up from Q4 for when quality matters more than saving every megabyte.",
		"Q6_K \u2014 the quality pick. If your GPU has room, this is where diminishing returns haven't kicked in yet.",
	],
	contextTriggers: ["hover:quant_badge", "model_browser:quant_column"],
});

register({
	id: "quant.q8_0",
	coreFacts: ["8-bit quantization", "Near-lossless quality", "2x memory of Q4"],
	variations: [
		"8-bit quantization. Nearly indistinguishable from full precision. Only if you've got VRAM to burn.",
		"Q8_0 is as close to the original as you can get while still saving space. Double the memory of Q4 though.",
		"Eight bits per weight. The 'I have a 4090 and I want the best' option.",
		"Q8 \u2014 audiophile-grade quantization. You probably can't tell the difference from fp16, but your GPU will.",
	],
	contextTriggers: ["hover:quant_badge", "model_browser:quant_column"],
});

// ── File Formats ───────────────────────────────────────

register({
	id: "format.gguf",
	coreFacts: ["Standard local format", "Universal compatibility", "Used by llama.cpp"],
	variations: [
		"GGUF is the standard format for running models locally. It's what llama.cpp and most local tools use. Think of it as the MP3 of AI models \u2014 compressed, portable, universal.",
		"GGUF \u2014 the universal local format. Every local inference tool speaks it. This is what you want.",
		"The GGUF format is your go-to for local models. Quantized, portable, and supported everywhere.",
		"GGUF files are ready-to-run model packages. No conversion needed, no extra steps. Just download and load.",
	],
	contextTriggers: ["hover:format_badge", "model_browser:format_column"],
});

register({
	id: "format.safetensors",
	coreFacts: ["HuggingFace official format", "Full precision", "Larger file size"],
	variations: [
		"SafeTensors is HuggingFace's official format. Full precision, no compression. Great for training and fine-tuning, but bigger and needs more memory. Phase 2 for us.",
		"SafeTensors \u2014 the uncompressed original. Full quality, full size. You'd use these on a server, not a gaming rig.",
		"HuggingFace's SafeTensors format. Think of it as the WAV file \u2014 perfect quality, but you need the storage for it.",
		"SafeTensors are the raw, unquantized model weights. Too big for most local setups, but great for fine-tuning later.",
	],
	contextTriggers: ["hover:format_badge", "model_browser:format_column"],
});

// ── VRAM & Context Concepts ────────────────────────────

register({
	id: "concept.vram",
	coreFacts: [
		"Graphics card memory",
		"Models live here during inference",
		"More VRAM = bigger models",
	],
	variations: [
		"VRAM is your graphics card's memory. AI models live here while they're running. More VRAM means bigger, smarter models.",
		"Think of VRAM as your GPU's workspace. The model needs to fit in this space to run on your graphics card.",
		"VRAM \u2014 video RAM on your GPU. It's the bottleneck for local AI. The number next to your GPU name is how much you've got.",
		"Your GPU's VRAM is where loaded models sit. If a model is 5 GB and you have 8 GB of VRAM, it fits with room to spare.",
	],
	contextTriggers: ["hover:vram_gauge", "hardware_detection:vram_row"],
});

register({
	id: "concept.context",
	coreFacts: ["How much text the model sees at once", "Measured in tokens", "Bigger = more memory"],
	variations: [
		"Context length is how much text the model can see at once. 8192 tokens is roughly 5-6 pages. Bigger context uses more memory.",
		"The context window is the model's working memory for a conversation. More tokens means it remembers more, but costs more VRAM.",
		"Context = how far back the model can 'see' in your conversation. 8K tokens is plenty for most chat. 32K is for long documents.",
		"Think of context length as the model's attention span. 8K tokens is good for conversations. Code analysis might want more.",
	],
	contextTriggers: ["hover:context_badge", "slot_assignment:context_display"],
});

register({
	id: "concept.slot",
	coreFacts: ["Named job a model fills", "One model per slot", "Slots have specific capabilities"],
	variations: [
		"A slot is a named job in the system. 'chat.brain' is the main thinking slot. 'voice.stt' is the listening slot. One model per job.",
		"Slots are like job positions. The brain slot does the thinking, the voice slot does the talking. You assign a model to each.",
		"Each slot is a role that needs filling. Brain for reasoning, voice for speech, vision for images. Pick the right model for each role.",
		"Think of slots as seats at a table. Each seat has a job. You pick which model sits where based on what it's good at.",
	],
	contextTriggers: ["slot_assignment:first_time", "hover:slot_label"],
});

// ── Model Architectures ────────────────────────────────

register({
	id: "model.qwen3",
	coreFacts: ["Alibaba Cloud", "Strong multilingual and code", "Available in 0.6B to 30B"],
	variations: [
		"Qwen3 is Alibaba's flagship model family. Excellent at code, multilingual, and reasoning. The 8B is the sweet spot for most setups.",
		"Qwen3 from Alibaba Cloud. Strong across the board \u2014 code, math, multilingual. The go-to recommendation for local use.",
		"Alibaba's Qwen3 family punches well above its weight class. The 4B handles daily tasks, the 8B is the serious workhorse.",
		"Qwen3 \u2014 think of it as the Honda Civic of AI models. Reliable, efficient, gets the job done without drama.",
	],
	contextTriggers: ["model_browser:card", "slot_assignment:recommendation"],
});

// ── Loading States ─────────────────────────────────────

register({
	id: "state.warm",
	coreFacts: [
		"Weights cached in system RAM",
		"Fast reload to GPU (<500ms)",
		"Not actively running inference",
	],
	variations: [
		"Model weights are cached in RAM. Not active, but can reload to GPU in under half a second.",
		"Warm state \u2014 the model was loaded before and its weights are still in system memory. Quick to reactivate.",
		"Cached and ready to go. The model isn't using GPU right now, but can be back in action almost instantly.",
		"Think of it as 'paused' \u2014 the weights are still in RAM, so reloading to GPU is nearly instant.",
	],
	contextTriggers: ["slot_status:warm"],
});

register({
	id: "state.standby",
	coreFacts: [
		"Session created, ready to activate",
		"Activation under 500ms",
		"Minimal resource usage while waiting",
	],
	variations: [
		"Standing by \u2014 the model has a session ready and can start inference in under half a second.",
		"Standby mode. The session is created and waiting. First inference will be nearly instant.",
		"Ready but idle. The model is prepared with a session and can respond the moment you need it.",
		"In standby \u2014 one step below fully active. Activation is sub-500ms, no perceivable delay.",
	],
	contextTriggers: ["slot_status:standby"],
});

register({
	id: "state.hot",
	coreFacts: [
		"Model is loaded and actively running inference",
		"GPU memory allocated and weights in VRAM",
		"Lowest possible latency — no load time",
	],
	variations: [
		"Clyffy's brain is fully warmed up and ready to think.",
		"This model is live — responses come as fast as hardware allows.",
		"Loaded and locked in. Zero wait time.",
		"Running hot — the model has everything it needs in memory right now.",
	],
	contextTriggers: ["slot_status:hot"],
});

register({
	id: "state.cold",
	coreFacts: [
		"Model file exists on disk but is not loaded into memory",
		"Must be loaded before inference (takes seconds to minutes)",
		"Zero resource usage while cold",
	],
	variations: [
		"This model is on disk but hasn't been loaded yet.",
		"Sitting on the shelf. Need to load it before Clyffy can use it.",
		"Cold storage — the file is there, but it needs to be brought into memory.",
		"Not using any resources right now. Load it when you're ready.",
	],
	contextTriggers: ["slot_status:cold"],
});

register({
	id: "state.loading",
	coreFacts: [
		"Model being loaded into GPU/RAM",
		"Takes 3-30 seconds depending on size",
		"Blocks the slot",
	],
	variations: [
		"Loading the model into memory. This takes a few seconds \u2014 bigger models take longer. The slot is busy until it's done.",
		"Model weights are being moved into GPU memory. Hang tight \u2014 this is a one-time cost per session.",
		"Loading in progress. The model file is being read from disk and placed into VRAM (or RAM for CPU models).",
		"Getting the model ready. Think of it as booting up \u2014 once loaded, inference is fast.",
	],
	contextTriggers: ["slot_status:loading"],
});

register({
	id: "state.loaded",
	coreFacts: ["Model ready for inference", "Taking VRAM/RAM", "Can be unloaded to free space"],
	variations: [
		"Model is loaded and ready. It's taking VRAM right now but can respond to requests immediately.",
		"This model is live \u2014 sitting in memory, ready to go. Inference will be fast.",
		"Loaded and operational. The model is in memory and waiting for input.",
		"Ready to work. The model weights are in GPU memory and inference can start instantly.",
	],
	contextTriggers: ["slot_status:loaded"],
});

register({
	id: "state.failed",
	coreFacts: ["Model failed to load", "Check error message", "May need different quant or device"],
	variations: [
		"Load failed. Check the error \u2014 usually it's not enough VRAM or a corrupted file.",
		"This model couldn't load. The error message tells you why. Common causes: VRAM full, file corrupt, architecture mismatch.",
		"Failed to load. Don't panic \u2014 read the error, it's specific. Might need a smaller quant or to free up VRAM first.",
		"Load failed. The raw error is shown above. Most common fix: try a smaller quantization or switch to CPU.",
	],
	contextTriggers: ["slot_status:failed"],
});

// ── Error Explanations ─────────────────────────────────

register({
	id: "error.vram_full",
	coreFacts: ["Not enough graphics memory", "Need to unload other models or use smaller quant"],
	variations: [
		"Not enough VRAM. You'll need to unload another model first, or pick a smaller quantization.",
		"GPU memory is full. Either free up space by unloading something, or try a Q4 quant instead of Q6/Q8.",
		"VRAM exhausted. The model won't fit alongside what's already loaded. Check the budget planner.",
		"Out of GPU memory. Solutions: unload a model, switch something to CPU, or pick a smaller quant.",
	],
	contextTriggers: ["error:vram_exceeded", "slot_assignment:wont_fit"],
});

register({
	id: "error.download_failed",
	coreFacts: ["Network or disk issue", "Check connection and free space"],
	variations: [
		"Download failed. Check your internet connection and make sure you have enough disk space.",
		"Couldn't complete the download. Common causes: network timeout, disk full, or HuggingFace rate limit.",
		"Download didn't finish. Verify your connection is stable and the target drive has enough free space.",
		"Failed to download the model. The error message has the specifics \u2014 usually network or disk space.",
	],
	contextTriggers: ["error:download_failed"],
});

// ── Hardware Detection ─────────────────────────────────

register({
	id: "hardware.gpu_found",
	coreFacts: ["GPU detected", "VRAM available for models", "Faster inference than CPU"],
	variations: [
		"Found your GPU. With dedicated VRAM, models will load faster and run better than CPU-only.",
		"GPU detected and ready. This means we can load models directly onto the graphics card for fast inference.",
		"Good news \u2014 you've got a GPU. That means real-time inference speeds instead of waiting on CPU.",
		"Graphics card found. VRAM is available for model loading. This is the fast path.",
	],
	contextTriggers: ["hardware_detection:gpu_row"],
});

register({
	id: "hardware.no_gpu",
	coreFacts: ["No GPU detected", "CPU-only mode", "Slower but functional"],
	variations: [
		"No GPU detected. We'll run in CPU mode \u2014 slower, but everything still works.",
		"CPU-only setup. Models will use system RAM instead of VRAM. Expect longer inference times.",
		"No graphics card found. That's fine \u2014 we'll use your CPU and regular RAM. It works, just takes longer.",
		"Running without a GPU. CPU inference is fully supported. Smaller models (4B and under) will still be responsive.",
	],
	contextTriggers: ["hardware_detection:no_gpu"],
});

register({
	id: "welcome.greeting",
	coreFacts: ["First interaction with Clyffy", "Friendly introduction"],
	variations: [
		"Hey! I'm Clyffy. Let me take a look at what we're working with.",
		"Hi there! I'm Clyffy, your AI assistant. Let's get you set up.",
		"Welcome! I'm Clyffy. First things first \u2014 let me check your hardware.",
		"Hey! Clyffy here. Ready to get your AI environment set up? Let's start with a hardware scan.",
	],
	contextTriggers: ["welcome:mount"],
});

// ── Resource Allocation ────────────────────────────────

register({
	id: "resource.allocation_tip",
	coreFacts: [
		"GPU reserved = always loaded",
		"GPU shared = on-demand",
		"CPU/DDR = always available",
	],
	variations: [
		"GPU Reserved means the model stays loaded all the time. GPU Shared means it loads on demand and unloads when not needed.",
		"Lock your brain model to GPU for instant responses. Put smaller utility models on CPU \u2014 they load fast enough.",
		"The allocation tiers control where models live. Reserved = always ready. Shared = loads when triggered. CPU = always available but slower.",
		"Think of it as parking spots. Reserved is your personal spot. Shared is the visitor lot. CPU is street parking \u2014 always there, just further away.",
	],
	contextTriggers: ["resource_panel:mount"],
});

register({
	id: "resource.vram_tight",
	coreFacts: ["VRAM near full", "Consider moving models to CPU", "Shared models may conflict"],
	variations: [
		"VRAM is getting tight. Consider moving lower-priority models to CPU to free up GPU space.",
		"You're close to the VRAM limit. If two shared models try to load at once, one will have to wait.",
		"Running low on GPU memory. The brain should stay on GPU, but utility models can work fine from CPU.",
		"VRAM headroom is thin. When shared models compete for the remaining space, the lower-priority one yields.",
	],
	contextTriggers: ["resource_panel:vram_low"],
});

/**
 * Pick a session-stable variation for a seed family.
 * Same variation returned for the entire session (stable per re-render).
 */
export function pickVariation(familyId: string): string {
	const family = SEED_FAMILIES.get(familyId);
	if (!family) return "";
	const index = sessionSeed % family.variations.length;
	return family.variations[index];
}

/**
 * Get the locked core facts for a seed family.
 */
export function getCoreFacts(familyId: string): string[] {
	return SEED_FAMILIES.get(familyId)?.coreFacts ?? [];
}

/**
 * Get all registered family IDs (for testing/debugging).
 */
export function getAllFamilyIds(): string[] {
	return [...SEED_FAMILIES.keys()];
}
