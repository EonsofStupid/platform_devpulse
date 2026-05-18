//! Launch the compiled portable .exe and live-tail every diagnostic
//! signal the binary writes — boot log, session JSONL, stderr capture,
//! crash dumps — through a single stdout stream so an operator never
//! has to dig through `%APPDATA%` to figure out what happened.
//!
//! # Why this exists
//!
//! Production `devpulse-desktop-app.exe` is `windows_subsystem = "windows"`:
//! the OS detaches stdout + stderr at process start, so `cargo run` or a
//! double-click leaves no terminal trace. The previous workflow asked
//! the operator to "open PowerShell, cd, pipe stderr, launch, watch."
//! That fails because (a) the detached stderr means the pipe captures
//! nothing, and (b) it puts the burden on the operator to know where
//! every diagnostic sink lives.
//!
//! This command bakes the right answer in:
//!
//! 1. Spawn the .exe as a child (selecting the portable build by
//!    default, falling back to `target/release/devpulse-desktop-app.exe`).
//! 2. Note `launched_at` so every "new since launch" probe is anchored.
//! 3. Open the boot log + bootstrap log + any early-crash files for
//!    tailing on background threads.
//! 4. Poll the logs dir every 250ms for newly-created
//!    `stderr-*.log` / `session-*.jsonl` / `crash-*.json` /
//!    `early-crash-*.json` files; once found, start tailing those too.
//! 5. Forward every captured line to stdout with a `[source]` prefix so
//!    the operator can see which sink each byte came from.
//! 6. Watch the child process. On exit, read `bootstrap.log` to see if
//!    the [`crate::crash_safety::ProcessExitGuard`] dropped its end
//!    marker (clean shutdown) or not (abnormal termination), and dump
//!    the last N stderr lines + any crash-json files as the verdict.
//!
//! Pair with the [`crate::commands::build_release::BuildRelease`]
//! command: build → launch, end-to-end visibility, zero PowerShell.

use crate::commands::Task;
use crate::workspace::Workspace;
use crate::xinfo;
use anyhow::{anyhow, Context, Result};
use std::collections::HashSet;
use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, SystemTime};

const APP_IDENTIFIER: &str = "com.devpulse.desktop";
const POLL_INTERVAL: Duration = Duration::from_millis(250);
/// How long to wait for the .exe to settle / for new logs to appear.
/// 12s covers the worst-observed cold boot (~11s) plus a 1s slack.
const READY_GRACE_SECS: u64 = 12;
/// Max lines to dump from stderr/session when the verdict is abnormal.
const TAIL_LINES_ON_ABNORMAL: usize = 80;

/// `cargo xtask launch [--release] [--watch <secs>]`.
pub struct Launch {
    /// Skip the portable folder probe and run the loose
    /// `target/release/devpulse-desktop-app.exe` directly.
    pub release: bool,
    /// How long to keep the launcher alive after the child exits, so
    /// any late-arriving log writes (telemetry flush, OTel shutdown)
    /// still reach stdout. Defaults to 2s.
    pub linger_secs: u64,
}

