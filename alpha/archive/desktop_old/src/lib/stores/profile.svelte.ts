/**
 * Profile Store - Svelte 5 runes state management for multi-tenant profiles
 * 
 * Supports: org (organization), team, single (individual) modes
 * Profile determines database scope and permissions
 */

export type TenantMode = 'single' | 'team' | 'org';

export interface Profile {
	id: string;
	name: string;
	email?: string;
	avatar?: string;
	tenantMode: TenantMode;
	tenantId?: string; // org/team ID if not single
	tenantName?: string;
	permissions: string[];
	createdAt: number;
}

class ProfileStore {
	profile = $state<Profile | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);

	/**
	 * Derived: Current tenant mode
	 */
	get tenantMode(): TenantMode {
		return this.profile?.tenantMode ?? 'single';
	}

	/**
	 * Derived: Is authenticated?
	 */
	get isAuthenticated(): boolean {
		return this.profile !== null;
	}

	/**
	 * Derived: Display name
	 */
	get displayName(): string {
		return this.profile?.name ?? 'Guest';
	}

	/**
	 * Derived: Tenant display name
	 */
	get tenantDisplayName(): string {
		if (!this.profile) return 'No Profile';
		if (this.profile.tenantMode === 'single') return 'Personal';
		return this.profile.tenantName ?? this.profile.tenantId ?? 'Unknown';
	}

	/**
	 * Initialize profile - loads from storage or creates default
	 */
	async init(): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			// TODO: Load from Tauri backend / libSQL
			// For now, create a default single-user profile
			const stored = localStorage.getItem('devpulse_profile');
			if (stored) {
				this.profile = JSON.parse(stored);
			} else {
				this.profile = {
					id: crypto.randomUUID(),
					name: 'Vibe Coder',
					tenantMode: 'single',
					permissions: ['read', 'write', 'admin'],
					createdAt: Date.now()
				};
				this.persist();
			}
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Update profile
	 */
	update(updates: Partial<Profile>): void {
		if (this.profile) {
			this.profile = { ...this.profile, ...updates };
			this.persist();
		}
	}

	/**
	 * Switch tenant mode
	 */
	switchTenant(mode: TenantMode, tenantId?: string, tenantName?: string): void {
		if (this.profile) {
			this.profile = {
				...this.profile,
				tenantMode: mode,
				tenantId: mode === 'single' ? undefined : tenantId,
				tenantName: mode === 'single' ? undefined : tenantName
			};
			this.persist();
		}
	}

	/**
	 * Check if user has permission
	 */
	hasPermission(permission: string): boolean {
		return this.profile?.permissions.includes(permission) ?? false;
	}

	/**
	 * Clear profile (logout)
	 */
	clear(): void {
		this.profile = null;
		localStorage.removeItem('devpulse_profile');
	}

	/**
	 * Persist to local storage (temp until backend)
	 */
	private persist(): void {
		if (this.profile) {
			localStorage.setItem('devpulse_profile', JSON.stringify(this.profile));
		}
	}
}

export const profileStore = new ProfileStore();
