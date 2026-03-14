//! Consolidated SurrealDB boot — one engine, three namespaces.
//!
//! Opens ONE SurrealKV instance at `.userdata/surreal/devpulse` and
//! initializes system, user, and global namespaces. Then starts the
//! HTTP server on :8822 for external tool access.
//!
//! # Recovery Policy
//! On first failure: retry after delay (file lock, antivirus).
//! On second failure: report error, return None for all graph stores.
//! **NEVER delete data.** Transient failures must not destroy the knowledge graph.

use crate::platform::config::{PlatformBootConfig, sanitize_path};
use crate::platform::init::InitEvent;
use crate::platform::server;
use crate::platform::stores::graph::{
    GraphStore, GLOBAL_GRAPH_SCHEMA, SYSTEM_GRAPH_SCHEMA, USER_GRAPH_SCHEMA,
};
use devpulse_maestro::cortex::persistence::SurrealAdapter;
use std::path::Path;
use std::sync::Arc;
use std::time::Instant;

/// Boot a consolidated SurrealDB instance with all three namespace scopes.
///
/// Returns graph stores for (system, user, global). Any or all may be None
/// if the engine fails to open or namespaces fail to initialize.
pub async fn boot_consolidated(
    data_dir: &Path,
    boot_config: &PlatformBootConfig,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
) -> (
    Option<Arc<GraphStore>>,
    Option<Arc<GraphStore>>,
    Option<Arc<GraphStore>>,
) {
    let any_graph_enabled = boot_config.stores.system.graph.enabled
        || boot_config.stores.user.graph.enabled
        || boot_config.stores.global.graph.enabled;

    if !any_graph_enabled {
        on_event(InitEvent::skipped("Graph store (SurrealDB)"));
        return (None, None, None);
    }

    on_event(InitEvent::running("Graph store", "Opening consolidated SurrealDB"));
    let start = Instant::now();

    // Single consolidated path for all graph namespaces
    let surreal_path = sanitize_path(
        &data_dir.join("surreal").join("devpulse"),
        &boot_config.windows,
    );

    // Ensure parent directory exists
    if let Some(parent) = surreal_path.parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            tracing::error!(error = ?e, "Failed to create SurrealDB directory");
            on_event(InitEvent::error("Graph store", &format!("{e:#}")));
            return (None, None, None);
        }
    }

    // Open ONE SurrealKV instance — system namespace is the "boot" namespace
    let sys_cfg = &boot_config.stores.system.graph;
    let adapter = match open_with_retry(
        &surreal_path,
        &sys_cfg.namespace,
        &sys_cfg.database,
        SYSTEM_GRAPH_SCHEMA,
        boot_config.windows.file_lock_retry_delay_ms,
        on_event,
    ).await {
        Some(a) => a,
        None => return (None, None, None),
    };

    let adapter = Arc::new(adapter);

    // Initialize user namespace on the same instance
    let usr_cfg = &boot_config.stores.user.graph;
    if usr_cfg.enabled {
        if let Err(e) = adapter.init_namespace(
            &usr_cfg.namespace,
            &usr_cfg.database,
            USER_GRAPH_SCHEMA,
        ).await {
            tracing::error!(error = ?e, "Failed to init user graph namespace");
            on_event(InitEvent::error("User graph namespace", &format!("{e:#}")));
        }
    }

    // Initialize global namespace on the same instance
    let glb_cfg = &boot_config.stores.global.graph;
    if glb_cfg.enabled {
        if let Err(e) = adapter.init_namespace(
            &glb_cfg.namespace,
            &glb_cfg.database,
            GLOBAL_GRAPH_SCHEMA,
        ).await {
            tracing::error!(error = ?e, "Failed to init global graph namespace");
            on_event(InitEvent::error("Global graph namespace", &format!("{e:#}")));
        }
    }

    tracing::info!(
        status = "ready",
        latency_ms = start.elapsed().as_millis() as u64,
        path = %surreal_path.display(),
        namespaces = "system, user, global",
        "Consolidated SurrealDB booted"
    );
    on_event(InitEvent::ok_with_latency("Graph store", start.elapsed()));

    // Start HTTP server on :8822
    on_event(InitEvent::running("SurrealDB HTTP", "Starting server on :8822"));
    match server::start(Arc::clone(&adapter), server::DEFAULT_PORT).await {
        Ok(()) => {
            tracing::info!(port = server::DEFAULT_PORT, "SurrealDB HTTP server ready");
            on_event(InitEvent::ok("SurrealDB HTTP", "Listening on :8822"));
        }
        Err(e) => {
            tracing::warn!(error = ?e, "SurrealDB HTTP server failed to start (non-fatal)");
            on_event(InitEvent::error("SurrealDB HTTP", &format!("{e:#}")));
        }
    }

    // Build scoped graph stores from the shared adapter
    let system_graph = if boot_config.stores.system.graph.enabled {
        Some(Arc::new(GraphStore::from_shared(Arc::clone(&adapter), "System graph")))
    } else {
        None
    };

    let user_graph = if boot_config.stores.user.graph.enabled {
        Some(Arc::new(GraphStore::from_shared(Arc::clone(&adapter), "User graph")))
    } else {
        None
    };

    let global_graph = if boot_config.stores.global.graph.enabled {
        Some(Arc::new(GraphStore::from_shared(adapter, "Global graph")))
    } else {
        None
    };

    (system_graph, user_graph, global_graph)
}

/// Open SurrealDB with one retry on failure.
///
/// First attempt: try to open. On failure: wait (file lock, antivirus may
/// release), then retry once. **NEVER deletes data.**
///
/// Returns `Some(adapter)` on success, `None` on failure (with error reported).
async fn open_with_retry(
    path: &std::path::Path,
    namespace: &str,
    database: &str,
    schema: &str,
    retry_delay_ms: u64,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
) -> Option<SurrealAdapter> {
    match SurrealAdapter::open_with_ns(path, namespace, database, schema).await {
        Ok(adapter) => return Some(adapter),
        Err(e) => {
            tracing::error!(error = ?e, "SurrealDB failed to open");
            tracing::info!("Retrying SurrealDB after delay (no data deletion)");
            tokio::time::sleep(std::time::Duration::from_millis(retry_delay_ms)).await;
        }
    }

    match SurrealAdapter::open_with_ns(path, namespace, database, schema).await {
        Ok(adapter) => Some(adapter),
        Err(retry_err) => {
            tracing::error!(
                error = ?retry_err,
                path = %path.display(),
                "SurrealDB failed on retry — graph stores unavailable"
            );
            on_event(InitEvent::error("Graph store", &format!("{retry_err:#}")));
            None
        }
    }
}
