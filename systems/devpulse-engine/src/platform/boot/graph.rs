//! Consolidated `SurrealDB` boot — one engine, three namespaces.
//!
//! Opens ONE `SurrealKV` instance at `.userdata/surreal/devpulse` and
//! initializes system, user, and global namespaces. Then starts the
//! HTTP server on the configured port for external tool access.
//!
//! # Recovery Policy
//! Uses the standard retry utility with exponential backoff on file lock errors.
//! **NEVER delete data.** Transient failures must not destroy the knowledge graph.

use crate::platform::boot::retry;
use crate::platform::config::{PlatformBootConfig, sanitize_path};
use crate::platform::init::InitEvent;
use crate::platform::server;
use crate::platform::services::graph::{
    GraphService, GLOBAL_GRAPH_SCHEMA, SYSTEM_GRAPH_SCHEMA, USER_GRAPH_SCHEMA,
};
use devpulse_maestro::cortex::persistence::SurrealAdapter;
use std::path::Path;
use std::sync::Arc;
use std::time::Instant;

/// Boot a consolidated `SurrealDB` instance with all three namespace scopes.
///
/// Returns graph stores for (system, user, global). Any or all may be None
/// if the engine fails to open or namespaces fail to initialize.
#[allow(clippy::too_many_lines, clippy::cast_possible_truncation)]
pub async fn boot_consolidated(
    data_dir: &Path,
    boot_config: &PlatformBootConfig,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
) -> (
    Option<Arc<GraphService>>,
    Option<Arc<GraphService>>,
    Option<Arc<GraphService>>,
) {
    let any_graph_enabled = boot_config.services.system.graph.enabled
        || boot_config.services.user.graph.enabled
        || boot_config.services.global.graph.enabled;

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

    // Open ONE SurrealKV instance with retry — uses per-store config
    let sys_cfg = &boot_config.services.system.graph;
    let retry_cfg = sys_cfg.retry.to_retry_config();
    let ns = sys_cfg.namespace.clone();
    let db = sys_cfg.database.clone();

    let adapter = {
        let path = surreal_path.clone();
        let result = retry::retry_on_lock_async(&retry_cfg, "Graph store (SurrealDB)", || {
            let p = path.clone();
            let n = ns.clone();
            let d = db.clone();
            async move {
                SurrealAdapter::open_with_ns(&p, &n, &d, SYSTEM_GRAPH_SCHEMA).await
            }
        })
        .await;

        match result {
            Ok(a) => a,
            Err(e) => {
                tracing::error!(error = ?e, path = %surreal_path.display(), "SurrealDB boot failed after retries");
                on_event(InitEvent::error("Graph store", &format!("{e:#}")));
                return (None, None, None);
            }
        }
    };

    let adapter = Arc::new(adapter);

    // Initialize user namespace on the same instance
    let usr_cfg = &boot_config.services.user.graph;
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
    let glb_cfg = &boot_config.services.global.graph;
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
        latency_us = start.elapsed().as_micros() as u64,
        path = %surreal_path.display(),
        namespaces = "system, user, global",
        "Consolidated SurrealDB booted"
    );
    on_event(InitEvent::ok_with_latency("Graph store", start.elapsed()));

    // Start HTTP server on configured port
    let graph_api = &boot_config.services.network.graph_api;
    if graph_api.enabled {
        let api_port = graph_api.port;
        on_event(InitEvent::running("SurrealDB HTTP", &format!("Starting server on :{api_port}")));
        match server::start(Arc::clone(&adapter), api_port).await {
            Ok(actual_port) => {
                tracing::info!(configured_port = api_port, actual_port = actual_port, "SurrealDB HTTP server ready");
                on_event(InitEvent::ok("SurrealDB HTTP", &format!("Listening on :{actual_port}")));
            }
            Err(e) => {
                tracing::warn!(error = ?e, "SurrealDB HTTP server failed to start (non-fatal)");
                on_event(InitEvent::error("SurrealDB HTTP", &format!("{e:#}")));
            }
        }
    } else {
        on_event(InitEvent::skipped("SurrealDB HTTP"));
    }

    // Build scoped graph services from the shared adapter
    let system_graph = if boot_config.services.system.graph.enabled {
        Some(Arc::new(GraphService::from_shared(Arc::clone(&adapter), "System graph")))
    } else {
        None
    };

    let user_graph = if boot_config.services.user.graph.enabled {
        Some(Arc::new(GraphService::from_shared(Arc::clone(&adapter), "User graph")))
    } else {
        None
    };

    let global_graph = if boot_config.services.global.graph.enabled {
        Some(Arc::new(GraphService::from_shared(adapter, "Global graph")))
    } else {
        None
    };

    (system_graph, user_graph, global_graph)
}
