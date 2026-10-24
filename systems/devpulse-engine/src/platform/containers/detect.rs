//! What this machine has for running containers — asked, never assumed.
//!
//! Each engine in `config/containers/engines.toml` is asked for its versions
//! (the engine half answers only when the engine is running), its compose
//! support and, for Podman, its machines. The host facts that decide what can
//! run come from the tools that own them: memory and cores from the OS, an
//! NVIDIA GPU from its driver (`nvidia-smi`), and on Windows WSL (`wsl.exe`)
//! and virtualization (CIM, read through `PowerShell`).

use std::path::Path;
use std::time::Duration;

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use specta::Type;

use devpulse_process::{self as process, Answer, Ran};

/// The bundled engine list.
const BUNDLED_ENGINES: &str = include_str!("../../../config/containers/engines.toml");

/// How long one question to a tool may take. Engines that are starting, and
/// `PowerShell`'s first CIM query, can take several seconds.
const TOOL_TIMEOUT: Duration = Duration::from_secs(20);

// ── Configuration ───────────────────────────────────────────────────────

/// One engine `DevPulse` knows how to ask.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EngineSpec {
    /// Stable id (`docker`, `podman`).
    pub id: String,
    /// Display name.
    pub name: String,
    /// The program on `PATH`.
    pub program: String,
    /// Arguments that print client and engine versions as JSON.
    pub version: Vec<String>,
    /// Arguments that print the compose version.
    pub compose: Vec<String>,
    /// Arguments that list machines as JSON (engines that run in a VM).
    #[serde(default)]
    pub machines: Option<Vec<String>>,
    /// On Linux the engine has no daemon: a client that answers works.
    #[serde(default)]
    pub daemonless_on_linux: bool,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct EnginesFile {
    engines: Vec<EngineSpec>,
}

/// Parse an engine list.
///
/// # Errors
/// Returns an error if the TOML is invalid, the list is empty, or an id
/// repeats.
pub fn parse_engines(text: &str) -> Result<Vec<EngineSpec>> {
    let file: EnginesFile = toml::from_str(text).context("read the engine list")?;
    anyhow::ensure!(!file.engines.is_empty(), "the engine list is empty");
    for (i, engine) in file.engines.iter().enumerate() {
        anyhow::ensure!(
            !file.engines[..i].iter().any(|e| e.id == engine.id),
            "engine {:?} is listed twice",
            engine.id
        );
    }
    Ok(file.engines)
}

/// Your engine list if you have a valid one, else the bundled list, with the
/// reason yours was not used.
///
/// # Errors
/// Only if the bundled list is broken, which its test rules out.
pub fn load_engines(data_dir: &Path) -> Result<(Vec<EngineSpec>, Option<String>)> {
    let path = data_dir
        .join("config")
        .join("containers")
        .join("engines.toml");
    let problem = match std::fs::read_to_string(&path) {
        Ok(text) => match parse_engines(&text) {
            Ok(engines) => return Ok((engines, None)),
            Err(e) => Some(format!("{} was not used: {e:#}", path.display())),
        },
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
        Err(e) => Some(format!("{} could not be read: {e}", path.display())),
    };
    if let Some(reason) = &problem {
        tracing::warn!(target: "containers", %reason, "engine list override rejected");
    }
    Ok((
        parse_engines(BUNDLED_ENGINES).context("bundled engine list")?,
        problem,
    ))
}

// ── What is reported ────────────────────────────────────────────────────

/// One engine, as it answered.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct EngineReport {
    /// Engine id from the list.
    pub id: String,
    /// Display name.
    pub name: String,
    /// The program is on this machine.
    pub installed: bool,
    /// The client's version, when it answered.
    pub client_version: Option<String>,
    /// The engine's version — reported only by a running engine.
    pub engine_version: Option<String>,
    /// The engine answered (it is running and reachable).
    pub running: bool,
    /// Compose version, when compose is available.
    pub compose: Option<String>,
    /// Machines (engines that run in a VM); empty when not applicable.
    pub machines: Vec<MachineReport>,
    /// Why the engine is not reachable, in the tool's own words.
    pub problem: Option<String>,
}