impl Task for Launch {
    fn name(&self) -> &'static str {
        "launch"
    }

    fn run(&self, ws: &Workspace) -> Result<()> {
        let exe = pick_exe(ws.root(), self.release)?;
        let data_dir = app_data_dir().ok_or_else(|| {
            anyhow!("could not resolve app data dir from env (APPDATA / HOME / XDG_DATA_HOME)")
        })?;
        let logs_dir = data_dir.join("logs");
        let bootstrap_log = data_dir.join("bootstrap.log");

        xinfo!("launching: {}", exe.display());
        xinfo!("data_dir:  {}", data_dir.display());
        xinfo!("logs_dir:  {}", logs_dir.display());
        xinfo!("───────── live diagnostic stream ─────────");

        // Anchor "new files since launch" probes BEFORE we spawn. Any
        // file with mtime >= launched_at was written by this run.
        let launched_at = SystemTime::now();

        let mut child = spawn_child(&exe)?;

        // Coordinated shutdown signal — flipped to true when the child
        // process exits, telling all tail threads to drain + bail.
        let stop = Arc::new(AtomicBool::new(false));

        // Tail the long-lived files immediately. boot.log + bootstrap.log
        // are always at known paths regardless of launch.
        let mut handles = vec![
            spawn_tail("boot", logs_dir.join("boot.log"), stop.clone()),
            spawn_tail("bootstrap", bootstrap_log.clone(), stop.clone()),
        ];

        // Watcher thread for new-since-launch files. Picks up
        // session-*.jsonl / stderr-*.log / crash-*.json / early-crash-*.json
        // the moment they appear and starts tailing each.
        let watcher_stop = stop.clone();
        let watcher_logs = logs_dir.clone();
        let watcher_exe_dir = exe.parent().map(Path::to_path_buf);
        let watcher = thread::spawn(move || {
            watch_new_logs(
                watcher_logs,
                watcher_exe_dir,
                launched_at,
                watcher_stop,
            );
        });

        // Wait for the child to exit. Streamed output is already
        // flowing through the tail threads.
        let exit_status = child
            .wait()
            .context("failed to wait on devpulse-desktop-app.exe")?;

        // Give late writes a chance to flush before we close the
        // streams. Telemetry guard drop, OTel exporter shutdown, etc.
        thread::sleep(Duration::from_secs(self.linger_secs.max(1)));

        // Signal every tail + the watcher to bail.
        stop.store(true, Ordering::SeqCst);
        for h in handles.drain(..) {
            let _ = h.join();
        }
        let _ = watcher.join();

        // Verdict — was the exit clean (end marker dropped) or abnormal?
        let verdict = read_exit_verdict(&bootstrap_log);
        println!("\n───────── verdict ─────────");
        println!(
            "child exit: {} (raw: {:?})",
            exit_status
                .code()
                .map(|c| format!("code {c}"))
                .unwrap_or_else(|| "signal".to_string()),
            exit_status,
        );
        match verdict {
            ExitVerdict::Clean { ended_at } => {
                println!("bootstrap.log: end marker present (process_ended_at_utc: {ended_at})");
                println!("→ clean shutdown via ProcessExitGuard drop");
            }
            ExitVerdict::Abnormal => {
                println!("bootstrap.log: NO end marker — abnormal termination");
                println!("→ check the dumps below for the cause");
                dump_abnormal_artifacts(&logs_dir, exe.parent(), launched_at);
            }
            ExitVerdict::Missing => {
                println!("bootstrap.log: missing entirely");
                println!("→ process never reached data-dir resolution; check early-crash next to exe");
                if let Some(exe_dir) = exe.parent() {
                    list_files_after(exe_dir, "early-crash-", launched_at, "[early-crash@exe]");
                }
            }
        }

        if exit_status.success() {
            Ok(())
        } else {
            Err(anyhow!("devpulse-desktop-app.exe exited non-zero"))
        }
    }
}

/// Choose which built .exe to launch. Prefers the packaged portable
/// folder (since that's what ships); falls back to the loose
/// `target/release/devpulse-desktop-app.exe` when only the build step
/// has run and `package-portable` hasn't.
fn pick_exe(root: &Path, force_release: bool) -> Result<PathBuf> {
    let loose = root
        .join("target")
        .join("release")
        .join("devpulse-desktop-app.exe");

    if force_release {
        if !loose.exists() {
            return Err(anyhow!(
                "--release requested but {} does not exist (run `cargo xtask build-release --portable-only` first)",
                loose.display()
            ));
        }
        return Ok(loose);
    }

    let portable_root = root.join("target").join("release").join("portable");
    if portable_root.is_dir() {
        // Pick the newest devpulse-desktop-v* folder.
        let mut versioned: Vec<_> = std::fs::read_dir(&portable_root)
            .ok()
            .into_iter()
            .flatten()
            .filter_map(|e| e.ok())
            .filter(|e| {
                e.file_name()
                    .to_string_lossy()
                    .starts_with("devpulse-desktop-v")
            })
            .collect();
        versioned.sort_by_key(|e| {
            e.metadata()
                .and_then(|m| m.modified())
                .unwrap_or(SystemTime::UNIX_EPOCH)
        });
        if let Some(latest) = versioned.last() {
            let candidate = latest.path().join("devpulse-desktop-app.exe");
            if candidate.exists() {
                return Ok(candidate);
            }
        }
    }

    if loose.exists() {
        return Ok(loose);
    }

    Err(anyhow!(
        "no built devpulse-desktop-app.exe found — run `cargo xtask build-release --portable-only` first"
    ))
}

