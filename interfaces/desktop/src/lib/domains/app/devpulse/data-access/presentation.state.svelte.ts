import { type PresentationMode, resolveLabel } from "$lib/sys/generated/terminology.js";

export const PRESENTATION_KEY = "devpulse.presentation.mode";

function savedMode(value: string | null): PresentationMode {
	return value === "advanced" ? "advanced" : "simple";
}

/** UI preference only: service state and endpoint readiness remain unchanged. */
export class PresentationState {
	#mode = $state<PresentationMode>("simple");
	error = $state<string | null>(null);

	constructor(private readonly storage?: Pick<Storage, "getItem" | "setItem">) {
		try {
			this.#mode = savedMode(storage?.getItem(PRESENTATION_KEY) ?? null);
		} catch {
			this.error = "Display preference could not be loaded.";
		}
	}

	get mode(): PresentationMode {
		return this.#mode;
	}
	get advanced(): boolean {
		return this.#mode === "advanced";
	}

	label(name: string): string {
		return resolveLabel(name, this.#mode);
	}

	setMode(mode: PresentationMode): void {
		this.#mode = mode;
		this.error = null;
		try {
			if (!this.storage) throw new Error("Storage unavailable");
			this.storage.setItem(PRESENTATION_KEY, mode);
		} catch {
			this.error = "Display changed for this window, but could not be saved.";
		}
	}

	acceptSavedMode(value: string | null): void {
		this.#mode = savedMode(value);
		this.error = null;
	}
}

function browserStorage(): Storage | undefined {
	try {
		return typeof window === "undefined" ? undefined : window.localStorage;
	} catch {
		return undefined;
	}
}

const storage = browserStorage();
export const presentationState = new PresentationState(storage);
if (typeof window !== "undefined") {
	window.addEventListener("storage", (event) => {
		if (event.storageArea === storage && (event.key === PRESENTATION_KEY || event.key === null)) {
			presentationState.acceptSavedMode(event.newValue);
		}
	});
}
