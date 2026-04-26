//! Graph store boot — spawn the `SurrealDB` sidecar, connect the WS
//! client, and initialize the three namespace scopes on one connection.
//!
//! The embedded `SurrealKV` path retired. We now manage a real
//! `surreal start` child process (`RocksDB` backend) via
//! [`SurrealService`] and open a single WS client to it via
//! [`SurrealAdapter::connect_with_ns`]. All three namespace scopes
//! (system, user, global) live on that one connection.
//!
//! The HTTP `/sql` / `/health` / `/rpc` endpoints come from the real
//! sidecar — the hand-rolled axum facade (`platform/server.rs`) is
//! gone, so `.claude/hooks/*.js` talk directly to `SurrealDB`.

use crate::platform::boot::log::BootLog;
use crate::platform::config::PlatformBootConfig;
use crate::platform::init::InitEvent;
use crate::platform::services::graph::{
    GraphService, GLOBAL_GRAPH_SCHEMA, SYSTEM_GRAPH_SCHEMA, USER_GRAPH_SCHEMA,
};
use crate::platform::services::surreal::SurrealService;
use crate::platform::services::surreal_config;
use devpulse_clyffy::cortex::persistence::SurrealConfig;
use devpulse_clyffy::cortex::persistence::SurrealAdapter;
use std::path::Path;
use std::sync::Arc;
use std::time::Instant;

