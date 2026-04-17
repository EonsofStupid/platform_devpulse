/**
 * @file Wizard Types
 * @module @devpulse/domains/app/models/feature/setup-wizard/types
 *
 * All types for the 8-phase dev onboarding wizard.
 * Follows the 10 Commandments spec — layman names, role colors, preset-first.
 */

import type { DevicePreference, HardwareTier, SlotId } from "../../util/models.types.js";

// ── Phases ─────────────────────────────────────────────

/** The 8 phases of the setup wizard, in sequential order. One step per phase. */
export type WizardPhase =
	| "welcome"
	| "systemcheck"
	| "brain"
	| "encoder"
	| "voice"
	| "helpers"
	| "activate"
	| "complete";

/** All phases in order, for iteration and progress dots. */
export const WIZARD_PHASES: WizardPhase[] = [
	"welcome",
	"systemcheck",
	"brain",
	"encoder",
	"voice",
	"helpers",
	"activate",
	"complete",
];

/** Phase display metadata — layman labels. */
export interface PhaseInfo {
	phase: WizardPhase;
	label: string;
	description: string;
}

export const PHASE_INFO: PhaseInfo[] = [
	{ phase: "welcome", label: "Welcome", description: "Meet Clyffy and see your hardware" },
	{
		phase: "systemcheck",
		label: "System Check",
		description: "Detect GPU, CPU, memory, and storage",
	},
	{ phase: "brain", label: "Brain", description: "Choose your primary reasoning model" },
	{ phase: "encoder", label: "Encoder", description: "Search, understanding, and vision models" },
	{ phase: "voice", label: "Voice", description: "Speech-to-text and text-to-speech" },
	{ phase: "helpers", label: "Helpers", description: "Background workers and fast routing" },
	{ phase: "activate", label: "Test Chat", description: "Verify the brain responds" },
	{ phase: "complete", label: "Ready!", description: "Review and launch" },
];

/** All phases show in progress dots — no hidden sub-pages. */
export const PROGRESS_PHASES: WizardPhase[] = WIZARD_PHASES;

// ── Slot Labels (10 Commandments #3) ─────────────────

/** Layman-friendly slot metadata per the owner's spec. */
export interface SlotLabel {
	id: SlotId;
	name: string;
	description: string;
	role: SlotRole;
}

/** Role groupings for color coding (10 Commandments #4). */
export type SlotRole = "reasoning" | "observation" | "encoder" | "voice";

/** Role → central accent color mapping. Generic color names from accent.css. */
export const ROLE_COLORS: Record<SlotRole, { accent: string; glow: string }> = {
	reasoning: { accent: "var(--accent-violet-main)", glow: "var(--accent-violet-glow)" },
	observation: { accent: "var(--accent-green-main)", glow: "var(--accent-green-glow)" },
	encoder: { accent: "var(--accent-blue-main)", glow: "var(--accent-blue-glow)" },
	voice: { accent: "var(--accent-coral-main)", glow: "var(--accent-coral-glow)" },
};

/**
 * Role frame — one per wizard step (Steps 2-5). Groups slots by function.
 * Each step renders SlotCards for these slots.
 */
export interface RoleFrame {
	id: string;
	label: string;
	description: string;
	slots: SlotId[];
	color: string;
	phase: WizardPhase;
}

/** The 4 role frames matching wizard Steps 2-5. */
export const ROLE_FRAMES: RoleFrame[] = [
	{
		id: "brain",
		label: "Brain",
		description: "Your primary reasoning engine",
		slots: ["chat.brain"],
		color: "teal",
		phase: "brain",
	},
	{
		id: "encoder",
		label: "Encoder",
		description: "Search, understanding, and vision",
		slots: ["rag.embedder", "rag.reranker", "rag.encoder", "vision.embedder"],
		color: "purple",
		phase: "encoder",
	},
	{
		id: "voice",
		label: "Voice",
		description: "Speech-to-text, text-to-speech, voice brain",
		slots: ["voice.stt", "voice.tts", "voice.brain", "voice.wake"],
		color: "amber",
		phase: "voice",
	},
	{
		id: "helpers",
		label: "Helpers",
		description: "Background workers and fast routing",
		slots: ["minion.shared", "minion.escalation", "chat.fast", "chat.vision"],
		color: "gray",
		phase: "helpers",
	},
];

