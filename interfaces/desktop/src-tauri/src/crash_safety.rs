//! Pre-logger crash safety net.
//!
//! Production builds run with `windows_subsystem = "windows"` so there is
//! no attached terminal — anything printed to stderr by default vanishes
//! into the void. The `tracing` subscriber + structured panic hook in
//! [`crate::logging`] only come online once `data_dir` has been resolved
//! and `logging::init()` succeeds. Anything that fails before that point
//! — a panic in argv parsing, a DLL load failure on the very first
//! `LoadLibrary` call, a WebView2 init error in a worker thread —
//! historically left ZERO trace on disk: the window would briefly appear
//! and vanish with no log, no crash dump, and no Windows Event Viewer
//! entry (the OS doesn't fault-record a clean `process_exit(1)`).
//!
//! This module installs three lines of defense that fire in order:
//!
//! 1. [`install_early_panic_hook`] — registered as the FIRST call inside
//!    `main()`. Writes `<exe_dir>/early-crash-<ts>.json` synchronously
//!    when a panic fires before `logging::init()` has had a chance to
//!    install the richer hook. The exe-sibling location works because
//!    the user already knows where the exe lives (vs `data_dir`, which
//!    is resolved later and may not even be writable on a fresh launch).
//!
//! 2. [`redirect_stderr_to_file`] — Windows-only. Rebinds the OS-level
//!    `STD_ERROR_HANDLE` to `<data_dir>/logs/stderr-<ts>.log` so every
//!    subsequent `eprintln!`, default-panic-handler stderr printout,
//!    libc `abort()` message, or third-party crate that writes to fd 2
//!    lands in a captured file instead of evaporating. Called from
//!    `lib.rs::run` once `data_dir` resolves but BEFORE the tracing
//!    subscriber initializes — that way panic backtraces emitted by
//!    `RUST_BACKTRACE=1` reach disk too.
//!
//! 3. [`ProcessExitGuard`] — RAII drop guard. Appends
//!    `process_ended_at_utc: <ts>` to `<data_dir>/bootstrap.log` when
//!    the process exits cleanly. The presence of an end marker
//!    distinguishes "process exited normally" from "process killed
//!    abnormally" without us having to parse Windows Event Viewer. The
//!    absence of an end marker is the user-visible diagnostic for "the
//!    window vanished and we don't know why" — they look at
//!    bootstrap.log, see `process_started_at_utc` but no
//!    `process_ended_at_utc`, and know the next places to check are the
//!    stderr log + early-crash json.
//!
//! All three are best-effort: failures inside the safety net itself are
//! swallowed because the alternative (panicking inside a panic handler)
//! is strictly worse than losing one diagnostic write.

use std::path::{Path, PathBuf};
use std::sync::OnceLock;

/// Process-end marker guard. Drop writes `process_ended_at_utc` to the
/// bootstrap log so post-mortem can tell clean exit from abnormal death.
///
/// Construct once in `lib.rs::run` after `write_bootstrap_log` succeeds.
/// Forget about it — the guard lives until `run()` returns, at which
/// point its `Drop` impl runs.
pub struct ProcessExitGuard {
    bootstrap_log: PathBuf,
}

impl ProcessExitGuard {
    /// Arm the guard. The `bootstrap_log` path should match whatever
    /// [`crate::write_bootstrap_log`] wrote to so the end marker
    /// appends to the same file.
    pub fn arm(bootstrap_log: PathBuf) -> Self {
        Self { bootstrap_log }
    }
}

impl Drop for ProcessExitGuard {
    fn drop(&mut self) {
        let timestamp = chrono::Utc::now().to_rfc3339();
        let marker =
            format!("---\nprocess_ended_at_utc: {timestamp}\nexit_kind: normal_drop_guard\n");
        let mut existing = std::fs::read_to_string(&self.bootstrap_log).unwrap_or_default();
        existing.push_str(&marker);
        let _ = std::fs::write(&self.bootstrap_log, existing);
    }
}

/// Holds the file the early panic hook should write into. The hook
/// itself is a `'static` closure so it can't capture a non-`'static`
/// path — we stash it here at install time.
static EARLY_CRASH_DIR: OnceLock<PathBuf> = OnceLock::new();

/// Install a panic hook that catches panics fired before
/// [`crate::logging::init`] gets a chance to register its richer hook.
///
/// Writes a crash JSON next to the exe (best location we have before
/// `data_dir` resolves). The path is `<exe_dir>/early-crash-<ts>.json`.
/// Falls back to the system temp directory if `current_exe()` fails.
///
/// Call this as the FIRST line of `main()` — even before argv parsing.
/// The richer hook in [`crate::logging::init`] replaces this one with
/// `std::panic::set_hook` once `data_dir` is known; any panic before
/// that replacement lands here.
pub fn install_early_panic_hook() {
    let target_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(Path::to_path_buf))
        .unwrap_or_else(std::env::temp_dir);
    let _ = EARLY_CRASH_DIR.set(target_dir);

    let prev = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        write_early_crash_json(info);
        prev(info);
    }));
}

