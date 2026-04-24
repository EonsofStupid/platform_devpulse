/**
 * @file Sherpa streaming ASR service — Tauri IPC wrappers.
 * @module @devpulse/domains/infra/sherpa/data-access/sherpa
 */

import type {
	SherpaCompileInfo,
	SherpaInstalledModel,
	SherpaSessionInfo,
} from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

function unwrap<T>(
	tag: string,
	r: { status: "ok"; data: T } | { status: "error"; error: string },
): T {
	if (r.status === "error") {
		logError("sherpa.svc", `${tag} FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function sherpaCompileInfo(): Promise<SherpaCompileInfo> {
	return unwrap("compileInfo", await commands.sherpaCompileInfo());
}

export async function sherpaListModels(): Promise<SherpaInstalledModel[]> {
	logInfo("sherpa.svc", "listModels()");
	return unwrap("listModels", await commands.sherpaListModels());
}

export async function sherpaDeleteModel(id: string): Promise<void> {
	logInfo("sherpa.svc", `deleteModel(${id})`);
	unwrap("deleteModel", await commands.sherpaDeleteModel(id));
}

export async function sherpaStartSession(modelId: string): Promise<string> {
	logInfo("sherpa.svc", `startSession(${modelId})`);
	return unwrap("startSession", await commands.sherpaStartSession(modelId));
}

export async function sherpaFeedAudio(sessionId: string, samples: number[]): Promise<string> {
	return unwrap("feedAudio", await commands.sherpaFeedAudio(sessionId, samples));
}

export async function sherpaFinishSession(sessionId: string): Promise<string> {
	logInfo("sherpa.svc", `finishSession(${sessionId})`);
	return unwrap("finishSession", await commands.sherpaFinishSession(sessionId));
}

export async function sherpaStopSession(sessionId: string): Promise<void> {
	logInfo("sherpa.svc", `stopSession(${sessionId})`);
	unwrap("stopSession", await commands.sherpaStopSession(sessionId));
}

export async function sherpaListSessions(): Promise<SherpaSessionInfo[]> {
	return unwrap("listSessions", await commands.sherpaListSessions());
}

export async function sherpaModelsDir(): Promise<string> {
	return unwrap("modelsDir", await commands.sherpaModelsDir());
}
