/**
 * @file RepoList types.
 * @module @devpulse/domains/app/onboarding/ui/repo-list
 */

import type { FoundRepo, RegisterResult } from "$lib/sys/bindings/onboarding/index.js";

/** Text for the list (from the copy catalog). */
export interface RepoListText {
	devpulse: string;
	registered: string;
	added: string;
}

export interface RepoListProps {
	repos: FoundRepo[];
	/** Paths you ticked. */
	picked: string[];
	/** Rust's result per registered path, after "Add". */
	results: RegisterResult[];
	text: RepoListText;
	disabled?: boolean;
	onToggle: (path: string) => void;
}