/** The definitive slot label list. EXACT from owner's spec. */
export const SLOT_LABELS: SlotLabel[] = [
	{
		id: "chat.brain",
		name: "Clyffy's Brain",
		description: "thinks and writes code",
		role: "reasoning",
	},
	{
		id: "chat.fast",
		name: "Quick Brain",
		description: "handles fast turns and routing",
		role: "reasoning",
	},
	{
		id: "chat.vision",
		name: "Vision Reasoning",
		description: "answers questions about images and screenshots",
		role: "encoder",
	},
	{
		id: "minion.shared",
		name: "Minion Core",
		description: "specialist helpers thinking about your project",
		role: "observation",
	},
	{
		id: "minion.escalation",
		name: "Deep Reasoning",
		description: "heavy fallback thinking when a task gets harder",
		role: "observation",
	},
	{
		id: "rag.embedder",
		name: "Memory Search",
		description: "finds relevant code",
		role: "encoder",
	},
	{
		id: "rag.encoder",
		name: "Query Encoder",
		description: "packs retrieval queries for the vector store",
		role: "encoder",
	},
	{
		id: "rag.reranker",
		name: "Quality Filter",
		description: "picks best results",
		role: "encoder",
	},
	{
		id: "vision.embedder",
		name: "Screen Reader",
		description: "understands screenshots",
		role: "encoder",
	},
	{ id: "voice.stt", name: "Voice Input", description: "Clyffy hears you", role: "voice" },
	{ id: "voice.tts", name: "Voice Output", description: "Clyffy talks back", role: "voice" },
	{
		id: "voice.brain",
		name: "Voice Conversation",
		description: "keeps live speech-to-speech conversation moving",
		role: "voice",
	},
	{
		id: "voice.wake",
		name: "Wake Word",
		description: "listens for the hands-free wake phrase",
		role: "voice",
	},
];

/** Look up a slot label by ID. */
export function getSlotLabel(slotId: string): SlotLabel | undefined {
	return SLOT_LABELS.find((s) => s.id === slotId);
}

/** Get the layman name for a slot, falling back to the raw ID. */
export function friendlyName(slotId: string): string {
	return getSlotLabel(slotId)?.name ?? slotId;
}

// ── Allocation Mode (mirrors engine AllocationMode) ──

export type AllocationMode = "cpu_only" | "budget" | "standard" | "high" | "flagship";

export const ALLOCATION_MODES: AllocationMode[] = [
	"cpu_only",
	"budget",
	"standard",
	"high",
	"flagship",
];

export function tierToAllocation(tier: HardwareTier, vramTotalMb?: number): AllocationMode {
	switch (tier) {
		case "Ultra":
			return "flagship";
		case "High":
			return "flagship";
		case "JessePrimary":
			return (vramTotalMb ?? 0) >= 16000 ? "flagship" : "high";
		case "Mid":
			return "high";
		case "Floor":
			return "standard";
		case "Minimal":
			return "budget";
		case "CpuOnly":
			return "cpu_only";
	}
}

export function allocationLabel(mode: AllocationMode): string {
	switch (mode) {
		case "cpu_only":
			return "CPU Only";
		case "budget":
			return "Budget (6 GB)";
		case "standard":
			return "Standard (8 GB)";
		case "high":
			return "High (12 GB)";
		case "flagship":
			return "Flagship (16 GB+)";
	}
}

// ── Model Recommendations ──────────────────────────────