/// One Podman machine.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MachineReport {
    /// Machine name.
    pub name: String,
    /// It is running.
    pub running: bool,
    /// It is the default machine.
    pub default: bool,
}

/// WSL on Windows.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct WslReport {
    /// `wsl --version` answered: the WSL package is installed.
    pub installed: bool,
    /// The WSL version it reported.
    pub version: Option<String>,
    /// Linux distributions registered.
    pub distributions: u32,
    /// Why WSL did not answer, in its own words.
    pub problem: Option<String>,
}

/// Hardware virtualization on Windows, as CIM reports it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct VirtualizationReport {
    /// The firmware has virtualization switched on (`None`: not reported —
    /// Windows hides it while a hypervisor already runs).
    pub firmware_enabled: Option<bool>,
    /// A hypervisor is already running (Hyper-V / WSL 2 are active).
    pub hypervisor_present: Option<bool>,
}

/// The facts about this machine that decide what can run.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct HostReport {
    /// `windows`, `macos` or `linux`.
    pub os: String,
    /// CPU architecture (`x86_64`, `aarch64`).
    pub arch: String,
    /// The OS's own long name and version.
    pub os_version: Option<String>,
    /// The OS build number (Windows: 19045 is Windows 10 22H2, 22000 and up
    /// is Windows 11), when the OS reports one.
    pub os_build: Option<u32>,
    /// Installed memory, in MiB.
    pub ram_total_mb: u64,
    /// Logical CPU cores.
    pub cpu_cores: u32,
    /// NVIDIA GPU names, as the driver reports them.
    pub nvidia_gpus: Vec<String>,
    /// WSL (Windows only).
    pub wsl: Option<WslReport>,
    /// Virtualization (Windows only).
    pub virtualization: Option<VirtualizationReport>,
}

/// Everything detection found.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ContainersReport {
    /// Each engine in the list.
    pub engines: Vec<EngineReport>,
    /// This machine.
    pub host: HostReport,
    /// Why your engine list was not used, if it wasn't.
    pub list_problem: Option<String>,
    /// Unix seconds when this was checked.
    pub checked_at: i64,
}

// ── Asking ──────────────────────────────────────────────────────────────

/// Ask every engine and the host, concurrently.
///
/// # Errors
/// Only if the bundled engine list is broken.
pub async fn detect(data_dir: &Path) -> Result<ContainersReport> {
    let (engines, list_problem) = load_engines(data_dir)?;
    let engine_reports = futures::future::join_all(engines.iter().map(ask_engine));
    let (engines, host) = tokio::join!(engine_reports, ask_host());
    Ok(ContainersReport {
        engines,
        host,
        list_problem,
        checked_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| i64::try_from(d.as_secs()).unwrap_or(i64::MAX)),
    })
}

async fn ask(program: &str, args: &[String], env: &[(&str, &str)]) -> Result<Ran> {
    let args: Vec<&str> = args.iter().map(String::as_str).collect();
    process::run(program, &args, env, TOOL_TIMEOUT).await
}

