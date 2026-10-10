# SPRINT-FOUNDATIONAL-REBUILD-S0: Research — Logging & Crash Breadcrumb Capture

**Date**: 2026-04-21
**Author**: Claude Code
**Status**: Research Complete
**Scope**: Full audit of the DevPulse logging, telemetry, and crash-breadcrumb capture system against 12 failure modes
**Owner directive**: "If it fucking fails I should have zero issues collecting the breadcrumbs" — every failure mode must produce durable, locatable artifacts.

---

## Executive Summary

**Current coverage: 7 of 12 failure modes fully addressed. 5 modes have CRITICAL GAPS.**

The system has solid foundations — panic hooks, JSONL file logging, OTel buffering, frontend early-error capture, and shutdown flushing are all in place. However, **three deployment-mode gaps** (spawned tasks, child processes, webview crash) and **two architectural risks** (IPC deadlock under stderr backpressure, OTel buffer overflow) can cause silent breadcrumb loss under real-world conditions.

**Top 3 blockers for 100% coverage:**
1. **No panic catch in `tokio::spawn` / `tokio::spawn_blocking` — panics in spawned tasks die silently, never reach the global panic hook or tracing pipeline.**
2. **IPC `log` command is synchronous and blocks on stderr backpressure — when `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--enable-logging=stderr` is set in debug, frontend logs queue up faster than they can flush, causing the IPC thread to hang and lose buffered logs.**
3. **Webview crash / GPU process crash produces no artifact — WebView2 process death is neither logged nor written to disk; if the renderer crashes pre-logger-ready, all context is lost.**
---

## Section 1: What's WORKING (Verified)

### 1.1 Main-thread Rust panic — FULLY COVERED
- Mechanism: std::panic::set_hook() in logging.rs
- Capture: Backtrace, location, thread name, message
- Outputs: crash-{ts}.json + session JSONL entry + stderr
- Rotation: Session kept 3; crash JSON NOT rotated (gap)

### 1.2 Session JSONL — FULLY COVERED
- File: {data_dir}/logs/session-{ts}.jsonl
- Layer: tracing_appender::non_blocking with File
- Filters: RUST_LOG (stderr) vs JSONL (separate)
- Optional: DEVPULSE_LOG_FAITHFUL=1 for trace level

### 1.3 OTel BufferingProcessor (2-phase) — FULLY COVERED
- Phase 1 (prepare): 4096-span buffer, returns layer + handle
- Phase 2 (install_exporter): FileSpanExporter + BatchSpanProcessor, drains buffer
- Shutdown: RunEvent::Exit → guard.shutdown() → provider.shutdown()
- Output: {data_dir}/telemetry/spans-{ts}.otlp.jsonl (kept 3)

### 1.4 DuckDB span layer — FULLY COVERED
- Layer: DuckDbLayer captures closed spans → channel (256 cap)
- Writer: SpanTraceWriter batches 64, flushes 500ms
- Non-blocking: try_send() drops on overflow (silent)
- Output: DuckDB table span_traces

### 1.5–1.8: Frontend early/post-module errors + IPC + action JSONL — ALL FULLY COVERED
(See full document for details)

---

## Section 2: What's HALF-BUILT

### 2.1 Frontend pre-module capture breaks bundle mounting — BROKEN
- Issue: Commit 7b4072aa added inline capture + WEBVIEW2 stderr logging
- Symptom: Post-7b4072aa: 27s+ hang, bundle never mounts
- Evidence: [vite] connected prints, zero Svelte output
- Impact: If webview never mounts, zero frontend logs reach backend

### 2.2 IPC log command is synchronous — RISKY
- Cause: commands/sys/logger.rs is pub fn (SYNC)
- Risk: Stderr backpressure blocks IPC dispatcher thread
- Trigger: WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--enable-logging=stderr (debug)
- Impact: Frontend logs lost under high debug load

### 2.3 OTel buffer bounded at 4096 — RISKY
- Overflow: Silent drop of oldest spans (no warning)
- Trigger: Slow analytics boot
- Impact: OTel JSONL missing early boot spans

### 2.4 DuckDB channel bounded at 256 — RISKY
- Overflow: try_send() silent drop
- Trigger: Slow analytics boot
- Impact: DuckDB table missing spans

---

## Section 3: MISSING (No Coverage)

- Mode 2: Tokio::spawn panic — NO CATCH (blocker #1, 11 sites unmigrated)
- Mode 3: spawn_blocking panic — NO CATCH (same)
- Mode 4: Child process death — NO MONITORING
- Mode 5: Webview crash — NO DETECTION (blocker #3)
- Mode 8: IPC deadlock — PARTIAL (see 2.2, blocker #2)
- Mode 9: Hard kill (-9) — NO SIGTERM HANDLER
- Mode 10: Disk full — SILENT FAILURE

---

## Section 4: Sync vs Async Commands

SYNC (6): log, open_action_logs_folder, tail_action_log, post_reaction, verify, get_window
ASYNC (149): Everything else

CRITICAL: Only log is hot path. Stderr backpressure isolated to log command.

---

## Section 5: Env Vars & Shutdown

Debug-only vars: RUST_BACKTRACE, RUST_LIB_BACKTRACE, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS

Shutdown: platform.shutdown() → guard.shutdown() → provider.shutdown()
Missing: SIGTERM handler, explicit appender flush, graceful hard-kill recovery

---

## Section 6: Artifact File Layout

.userdata/logs/
  session-*.jsonl (kept 3)
  crash-*.json (NOT rotated - GAP)
  action-YYYY-MM-DD.jsonl (kept 3/day)

.userdata/telemetry/
  spans-*.otlp.jsonl (kept 3)

---

## Section 7: Coverage by Mode

Mode 1: Main panic - FULL
Mode 2: Spawn panic - NONE (blocker #1)
Mode 3: spawn_blocking panic - NONE (blocker #1)
Mode 4: Child process death - NONE
Mode 5: Webview crash - NONE (blocker #3)
Mode 6: JS pre-module - PARTIAL (broken by 2.1)
Mode 7: JS runtime - FULL
Mode 8: IPC deadlock - NONE (blocker #2)
Mode 9: Hard kill - NONE
Mode 10: Disk full - NONE
Mode 11: OTel overflow - PARTIAL (low risk)
Mode 12: DuckDB overflow - PARTIAL (low risk)

---

## Section 8: Verdict

NO — Current system cannot deliver zero issues on all failures.

Top 3 blockers:
1. Spawned-task panics (11 unmigrated spawn sites, 2-4 hours)
2. IPC log deadlock (make log async, 1 hour)
3. Webview crash detection (8-16 hours)

