/**
 * @file sys/bindings/sherpa/index.ts
 * @description Sherpa-onnx STT runtime — sessions + model management.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const sherpaCompileInfo = commands.sherpaCompileInfo;
export const sherpaListModels = commands.sherpaListModels;
export const sherpaDeleteModel = commands.sherpaDeleteModel;
export const sherpaStartSession = commands.sherpaStartSession;
export const sherpaFeedAudio = commands.sherpaFeedAudio;
export const sherpaFinishSession = commands.sherpaFinishSession;
export const sherpaStopSession = commands.sherpaStopSession;
export const sherpaListSessions = commands.sherpaListSessions;
export const sherpaModelsDir = commands.sherpaModelsDir;

export type {
	SherpaCompileInfo,
	SherpaInstalledModel,
	SherpaSessionInfo,
} from "$lib/sys/generated/bindings.js";
