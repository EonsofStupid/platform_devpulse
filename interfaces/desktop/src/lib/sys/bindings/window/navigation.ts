/** Cross-window links stay in their owning shell; never replace the chat webview. */
import { emit, emitTo, listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { goto } from "$app/navigation";
import { commands } from "$lib/sys/generated/bindings.js";
import { findRoute, hrefOf, type RouteNode } from "$lib/sys/routing/index.js";

const REQUEST = "devpulse:navigate-main";
const RESPONSE = "devpulse:navigate-main-result";
const READY = "devpulse:navigate-main-ready";
const TIMEOUT = 10_000;
interface Request {
	id: string;
	source: string;
	path: string;
	conversation: string | null;
	expires: number;
}
interface Response {
	id: string;
	error: string | null;
}

function destination(path: string, conversation: string | null): string {
	const route = findRoute(path);
	if (!route?.hasPage || !route.routeId.startsWith("/(app)/")) {
		throw new Error("This page does not belong to the main application window.");
	}
	const query = conversation ? `?${new URLSearchParams({ conversation })}` : "";
	return `${hrefOf(route)}${query}`;
}

/** Called once by the root layout; late listener registration is cleaned up on unmount. */
export function startMainNavigation(onError: (error: unknown) => void): () => void {
	if (getCurrentWindow().label !== "main") return () => {};
	let stopped = false;
	let unlisten: UnlistenFn | undefined;
	const received = new Map<string, number>();
	void listen<Request>(
		REQUEST,
		({ payload }) => {
			if (stopped || payload.expires < Date.now()) return;
			for (const [id, expires] of received) if (expires < Date.now()) received.delete(id);
			if (received.has(payload.id)) return;
			received.set(payload.id, payload.expires);
			void (async () => {
				let error: string | null = null;
				try {
					await goto(destination(payload.path, payload.conversation));
				} catch (cause) {
					error = cause instanceof Error ? cause.message : String(cause);
				}
				await emitTo(payload.source, RESPONSE, { id: payload.id, error } satisfies Response);
			})().catch(onError);
		},
		{ target: { kind: "Window", label: "main" } },
	)
		.then((detach) => {
			if (stopped) detach();
			else {
				unlisten = detach;
				// A newly opened main window may not have been listening to the first request.
				void emit(READY).catch(onError);
			}
		})
		.catch(onError);
	return () => {
		stopped = true;
		unlisten?.();
	};
}

/** Resolve only after the owning window acknowledges navigation; surface lost/failed delivery. */
export async function openMainPage(
	route: RouteNode,
	conversation: string | null = null,
): Promise<void> {
	const href = destination(route.path, conversation);
	const source = getCurrentWindow().label;
	if (source === "main") {
		await goto(href);
		return;
	}
	const id = crypto.randomUUID();
	let timer: ReturnType<typeof setTimeout> | undefined;
	let detach: UnlistenFn | undefined;
	let detachReady: UnlistenFn | undefined;
	let finished = false;
	const expires = Date.now() + TIMEOUT;
	try {
		await new Promise<void>((resolve, reject) => {
			const send = () =>
				emitTo("main", REQUEST, {
					id,
					source,
					path: route.path,
					conversation,
					expires,
				} satisfies Request);
			timer = setTimeout(
				() => reject(new Error("The main window did not respond. Try the link again.")),
				TIMEOUT,
			);
			void (async () => {
				const unlisten = await listen<Response>(
					RESPONSE,
					({ payload }) => {
						if (payload.id !== id) return;
						if (payload.error) reject(new Error(payload.error));
						else resolve();
					},
					{ target: { kind: "Window", label: source } },
				);
				if (finished) {
					unlisten();
					return;
				}
				detach = unlisten;
				const stopReady = await listen(READY, () => {
					if (!finished) void send().catch(reject);
				});
				if (finished) {
					stopReady();
					return;
				}
				detachReady = stopReady;
				const result = await commands.openWindow("Main");
				if (finished) return;
				if (result.status === "error") throw new Error(result.error);
				await send();
			})().catch(reject);
		});
	} finally {
		finished = true;
		clearTimeout(timer);
		detach?.();
		detachReady?.();
	}
}
