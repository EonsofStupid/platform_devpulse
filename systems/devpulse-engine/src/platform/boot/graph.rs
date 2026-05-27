//! Graph store boot — open the embedded `SurrealKV` store and
//! initialize the three namespace scopes on one connection.
//!
//! No child process, no port allocator, no WS handshake. `DevPulse`
//! holds the `SurrealKV` file lock directly via [`SurrealService`].
//! The single `Surreal<Db>` connection backs system / user / global
//! namespace scopes; each query prefixes its own `USE NS .. DB ..;`
//! so isolation is at the query level, not session state.

use crate::platform::boot::log::BootLog;
use crate::platform::config::PlatformBootConfig;
use crate::platform::init::InitEvent;
use crate::platform::services::graph::{
    GraphService, GLOBAL_GRAPH_SCHEMA, SYSTEM_GRAPH_SCHEMA, USER_GRAPH_SCHEMA,
};
use crate::platform::services::surreal::SurrealService;
use devpulse_clyffy::cortex::persistence::SurrealAdapter;
use devpulse_clyffy::cortex::persistence::SurrealConfig;
use std::path::Path;
use std::sync::Arc;
use std::time::Instant;

/// Boot the embedded `SurrealKV` store and build three scoped graph services.
///
/// Returns `(store, system, user, global)`. Any element may be `None`:
/// - `store = None` → graph disabled in config OR store open failed.
/// - A `graph` = `None` → its namespace is disabled in config OR it
///   couldn't initialize (but the store itself is up).
///
/// Downstream validation in `boot::validate` decides whether `None`s are
/// tolerable based on per-namespace `critical` flags.
#[allow(clippy::too_many_lines, clippy::cast_possible_truncation)]
pub async fn boot_consolidated(
    data_dir: &Path,
    boot_config: &PlatformBootConfig,
    on_event: &(impl Fn(InitEvent) + Send + 'static),
    boot_log: &BootLog,
) -> (
    Option<Arc<SurrealService>>,
    Option<Arc<GraphService>>,
    Option<Arc<GraphService>>,
    Option<Arc<GraphService>>,
) {
    let any_graph_enabled = boot_config.services.system.graph.enabled
        || boot_config.services.user.graph.enabled
        || boot_config.services.global.graph.enabled;

    if !any_graph_enabled {
        on_event(InitEvent::skipped("Graph store"));
        boot_log.skip("Graph store", "all graph namespaces disabled");
        return (None, None, None, None);
    }

    let store_cfg = &boot_config.services.system.surreal;
    if !store_cfg.enabled {
        on_event(InitEvent::skipped("Graph store"));
        boot_log.skip("Graph store", "SurrealDB embedded store disabled");
        return (None, None, None, None);
    }

    // ── Stage A: open the embedded SurrealKV store ──────────────
    on_event(InitEvent::running(
        "SurrealKV embedded",
        "Opening on-disk store...",
    ));
    boot_log.running("SurrealKV embedded", "opening store...");
    let start = Instant::now();

    let data_path = data_dir.join("surreal").join("devpulse");
    let cfg = SurrealConfig {
        data_path: data_path.clone(),
    };

    let store = match SurrealService::boot(cfg).await {
        Ok(svc) => Arc::new(svc),
        Err(e) => {
            tracing::error!(error = ?e, "SurrealKV embedded store open failed");
            on_event(InitEvent::error("SurrealKV embedded", &format!("{e:#}")));
            boot_log.fail("SurrealKV embedded", &format!("open failed: {e:#}"));
            return (None, None, None, None);
        }
    };

    let store_latency = start.elapsed();
    on_event(InitEvent::ok_with_latency(
        "SurrealKV embedded",
        store_latency,
    ));
    boot_log.ok(
        "SurrealKV embedded",
        &format!(
            "open at {} ({}ms)",
            data_path.display(),
            store_latency.as_millis() as u64
        ),
    );

    // ── Stage B: clone the connection + initialize system namespace ─
    on_event(InitEvent::running("Graph store", "Initializing schemas"));
    boot_log.running("Graph store", "initializing schemas...");
    let connect_start = Instant::now();

    let sys_cfg = &boot_config.services.system.graph;
    let adapter = match SurrealAdapter::connect_with_ns(
        store.adapter(),
        &sys_cfg.namespace,
        &sys_cfg.database,
        SYSTEM_GRAPH_SCHEMA,
    )
    .await
    {
        Ok(a) => Arc::new(a),
        Err(e) => {
            tracing::error!(error = ?e, "SurrealKV adapter init failed");
            on_event(InitEvent::error("Graph store", &format!("{e:#}")));
            boot_log.fail("Graph store", &format!("schema init failed: {e:#}"));
            return (Some(store), None, None, None);
        }
    };

    // ── Stage C: User + global namespaces on the same connection ─
    let usr_cfg = &boot_config.services.user.graph;
    if usr_cfg.enabled {
        if let Err(e) = adapter
            .init_namespace(&usr_cfg.namespace, &usr_cfg.database, USER_GRAPH_SCHEMA)
            .await
        {
            tracing::error!(error = ?e, namespace = %usr_cfg.namespace, "Failed to init user graph namespace");
            on_event(InitEvent::error("User graph namespace", &format!("{e:#}")));
        }
    }

    let glb_cfg = &boot_config.services.global.graph;
    if glb_cfg.enabled {
        if let Err(e) = adapter
            .init_namespace(&glb_cfg.namespace, &glb_cfg.database, GLOBAL_GRAPH_SCHEMA)
            .await
        {
            tracing::error!(error = ?e, namespace = %glb_cfg.namespace, "Failed to init global graph namespace");
            on_event(InitEvent::error(
                "Global graph namespace",
                &format!("{e:#}"),
            ));
        }
    }

    tracing::info!(
        status = "ready",
        latency_us = connect_start.elapsed().as_micros() as u64,
        path = %data_path.display(),
        namespaces = "system, user, global",
        "Graph store connected (embedded SurrealKV)"
    );
    on_event(InitEvent::ok_with_latency(
        "Graph store",
        connect_start.elapsed(),
    ));
    boot_log.ok(
        "Graph store",
        &format!(
            "3 namespaces ready ({}ms)",
            connect_start.elapsed().as_millis() as u64
        ),
    );

    // ── Stage D: Build scoped GraphServices ──────────────────────
    let system_graph = if sys_cfg.enabled {
        Some(Arc::new(GraphService::from_shared(
            &adapter,
            &sys_cfg.namespace,
            &sys_cfg.database,
            "System graph",
        )))
    } else {
        None
    };

    let user_graph = if usr_cfg.enabled {
        Some(Arc::new(GraphService::from_shared(
            &adapter,
            &usr_cfg.namespace,
            &usr_cfg.database,
            "User graph",
        )))
    } else {
        None
    };

    let global_graph = if glb_cfg.enabled {
        Some(Arc::new(GraphService::from_shared(
            &adapter,
            &glb_cfg.namespace,
            &glb_cfg.database,
            "Global graph",
        )))
    } else {
        None
    };

    (Some(store), system_graph, user_graph, global_graph)
}
