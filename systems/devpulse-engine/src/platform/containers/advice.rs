//! From what this machine has and your answers to one recommendation.
//!
//! The decision is explicit and shown: every reason, warning and blocker
//! names the fact or answer it rests on and the source behind it, and every
//! threshold comes from `config/containers/advice.toml`. Rules, in order:
//!
//! 1. An engine that already works is kept, never replaced.
//! 2. An engine that is installed but not running is kept and started.
//! 3. Otherwise your answers decide: Docker Desktop where its licence makes it
//!    free for you; Podman (free, Apache 2.0) where Docker Desktop would need
//!    a paid plan; the host decides what can run (Windows 10 and Intel Macs
//!    are not supported by Podman 6; Linux runs an engine natively).
//! 4. The host's blockers (virtualization off, WSL missing) come first, with
//!    the step that fixes them.

use std::collections::BTreeMap;
use std::path::Path;

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use specta::Type;

use super::detect::{ContainersReport, EngineReport, HostReport};

/// The bundled advice data.
const BUNDLED_ADVICE: &str = include_str!("../../../config/containers/advice.toml");

// ── Configuration ───────────────────────────────────────────────────────

/// Licence thresholds.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Licence {
    /// Docker Desktop is free for organizations with fewer employees…
    pub docker_desktop_free_employees_below: u32,
    /// …and less annual revenue (US dollars) than this.
    pub docker_desktop_free_revenue_usd_below: u64,
}

/// Host requirements.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Requirements {
    /// Docker Desktop's minimum RAM.
    pub docker_desktop_min_ram_mb: u64,
    /// Podman Desktop's minimum RAM for its machine.
    pub podman_desktop_min_ram_mb: u64,
    /// Docker Desktop's minimum WSL version.
    pub docker_desktop_min_wsl: String,
    /// The first Windows 11 build.
    pub windows_11_min_build: u32,
}

/// A product `DevPulse` can recommend.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize, Type)]
#[serde(deny_unknown_fields)]
pub struct Product {
    /// Stable id (`docker-desktop`, `podman`, `podman-desktop`).
    pub id: String,
    /// The engine it provides (`docker`, `podman`).
    pub engine: String,
    /// Display name.
    pub name: String,
    /// The source naming its licence.
    pub licence: String,
    /// `winget` package ids installed on Windows, in order.
    #[serde(default)]
    pub windows_winget: Vec<String>,
    /// `brew` argument sets run on macOS, in order.
    #[serde(default)]
    pub macos_brew: Vec<Vec<String>>,
    /// How to install it on Linux — shown, never run (it needs your password).
    pub linux_install: String,
    /// Engine arguments that start it, in order; empty when starting means
    /// creating or starting a Podman machine.
    #[serde(default)]
    pub start: Vec<Vec<String>>,
    /// The image the Test step runs.
    pub test_image: String,
}

/// A source shown with a reason.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize, Type)]
#[serde(deny_unknown_fields)]
pub struct Source {
    /// Its title.
    pub title: String,
    /// Where to read it.
    pub url: String,
}

/// Everything the advice uses.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AdviceConfig {
    /// Licence thresholds.
    pub licence: Licence,
    /// Host requirements.
    pub requirements: Requirements,
    /// Products, in preference order where nothing else decides.
    pub products: Vec<Product>,
    /// Sources by key.
    pub sources: BTreeMap<String, Source>,
}

impl AdviceConfig {
    /// Parse advice data; every product's licence must name a source, and
    /// the products every rule uses must exist.
    ///
    /// # Errors
    /// Returns an error if the TOML is invalid or refers to something missing.
    pub fn parse(text: &str) -> Result<Self> {
        let config: Self = toml::from_str(text).context("read the advice data")?;
        for product in &config.products {
            anyhow::ensure!(
                config.sources.contains_key(&product.licence),
                "product {:?} names licence source {:?}, which is not listed",
                product.id,
                product.licence
            );
        }
        for id in [DOCKER_DESKTOP, PODMAN, PODMAN_DESKTOP] {
            anyhow::ensure!(config.product(id).is_some(), "product {id:?} is missing");
        }
        Ok(config)
    }