async fn ask_engine(spec: &EngineSpec) -> EngineReport {
    let mut report = EngineReport {
        id: spec.id.clone(),
        name: spec.name.clone(),
        installed: false,
        client_version: None,
        engine_version: None,
        running: false,
        compose: None,
        machines: Vec::new(),
        problem: None,
    };
    let answer = match ask(&spec.program, &spec.version, &[]).await {
        Ok(Ran::Missing) => return report,
        Ok(Ran::Answered(answer)) => answer,
        Err(e) => {
            report.installed = true;
            report.problem = Some(format!("{e:#}"));
            return report;
        }
    };
    report.installed = true;
    let versions = parse_versions(&answer.stdout);
    report.client_version = versions.client;
    report.engine_version = versions.engine;
    if report.engine_version.is_none()
        && answer.ok()
        && spec.daemonless_on_linux
        && std::env::consts::OS == "linux"
    {
        report.engine_version.clone_from(&report.client_version);
    }
    report.running = report.engine_version.is_some();
    if !report.running {
        report.problem = Some(answer.reason());
    }

    let (compose, machines) = tokio::join!(ask(&spec.program, &spec.compose, &[]), async {
        match &spec.machines {
            Some(args) => Some(ask(&spec.program, args, &[]).await),
            None => None,
        }
    });
    report.compose = match compose {
        Ok(Ran::Answered(a)) if a.ok() => parse_compose(&a.stdout),
        _ => None,
    };
    if let Some(Ok(Ran::Answered(a))) = machines {
        if a.ok() {
            report.machines = parse_machines(&a.stdout);
        }
    }
    report
}

/// Client and engine versions read from `version` JSON.
#[derive(Debug, Default, PartialEq, Eq)]
pub struct Versions {
    /// Client version.
    pub client: Option<String>,
    /// Engine (server) version.
    pub engine: Option<String>,
}

fn version_of(section: Option<&Value>) -> Option<String> {
    section
        .and_then(|s| s.get("Version"))
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|v| !v.is_empty())
        .map(str::to_owned)
}

/// Read `{"Client": {"Version": …}, "Server": {"Version": …}}` — the shape
/// both engines print. Text around the JSON (warnings) is ignored; a missing
/// or `null` section means that half did not answer.
#[must_use]
pub fn parse_versions(stdout: &str) -> Versions {
    let Some(json) = stdout
        .find('{')
        .and_then(|start| stdout.rfind('}').map(|end| &stdout[start..=end]))
    else {
        return Versions::default();
    };
    let Ok(value) = serde_json::from_str::<Value>(json) else {
        return Versions::default();
    };
    Versions {
        client: version_of(value.get("Client")),
        engine: version_of(value.get("Server")),
    }
}

/// The version number in a compose answer (`2.29.7`, `v2.29.7`, or a longer
/// sentence that contains it).
#[must_use]
pub fn parse_compose(stdout: &str) -> Option<String> {
    stdout
        .split(|c: char| c.is_whitespace() || c == ',')
        .map(|w| w.trim_start_matches('v'))
        .find(|w| looks_like_version(w))
        .map(str::to_owned)
}

fn looks_like_version(word: &str) -> bool {
    let mut parts = word.split('.');
    let numeric =
        |p: Option<&str>| p.is_some_and(|p| !p.is_empty() && p.chars().all(|c| c.is_ascii_digit()));
    numeric(parts.next()) && numeric(parts.next())
}

/// Read `podman machine list --format json`.
#[must_use]
pub fn parse_machines(stdout: &str) -> Vec<MachineReport> {
    let Ok(Value::Array(items)) = serde_json::from_str::<Value>(stdout.trim()) else {
        return Vec::new();
    };
    items
        .iter()
        .filter_map(|m| {
            Some(MachineReport {
                name: m.get("Name")?.as_str()?.to_owned(),
                running: m.get("Running").and_then(Value::as_bool).unwrap_or(false),
                default: m.get("Default").and_then(Value::as_bool).unwrap_or(false),
            })
        })
        .collect()
}

async fn ask_host() -> HostReport {
    let os = std::env::consts::OS.to_owned();
    let mut system = sysinfo::System::new();
    system.refresh_memory();
    let ram_total_mb = system.total_memory() / (1024 * 1024);
    let cpu_cores = std::thread::available_parallelism()
        .map_or(0, |n| u32::try_from(n.get()).unwrap_or(u32::MAX));

    let windows = os == "windows";
    let (nvidia_gpus, wsl, virtualization) = tokio::join!(
        ask_nvidia(),
        async {
            if windows {
                Some(ask_wsl().await)
            } else {
                None
            }
        },
        async {
            if windows {
                Some(ask_virtualization().await)
            } else {
                None
            }
        }
    );
    HostReport {
        os,
        arch: std::env::consts::ARCH.to_owned(),
        os_version: sysinfo::System::long_os_version(),
        // Windows' kernel version is its build number ("26200").
        os_build: sysinfo::System::kernel_version()
            .and_then(|v| v.split('.').next().and_then(|n| n.parse().ok())),
        ram_total_mb,
        cpu_cores,
        nvidia_gpus,
        wsl,
        virtualization,
    }
}