/** Model recommendation for wizard download flow. */
export interface ModelRec {
	/** Human name: "Qwen3-8B" */
	name: string;
	/** Why the user needs it: "Your main AI brain" */
	purpose: string;
	/** Target slot ID. */
	slot: SlotId;
	/** Download size in MB */
	sizeMb: number;
	/** Estimated VRAM usage in MB (0 for CPU-only models) */
	vramMb: number;
	/** HuggingFace repo ID */
	repo: string;
	/** Filename within repo */
	file: string;
	/** Where this model runs */
	device: DevicePreference;
	/** Whether this model file is already downloaded on disk */
	alreadyDownloaded: boolean;
}

// ── Import ─────────────────────────────────────────────

export type ImportMode = "copy" | "symlink";

// ── Continue Gates ─────────────────────────────────────

export interface ContinueGate {
	phase: WizardPhase;
	conditions: string[];
	allMet: boolean;
	blockers: string[];
}

// ── Download Tracking ──────────────────────────────────

/** Tracked download in the download queue. */
export interface DownloadTracker {
	downloadId: string;
	slotId: SlotId;
	filename: string;
	friendlyName: string;
	bytesDownloaded: number;
	totalBytes: number;
	speedBps: number;
	status: "queued" | "downloading" | "complete" | "failed" | "cancelled";
	error?: string;
	/**
	 * Retry context so a `DownloadProgressRow` can re-dispatch `download_model`
	 * without the overlay having to stash the original args somewhere else.
	 */
	repoId?: string;
	/** Start timestamp in ms for ETA calculation. */
	startedAtMs?: number;
}

/**
 * Stage in the kernel's `LoadingStage` event stream. Matches the Rust
 * `LoadingStage` variants emitted by `kernel/model-loader/src/loading/states.rs`
 * — the bridge normalises them into this union so the overlay only has
 * to reason about layman labels, not Rust enum variants.
 */
export type LoadingStageKind = "reading" | "memory" | "warmup" | "ready" | "failed";

/**
 * Per-slot loading tracker populated by the download-bootstrap event bridge.
 *
 * A card enters the `loading` visual state whenever `wizardState.activeLoads[slotId]`
 * is non-null. The `stage` field drives which layman label the
 * `ClyffyLoadSpinner` renders, the `progressPct` drives an indeterminate-to-
 * determinate transition on the ARIA progressbar, and `error` populates the
 * inline Retry card when a load fails.
 */
export interface LoadingTracker {
	/** Slot being loaded (e.g. `"chat.brain"`). */
	slotId: SlotId;
	/** Registry ID of the model (stable across sessions). */
	modelId: string;
	/** Layman-friendly name shown in the card. Never a raw filename. */
	friendlyName: string;
	/** Current stage of the load. */
	stage: LoadingStageKind;
	/** 0 – 100 percent if the kernel emitted a progress hint, otherwise null. */
	progressPct: number | null;
	/** Error string when `stage === "failed"`. */
	error: string | null;
	/** Start timestamp in ms for diagnostics. */
	startedAtMs: number;
}

// ── Voice Config / Escalation Config ──────────────────
// DEFERRED to devtools. See _archive/ for old implementations.

// ── Model Browser Filter ──────────────────────────────

export interface ModelBrowserFilter {
	format: "gguf" | "safetensors" | "all";
	maxSizeMb: number | null;
	fitOnly: boolean;
}

// ── Wizard Copy (mirrors Rust WizardCopy) ─────────────
//
// All user-facing strings come from Rust via the get_wizard_copy command.
// Rust loads from .userdata/config/wizard_copy.toml or embedded default.
// Frontend never hardcodes wizard text — it calls the command and renders.

export interface GreetingCopy {
	title: string;
	subtitle: string;
	mascot_alt: string;
	hint: string;
	cta_label: string;
	cta_aria: string;
}

export interface ScanningCopy {
	title: string;
	subtitle: string;
	mascot_alt: string;
}