    /// Your advice data if valid, else the bundled data with the reason.
    ///
    /// # Errors
    /// Only if the bundled data is broken, which its test rules out.
    pub fn load(data_dir: &Path) -> Result<(Self, Option<String>)> {
        let path = data_dir
            .join("config")
            .join("containers")
            .join("advice.toml");
        let problem = match std::fs::read_to_string(&path) {
            Ok(text) => match Self::parse(&text) {
                Ok(config) => return Ok((config, None)),
                Err(e) => Some(format!("{} was not used: {e:#}", path.display())),
            },
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
            Err(e) => Some(format!("{} could not be read: {e}", path.display())),
        };
        if let Some(reason) = &problem {
            tracing::warn!(target: "containers", %reason, "advice override rejected");
        }
        Ok((
            Self::parse(BUNDLED_ADVICE).context("bundled advice")?,
            problem,
        ))
    }

    /// A product by id.
    #[must_use]
    pub fn product(&self, id: &str) -> Option<&Product> {
        self.products.iter().find(|p| p.id == id)
    }

    fn source(&self, key: &str) -> Option<Source> {
        self.sources.get(key).cloned()
    }
}

const DOCKER_DESKTOP: &str = "docker-desktop";
const PODMAN: &str = "podman";
const PODMAN_DESKTOP: &str = "podman-desktop";

// ── Your answers ────────────────────────────────────────────────────────

/// What the containers will be used for — the licence question.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum Usage {
    /// Your own projects.
    Personal,
    /// School or university.
    Education,
    /// A non-commercial open-source project.
    OpenSource,
    /// Work, at an organization below both licence thresholds.
    SmallBusiness,
    /// Work, at an organization at or above either threshold.
    LargeOrganization,
    /// Work for a government body.
    Government,
}

impl Usage {
    /// Docker Desktop is free for this use (Docker Subscription Service
    /// Agreement).
    #[must_use]
    pub const fn docker_desktop_free(self) -> bool {
        !matches!(self, Self::LargeOrganization | Self::Government)
    }
}

/// Your answers to the few questions the machine cannot answer.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Answers {
    /// The licence question.
    pub usage: Usage,
    /// Containers will use the GPU (AI or ML work).
    pub needs_gpu: bool,
    /// A desktop app to see and manage containers, rather than the command
    /// line alone.
    pub prefers_app: bool,
}

// ── The recommendation ──────────────────────────────────────────────────

/// What a reason, warning or blocker says (its text is in the copy catalog
/// under `containers.points.<code>`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum PointCode {
    /// An engine already works.
    KeepWorking,
    /// An engine is installed but not running.
    KeepInstalled,
    /// Docker Desktop is free for your use.
    LicenceFree,
    /// Docker Desktop needs a paid plan for your use.
    LicenceRequired,
    /// Podman is free and open source.
    FreeAndOpen,
    /// Podman installs for your user only, without administrator rights.
    NoAdminNeeded,
    /// VS Code Dev Containers use Docker without extra settings.
    DevContainersReady,
    /// VS Code Dev Containers use Podman after one setting.
    DevContainersSetting,
    /// Docker Desktop runs GPU containers on the WSL 2 backend.
    GpuDocker,
    /// Podman runs GPU containers through CDI, on WSL 2 only.
    GpuPodman,
    /// Linux runs an engine natively, without a VM.
    LinuxNative,
    /// Podman 6 does not support Windows 10.
    Windows10,
    /// Podman 6 does not support Intel Macs.
    IntelMac,
    /// Hardware virtualization is off in the firmware.
    VirtualizationOff,
    /// WSL is not installed.
    WslMissing,
    /// WSL is older than Docker Desktop needs.
    WslOld,
    /// Less RAM than the product asks for.
    RamLow,
}

/// One reason, warning or blocker, with what it rests on.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Point {
    /// What it says.
    pub code: PointCode,
    /// Values for the text's placeholders (`{name}`, `{version}`, …).
    pub values: BTreeMap<String, String>,
    /// Where it comes from.
    pub source: Option<Source>,
}

/// A setup step, run only when you click it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum StepKind {
    /// Install WSL (Windows; administrator, then a restart).
    InstallWsl,
    /// Update WSL (Windows).
    UpdateWsl,
    /// Install the product.
    Install,
    /// Start the engine (or create and start its machine).
    Start,
    /// Run a test container.
    Test,
}

/// One step of the recommendation.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Step {
    /// What it does.
    pub kind: StepKind,
    /// The product it acts on.
    pub product: String,
}