async fn ask_nvidia() -> Vec<String> {
    let args = ["--query-gpu=name", "--format=csv,noheader"].map(str::to_owned);
    match ask("nvidia-smi", &args, &[]).await {
        Ok(Ran::Answered(a)) if a.ok() => a
            .stdout
            .lines()
            .map(str::trim)
            .filter(|l| !l.is_empty())
            .map(str::to_owned)
            .collect(),
        _ => Vec::new(),
    }
}

/// `wsl.exe` prints UTF-16 unless `WSL_UTF8=1` is set.
const WSL_ENV: [(&str, &str); 1] = [("WSL_UTF8", "1")];

async fn ask_wsl() -> WslReport {
    let version = ask("wsl", &["--version".to_owned()], &WSL_ENV).await;
    let mut report = WslReport {
        installed: false,
        version: None,
        distributions: 0,
        problem: None,
    };
    match version {
        Ok(Ran::Missing) => {
            report.problem = Some("wsl.exe is not on this machine".to_owned());
            return report;
        }
        Ok(Ran::Answered(a)) if a.ok() => {
            report.installed = true;
            report.version = first_version(&a.stdout);
        }
        Ok(Ran::Answered(a)) => {
            report.problem = Some(a.reason());
            return report;
        }
        Err(e) => {
            report.problem = Some(format!("{e:#}"));
            return report;
        }
    }
    if let Ok(Ran::Answered(a)) = ask(
        "wsl",
        &["--list".to_owned(), "--quiet".to_owned()],
        &WSL_ENV,
    )
    .await
    {
        if a.ok() {
            report.distributions = count_lines(&a);
        }
    }
    report
}

/// The first dotted number in a localized answer (`WSL version: 2.3.24.0`).
fn first_version(text: &str) -> Option<String> {
    text.split(|c: char| !(c.is_ascii_digit() || c == '.'))
        .map(|w| w.trim_matches('.'))
        .find(|w| looks_like_version(w))
        .map(str::to_owned)
}

fn count_lines(answer: &Answer) -> u32 {
    u32::try_from(
        answer
            .stdout
            .lines()
            .map(|l| l.trim().trim_matches('\0'))
            .filter(|l| !l.is_empty())
            .count(),
    )
    .unwrap_or(u32::MAX)
}

/// One `PowerShell` call printing two lines: firmware virtualization (one
/// value per processor) and whether a hypervisor already runs.
const VIRTUALIZATION_QUERY: &str = "$p = Get-CimInstance Win32_Processor; \
     $c = Get-CimInstance Win32_ComputerSystem; \
     ($p | ForEach-Object { $_.VirtualizationFirmwareEnabled }) -join ','; \
     $c.HypervisorPresent";

async fn ask_virtualization() -> VirtualizationReport {
    let args = [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        VIRTUALIZATION_QUERY,
    ]
    .map(str::to_owned);
    match ask("powershell", &args, &[]).await {
        Ok(Ran::Answered(a)) if a.ok() => parse_virtualization(&a.stdout),
        _ => VirtualizationReport {
            firmware_enabled: None,
            hypervisor_present: None,
        },
    }
}

fn parse_bool(word: &str) -> Option<bool> {
    match word.trim().to_ascii_lowercase().as_str() {
        "true" => Some(true),
        "false" => Some(false),
        _ => None,
    }
}

