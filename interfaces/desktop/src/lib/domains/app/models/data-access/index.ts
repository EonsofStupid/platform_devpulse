export {
	getCatalog,
	getCatalogForSlot,
	refreshCatalog,
} from "./catalog.service.js";
export {
	autoConfigureHardware,
	cancelDownload,
	downloadModel,
	importLocalModel,
	onDownloadComplete,
	onDownloadProgress,
} from "./download.service.js";
export { fetchHardwareMetrics } from "./hardware.service.js";
export { generateText, onInferenceToken } from "./inference.service.js";
export { getModelRegistry, scanModels } from "./registry.service.js";
export { searchHuggingFace } from "./search.service.js";
export {
	assignModelToSlot,
	deleteModel,
	getSlots,
	isFirstRun,
	loadSlot,
	swapSlotModel,
	unloadSlot,
	warmSlot,
} from "./slots.service.js";