/// The recommendation.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Advice {
    /// The recommended product; `None` until your answers are needed and
    /// given.
    pub product: Option<Product>,
    /// The product's licence, shown with the install step.
    pub licence: Option<Source>,
    /// The engine already on this machine is kept.
    pub keep: bool,
    /// Your answers are needed before a product can be recommended.
    pub needs_answers: bool,
    /// Why this product.
    pub reasons: Vec<Point>,
    /// Worth knowing, not blocking.
    pub warnings: Vec<Point>,
    /// Must be fixed first.
    pub blockers: Vec<Point>,
    /// The steps, in order.
    pub steps: Vec<Step>,
    /// Why your advice data was not used, if it wasn't.
    pub data_problem: Option<String>,
}

fn point(code: PointCode, source: Option<Source>, values: &[(&str, &str)]) -> Point {
    Point {
        code,
        values: values
            .iter()
            .map(|(k, v)| ((*k).to_owned(), (*v).to_owned()))
            .collect(),
        source,
    }
}

/// Dotted versions compared number by number (`2.10.0` > `2.9.1`).
fn version_below(found: &str, wanted: &str) -> bool {
    let nums = |v: &str| -> Vec<u64> { v.split('.').map(|p| p.parse().unwrap_or(0)).collect() };
    let (found, wanted) = (nums(found), nums(wanted));
    for i in 0..found.len().max(wanted.len()) {
        let (f, w) = (
            found.get(i).copied().unwrap_or(0),
            wanted.get(i).copied().unwrap_or(0),
        );
        if f != w {
            return f < w;
        }
    }
    false
}

/// The product an engine already on this machine is.
fn product_of<'a>(
    engine: &EngineReport,
    host: &HostReport,
    config: &'a AdviceConfig,
) -> Option<&'a Product> {
    match engine.id.as_str() {
        // On Windows and macOS the Docker engine for Linux containers is
        // Docker Desktop (Docker's Windows binaries run Windows containers only).
        "docker" if host.os != "linux" => config.product(DOCKER_DESKTOP),
        "podman" => config.product(PODMAN),
        _ => None,
    }
}

/// Blockers and their steps that come from the host itself.
fn host_checks(
    host: &HostReport,
    config: &AdviceConfig,
    product: Option<&Product>,
    advice: &mut Advice,
) {
    if host.os != "windows" {
        return;
    }
    if let Some(v) = &host.virtualization {
        if v.firmware_enabled == Some(false) && v.hypervisor_present != Some(true) {
            advice.blockers.push(point(
                PointCode::VirtualizationOff,
                config.source("virtualization"),
                &[],
            ));
        }
    }
    let target = product.map_or(DOCKER_DESKTOP, |p| p.id.as_str()).to_owned();
    match &host.wsl {
        Some(wsl) if !wsl.installed => {
            advice.blockers.push(point(
                PointCode::WslMissing,
                config.source("wsl_install"),
                &[],
            ));
            advice.steps.push(Step {
                kind: StepKind::InstallWsl,
                product: target,
            });
        }
        Some(wsl) if target == DOCKER_DESKTOP => {
            let wanted = config.requirements.docker_desktop_min_wsl.as_str();
            if let Some(found) = wsl.version.as_deref().filter(|f| version_below(f, wanted)) {
                advice.warnings.push(point(
                    PointCode::WslOld,
                    config.source("docker_windows"),
                    &[("found", found), ("wanted", wanted)],
                ));
                advice.steps.push(Step {
                    kind: StepKind::UpdateWsl,
                    product: target,
                });
            }
        }
        _ => {}
    }
}

fn ram_check(host: &HostReport, product: &Product, config: &AdviceConfig, advice: &mut Advice) {
    let needed = match product.id.as_str() {
        DOCKER_DESKTOP => Some((
            config.requirements.docker_desktop_min_ram_mb,
            "docker_windows",
        )),
        PODMAN_DESKTOP => Some((
            config.requirements.podman_desktop_min_ram_mb,
            "podman_desktop",
        )),
        _ => None,
    };
    if let Some((needed, source)) = needed {
        if host.ram_total_mb < needed {
            let (have, want) = (
                (host.ram_total_mb / 1024).to_string(),
                (needed / 1024).to_string(),
            );
            advice.warnings.push(point(
                PointCode::RamLow,
                config.source(source),
                &[("have", &have), ("want", &want), ("name", &product.name)],
            ));
        }
    }
}

