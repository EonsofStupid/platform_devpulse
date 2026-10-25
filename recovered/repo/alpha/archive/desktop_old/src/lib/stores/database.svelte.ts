/**
 * Database Store - Svelte 5 runes state for database connections
 * 
 * Tracks connection status for:
 * - Global DuckDB (app-wide analytics)
 * - Per-project DuckDB (project-specific analytics)
 * - Global Postgres (shared data via Supabase)
 * - Per-project Postgres DB
 * 
 * Profile tenant mode determines which databases are active
 */

export type DbType = 'duckdb-global' | 'duckdb-project' | 'postgres-global' | 'postgres-project';

export interface DbConnection {
	type: DbType;
	status: 'disconnected' | 'connecting' | 'connected' | 'error';
	error?: string;
	projectId?: string; // For per-project DBs
	lastPing?: number;
}

class DatabaseStore {
	connections = $state<Map<DbType, DbConnection>>(new Map([
		['duckdb-global', { type: 'duckdb-global', status: 'disconnected' }],
		['duckdb-project', { type: 'duckdb-project', status: 'disconnected' }],
		['postgres-global', { type: 'postgres-global', status: 'disconnected' }],
		['postgres-project', { type: 'postgres-project', status: 'disconnected' }]
	]));
	
	loading = $state(false);
	error = $state<string | null>(null);

	/**
	 * Get connection by type
	 */
	getConnection(type: DbType): DbConnection | undefined {
		return this.connections.get(type);
	}

	/**
	 * Derived: Is global DuckDB ready?
	 */
	get duckdbReady(): boolean {
		return this.connections.get('duckdb-global')?.status === 'connected';
	}

	/**
	 * Derived: Is global Postgres ready?
	 */
	get postgresReady(): boolean {
		return this.connections.get('postgres-global')?.status === 'connected';
	}

	/**
	 * Derived: All connections as array
	 */
	get allConnections(): DbConnection[] {
		return Array.from(this.connections.values());
	}

	/**
	 * Derived: Any errors?
	 */
	get hasErrors(): boolean {
		return this.allConnections.some(c => c.status === 'error');
	}

	/**
	 * Initialize database connections
	 */
	async init(): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			// TODO: Call Tauri commands to init DBs
			// await invoke('init_duckdb_global');
			// await invoke('init_postgres_global');
			
			// For now, simulate connected state
			this.updateConnection('duckdb-global', { status: 'connected', lastPing: Date.now() });
			this.updateConnection('postgres-global', { status: 'connected', lastPing: Date.now() });
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Connect to project-specific databases
	 */
	async connectProject(projectId: string): Promise<void> {
		this.loading = true;

		try {
			// TODO: Call Tauri commands
			// await invoke('init_duckdb_project', { projectId });
			// await invoke('init_postgres_project', { projectId });
			
			this.updateConnection('duckdb-project', { 
				status: 'connected', 
				projectId, 
				lastPing: Date.now() 
			});
			this.updateConnection('postgres-project', { 
				status: 'connected', 
				projectId, 
				lastPing: Date.now() 
			});
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Disconnect project databases
	 */
	disconnectProject(): void {
		this.updateConnection('duckdb-project', { status: 'disconnected', projectId: undefined });
		this.updateConnection('postgres-project', { status: 'disconnected', projectId: undefined });
	}

	/**
	 * Update a connection's state
	 */
	private updateConnection(type: DbType, updates: Partial<DbConnection>): void {
		const current = this.connections.get(type);
		if (current) {
			this.connections.set(type, { ...current, ...updates });
			// Trigger reactivity by creating new Map
			this.connections = new Map(this.connections);
		}
	}

	/**
	 * Health check all connections
	 */
	async healthCheck(): Promise<void> {
		// TODO: Ping each connection
		for (const [type, conn] of this.connections) {
			if (conn.status === 'connected') {
				this.updateConnection(type, { lastPing: Date.now() });
			}
		}
	}
}

export const databaseStore = new DatabaseStore();