/// Spawn the child .exe with stdio inherited so any pre-redirect stderr
/// (the few eprintln! calls in `lib.rs::run` before stderr is rebound)
/// reaches the launcher's terminal too. After the in-process
/// `redirect_stderr_to_file` takes effect, stderr flows into the file
/// the watcher will pick up automatically.
fn spawn_child(exe: &Path) -> Result<Child> {
    let exe_dir = exe.parent().ok_or_else(|| {
        anyhow!("exe has no parent directory: {}", exe.display())
    })?;
    Command::new(exe)
        .current_dir(exe_dir)
        .stdin(Stdio::null())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
        .with_context(|| format!("failed to spawn {}", exe.display()))
}

/// Tail a single file: print every newly-appended line with a
/// `[source]` prefix. Waits for the file to exist before opening
/// (boot.log and stderr-*.log are written by the child, not by us, so
/// we may race them). Exits when `stop` flips to true.
fn spawn_tail(source: &'static str, path: PathBuf, stop: Arc<AtomicBool>) -> thread::JoinHandle<()> {
    thread::spawn(move || {
        // Wait for file to appear (bounded — bail if the child exits
        // before the file ever exists).
        let deadline = std::time::Instant::now() + Duration::from_secs(READY_GRACE_SECS);
        while !path.exists() {
            if stop.load(Ordering::SeqCst) {
                return;
            }
            if std::time::Instant::now() > deadline {
                return;
            }
            thread::sleep(POLL_INTERVAL);
        }

        let Ok(file) = File::open(&path) else {
            return;
        };
        let mut reader = BufReader::new(file);
        // Start from beginning for boot.log (it's overwritten on each
        // boot so the whole file is fresh). For session-*.jsonl /
        // stderr-*.log the watcher hands us files that didn't exist
        // before launch, so beginning is also correct.
        let _ = reader.seek(SeekFrom::Start(0));

        let mut buf = String::new();
        loop {
            buf.clear();
            match reader.read_line(&mut buf) {
                Ok(0) => {
                    if stop.load(Ordering::SeqCst) {
                        break;
                    }
                    thread::sleep(POLL_INTERVAL);
                }
                Ok(_) => {
                    let line = buf.trim_end_matches('\n').trim_end_matches('\r');
                    if line.is_empty() {
                        continue;
                    }
                    println!("[{source}] {line}");
                }
                Err(_) => {
                    if stop.load(Ordering::SeqCst) {
                        break;
                    }
                    thread::sleep(POLL_INTERVAL);
                }
            }
        }
    })
}

/// Poll the logs dir for newly-created `stderr-*.log` /
/// `session-*.jsonl` / `crash-*.json` / `early-crash-*.json` files,
/// AND the exe dir for the early-panic fallback location. When a new
/// file appears, spawn a tail thread for it.
fn watch_new_logs(
    logs_dir: PathBuf,
    exe_dir: Option<PathBuf>,
    launched_at: SystemTime,
    stop: Arc<AtomicBool>,
) {
    let mut started: HashSet<PathBuf> = HashSet::new();
    let mut tail_handles: Vec<thread::JoinHandle<()>> = Vec::new();

    while !stop.load(Ordering::SeqCst) {
        scan_dir(&logs_dir, launched_at, &mut started, &mut tail_handles, &stop);
        if let Some(d) = exe_dir.as_deref() {
            scan_dir(d, launched_at, &mut started, &mut tail_handles, &stop);
        }
        thread::sleep(POLL_INTERVAL);
    }

    for h in tail_handles {
        let _ = h.join();
    }
}

fn scan_dir(
    dir: &Path,
    launched_at: SystemTime,
    started: &mut HashSet<PathBuf>,
    handles: &mut Vec<thread::JoinHandle<()>>,
    stop: &Arc<AtomicBool>,
) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if started.contains(&path) {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        let Some(source) = source_label(&name) else {
            continue;
        };
        let Ok(meta) = entry.metadata() else { continue };
        let Ok(modified) = meta.modified() else { continue };
        if modified < launched_at {
            continue;
        }
        started.insert(path.clone());
        handles.push(spawn_tail(source, path, stop.clone()));
    }
}

/// Map a filename to a stable `[source]` label for stdout prefix.
/// `None` means "not a file we tail."
fn source_label(name: &str) -> Option<&'static str> {
    if name.starts_with("session-") && name.ends_with(".jsonl") {
        return Some("session");
    }
    if name.starts_with("stderr-") && name.ends_with(".log") {
        return Some("stderr");
    }
    if name.starts_with("early-crash-") && name.ends_with(".json") {
        return Some("early-crash");
    }
    if name.starts_with("crash-") && name.ends_with(".json") {
        return Some("crash");
    }
    None
}

