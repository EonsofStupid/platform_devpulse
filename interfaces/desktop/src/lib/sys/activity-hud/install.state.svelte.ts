/**
 * @file Platform Install State
 * @module @devpulse/sys/activity-hud/install-state
 *
 * Svelte 5 rune state tracking ALL active model installs platform-wide.
 *
 * An "install" is the engine's atomic chain — download → scan → assign
 * → load — composed by `install_to_slot`. Distinct from a raw download
 * (which is just bytes-to-disk). The install lifecycle starts when the
 * user clicks an "Install to {slot}" button and ends when the model is
 * either loaded into the slot (success) or one of the four chain
 * stages fails.
 *
 * Subscribes to the three `model:install-*` Tauri events emitted by
 * `EventBridge` (engine → desktop bridge) which mirror
 * `LoaderEvent::Install{Started,Complete,Failed}` from the engine.
 */

import { listen } from "@tauri-apps/api/event";

export interface ActiveInstall {
	installId: string;
	repoId: string;
	primaryFilename: string;
	slotId: string;
	status: "running" | "complete" | "failed";
	/** Registry id of the now-loaded model. Set on `complete`. */
	modelId?: string;
	/**
	 * Stage-prefixed error description from `InstallFailed` —
	 * "download: ...", "scan: ...", "assign: ...", "load: ...".
	 * Set on `failed`. UI surfaces the prefix as the retry
	 * affordance ("Retry download", "Reassign", etc.).
	 */
	error?: string;
	startedAtMs: number;
}

class InstallState {
	installs = $state<Record<string, ActiveInstall>>({});
	private booted = false;

	get list(): ActiveInstall[] {
		return Object.values(this.installs);
	}

	get activeCount(): number {
		return this.list.filter((i) => i.status === "running").length;
	}

	get hasActive(): boolean {
		return this.activeCount > 0;
	}

	/** Wire up Tauri event listeners. Call once at app boot. */
	async boot(): Promise<void> {
		if (this.booted) return;
		this.booted = true;

		await listen<{
			install_id: string;
			repo_id: string;
			primary_filename: string;
			slot_id: string;
		}>("model:install-started", (event) => {
			const { install_id, repo_id, primary_filename, slot_id } = event.payload;
			this.installs = {
				...this.installs,
				[install_id]: {
					installId: install_id,
					repoId: repo_id,
					primaryFilename: primary_filename,
					slotId: slot_id,
					status: "running",
					startedAtMs: Date.now(),
				},
			};
		});

		await listen<{ install_id: string; slot_id: string; model_id: string }>(
			"model:install-complete",
			(event) => {
				const ins = this.installs[event.payload.install_id];
				if (!ins) return;
				this.installs = {
					...this.installs,
					[event.payload.install_id]: {
						...ins,
						status: "complete",
						modelId: event.payload.model_id,
					},
				};
			},
		);

		await listen<{ install_id: string; slot_id: string; error: string }>(
			"model:install-failed",
			(event) => {
				const ins = this.installs[event.payload.install_id];
				if (!ins) return;
				this.installs = {
					...this.installs,
					[event.payload.install_id]: {
						...ins,
						status: "failed",
						error: event.payload.error,
					},
				};
			},
		);
	}

	/** Remove a completed/failed install from the list. */
	dismiss(installId: string): void {
		if (!(installId in this.installs)) return;
		const next: Record<string, ActiveInstall> = {};
		for (const [id, ins] of Object.entries(this.installs)) {
			if (id !== installId) next[id] = ins;
		}
		this.installs = next;
	}
}

export const installState = new InstallState();