export interface HardwareCopy {
	title: string;
	gpu_label: string;
	vram_label: string;
	cpu_label: string;
	ram_label: string;
	disk_label: string;
	gpu_tooltip: string;
	vram_tooltip: string;
	cpu_tooltip: string;
	ram_tooltip: string;
	disk_tooltip: string;
	no_gpu_warning_title: string;
	no_gpu_warning_detail: string;
	next_step_template: string;
	continue_label: string;
	continue_aria: string;
}

export interface ModelsCopy {
	title: string;
	subtitle_with_recs: string;
	subtitle_no_recs: string;
	setup_button_label: string;
	setup_in_progress_label: string;
	setup_complete_message: string;
	error_retry_label: string;
	error_pick_manually_label: string;
	error_skip_label: string;
	customize_link_label: string;
	browse_link_label: string;
	continue_label: string;
	back_label: string;
}

export interface CustomizeCopy {
	title: string;
	subtitle: string;
	group_thinking: string;
	group_watching: string;
	group_understanding: string;
	group_talking: string;
	browse_link_label: string;
	done_label: string;
	back_label: string;
}

export interface BrowseCopy {
	title: string;
	subtitle: string;
	recommended_tab_label: string;
	local_tab_label: string;
	online_tab_label: string;
	local_browse_tab_label: string;
	search_panel_description: string;
	search_placeholder: string;
	search_input_aria: string;
	search_button_label: string;
	all_formats_label: string;
	all_formats_tooltip: string;
	no_results_title: string;
	no_results_title_template: string;
	no_results_hint: string;
	welcome_search_title: string;
	welcome_search_hint: string;
	popular_searches_label: string;
	try_one_of_these_label: string;
	format_help_title: string;
	format_gguf_help: string;
	format_safetensors_help: string;
	search_loading_template: string;
	search_loading_hint: string;
	retry_label: string;
	clear_label: string;
	result_label_singular: string;
	result_label_plural: string;
	gguf_section_label: string;
	safetensors_section_label: string;
	shard_count_template: string;
	all_shards_summary_template: string;
	install_to_label: string;
	download_to_template: string;
	downloading_label: string;
	download_all_shards_template: string;
	downloading_all_shards_label: string;
	disk_space_warning_template: string;
	no_format_files_template: string;
	import_button_label: string;
	importing_label: string;
	load_more_label: string;
	loading_more_label: string;
}

export interface ActivateCopy {
	title: string;
	greeting_message: string;
	progress_remaining_template: string;
	progress_complete_label: string;
	brain_missing_title: string;
	brain_missing_detail: string;
	voice_unavailable_message: string;
	thinking_label: string;
	error_message_template: string;
	send_aria: string;
	voice_enable_aria: string;
	voice_disable_aria: string;
}

export interface ProfileCopy {
	title: string;
	subtitle: string;
	name_label: string;
	name_placeholder: string;
	experience_label: string;
	project_folder_label: string;
	project_folder_placeholder: string;
	project_folder_hint: string;
	browse_button_label: string;
	continue_label: string;
	continue_template: string;
	back_label: string;
}

export interface CompletionCopy {
	title: string;
	subtitle_template: string;
	api_section_label: string;
	api_empty_message: string;
	launch_label: string;
	hint: string;
}

/** Copy for the HuggingFace token modal (matches Rust `HfTokenCopy`). */
export interface HfTokenCopy {
	title: string;
	subtitle: string;
	field_label: string;
	field_placeholder: string;
	save_label: string;
	save_aria: string;
	clear_label: string;
	clear_aria: string;
	cancel_label: string;
	close_aria: string;
	saved_badge: string;
	unsaved_badge: string;
	help_link_label: string;
	help_url: string;
	save_error_template: string;
	lock_icon_aria: string;
}

/** Copy for download progress rows (matches Rust `DownloadsCopy`). */
export interface DownloadsCopy {
	title: string;
	empty_message: string;
	row_aria_template: string;
	progress_aria_template: string;
	speed_template: string;
	eta_template: string;
	eta_seconds_template: string;
	eta_computing_label: string;
	starting_label: string;
	verifying_label: string;
	importing_label: string;
	complete_label: string;
	failed_label_template: string;
	cancelled_label: string;
	cancel_label: string;
	cancel_aria: string;
	retry_label: string;
	retry_aria: string;
	dismiss_label: string;
	dismiss_aria: string;
}