fn write_early_crash_json(info: &std::panic::PanicHookInfo<'_>) {
    let Some(dir) = EARLY_CRASH_DIR.get() else {
        return;
    };

    let timestamp_raw = chrono::Utc::now();
    let ts_file = timestamp_raw.format("%Y-%m-%d-%H%M%S%.3f").to_string();
    let ts_iso = timestamp_raw.to_rfc3339();

    let location = info.location().map_or_else(
        || "<unknown>".to_string(),
        |l| format!("{}:{}:{}", l.file(), l.line(), l.column()),
    );

    let payload = info.payload();
    let message = if let Some(s) = payload.downcast_ref::<&str>() {
        (*s).to_string()
    } else if let Some(s) = payload.downcast_ref::<String>() {
        s.clone()
    } else {
        "<non-string panic payload>".to_string()
    };

    let thread = std::thread::current()
        .name()
        .unwrap_or("<unnamed>")
        .to_string();

    let backtrace = std::backtrace::Backtrace::force_capture().to_string();

    let crash_path = dir.join(format!("early-crash-{ts_file}.json"));
    let crash_json = serde_json::json!({
        "timestamp": ts_iso,
        "hook": "early_panic_hook (pre-logger)",
        "location": location,
        "thread": thread,
        "message": message,
        "backtrace": backtrace,
    });
    let serialized =
        serde_json::to_string_pretty(&crash_json).unwrap_or_else(|_| crash_json.to_string());
    let _ = std::fs::write(&crash_path, serialized);
}

/// Rebind the OS-level standard-error handle to a file under
/// `<data_dir>/logs/`. Captures every byte that goes to fd 2 from the
/// process from this point on — default panic-handler stderr printouts,
/// `RUST_BACKTRACE=1` backtraces from worker threads, `libc::abort()`,
/// any crate that writes to `std::io::stderr()` directly. Anything that
/// went to stderr before this call is unaffected (already written to
/// the inherited handle).
///
/// Returns the path the file was opened at so the caller can advertise
/// it in `bootstrap.log` / the pointer file.
///
/// Best-effort: returns `Ok(None)` on every failure path rather than
/// panicking — the calling code's logging is not load-bearing on this
/// succeeding.
///
/// Workspace policy is `-D unsafe-code`. The minimum-scoped allow on
/// this function is the trade — Windows offers no safe-Rust path to
/// rebind `STD_ERROR_HANDLE`, and the alternative (pulling
/// `windows-sys` as a direct dep purely for two symbols) is strictly
/// worse than two explicit unsafe blocks documented in one place.
#[cfg(windows)]
#[allow(unsafe_code)]
pub fn redirect_stderr_to_file(logs_dir: &Path) -> std::io::Result<Option<PathBuf>> {
    use std::os::windows::io::IntoRawHandle;

    // Raw FFI to avoid pulling `windows-sys` as a direct dep; the
    // surface we need is a single function + a constant.
    #[link(name = "kernel32")]
    unsafe extern "system" {
        fn SetStdHandle(nStdHandle: u32, hHandle: *mut std::ffi::c_void) -> i32;
    }
    // STD_ERROR_HANDLE = (DWORD)-12 per <winbase.h>.
    const STD_ERROR_HANDLE: u32 = 0xFFFF_FFF4;

    std::fs::create_dir_all(logs_dir)?;
    let timestamp = chrono::Local::now().format("%Y-%m-%d-%H%M%S");
    let stderr_path = logs_dir.join(format!("stderr-{timestamp}.log"));

    let file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&stderr_path)?;
    let handle = file.into_raw_handle();

    // SAFETY: `handle` is a valid HANDLE owned by us (we just opened it
    // via `OpenOptions`). `SetStdHandle` adopts ownership for the
    // lifetime of the process; the file stays open until exit which is
    // exactly what we want — `eprintln!` should keep working as long as
    // anything in the binary cares to emit to stderr.
    let rc = unsafe { SetStdHandle(STD_ERROR_HANDLE, handle.cast()) };
    if rc == 0 {
        // SetStdHandle failed; we leaked the handle but that's a one-off
        // on a code path that should never fire. Surface via Err so the
        // caller knows the redirect didn't take.
        return Err(std::io::Error::last_os_error());
    }
    Ok(Some(stderr_path))
}

/// Non-Windows no-op. Production target is Windows; macOS + Linux land
/// later and will use `libc::dup2(fd, STDERR_FILENO)` instead.
#[cfg(not(windows))]
pub fn redirect_stderr_to_file(_logs_dir: &Path) -> std::io::Result<Option<PathBuf>> {
    Ok(None)
}
