/**
 * @file Ollama sidecar service — Tauri IPC wrappers.
 * @module @devpulse/domains/infra/ollama_sidecar/data-access/ollama_sidecar
 *
 * Thin result-unwrapping layer over the specta-generated `commands` object.
 * Every wrapper logs, rethrows on error, and returns `data` on success —
 * same shape as the LibSQL service wrappers.
 */

import type {
	OllamaConfig,
	OllamaHealth,
	OllamaModel,
	OllamaStatus,
} from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

export async function ollamaSidecarStart(): Promise<OllamaStatus> {
	logInfo("ollama_sidecar.svc", "start()");
	const r = await commands.ollamaSidecarStart();
	if (r.status === "error") {
		logError("ollama_sidecar.svc", `start() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function ollamaSidecarStop(): Promise<void> {
	logInfo("ollama_sidecar.svc", "stop()");
	const r = await commands.ollamaSidecarStop();
	if (r.status === "error") {
		logError("ollama_sidecar.svc", `stop() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
}

export async function ollamaSidecarRestart(): Promise<OllamaStatus> {
	logInfo("ollama_sidecar.svc", "restart()");
	const r = await commands.ollamaSidecarRestart();
	if (r.status === "error") {
		logError("ollama_sidecar.svc", `restart() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function ollamaSidecarStatus(): Promise<OllamaStatus> {
	const r = await commands.ollamaSidecarStatus();
	if (r.status === "error") {
		logError("ollama_sidecar.svc", `status() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function ollamaSidecarHealth(): Promise<OllamaHealth> {
	const r = await commands.ollamaSidecarHealth();
	if (r.status === "error") {
		logError("ollama_sidecar.svc", `health() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function ollamaSidecarConfig(): Promise<OllamaConfig> {
	const r = await commands.ollamaSidecarConfig();
	if (r.status === "error") {
		logError("ollama_sidecar.svc", `config() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function ollamaSidecarListModels(): Promise<OllamaModel[]> {
	logInfo("ollama_sidecar.svc", "listModels()");
	const r = await commands.ollamaSidecarListModels();
	if (r.status === "error") {
		logError("ollama_sidecar.svc", `listModels() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
	return r.data;
}

export async function ollamaSidecarPullModel(name: string): Promise<void> {
	logInfo("ollama_sidecar.svc", `pullModel(${name})`);
	const r = await commands.ollamaSidecarPullModel(name);
	if (r.status === "error") {
		logError("ollama_sidecar.svc", `pullModel() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
}

export async function ollamaSidecarDeleteModel(name: string): Promise<void> {
	logInfo("ollama_sidecar.svc", `deleteModel(${name})`);
	const r = await commands.ollamaSidecarDeleteModel(name);
	if (r.status === "error") {
		logError("ollama_sidecar.svc", `deleteModel() FAILED: ${r.error}`);
		throw new Error(r.error);
	}
}
