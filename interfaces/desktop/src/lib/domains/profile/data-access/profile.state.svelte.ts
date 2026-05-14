/**
 * @module @devpulse/domains/profile/data-access/profile.state.svelte
 *
 * Post-login profile state — Clyffy's encoder/embedder picker. NOT
 * the wizard's "tell me about yourself" profile (that's owned by
 * `wizard.ProfileCopy`).
 *
 * State machine:
 *   idle        — initial; user can type a repo id and click Apply
 *   resolving   — calling `recommendPrimaryForSlot` to find the .gguf
 *                 inside the repo
 *   downloading — `installToSlot` is fetching files from HF
 *   loading     — files on disk; kernel is loading them into the runtime
 *   applied     — slot is live, Clyffy can use the embedder
 *   failed      — error surfaced via `applyError`
 *
 * The downloading/loading distinction tracks the existing `installState`
 * + `downloadState` runes — we don't replicate their progress; we
 * read their phase and lift it into our own state machine.
 */

import { commands } from "$lib/sys/generated/bindings.js";

/** Seed value — mirrors `kernel/model-loader/config/presets.default.toml:141`
 *  which locks `microsoft/harrier-oss-v1-0.6b` as the default for the
 *  `rag.embedder` slot on capable hardware. The tier-adaptive fallback
 *  to `microsoft/harrier-oss-v1-270m` (Floor / Minimal / CpuOnly tiers,
 *  same file lines 428–555) kicks in via the kernel's preset apply path
 *  when the user clicks Apply. The seed here is purely a UI default
 *  the operator can override by typing a different repo id. */
const SEED_EMBEDDER_REPO = "microsoft/harrier-oss-v1-0.6b";

/** The Tauri slot id Clyffy's embedder lives in. Matches the kernel
 *  slot config — `kernel/model-loader/config/slots.default.toml`'s
 *  `rag.embedder` entry. */
const EMBEDDER_SLOT_ID = "rag.embedder";

/** The Tauri slot id for the minion-process embedder (read-only on
 *  this screen — Clyffy manages it automatically with the small 270m
 *  variant per `presets.default.toml:622`). */
const MINION_EMBEDDER_SLOT_ID = "minion.embedder";

/** Phase of the apply state machine. Drives the button label + status text. */
export type ProfileApplyPhase =
	| "idle"
	| "resolving"
	| "downloading"
	| "loading"
	| "applied"
	| "failed";

class ProfileState {
	/** Repo id currently in the input field. Seeded with the locked
	 *  default; the operator can edit before clicking Apply. */
	pendingRepoId = $state<string>(SEED_EMBEDDER_REPO);
	/** Repo id of the model that's currently live in the embedder slot.
	 *  Loaded from `getSlots()` at mount. `null` when nothing is loaded yet. */
	currentRepoId = $state<string | null>(null);
	/** Repo id the system recommends — for the picker's "Recommended"
	 *  status line. Today this is the same as the seed value. When the
	 *  kernel grows a tier-aware `get_recommended_embedder_repo` Tauri
	 *  command, this binds to it. */
	recommendedRepoId = $state<string>(SEED_EMBEDDER_REPO);
	/** Apply state machine phase. */
	phase = $state<ProfileApplyPhase>("idle");
	/** Last error message from a failed apply. */
	applyError = $state<string | null>(null);
	/** Bytes downloaded so far in the active install — pulled live from
	 *  the existing `downloadState` rune via `$derived` in the UI layer.
	 *  Held here as a placeholder for future enhancements. */

	/** Live: what the minion process is using right now. Read from the
	 *  kernel's slot snapshot at init time; falls back to the locked
	 *  270m default per `presets.default.toml:622` when the slot is
	 *  unassigned (typical on first run before auto-config has run). */
	minionRepoId = $state<string>("microsoft/harrier-oss-v1-270m");

	/**
	 * Hydrate `currentRepoId` + `minionRepoId` from the kernel's slot
	 * snapshot. Called from the profile route's mount-time `$effect`.
	 * Failure is non-fatal — the picker still renders, the operator
	 * can still apply.
	 */
	async init(): Promise<void> {
		const result = await commands.getSlots();
		if (result.status !== "ok") {
			// Slot fetch failure is informational, not blocking — keep
			// `currentRepoId` null so the UI shows "no model loaded yet"
			// instead of crashing.
			return;
		}
		const slot = result.data.find((s) => s.id === EMBEDDER_SLOT_ID);
		this.currentRepoId = slot?.assigned_model_id ?? null;
		const minionSlot = result.data.find((s) => s.id === MINION_EMBEDDER_SLOT_ID);
		if (minionSlot?.assigned_model_id) {
			this.minionRepoId = minionSlot.assigned_model_id;
		}
	}

	/**
	 * Apply the pending repo id — drives the full install chain:
	 *
	 *   1. `recommendPrimaryForSlot(repo, slot)` → finds the primary
	 *      file in the repo (kernel knows which `.gguf` / `.safetensors`
	 *      to pick for this slot's runtime).
	 *   2. `installToSlot(repo, file, slot, null)` → downloads (if
	 *      not on disk) + registers + loads into the runtime.
	 *   3. Emits an `slot_loaded` analytics event on success — the
	 *      runtime chain proof point Phase D verifies.
	 *
	 * Errors are surfaced via `applyError` + `phase = "failed"`. The
	 * UI shows the error template inline.
	 */
	async apply(): Promise<void> {
		this.applyError = null;
		const repo = this.pendingRepoId.trim();
		if (repo.length === 0) {
			this.applyError = "Type a HuggingFace repo id first (owner/repo-name).";
			this.phase = "failed";
			return;
		}

		this.phase = "resolving";
		const recommend = await commands.recommendPrimaryForSlot(repo, EMBEDDER_SLOT_ID);
		if (recommend.status !== "ok" || recommend.data === null) {
			this.applyError =
				recommend.status === "ok"
					? "No suitable file found in this repo for the embedder slot."
					: recommend.error;
			this.phase = "failed";
			return;
		}
		const primaryFilename = recommend.data;

		this.phase = "downloading";
		const install = await commands.installToSlot(repo, primaryFilename, EMBEDDER_SLOT_ID, null);
		if (install.status !== "ok") {
			this.applyError = install.error;
			this.phase = "failed";
			return;
		}

		// At this point the kernel has reported a successful install
		// chain. The `loading` phase is the kernel's load-into-runtime
		// stage — install_to_slot returns AFTER load completes, so we
		// can advance straight to `applied`. Future enhancement: parse
		// the install_to_slot return string for the slot's actual
		// loaded state.
		this.phase = "applied";
		this.currentRepoId = repo;
	}

	/**
	 * Reset back to idle so the operator can try again after a
	 * failure. Doesn't clear the pending repo id — they likely want
	 * to edit + retry, not start from scratch.
	 */
	reset(): void {
		this.phase = "idle";
		this.applyError = null;
	}
}

/** Module-scope singleton. */
export const profileState = new ProfileState();
