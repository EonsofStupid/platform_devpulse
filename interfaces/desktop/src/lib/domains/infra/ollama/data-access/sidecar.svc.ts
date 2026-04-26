/**
 * @file Ollama sidecar service — Tauri IPC wrappers for managed-process verbs.
 * @module @devpulse/domains/infra/ollama/data-access/sidecar.svc
 *
 * Thin result-unwrapping layer over the `sys/bindings/ollama` facade.
 * The facade insulates the domain from generated-binding renames; this
 * file insulates UI code from the facade's pass-through tuple shape.
 *
 * Mirrors the Rust `commands::ollama::sidecar` surface — start/stop/restart
 * lifecycle, status/health observation, config read, and the model verbs.
 */

import {
	type OllamaConfig,
	type OllamaHealth,
	type OllamaModel,
	type OllamaStatus,
	ollamaConfig as ollamaConfigCmd,
	ollamaDeleteModel as ollamaDeleteModelCmd,
	ollamaHealth as ollamaHealthCmd,
	ollamaListModels as ollamaListModelsCmd,
	ollamaPullModel as ollamaPullModelCmd,
	ollamaRestart as ollamaRestartCmd,
	ollamaStart as ollamaStartCmd,
	ollamaStatus as ollamaStatusCmd,
	ollamaStop as ollamaStopCmd,
} from "$lib/sys/bindings/ollama/index.js";
import { logError, logInfo } from "$lib/sys/logger.js";

const TAG = "ollama.sidecar.svc";

export async function ollamaStart(): Promise<OllamaStatus> {
	logInfo(TAG, "start()");
	const r = await ollamaStartCmd();
	if (r.status === "error") {
		logError(TAG, `start() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function ollamaStop(): Promise<void> {
	logInfo(TAG, "stop()");
	const r = await ollamaStopCmd();
	if (r.status === "error") {
		logError(TAG, `stop() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
}

export async function ollamaRestart(): Promise<OllamaStatus> {
	logInfo(TAG, "restart()");
	const r = await ollamaRestartCmd();
	if (r.status === "error") {
		logError(TAG, `restart() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function ollamaStatus(): Promise<OllamaStatus> {
	const r = await ollamaStatusCmd();
	if (r.status === "error") {
		logError(TAG, `status() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function ollamaHealth(): Promise<OllamaHealth> {
	const r = await ollamaHealthCmd();
	if (r.status === "error") {
		logError(TAG, `health() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function ollamaConfig(): Promise<OllamaConfig> {
	const r = await ollamaConfigCmd();
	if (r.status === "error") {
		logError(TAG, `config() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function ollamaListModels(): Promise<OllamaModel[]> {
	logInfo(TAG, "listModels()");
	const r = await ollamaListModelsCmd();
	if (r.status === "error") {
		logError(TAG, `listModels() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function ollamaPullModel(name: string): Promise<void> {
	logInfo(TAG, `pullModel(${name})`);
	const r = await ollamaPullModelCmd(name);
	if (r.status === "error") {
		logError(TAG, `pullModel() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
}

export async function ollamaDeleteModel(name: string): Promise<void> {
	logInfo(TAG, `deleteModel(${name})`);
	const r = await ollamaDeleteModelCmd(name);
	if (r.status === "error") {
		logError(TAG, `deleteModel() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
}
