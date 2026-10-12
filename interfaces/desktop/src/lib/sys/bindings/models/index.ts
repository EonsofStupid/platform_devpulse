/**
 * @file sys/bindings/models/index.ts
 * @description Model management — slots, downloads, catalog, presets,
 * inference, voice/keyword config, capabilities, compatibility matrix.
 *
 * Largest binding domain — ~50 commands. Sub-files (slots/, downloads/,
 * voice-config/, etc.) can be split out later when files cross 500 LOC;
 * single-file is fine until then since the surface is mostly flat.
 */

import { commands } from "$lib/sys/generated/bindings.js";

// ── Hardware + scan + slots ─────────────────────────────────────
export const getHardwareMetrics = commands.getHardwareMetrics;
export const scanModels = commands.scanModels;
export const getSlots = commands.getSlots;
export const getModelsStatus = commands.getModelsStatus;
export const getModelCatalog = commands.getModelCatalog;

// ── Slot lifecycle ──────────────────────────────────────────────
export const assignModelToSlot = commands.assignModelToSlot;
export const loadSlot = commands.loadSlot;
export const unloadSlot = commands.unloadSlot;
export const clearSlotAssignment = commands.clearSlotAssignment;
export const swapSlotModel = commands.swapSlotModel;
export const warmSlot = commands.warmSlot;

// ── Downloads + repo files ──────────────────────────────────────
export const downloadModel = commands.downloadModel;
export const cancelDownload = commands.cancelDownload;
export const listRepoFiles = commands.listRepoFiles;
export const modelsDirPath = commands.modelsDirPath;
export const recommendPrimaryForSlot = commands.recommendPrimaryForSlot;
export const installToSlot = commands.installToSlot;

// ── Hugging Face token ──────────────────────────────────────────
export const setHfToken = commands.setHfToken;
export const hasHfToken = commands.hasHfToken;
export const clearHfToken = commands.clearHfToken;
export const hfTokenSuffix = commands.hfTokenSuffix;
export const searchHuggingface = commands.searchHuggingface;

// ── Assistant config (name / wake / voice) ──────────────────────
export const getAssistantConfig = commands.getAssistantConfig;
export const setAssistantName = commands.setAssistantName;
export const setWakePhrase = commands.setWakePhrase;
export const setWakeEnabled = commands.setWakeEnabled;
export const setVoiceBrain247 = commands.setVoiceBrain247;
export const setVoiceProfile = commands.setVoiceProfile;
export const registerVoiceClone = commands.registerVoiceClone;
export const removeVoiceClone = commands.removeVoiceClone;
export const addKeywordAction = commands.addKeywordAction;
export const removeKeywordAction = commands.removeKeywordAction;
export const updateKeywordAction = commands.updateKeywordAction;
export const setIdleTimeout = commands.setIdleTimeout;
export const setBrainNgl = commands.setBrainNgl;
export const uploadVoiceSample = commands.uploadVoiceSample;
export const listKokoroVoices = commands.listKokoroVoices;

// ── Local model import + hardware presets ───────────────────────
export const deleteModel = commands.deleteModel;
export const importLocalModel = commands.importLocalModel;
export const pickDirectory = commands.pickDirectory;
export const autoConfigure = commands.autoConfigure;
export const listPresets = commands.listPresets;
export const configForTier = commands.configForTier;
export const getWizardCopy = commands.getWizardCopy;
export const getTierDisplay = commands.getTierDisplay;

// ── Inference ───────────────────────────────────────────────────
export const inferenceGenerate = commands.inferenceGenerate;
export const testInference = commands.testInference;
export const getVramBudget = commands.getVramBudget;

// ── Capability backends (embedder / reranker / vision) ──────────
export const embedText = commands.embedText;
export const embedBatch = commands.embedBatch;
export const rerankDocuments = commands.rerankDocuments;
export const encodeImage = commands.encodeImage;

// ── Burn encoder — text embedding via rag.embedder slot ─────────
export const encoderIsLoaded = commands.encoderIsLoaded;
export const encoderEmbed = commands.encoderEmbed;

// ── Compatibility registry ──────────────────────────────────────
export const listBackendMatrix = commands.listBackendMatrix;
export const resolveArchitectureCompatibility = commands.resolveArchitectureCompatibility;

// ── Types ───────────────────────────────────────────────────────
export type {
	ActivateCopy,
	Alternative,
	AlternativeKind,
	ArchFamily,
	ArchId,
	ArchitectureSpec,
	AssistantAction,
	AssistantConfig,
	BackendId,
	BackendInfo,
	BackendMatrix,
	BrowseCopy,
	CatalogEntry,
	CatalogOption,
	CompletionCopy,
	CustomizeCopy,
	DownloadsCopy,
	FormatSupport,
	GreetingCopy,
	HardwareCopy,
	HardwareInfo,
	HfFileInfoItem,
	HfSearchResultInfo,
	HfTokenCopy,
	IdentityConfig,
	KeywordActionEntry,
	KokoroVoiceInfo,
	LoadError,
	LoadingCopy,
	ModelFormat,
	ModelInfo,
	ModelsCopy,
	ModelsReadiness,
	ProfileCopy,
	RepoFile,
	Resolution,
	RoleCardsCopy,
	ScanningCopy,
	SlotBudgetEntryInfo,
	SlotInfo,
	SupportStatus,
	SupportTier,
	TierDisplay,
	TierRole,
	UnsupportedReason,
	VoiceBrainConfig,
	VoiceCloneEntry,
	VramBudgetInfo,
	WakeConfig,
	WizardCopy,
} from "$lib/sys/generated/bindings.js";