/// Decide.
#[must_use]
pub fn advise(
    report: &ContainersReport,
    answers: Option<&Answers>,
    config: &AdviceConfig,
) -> Advice {
    let host = &report.host;
    let mut advice = Advice {
        product: None,
        licence: None,
        keep: false,
        needs_answers: false,
        reasons: Vec::new(),
        warnings: Vec::new(),
        blockers: Vec::new(),
        steps: Vec::new(),
        data_problem: None,
    };

    // 1–2. An engine on this machine is kept.
    let existing = report
        .engines
        .iter()
        .find(|e| e.running)
        .or_else(|| report.engines.iter().find(|e| e.installed));
    if let Some(engine) = existing {
        let product = product_of(engine, host, config).cloned();
        advice.keep = true;
        let version = engine
            .engine_version
            .as_deref()
            .or(engine.client_version.as_deref())
            .unwrap_or("");
        if engine.running {
            advice.reasons.push(point(
                PointCode::KeepWorking,
                None,
                &[("name", &engine.name), ("version", version)],
            ));
        } else {
            let problem = engine.problem.as_deref().unwrap_or("");
            advice.reasons.push(point(
                PointCode::KeepInstalled,
                None,
                &[
                    ("name", &engine.name),
                    ("version", version),
                    ("problem", problem),
                ],
            ));
            host_checks(host, config, product.as_ref(), &mut advice);
        }
        if let (Some(p), Some(a)) = (&product, answers) {
            if p.id == DOCKER_DESKTOP && !a.usage.docker_desktop_free() {
                advice.warnings.push(licence_required(config));
            }
        }
        if let Some(p) = &product {
            if !engine.running {
                advice.steps.push(Step {
                    kind: StepKind::Start,
                    product: p.id.clone(),
                });
            }
            advice.steps.push(Step {
                kind: StepKind::Test,
                product: p.id.clone(),
            });
            advice.licence = config.source(&p.licence);
        }
        advice.product = product;
        return advice;
    }

    // 3. Nothing yet: the answers decide.
    let Some(answers) = answers else {
        advice.needs_answers = true;
        host_checks(host, config, None, &mut advice);
        return advice;
    };
    let product_id = choose(host, *answers, config, &mut advice);
    let Some(product) = config.product(product_id).cloned() else {
        return advice;
    };
    host_checks(host, config, Some(&product), &mut advice);
    ram_check(host, &product, config, &mut advice);
    // Install everywhere (on Linux the step shows your distribution's command
    // instead of running it); Start only where the engine runs in a VM or app.
    let mut kinds = vec![StepKind::Install];
    if host.os != "linux" {
        kinds.push(StepKind::Start);
    }
    kinds.push(StepKind::Test);
    for kind in kinds {
        advice.steps.push(Step {
            kind,
            product: product.id.clone(),
        });
    }
    advice.licence = config.source(&product.licence);
    advice.product = Some(product);
    advice
}

/// `10000000` → `10,000,000`.
fn group_digits(n: u64) -> String {
    let digits = n.to_string();
    let mut out = String::with_capacity(digits.len() + digits.len() / 3);
    for (i, c) in digits.chars().enumerate() {
        if i > 0 && (digits.len() - i).is_multiple_of(3) {
            out.push(',');
        }
        out.push(c);
    }
    out
}

fn licence_required(config: &AdviceConfig) -> Point {
    let employees = group_digits(u64::from(
        config.licence.docker_desktop_free_employees_below,
    ));
    let revenue = group_digits(config.licence.docker_desktop_free_revenue_usd_below);
    point(
        PointCode::LicenceRequired,
        config.source("docker_licence"),
        &[("employees", &employees), ("revenue", &revenue)],
    )
}

