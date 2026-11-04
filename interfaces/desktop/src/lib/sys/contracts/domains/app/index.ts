/**
 * @file sys/contracts/domains/app/index.ts
 * @description Barrel export for app namespace domain contracts
 */

// Domain metadata constants and feature identifiers
export { CLYFFY_DOMAIN } from "./clyffy/clyffy.contract.js";
export {
	DEVFORGE_DOMAIN,
	DEVFORGE_FEATURES,
	type DevForgeFeature,
} from "./devforge/devforge.contract.js";
export {
	DEVPULSE_DOMAIN,
	DEVPULSE_FEATURES,
	type DevPulseFeature,
} from "./devpulse/devpulse.contract.js";
export { LATEST_DOMAIN, LATEST_FEATURES, type LatestFeature } from "./latest/latest.contract.js";
export {
	MODEL_LOADER_DOMAIN,
	MODEL_LOADER_FEATURES,
	type ModelLoaderFeature,
} from "./model-loader/model-loader.contract.js";
export {
	OVERMIND_DOMAIN,
	OVERMIND_FEATURES,
	type OvermindFeature,
} from "./overmind/overmind.contract.js";
export { UIDEMO_DOMAIN, UIDEMO_FEATURES, type UiDemoFeature } from "./ui-demo/ui-demo.contract.js";
export {
	VOICE_LAB_DOMAIN,
	VOICE_LAB_FEATURES,
	type VoiceLabFeature,
} from "./voice-lab/voice-lab.contract.js";
export {
	WIREDFRONT_DOMAIN,
	WIREDFRONT_FEATURES,
	type WiredFrontFeature,
} from "./wiredfront/wiredfront.contract.js";

// All domains array for registration
import { CLYFFY_DOMAIN } from "./clyffy/clyffy.contract.js";
import { DEVFORGE_DOMAIN } from "./devforge/devforge.contract.js";
import { DEVPULSE_DOMAIN } from "./devpulse/devpulse.contract.js";
import { LATEST_DOMAIN } from "./latest/latest.contract.js";
import { MODEL_LOADER_DOMAIN } from "./model-loader/model-loader.contract.js";
import { OVERMIND_DOMAIN } from "./overmind/overmind.contract.js";
import { UIDEMO_DOMAIN } from "./ui-demo/ui-demo.contract.js";
import { VOICE_LAB_DOMAIN } from "./voice-lab/voice-lab.contract.js";
import { WIREDFRONT_DOMAIN } from "./wiredfront/wiredfront.contract.js";

/** All app domains for bulk registration */
export const APP_DOMAINS = [
	LATEST_DOMAIN,
	DEVPULSE_DOMAIN,
	UIDEMO_DOMAIN,
	OVERMIND_DOMAIN,
	WIREDFRONT_DOMAIN,
	DEVFORGE_DOMAIN,
	MODEL_LOADER_DOMAIN,
	VOICE_LAB_DOMAIN,
	CLYFFY_DOMAIN,
] as const;

/** The id of an app hub. */
export type AppDomainId = (typeof APP_DOMAINS)[number]["id"];
