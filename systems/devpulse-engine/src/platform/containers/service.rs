//! The containers service: what was found, your answers, the advice, the
//! step running — published as the `containers` state every window renders.

use std::path::PathBuf;
use std::sync::Arc;

use anyhow::{Context, Result, bail};
use devpulse_clyffy::cortex::persistence::{SqlAdapter, SqlValue, TursoAdapter};
use serde::{Deserialize, Serialize};
use specta::Type;
use tokio::sync::Mutex;

use super::actions::{StepRun, run_step};
use super::advice::{Advice, AdviceConfig, Answers, Step, advise};
use super::detect::{ContainersReport, detect, load_engines};
use crate::signals::{Signal, SignalSource, SignalVariant};

/// Your answers, in the user `kv_store`.
const KV_ANSWERS: &str = "containers_answers";

/// The `containers` state.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ContainersState {
    /// A check of this machine is running.
    pub checking: bool,
    /// What the last check found; `None` before the first check finishes.
    pub report: Option<ContainersReport>,
    /// Your answers, once given.
    pub answers: Option<Answers>,
    /// The recommendation for the report and your answers.
    pub advice: Option<Advice>,
    /// The step running now.
    pub running: Option<Step>,
    /// The last step that finished.
    pub last_run: Option<StepRun>,
    /// Why a check could not run, if it couldn't.
    pub problem: Option<String>,
}

/// Containers for your projects.
pub struct Containers {
    data_dir: PathBuf,
    db: Arc<TursoAdapter>,
    signals: crate::Engine,
    state: Mutex<ContainersState>,
    /// One step at a time; checks wait for a running step.
    serial: Mutex<()>,
}

impl Containers {
    /// Load your answers, publish the state, and start the first check in the
    /// background.
    ///
    /// # Errors
    /// Returns an error if your stored answers cannot be read.
    pub async fn start(
        db: Arc<TursoAdapter>,
        data_dir: PathBuf,
        signals: crate::Engine,
    ) -> Result<Arc<Self>> {
        let answers = load_answers(db.as_ref()).await?;
        let containers = Arc::new(Self {
            data_dir,
            db,
            signals,
            state: Mutex::new(ContainersState {
                checking: false,
                report: None,
                answers,
                advice: None,
                running: None,
                last_run: None,
                problem: None,
            }),
            serial: Mutex::new(()),
        });
        containers.publish().await;
        let me = Arc::clone(&containers);
        devpulse_telemetry::spawn(async move {
            if let Err(e) = me.check().await {
                tracing::warn!(target: "containers", error = %format!("{e:#}"), "first check failed");
            }
        });
        Ok(containers)
    }

    /// The current state.
    pub async fn state(&self) -> ContainersState {
        self.state.lock().await.clone()
    }

    /// A concise, credential-free host snapshot for an explicitly selected
    /// AI conversation. Missing observations stay missing; callers must not
    /// infer that a tool is installed or running.
    pub async fn host_context(&self) -> Option<String> {
        self.state().await.report.as_ref().map(format_host_context)
    }

    async fn publish(&self) -> ContainersState {
        let state = self.state().await;
        self.signals.emit(Signal::new(
            SignalSource::System,
            SignalVariant::Containers(Box::new(state.clone())),
        ));
        state
    }

    fn config(&self) -> Result<(AdviceConfig, Option<String>)> {
        AdviceConfig::load(&self.data_dir)
    }

    /// Look at this machine again and recompute the advice.
    ///
    /// # Errors
    /// Returns an error if the bundled engine list or advice data is broken.
    pub async fn check(&self) -> Result<ContainersState> {
        let _serial = self.serial.lock().await;
        self.check_locked().await
    }

    async fn check_locked(&self) -> Result<ContainersState> {
        self.state.lock().await.checking = true;
        self.publish().await;
        let outcome = async {
            let report = detect(&self.data_dir).await?;
            let (config, data_problem) = self.config()?;
            Ok::<_, anyhow::Error>((report, config, data_problem))
        }
        .await;
        {
            let mut state = self.state.lock().await;
            state.checking = false;
            match &outcome {
                Ok((report, config, data_problem)) => {
                    let mut advice = advise(report, state.answers.as_ref(), config);
                    advice.data_problem.clone_from(data_problem);
                    state.advice = Some(advice);
                    state.report = Some(report.clone());
                    state.problem = None;
                }
                Err(e) => state.problem = Some(format!("{e:#}")),
            }
        }
        let state = self.publish().await;
        outcome.map(|_| state)
    }

    /// Store your answers and recompute the advice.
    ///
    /// # Errors
    /// Returns an error if the answers cannot be stored.
    pub async fn answer(&self, answers: Answers) -> Result<ContainersState> {
        let _serial = self.serial.lock().await;
        let json = serde_json::to_string(&answers).context("encode your answers")?;
        self.db
            .execute(
                "INSERT INTO kv_store (key, value) VALUES (?, ?) \
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()",
                &[KV_ANSWERS.into(), json.as_str().into()],
            )
            .await
            .context("store your answers")?;
        let (config, data_problem) = self.config()?;
        {
            let mut state = self.state.lock().await;
            state.answers = Some(answers);
            if let Some(report) = state.report.clone() {
                let mut advice = advise(&report, Some(&answers), &config);
                advice.data_problem = data_problem;
                state.advice = Some(advice);
            }
        }
        tracing::info!(target: "containers", ?answers, "answers stored");
        Ok(self.publish().await)
    }