enum ExitVerdict {
    Clean { ended_at: String },
    Abnormal,
    Missing,
}

fn read_exit_verdict(bootstrap_log: &Path) -> ExitVerdict {
    let Ok(content) = std::fs::read_to_string(bootstrap_log) else {
        return ExitVerdict::Missing;
    };
    for line in content.lines() {
        if let Some(rest) = line.strip_prefix("process_ended_at_utc:") {
            return ExitVerdict::Clean {
                ended_at: rest.trim().to_string(),
            };
        }
    }
    ExitVerdict::Abnormal
}

/// On abnormal exit, dump the last N lines of stderr-*.log and the
/// full contents of any early-crash / crash JSON written during this
/// run. The watcher will have already streamed everything live, but
/// the verdict block at the bottom reprints them so the operator
/// sees the cause without scrolling.
fn dump_abnormal_artifacts(logs_dir: &Path, exe_dir: Option<&Path>, launched_at: SystemTime) {
    println!("\n--- stderr tail ({TAIL_LINES_ON_ABNORMAL} lines) ---");
    if let Some(path) = newest_with_prefix(logs_dir, "stderr-") {
        match std::fs::read_to_string(&path) {
            Ok(content) => {
                let lines: Vec<&str> = content.lines().collect();
                let start = lines.len().saturating_sub(TAIL_LINES_ON_ABNORMAL);
                for line in &lines[start..] {
                    println!("  {line}");
                }
                println!("  (source: {})", path.display());
            }
            Err(e) => println!("  <read failed: {e}>"),
        }
    } else {
        println!("  <no stderr-*.log written>");
    }

    println!("\n--- crash JSONs since launch ---");
    list_files_after(logs_dir, "crash-", launched_at, "[crash]");
    list_files_after(logs_dir, "early-crash-", launched_at, "[early-crash]");
    if let Some(d) = exe_dir {
        list_files_after(d, "early-crash-", launched_at, "[early-crash@exe]");
    }
}

fn newest_with_prefix(dir: &Path, prefix: &str) -> Option<PathBuf> {
    let entries = std::fs::read_dir(dir).ok()?;
    let mut best: Option<(SystemTime, PathBuf)> = None;
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if !name.starts_with(prefix) {
            continue;
        }
        let Ok(meta) = entry.metadata() else { continue };
        let Ok(modified) = meta.modified() else { continue };
        match &best {
            Some((m, _)) if *m >= modified => {}
            _ => best = Some((modified, entry.path())),
        }
    }
    best.map(|(_, p)| p)
}

fn list_files_after(dir: &Path, prefix: &str, launched_at: SystemTime, tag: &str) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        println!("  {tag} <dir unreadable: {}>", dir.display());
        return;
    };
    let mut any = false;
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if !name.starts_with(prefix) {
            continue;
        }
        let Ok(meta) = entry.metadata() else { continue };
        let Ok(modified) = meta.modified() else { continue };
        if modified < launched_at {
            continue;
        }
        any = true;
        let path = entry.path();
        println!("  {tag} {}", path.display());
        if let Ok(content) = std::fs::read_to_string(&path) {
            for line in content.lines() {
                println!("    {line}");
            }
        }
    }
    if !any {
        println!("  {tag} <none>");
    }
}

#[cfg(target_os = "windows")]
fn app_data_dir() -> Option<PathBuf> {
    let appdata = std::env::var_os("APPDATA")?;
    Some(PathBuf::from(appdata).join(APP_IDENTIFIER))
}

#[cfg(target_os = "macos")]
fn app_data_dir() -> Option<PathBuf> {
    let home = std::env::var_os("HOME")?;
    Some(
        PathBuf::from(home)
            .join("Library")
            .join("Application Support")
            .join(APP_IDENTIFIER),
    )
}

#[cfg(all(unix, not(target_os = "macos")))]
fn app_data_dir() -> Option<PathBuf> {
    if let Some(xdg) = std::env::var_os("XDG_DATA_HOME") {
        return Some(PathBuf::from(xdg).join(APP_IDENTIFIER));
    }
    let home = std::env::var_os("HOME")?;
    Some(
        PathBuf::from(home)
            .join(".local")
            .join("share")
            .join(APP_IDENTIFIER),
    )
}
