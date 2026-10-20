/**
 * @file youForm — the "You" stage's form, as Rust describes it.
 * @module @devpulse/domains/app/onboarding/data-access/you-form.state
 *
 * Rust sends the form (schema, stored values, suggestions found on this
 * machine) and validates every submission against the same schema. This
 * store only holds what you typed and the errors Rust returned. Saving goes
 * to Rust; when it is saved, first run continues (Rust checks the gate).
 */

import type { Result } from "$lib/sys/bindings/_shared/index.js";
import { pickDirectory } from "$lib/sys/bindings/models/index.js";
import {
	type FieldError,
	type FormView,
	onboardingYouForm,
	onboardingYouSubmit,
} from "$lib/sys/bindings/onboarding/index.js";
import { logError } from "$lib/sys/logger.js";
import { onboardingState } from "./onboarding.state.svelte.js";
import { repoScan } from "./repo-scan.state.svelte.js";

function unwrap<T>(name: string, result: Result<T, string>): T {
	if (result.status === "error") {
		logError("onboarding.youForm", `${name} failed: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

class YouFormStore {
	view = $state<FormView | null>(null);
	draft = $state<Record<string, string>>({});
	errors = $state<FieldError[]>([]);
	loading = $state(false);
	saving = $state(false);
	problem = $state<string | null>(null);

	async load(): Promise<void> {
		this.loading = true;
		this.problem = null;
		try {
			const view = unwrap("onboardingYouForm", await onboardingYouForm());
			const stored = (view.values ?? {}) as Record<string, string | null>;
			this.draft = Object.fromEntries(view.fields.map((f) => [f, stored[f] ?? ""]));
			this.view = view;
		} catch (e) {
			this.problem = message(e);
		} finally {
			this.loading = false;
		}
	}

	set(field: string, value: string): void {
		this.draft = { ...this.draft, [field]: value };
		this.errors = this.errors.filter((e) => e.field !== field);
	}

	async browse(field: string, title: string): Promise<void> {
		try {
			const path = unwrap("pickDirectory", await pickDirectory(title));
			if (path) this.set(field, path);
		} catch (e) {
			this.problem = message(e);
		}
	}

	/** Optional fields left empty are sent as "not given". */
	private payload(): Record<string, string | null> {
		const schema = (this.view?.schema ?? {}) as { required?: string[] };
		const required = schema.required ?? [];
		return Object.fromEntries(
			Object.entries(this.draft).map(([field, value]) => [
				field,
				value.trim() === "" && !required.includes(field) ? null : value,
			]),
		);
	}

	/**
	 * Save; when Rust accepts it, add the repositories you ticked (DevPulse
	 * itself is ticked for you), then continue to the next stage. A repo Rust
	 * refuses keeps you on this stage with its reason shown.
	 */
	saveAndContinue = async (): Promise<void> => {
		this.saving = true;
		this.problem = null;
		try {
			const outcome = unwrap("onboardingYouSubmit", await onboardingYouSubmit(this.payload()));
			this.errors = outcome.errors;
			if (!outcome.saved) return;
			if (!(await repoScan.register())) return;
			await onboardingState.next();
		} catch (e) {
			this.problem = message(e);
		} finally {
			this.saving = false;
		}
	};
}

export const youForm = new YouFormStore();
