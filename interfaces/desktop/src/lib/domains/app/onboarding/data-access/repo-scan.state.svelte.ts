/**
 * @file repoScan — the repositories in your projects folder, as Rust found them.
 * @module @devpulse/domains/app/onboarding/data-access/repo-scan.state
 *
 * Rust scans the folder (git repositories, their languages via tokei,
 * DevPulse itself first) and registers the ones you tick, in place. This
 * store holds the list Rust returned, your ticks, and Rust's per-repo
 * results.
 */

import type { Result } from "$lib/sys/bindings/_shared/index.js";
import {
	type FoundRepo,
	onboardingRegisterProjects,
	onboardingScanProjects,
	type RegisterResult,
} from "$lib/sys/bindings/onboarding/index.js";
import { logError } from "$lib/sys/logger.js";

function unwrap<T>(name: string, result: Result<T, string>): T {
	if (result.status === "error") {
		logError("onboarding.repoScan", `${name} failed: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

class RepoScanStore {
	folder = $state<string | null>(null);
	repos = $state<FoundRepo[] | null>(null);
	/** The folder you gave does not exist (Rust's answer, not a failure). */
	missing = $state(false);
	picked = $state<string[]>([]);
	scanning = $state(false);
	registering = $state(false);
	results = $state<RegisterResult[]>([]);
	problem = $state<string | null>(null);

	/** Repos you can still add (not registered yet). */
	get addable(): FoundRepo[] {
		return this.repos?.filter((r) => !r.registered) ?? [];
	}

	async scan(folder: string): Promise<void> {
		const target = folder.trim();
		if (!target) return;
		this.folder = target;
		this.scanning = true;
		this.problem = null;
		this.missing = false;
		this.results = [];
		try {
			const repos = unwrap("onboardingScanProjects", await onboardingScanProjects(target));
			if (this.folder !== target) return;
			this.missing = repos === null;
			this.repos = repos ?? [];
			// DevPulse itself is ticked (dogfood); the rest are yours to tick.
			this.picked = this.repos.filter((r) => r.isDevpulse && !r.registered).map((r) => r.path);
		} catch (e) {
			this.repos = null;
			this.problem = message(e);
		} finally {
			this.scanning = false;
		}
	}

	toggle(path: string): void {
		this.picked = this.picked.includes(path)
			? this.picked.filter((p) => p !== path)
			: [...this.picked, path];
	}

	/** Repos Rust refused, with its reason (from the last registration). */
	get failed(): RegisterResult[] {
		return this.results.filter((r) => r.error !== null);
	}

	/**
	 * Register the ticked repos in place. The list then shows Rust's answer
	 * per repo — added ones marked registered and unticked, refused ones kept
	 * ticked with the reason — without rescanning the folder (a rescan counts
	 * every repo's languages again). The projects list and the active project
	 * arrive on Rust's `projects` signal. Returns `true` when every ticked
	 * repo was added.
	 */
	register = async (): Promise<boolean> => {
		if (this.picked.length === 0 || !this.folder) return true;
		this.registering = true;
		this.problem = null;
		try {
			const results = unwrap(
				"onboardingRegisterProjects",
				await onboardingRegisterProjects(this.picked),
			);
			const added = new Set(results.filter((r) => r.error === null).map((r) => r.path));
			this.repos =
				this.repos?.map((r) => (added.has(r.path) ? { ...r, registered: true } : r)) ?? null;
			this.picked = this.picked.filter((path) => !added.has(path));
			this.results = results;
			return this.failed.length === 0;
		} catch (e) {
			this.problem = message(e);
			return false;
		} finally {
			this.registering = false;
		}
	};
}

export const repoScan = new RepoScanStore();