/** Copy for the Clyffy load spinner (matches Rust `LoadingCopy`). */
export interface LoadingCopy {
	title_template: string;
	subtitle_template: string;
	stage_reading_label: string;
	stage_memory_label: string;
	stage_warmup_label: string;
	stage_ready_label: string;
	stage_failed_label: string;
	retry_label: string;
	retry_aria: string;
	mascot_alt: string;
	progress_aria_template: string;
}

/** Copy for the four role cards (matches Rust `RoleCardsCopy`). */
export interface RoleCardsCopy {
	group_title: string;
	group_subtitle: string;

	brain_title: string;
	brain_layman: string;
	brain_empty_label: string;
	brain_change_label: string;
	brain_change_aria: string;

	minion_title: string;
	minion_layman: string;
	minion_empty_label: string;
	minion_change_label: string;
	minion_change_aria: string;

	encoder_title: string;
	encoder_layman: string;
	encoder_empty_label: string;
	encoder_change_label: string;
	encoder_change_aria: string;

	voice_title: string;
	voice_layman: string;
	voice_empty_label: string;
	voice_change_label: string;
	voice_change_aria: string;

	status_empty: string;
	status_downloading: string;
	status_warming: string;
	status_ready: string;
	status_error: string;
	vram_estimate_template: string;
}

/** Layman tooltip strings (matches Rust `ClyffyTooltipsCopy`). */
export interface ClyffyTooltipsCopy {
	hf_token_info: string;
	vram_info: string;
	role_brain_info: string;
	role_minion_info: string;
	role_encoder_info: string;
	role_voice_info: string;
	preset_picker_info: string;
	symlink_info: string;
}

/** Root copy struct — one Tauri call returns everything. */
export interface WizardCopy {
	greeting: GreetingCopy;
	scanning: ScanningCopy;
	hardware: HardwareCopy;
	models: ModelsCopy;
	customize: CustomizeCopy;
	browse: BrowseCopy;
	activate: ActivateCopy;
	profile: ProfileCopy;
	completion: CompletionCopy;
	hf_token: HfTokenCopy;
	downloads: DownloadsCopy;
	loading: LoadingCopy;
	role_cards: RoleCardsCopy;
	clyffy_tooltips: ClyffyTooltipsCopy;
}

// ── Tier Display (mirrors Rust TierDisplay) ───────────

/**
 * Semantic role for hardware tier color coding. Returned from Rust.
 * Frontend maps to SD5 design tokens via TIER_TOKENS below.
 */
export type TierRole = "workstation" | "prosumer" | "mainstream" | "entry" | "cpumode" | "minimal";

/** Display metadata for a hardware tier — name, description, role, tooltip. */
export interface TierDisplay {
	name: string;
	description: string;
	role: TierRole;
	tooltip: string;
}

/**
 * Tier role → SD5 design tokens.
 *
 * SINGLE source of truth for tier color presentation. Rebrand purple → blue
 * here, NOT in Rust. Rust returns semantic intent (`role`), frontend translates.
 */
export const TIER_TOKENS: Record<TierRole, { color: string; glow: string }> = {
	workstation: { color: "var(--accent-purple-main)", glow: "var(--accent-purple-glow)" },
	prosumer: { color: "var(--accent-cyan-main)", glow: "var(--accent-cyan-glow)" },
	mainstream: { color: "var(--accent-green-main)", glow: "var(--accent-green-glow)" },
	entry: { color: "var(--accent-gold-main)", glow: "var(--accent-gold-glow)" },
	cpumode: { color: "var(--accent-coral-main)", glow: "var(--accent-coral-glow)" },
	minimal: { color: "var(--accent-salmon-main)", glow: "var(--accent-salmon-glow)" },
};