/// Boot the `SurrealDB` sidecar and build three scoped graph services.
///
/// Returns `(sidecar, system, user, global)`. Any element may be `None`:
/// - `sidecar = None` → graph disabled in config OR sidecar spawn failed.
/// - A `graph` = `None` → its namespace is disabled in config OR it couldn't
///   initialize (but the sidecar itself is up).
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

    let sidecar_cfg = &boot_config.services.system.surreal;
    if !sidecar_cfg.enabled {
        on_event(InitEvent::skipped("Graph store"));
        boot_log.skip("Graph store", "SurrealDB sidecar disabled");
        return (None, None, None, None);
    }

    // ── Stage A: Surreal child process (`surreal start`) ──────────
    on_event(InitEvent::running(
        "SurrealDB sidecar",
        "Spawning surreal start...",
    ));
    boot_log.running("SurrealDB sidecar", "starting process...");
    let start = Instant::now();

    let graph_api = &boot_config.services.network.graph_api;
    let data_path = data_dir.join("surreal").join("devpulse");

    // Overlay: platform.toml defaults + user/surreal.toml.
    // The user file persists devtool edits (port, binary, creds, etc.)
    // and is atomic-written, so load failures just fall back to defaults.
    let overlay = surreal_config::load(data_dir);
    let resolved = surreal_config::apply_overlay(
        graph_api.port,
        sidecar_cfg.resolved_binary(),
        &sidecar_cfg.root_user,
        &sidecar_cfg.root_password,
        &sidecar_cfg.log_level,
        sidecar_cfg.max_bumps,
        &overlay,
    );

    let cfg = SurrealConfig {
        host: graph_api.bind.clone(),
        port: resolved.port,
        max_bumps: resolved.max_bumps,
        binary_path: resolved.binary_path,
        data_path,
        root_user: resolved.root_user,
        root_password: resolved.root_password,
        log_level: resolved.log_level,
    };

    let sidecar = match SurrealService::boot(cfg).await {
        Ok(svc) => Arc::new(svc),
        Err(e) => {
            tracing::error!(error = ?e, "SurrealDB sidecar boot failed");
            on_event(InitEvent::error("SurrealDB sidecar", &format!("{e:#}")));
            boot_log.fail("SurrealDB sidecar", &format!("spawn failed: {e:#}"));
            return (None, None, None, None);
        }
    };

    let endpoint = sidecar.endpoint().clone();
    let bumps = endpoint.allocation.bumps;
    let sidecar_latency = start.elapsed();

    on_event(InitEvent::ok_with_latency("SurrealDB sidecar", sidecar_latency));
    boot_log.ok(
        "SurrealDB sidecar",
        &format!(
            "{} on {}:{}{} ({}ms)",
            if sidecar.adapter().is_managed() {
                "managed"
            } else {
                "attached"
            },
            endpoint.host,
            endpoint.allocation.actual,
            if bumps > 0 {
                format!(" (bumped +{bumps})")
            } else {
                String::new()
            },
            sidecar_latency.as_millis() as u64
        ),
    );

    // ── Stage B: WS client + system namespace ─────────────────────
    on_event(InitEvent::running("Graph store", "Connecting WS client"));
    boot_log.running("Graph store", "connecting WS client...");
    let connect_start = Instant::now();

    let sys_cfg = &boot_config.services.system.graph;
    let adapter = match SurrealAdapter::connect_with_ns(
        &endpoint,
        &sys_cfg.namespace,
        &sys_cfg.database,
        SYSTEM_GRAPH_SCHEMA,
    )
    .await
    {
        Ok(a) => Arc::new(a),
        Err(e) => {
            tracing::error!(error = ?e, "SurrealDB WS client connect failed");
            on_event(InitEvent::error("Graph store", &format!("{e:#}")));
            boot_log.fail("Graph store", &format!("WS connect failed: {e:#}"));
            return (Some(sidecar), None, None, None);
        }
    };

    // NS-scoped system user — preserves the pre-sidecar contract that
    // `.claude/hooks/*.js` use namespace-scoped creds to auth against
    // `/sql`. The sidecar's `SURREAL_USER` is the root login; this
    // creates a second, namespace-scoped principal.
    let sys_user_ddl = format!(
        "DEFINE USER IF NOT EXISTS {} ON NAMESPACE PASSWORD '{}' ROLES OWNER;",
        sys_cfg.system_user, sys_cfg.system_password,
    );
    if let Err(e) = adapter
        .execute_in_ns(&sys_cfg.namespace, &sys_cfg.database, &sys_user_ddl)
        .await
    {
        tracing::warn!(
            error = ?e,
            namespace = %sys_cfg.namespace,
            "Failed to create system user on system namespace (non-fatal)"
        );
    }

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
        let usr_user_ddl = format!(
            "DEFINE USER IF NOT EXISTS {} ON NAMESPACE PASSWORD '{}' ROLES OWNER;",
            usr_cfg.system_user, usr_cfg.system_password,
        );
        if let Err(e) = adapter
            .execute_in_ns(&usr_cfg.namespace, &usr_cfg.database, &usr_user_ddl)
            .await
        {
            tracing::warn!(
                error = ?e,
                namespace = %usr_cfg.namespace,
                "Failed to create system user on user namespace (non-fatal)"
            );
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
        let glb_user_ddl = format!(
            "DEFINE USER IF NOT EXISTS {} ON NAMESPACE PASSWORD '{}' ROLES OWNER;",
            glb_cfg.system_user, glb_cfg.system_password,
        );
        if let Err(e) = adapter
            .execute_in_ns(&glb_cfg.namespace, &glb_cfg.database, &glb_user_ddl)
            .await
        {
            tracing::warn!(
                error = ?e,
                namespace = %glb_cfg.namespace,
                "Failed to create system user on global namespace (non-fatal)"
            );
        }
    }

    tracing::info!(
        status = "ready",
        latency_us = connect_start.elapsed().as_micros() as u64,
        url = %endpoint.ws_url(),
        port_configured = endpoint.allocation.configured,
        port_actual = endpoint.allocation.actual,
        port_bumps = bumps,
        namespaces = "system, user, global",
        "Graph store connected"
    );
    on_event(InitEvent::ok_with_latency("Graph store", connect_start.elapsed()));
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

    (Some(sidecar), system_graph, user_graph, global_graph)
}