/// Pick a product id from the host and the answers, adding the reasons.
fn choose(
    host: &HostReport,
    answers: Answers,
    config: &AdviceConfig,
    advice: &mut Advice,
) -> &'static str {
    let podman = |advice: &mut Advice| {
        advice.reasons.push(point(
            PointCode::FreeAndOpen,
            config.source("podman_licence"),
            &[],
        ));
        if answers.prefers_app {
            PODMAN_DESKTOP
        } else {
            PODMAN
        }
    };
    let docker_free = answers.usage.docker_desktop_free();

    if host.os == "linux" {
        advice.reasons.push(point(
            PointCode::LinuxNative,
            config.source("podman_linux"),
            &[],
        ));
        return podman(advice);
    }
    // Podman 6 dropped Windows 10 and Intel Macs.
    let podman_unsupported = match host.os.as_str() {
        "windows" => host
            .os_build
            .is_some_and(|b| b < config.requirements.windows_11_min_build)
            .then_some(PointCode::Windows10),
        "macos" => (host.arch == "x86_64").then_some(PointCode::IntelMac),
        _ => None,
    };

    if !docker_free {
        advice.reasons.push(licence_required(config));
        if let Some(code) = podman_unsupported {
            advice
                .blockers
                .push(point(code, config.source("podman_6"), &[]));
        }
        let chosen = podman(advice);
        if answers.needs_gpu {
            advice.reasons.push(point(
                PointCode::GpuPodman,
                config.source("podman_gpu"),
                &[],
            ));
        }
        advice.reasons.push(point(
            PointCode::DevContainersSetting,
            config.source("dev_containers"),
            &[],
        ));
        return chosen;
    }

    advice.reasons.push(point(
        PointCode::LicenceFree,
        config.source("docker_desktop_free"),
        &[],
    ));
    let docker_desktop = |advice: &mut Advice| {
        advice.reasons.push(point(
            PointCode::DevContainersReady,
            config.source("dev_containers"),
            &[],
        ));
        DOCKER_DESKTOP
    };
    if answers.needs_gpu {
        advice.reasons.push(point(
            PointCode::GpuDocker,
            config.source("docker_gpu"),
            &[],
        ));
        return docker_desktop(advice);
    }
    if let Some(code) = podman_unsupported {
        advice
            .reasons
            .push(point(code, config.source("podman_6"), &[]));
        return docker_desktop(advice);
    }
    if !answers.prefers_app && host.os == "windows" {
        // Command line only: Podman installs per user, without admin rights,
        // and runs rootless by default.
        advice.reasons.retain(|p| p.code != PointCode::LicenceFree);
        advice.reasons.push(point(
            PointCode::NoAdminNeeded,
            config.source("podman_windows"),
            &[],
        ));
        let chosen = podman(advice);
        advice.reasons.push(point(
            PointCode::DevContainersSetting,
            config.source("dev_containers"),
            &[],
        ));
        return chosen;
    }
    docker_desktop(advice)
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use crate::platform::containers::detect::{VirtualizationReport, WslReport};

    fn config() -> AdviceConfig {
        AdviceConfig::parse(BUNDLED_ADVICE).expect("bundled advice")
    }

    fn engine(id: &str, installed: bool, running: bool) -> EngineReport {
        EngineReport {
            id: id.into(),
            name: if id == "docker" {
                "Docker".into()
            } else {
                "Podman".into()
            },
            installed,
            client_version: installed.then(|| "27.3.1".into()),
            engine_version: running.then(|| "27.3.1".into()),
            running,
            compose: None,
            machines: Vec::new(),
            problem: (installed && !running).then(|| "Cannot connect".into()),
        }
    }

    fn windows(build: u32) -> HostReport {
        HostReport {
            os: "windows".into(),
            arch: "x86_64".into(),
            os_version: Some("Windows".into()),
            os_build: Some(build),
            ram_total_mb: 32 * 1024,
            cpu_cores: 16,
            nvidia_gpus: Vec::new(),
            wsl: Some(WslReport {
                installed: true,
                version: Some("2.6.1.0".into()),
                distributions: 1,
                problem: None,
            }),
            virtualization: Some(VirtualizationReport {
                firmware_enabled: Some(true),
                hypervisor_present: Some(true),
            }),
        }
    }

    fn report(engines: Vec<EngineReport>, host: HostReport) -> ContainersReport {
        ContainersReport {
            engines,
            host,
            list_problem: None,
            checked_at: 0,
        }
    }

    fn answers(usage: Usage, needs_gpu: bool, prefers_app: bool) -> Answers {
        Answers {
            usage,
            needs_gpu,
            prefers_app,
        }
    }

    fn codes(points: &[Point]) -> Vec<PointCode> {
        points.iter().map(|p| p.code).collect()
    }

    fn kinds(advice: &Advice) -> Vec<StepKind> {
        advice.steps.iter().map(|s| s.kind).collect()
    }

    #[test]
    fn bundled_advice_is_valid_and_every_source_has_a_url() {
        let c = config();
        assert!(c.sources.values().all(|s| s.url.starts_with("https://")));
        assert_eq!(c.licence.docker_desktop_free_employees_below, 250);
    }

    #[test]
    fn a_working_engine_is_kept_and_only_tested() {
        let r = report(
            vec![engine("docker", true, true), engine("podman", false, false)],
            windows(26200),
        );
        let a = advise(&r, Some(&answers(Usage::Personal, false, true)), &config());
        assert!(a.keep);
        assert_eq!(a.product.as_ref().unwrap().id, "docker-desktop");
        assert_eq!(codes(&a.reasons), [PointCode::KeepWorking]);
        assert!(a.warnings.is_empty());
        assert_eq!(kinds(&a), [StepKind::Test]);
    }

    #[test]
    fn a_working_docker_desktop_at_a_large_organization_warns_about_the_licence() {
        let r = report(vec![engine("docker", true, true)], windows(26200));
        let a = advise(
            &r,
            Some(&answers(Usage::LargeOrganization, false, true)),
            &config(),
        );
        assert!(a.keep);
        assert_eq!(codes(&a.warnings), [PointCode::LicenceRequired]);
        assert!(a.warnings[0].source.is_some(), "the licence is cited");
    }

    #[test]
    fn an_installed_engine_that_is_not_running_is_started() {
        let r = report(vec![engine("podman", true, false)], windows(26200));
        let a = advise(&r, None, &config());
        assert!(a.keep && !a.needs_answers);
        assert_eq!(codes(&a.reasons), [PointCode::KeepInstalled]);
        assert_eq!(kinds(&a), [StepKind::Start, StepKind::Test]);
    }

    #[test]
    fn nothing_installed_needs_your_answers_first() {
        let r = report(vec![engine("docker", false, false)], windows(26200));
        let a = advise(&r, None, &config());
        assert!(a.needs_answers);
        assert!(a.product.is_none() && a.steps.is_empty());
    }

    #[test]
    fn personal_use_with_an_app_gets_docker_desktop() {
        let r = report(vec![], windows(26200));
        let a = advise(&r, Some(&answers(Usage::Personal, false, true)), &config());
        assert_eq!(a.product.as_ref().unwrap().id, "docker-desktop");
        assert_eq!(
            codes(&a.reasons),
            [PointCode::LicenceFree, PointCode::DevContainersReady]
        );
        assert_eq!(
            kinds(&a),
            [StepKind::Install, StepKind::Start, StepKind::Test]
        );
    }

    #[test]
    fn command_line_only_on_windows_11_gets_podman_without_admin() {
        let r = report(vec![], windows(26200));
        let a = advise(&r, Some(&answers(Usage::Personal, false, false)), &config());
        assert_eq!(a.product.as_ref().unwrap().id, "podman");
        assert!(codes(&a.reasons).contains(&PointCode::NoAdminNeeded));
    }

    #[test]
    fn a_large_organization_gets_podman_with_the_licence_reason() {
        let r = report(vec![], windows(26200));
        let a = advise(
            &r,
            Some(&answers(Usage::LargeOrganization, true, true)),
            &config(),
        );
        assert_eq!(a.product.as_ref().unwrap().id, "podman-desktop");
        let reasons = codes(&a.reasons);
        assert!(reasons.contains(&PointCode::LicenceRequired));
        assert!(reasons.contains(&PointCode::FreeAndOpen));
        assert!(reasons.contains(&PointCode::GpuPodman));
    }

    #[test]
    fn windows_10_at_a_large_organization_is_blocked_with_the_reason() {
        let r = report(vec![], windows(19045));
        let a = advise(
            &r,
            Some(&answers(Usage::Government, false, true)),
            &config(),
        );
        assert_eq!(codes(&a.blockers), [PointCode::Windows10]);
        let r = report(vec![], windows(19045));
        let personal = advise(&r, Some(&answers(Usage::Personal, false, false)), &config());
        assert_eq!(
            personal.product.as_ref().unwrap().id,
            "docker-desktop",
            "Windows 10 personal use: Docker Desktop still supports it"
        );
    }

    #[test]
    fn missing_wsl_and_virtualization_come_first() {
        let mut host = windows(26200);
        host.wsl = Some(WslReport {
            installed: false,
            version: None,
            distributions: 0,
            problem: Some("not installed".into()),
        });
        host.virtualization = Some(VirtualizationReport {
            firmware_enabled: Some(false),
            hypervisor_present: Some(false),
        });
        let a = advise(
            &report(vec![], host),
            Some(&answers(Usage::Personal, false, true)),
            &config(),
        );
        assert_eq!(
            codes(&a.blockers),
            [PointCode::VirtualizationOff, PointCode::WslMissing]
        );
        assert_eq!(
            kinds(&a)[0],
            StepKind::InstallWsl,
            "the fix comes before the install"
        );
    }

    #[test]
    fn old_wsl_and_low_ram_are_warned() {
        let mut host = windows(26200);
        host.ram_total_mb = 4 * 1024;
        if let Some(wsl) = host.wsl.as_mut() {
            wsl.version = Some("2.0.9".into());
        }
        let a = advise(
            &report(vec![], host),
            Some(&answers(Usage::Personal, false, true)),
            &config(),
        );
        let warnings = codes(&a.warnings);
        assert!(warnings.contains(&PointCode::WslOld));
        assert!(warnings.contains(&PointCode::RamLow));
        assert!(kinds(&a).contains(&StepKind::UpdateWsl));
    }

    #[test]
    fn linux_runs_podman_natively() {
        let mut host = windows(0);
        host.os = "linux".into();
        host.wsl = None;
        host.virtualization = None;
        let a = advise(
            &report(vec![], host),
            Some(&answers(Usage::Personal, false, false)),
            &config(),
        );
        assert_eq!(a.product.as_ref().unwrap().id, "podman");
        assert!(codes(&a.reasons).contains(&PointCode::LinuxNative));
        assert_eq!(
            kinds(&a),
            [StepKind::Install, StepKind::Test],
            "Linux: the distribution's package manager installs it; no VM to start"
        );
    }

    /// Every code the advice can produce has its text in the copy catalog, so
    /// no reason ever shows as a bare code.
    #[test]
    fn every_point_step_and_usage_has_its_text() {
        let copy = crate::platform::copy::bundled()
            .expect("copy")
            .onboarding
            .containers;
        let name = |v: serde_json::Value| v.as_str().map(str::to_owned).expect("a string tag");
        let points = [
            PointCode::KeepWorking,
            PointCode::KeepInstalled,
            PointCode::LicenceFree,
            PointCode::LicenceRequired,
            PointCode::FreeAndOpen,
            PointCode::NoAdminNeeded,
            PointCode::DevContainersReady,
            PointCode::DevContainersSetting,
            PointCode::GpuDocker,
            PointCode::GpuPodman,
            PointCode::LinuxNative,
            PointCode::Windows10,
            PointCode::IntelMac,
            PointCode::VirtualizationOff,
            PointCode::WslMissing,
            PointCode::WslOld,
            PointCode::RamLow,
        ];
        for code in points {
            let key = name(serde_json::to_value(code).unwrap());
            assert!(
                copy.points.contains_key(&key),
                "copy lacks containers.points.{key}"
            );
        }
        for kind in [
            StepKind::InstallWsl,
            StepKind::UpdateWsl,
            StepKind::Install,
            StepKind::Start,
            StepKind::Test,
        ] {
            let key = name(serde_json::to_value(kind).unwrap());
            assert!(
                copy.steps.contains_key(&key),
                "copy lacks containers.steps.{key}"
            );
        }
        for usage in [
            Usage::Personal,
            Usage::Education,
            Usage::OpenSource,
            Usage::SmallBusiness,
            Usage::LargeOrganization,
            Usage::Government,
        ] {
            let key = name(serde_json::to_value(usage).unwrap());
            assert!(
                copy.usage.contains_key(&key),
                "copy lacks containers.usage.{key}"
            );
        }
    }

    #[test]
    fn licence_numbers_read_like_numbers() {
        assert_eq!(group_digits(10_000_000), "10,000,000");
        assert_eq!(group_digits(250), "250");
        assert_eq!(group_digits(1_000), "1,000");
        let point = licence_required(&config());
        assert_eq!(
            point.values.get("revenue").map(String::as_str),
            Some("10,000,000")
        );
    }

    #[test]
    fn versions_compare_number_by_number() {
        assert!(version_below("2.0.9", "2.1.5"));
        assert!(!version_below("2.10.0", "2.9.1"));
        assert!(!version_below("2.1.5", "2.1.5"));
    }
}
