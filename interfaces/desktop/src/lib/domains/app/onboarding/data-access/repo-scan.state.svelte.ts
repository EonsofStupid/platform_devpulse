/**
 * @file repoScan — the repositories in your projects folder, as Rust found them.
 * @module @devpulse/domains/app/onboarding/data-access/repo-scan.state
 *
 * Rust scans the folder (git repositories, their languages via tokei,
 * DevPulse itself first) and registers the ones you tick, in place. This
 * store holds the list Rust returned, your ticks, and Rust's per-repo
 * results.
 */

import { projectsState } from "$lib/domains/app/projects/index.js";
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

	/** Register the ticked repos in place, then rescan so the list shows what is stored. */
	register = async (): Promise<void> => {
		if (this.picked.length === 0 || !this.folder) return;
		this.registering = true;
		this.problem = null;
		try {
			this.results = unwrap(
				"onboardingRegisterProjects",
				await onboardingRegisterProjects(this.picked),
			);
			const folder = this.folder;
			const results = this.results;
			// The projects list and the active project live in the projects
			// domain; it re-reads them from Rust.
			await Promise.all([this.scan(folder), projectsState.refresh("onboarding")]);
			this.results = results;
		} catch (e) {
			this.problem = message(e);
		} finally {
			this.registering = false;
		}
	};
}

export const repoScan = new RepoScanStore();
