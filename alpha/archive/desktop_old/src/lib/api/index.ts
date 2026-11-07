/**
 * Desktop API Layer - Re-exports all Tauri command wrappers
 */

// Chat
export {
	sendMessage,
	getHistory,
	type ChatResult,
	type Message
} from './chat';

// Projects
export {
	listProjects,
	addProject,
	removeProject,
	selectProject,
	getSelectedProject,
	browseFolder,
	type Project
} from './projects';

// Status
export {
	getStatus,
	getSystemStatus,
	getAdapters,
	setAdapter,
	type StatusInfo,
	type AdapterInfo,
	type SystemStatusSnapshot,
	type ComponentStatus,
	type LoadState
} from './status';

// Voice
export {
	getVoiceStatus,
	speak,
	transcribe,
	type VoiceStatus
} from './voice';

// Window
export {
	openChatWindow,
	closeChatWindow,
	dockChatWindow
} from './window';

// Models
export {
	listModels,
	listModelsByFamily,
	getModelSummary,
	setActiveModel,
	getModelLoadStates,
	onModelLoading,
	loadVLModel,
	unloadVLModel,
	getCurrentVLModel,
	type ModelInfo,
	type ModelSummary,
	type ModelLoadState,
	type ModelLoadEvent,
	type ModelFamily
} from './models';

// Discovery - Adapter-based model scanning
export {
	scanModels,
	setModelDirectory,
	getDiscoveredModels,
	getVLModels,
	selectDiscoveredModel,
	getSelectedModel,
	type DiscoveredModel
} from './discovery';