    /// Run one step of the current advice, then look at the machine again.
    ///
    /// # Errors
    /// Returns an error if the step is not part of the current advice, or the
    /// machine cannot be checked afterwards.
    pub async fn run(&self, step: Step) -> Result<ContainersState> {
        let _serial = self.serial.lock().await;
        let (report, listed) = {
            let state = self.state.lock().await;
            let listed = state
                .advice
                .as_ref()
                .is_some_and(|a| a.steps.contains(&step));
            (state.report.clone(), listed)
        };
        if !listed {
            bail!(
                "{:?} for {} is not a step of the current advice",
                step.kind,
                step.product
            );
        }
        let Some(report) = report else {
            bail!("the machine has not been checked yet");
        };
        let (config, _) = self.config()?;
        let (engines, _) = load_engines(&self.data_dir)?;

        self.state.lock().await.running = Some(step.clone());
        self.publish().await;
        tracing::info!(target: "containers", kind = ?step.kind, product = %step.product, "step started");
        let result = run_step(&step, &report, &config, &engines).await;
        tracing::info!(target: "containers", kind = ?step.kind, ok = result.ok, "step finished");
        {
            let mut state = self.state.lock().await;
            state.running = None;
            state.last_run = Some(result);
        }
        self.check_locked().await
    }
}

fn format_host_context(report: &ContainersReport) -> String {
    let engines = report
        .engines
        .iter()
        .map(|engine| {
            format!(
                "{}: installed={}, running={}, client_version={}, engine_version={}, compose={}",
                engine.name,
                engine.installed,
                engine.running,
                engine.client_version.as_deref().unwrap_or("unknown"),
                engine.engine_version.as_deref().unwrap_or("unknown"),
                engine.compose.as_deref().unwrap_or("unavailable")
            )
        })
        .collect::<Vec<_>>();
    let wsl = report.host.wsl.as_ref().map_or_else(
        || "not reported".to_owned(),
        |wsl| {
            format!(
                "installed={}, version={}, distributions={}",
                wsl.installed,
                wsl.version.as_deref().unwrap_or("unknown"),
                wsl.distributions
            )
        },
    );
    let virtualization = report.host.virtualization.map_or_else(
        || "not reported".to_owned(),
        |virtualization| {
            format!(
                "firmware_enabled={:?}, hypervisor_present={:?}",
                virtualization.firmware_enabled, virtualization.hypervisor_present
            )
        },
    );
    format!(
        "## DevPulse host observations (checked at {})\nOS: {} {} ({}); RAM: {} MiB; CPU cores: {}; NVIDIA GPUs: {}.\nWSL: {wsl}. Virtualization: {virtualization}.\nContainer engines: {}.\nThese are read-only observations, not permission to change the machine. Recheck before acting; installed does not mean running.",
        report.checked_at,
        report.host.os,
        report
            .host
            .os_version
            .as_deref()
            .unwrap_or("version unknown"),
        report.host.arch,
        report.host.ram_total_mb,
        report.host.cpu_cores,
        if report.host.nvidia_gpus.is_empty() {
            "none reported".to_owned()
        } else {
            report.host.nvidia_gpus.join(", ")
        },
        if engines.is_empty() {
            "none detected".to_owned()
        } else {
            engines.join("; ")
        }
    )
}

async fn load_answers(db: &dyn SqlAdapter) -> Result<Option<Answers>> {
    let rows = db
        .query(
            "SELECT value FROM kv_store WHERE key = ? LIMIT 1",
            &[KV_ANSWERS.into()],
        )
        .await
        .context("read your container answers")?;
    let Some(text) = rows
        .into_iter()
        .next()
        .and_then(|row| match row.into_iter().next() {
            Some(SqlValue::Text(s)) => Some(s),
            Some(SqlValue::Blob(b)) => Some(String::from_utf8_lossy(&b).into_owned()),
            _ => None,
        })
    else {
        return Ok(None);
    };
    match serde_json::from_str(&text) {
        Ok(answers) => Ok(Some(answers)),
        Err(e) => {
            // An older shape is asked again, not guessed.
            tracing::warn!(target: "containers", error = %e, "stored answers unreadable; asking again");
            Ok(None)
        }
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use crate::platform::containers::advice::{StepKind, Usage};
    use crate::platform::profile::tests::user_db;

    #[tokio::test]
    async fn answers_are_stored_and_a_step_outside_the_advice_is_refused() {
        let (db, dir) = user_db("containers").await;
        let db = Arc::new(db);
        let engine = crate::Engine::boot();
        let containers = Containers::start(Arc::clone(&db), dir.clone(), engine.clone())
            .await
            .expect("start");
        containers.check().await.expect("check");

        let answers = Answers {
            usage: Usage::Personal,
            needs_gpu: false,
            prefers_app: true,
        };
        let state = containers.answer(answers).await.expect("answer");
        assert_eq!(state.answers, Some(answers));
        assert!(state.advice.is_some());
        assert_eq!(
            load_answers(db.as_ref()).await.expect("load"),
            Some(answers)
        );

        let stranger = Step {
            kind: StepKind::Install,
            product: "not-a-product".into(),
        };
        assert!(
            containers.run(stranger).await.is_err(),
            "only steps of the advice run"
        );

        db.close().await;
        let _ = std::fs::remove_dir_all(dir);
    }
}