/// Read the two lines of [`VIRTUALIZATION_QUERY`], by position (an empty
/// first line means the firmware value was not reported). Firmware counts as
/// enabled only when every processor says so.
#[must_use]
pub fn parse_virtualization(stdout: &str) -> VirtualizationReport {
    let mut lines = stdout.trim_start_matches('\u{feff}').lines().map(str::trim);
    let firmware = lines.next().filter(|l| !l.is_empty()).and_then(|line| {
        let values: Vec<Option<bool>> = line.split(',').map(parse_bool).collect();
        if values.iter().any(Option::is_none) {
            None
        } else {
            Some(values.iter().all(|v| *v == Some(true)))
        }
    });
    VirtualizationReport {
        firmware_enabled: firmware,
        hypervisor_present: lines.next().and_then(parse_bool),
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    #[test]
    fn bundled_engines_parse() {
        let engines = parse_engines(BUNDLED_ENGINES).expect("bundled");
        let ids: Vec<_> = engines.iter().map(|e| e.id.as_str()).collect();
        assert_eq!(ids, ["docker", "podman"]);
        assert!(engines[1].machines.is_some(), "podman lists machines");
        assert!(parse_engines("engines = []").is_err());
    }

    #[test]
    fn versions_read_both_halves_or_only_the_client() {
        let running =
            r#"{"Client":{"Version":"27.3.1","ApiVersion":"1.47"},"Server":{"Version":"27.3.1"}}"#;
        assert_eq!(
            parse_versions(running),
            Versions {
                client: Some("27.3.1".into()),
                engine: Some("27.3.1".into())
            }
        );
        let stopped = "WARNING: something\n{\"Client\":{\"Version\":\"5.2.3\"},\"Server\":null}\n";
        assert_eq!(
            parse_versions(stopped),
            Versions {
                client: Some("5.2.3".into()),
                engine: None
            }
        );
        assert_eq!(parse_versions("not json"), Versions::default());
    }

    #[test]
    fn compose_and_wsl_versions_are_found_in_any_wording() {
        assert_eq!(parse_compose("2.29.7\n").as_deref(), Some("2.29.7"));
        assert_eq!(parse_compose("v2.29.7").as_deref(), Some("2.29.7"));
        assert_eq!(
            parse_compose("docker-compose version 1.29.2, build 5becea4c").as_deref(),
            Some("1.29.2")
        );
        assert_eq!(parse_compose("no compose here"), None);
        assert_eq!(
            first_version("WSL-Version: 2.3.24.0\nKernelversion: 5.15.153.1-2").as_deref(),
            Some("2.3.24.0")
        );
    }

    #[test]
    fn machines_are_listed() {
        let json = r#"[{"Name":"podman-machine-default","Default":true,"Running":false},{"Name":"gpu","Default":false,"Running":true}]"#;
        let machines = parse_machines(json);
        assert_eq!(machines.len(), 2);
        assert!(machines[0].default && !machines[0].running);
        assert!(machines[1].running);
        assert!(parse_machines("").is_empty());
    }

    #[test]
    fn virtualization_needs_every_processor() {
        let on = parse_virtualization("True\r\nFalse\r\n");
        assert_eq!(on.firmware_enabled, Some(true));
        assert_eq!(on.hypervisor_present, Some(false));
        let mixed = parse_virtualization("True,False\nTrue\n");
        assert_eq!(mixed.firmware_enabled, Some(false));
        assert_eq!(mixed.hypervisor_present, Some(true));
        let hidden = parse_virtualization("\nTrue\n");
        assert_eq!(hidden.firmware_enabled, None, "not reported is not false");
    }

    #[tokio::test]
    async fn detection_reports_every_engine_and_the_host() {
        let dir = std::env::temp_dir().join("devpulse-containers-detect");
        let report = detect(&dir).await.expect("detect");
        assert_eq!(report.engines.len(), 2);
        assert!(report.host.ram_total_mb > 0);
        assert!(report.host.cpu_cores > 0);
        for engine in &report.engines {
            assert!(
                !engine.running || engine.engine_version.is_some(),
                "running means the engine answered: {engine:?}"
            );
        }
    }
}
