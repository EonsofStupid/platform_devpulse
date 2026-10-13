//! The first-run workflow: your intents in, the `Onboarding` state out.
//!
//! Every intent reads the stored progress, checks it is allowed (gates are
//! evaluated here, never in the UI), writes to Turso, then publishes the new
//! state. Intents are serialized so two clicks never interleave.

use std::path::Path;
use std::sync::Arc;

use anyhow::{bail, Result};
use devpulse_clyffy::cortex::persistence::TursoAdapter;
use tokio::sync::Mutex;

use super::flow::{Flow, LoadedFlow, Stage};
use super::state::{OnboardingState, OnboardingStatus, Requirement};
use super::store;
use crate::platform::profile;
use crate::signals::{Signal, SignalSource, SignalVariant};

/// The first-run workflow.
pub struct Onboarding {
    db: Arc<TursoAdapter>,
    flow: LoadedFlow,
    signals: crate::Engine,
    serial: Mutex<()>,
}

impl Onboarding {
    /// Load the flow and progress, and publish the current state.
    ///
    /// # Errors
    /// Returns an error if the bundled flow is broken or progress cannot be
    /// read.
    pub async fn start(
        db: Arc<TursoAdapter>,
        data_dir: &Path,
        signals: crate::Engine,
    ) -> Result<Self> {
        let onboarding = Self {
            db,
            flow: Flow::load(data_dir)?,
            signals,
            serial: Mutex::new(()),
        };
        let state = onboarding.publish().await?;
        tracing::info!(target: "onboarding", ?state, "first-run state published at boot");
        Ok(onboarding)
    }

    /// The current state, computed from Turso.
    ///
    /// # Errors
    /// Returns an error if progress or the profile cannot be read.
    pub async fn state(&self) -> Result<OnboardingState> {
        let progress = store::load(self.db.as_ref()).await?;
        let flow = &self.flow.flow;
        let stage = match progress.stage_id.as_deref().map(Stage::from_id) {
            Some(Ok(stage)) if flow.contains(stage) => stage,
            Some(Ok(stage)) => {
                tracing::warn!(target: "onboarding", stage = stage.id(), "stored stage is not in the flow; starting at the first stage");
                flow.first()
            }
            Some(Err(e)) => {
                tracing::warn!(target: "onboarding", error = %format!("{e:#}"), "stored stage unknown; starting at the first stage");
                flow.first()
            }
            None => flow.first(),
        };
        let status = if progress.complete {
            OnboardingStatus::Complete
        } else if progress.later_at.is_some() {
            OnboardingStatus::Later
        } else {
            OnboardingStatus::Open
        };
        Ok(OnboardingState {
            status,
            stage,
            stages: flow.stages().to_vec(),
            needs: self.needs(stage).await?,
            flow_problem: self.flow.override_error.clone(),
        })
    }

    /// What a stage still needs before you can continue.
    async fn needs(&self, stage: Stage) -> Result<Vec<Requirement>> {
        Ok(match stage {
            Stage::Welcome => Vec::new(),
            Stage::You => {
                let me = profile::ensure(self.db.as_ref()).await?;
                if me.display_name.is_some() {
                    Vec::new()
                } else {
                    vec![Requirement::Name]
                }
            }
        })
    }

    /// Re-read and publish the state (after anything that changes a gate,
    /// such as saving your name).
    ///
    /// # Errors
    /// Returns an error if the state cannot be computed.
    pub async fn publish(&self) -> Result<OnboardingState> {
        let state = self.state().await?;
        self.signals.emit(Signal::new(
            SignalSource::System,
            SignalVariant::Onboarding(state.clone()),
        ));
        Ok(state)
    }

    /// Continue to the next stage; after the last one, first run is finished.
    ///
    /// # Errors
    /// Returns an error if first run is not open, or the stage still needs
    /// something.
    pub async fn next(&self) -> Result<OnboardingState> {
        let _serial = self.serial.lock().await;
        let state = self.state().await?;
        if state.status != OnboardingStatus::Open {
            bail!("first run is not open");
        }
        if !state.needs.is_empty() {
            bail!("{} still needs {:?}", state.stage.id(), state.needs);
        }
        match self.flow.flow.next(state.stage) {
            Some(next) => store::set_stage(self.db.as_ref(), next).await?,
            None => store::set_complete(self.db.as_ref(), true).await?,
        }
        tracing::info!(target: "onboarding", from = state.stage.id(), "continue");
        self.publish().await
    }

    /// Go back one stage.
    ///
    /// # Errors
    /// Returns an error if first run is not open or this is the first stage.
    pub async fn back(&self) -> Result<OnboardingState> {
        let _serial = self.serial.lock().await;
        let state = self.state().await?;
        if state.status != OnboardingStatus::Open {
            bail!("first run is not open");
        }
        let Some(previous) = self.flow.flow.previous(state.stage) else {
            bail!("{} is the first stage", state.stage.id());
        };
        store::set_stage(self.db.as_ref(), previous).await?;
        self.publish().await
    }

    /// "Set up later": leave first run; it can be reopened at any time.
    ///
    /// # Errors
    /// Returns an error if progress cannot be written.
    pub async fn later(&self) -> Result<OnboardingState> {
        let _serial = self.serial.lock().await;
        store::set_later(self.db.as_ref(), true).await?;
        tracing::info!(target: "onboarding", "set up later");
        self.publish().await
    }

    /// Reopen first run where you left it.
    ///
    /// # Errors
    /// Returns an error if progress cannot be written.
    pub async fn reopen(&self) -> Result<OnboardingState> {
        let _serial = self.serial.lock().await;
        store::set_later(self.db.as_ref(), false).await?;
        store::set_complete(self.db.as_ref(), false).await?;
        tracing::info!(target: "onboarding", "reopened");
        self.publish().await
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use crate::platform::profile::tests::user_db;

    async fn workflow(tag: &str) -> (Onboarding, crate::Engine, std::path::PathBuf) {
        let (db, dir) = user_db(tag).await;
        let engine = crate::Engine::boot();
        let onboarding = Onboarding::start(Arc::new(db), &dir, engine.clone())
            .await
            .expect("start");
        (onboarding, engine, dir)
    }

    fn published(engine: &crate::Engine) -> OnboardingState {
        let latest = engine
            .state()
            .latest(crate::signals::SignalKind::Onboarding);
        match latest.as_ref().map(|s| s.payload.as_ref()) {
            Some(SignalVariant::Onboarding(state)) => state.clone(),
            other => panic!("no onboarding state published: {other:?}"),
        }
    }

    #[tokio::test]
    async fn walks_the_flow_with_the_name_gate() {
        let (ob, engine, dir) = workflow("walk").await;
        let s = published(&engine);
        assert_eq!(
            (s.status, s.stage),
            (OnboardingStatus::Open, Stage::Welcome)
        );
        assert!(ob.back().await.is_err(), "nothing before welcome");

        let s = ob.next().await.expect("welcome → you");
        assert_eq!(s.stage, Stage::You);
        assert_eq!(s.needs, [Requirement::Name]);
        assert!(ob.next().await.is_err(), "the name gate holds");

        profile::update_identity(ob.db.as_ref(), Some("Ada".into()), None)
            .await
            .expect("name");
        assert!(ob.publish().await.expect("publish").needs.is_empty());
        let s = ob.next().await.expect("finish");
        assert_eq!(s.status, OnboardingStatus::Complete);
        assert_eq!(published(&engine).status, OnboardingStatus::Complete);
        assert!(ob.next().await.is_err(), "finished");

        ob.db.close().await;
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn later_and_reopen_keep_the_stage() {
        let (ob, _engine, dir) = workflow("later").await;
        ob.next().await.expect("to you");
        let s = ob.later().await.expect("later");
        assert_eq!((s.status, s.stage), (OnboardingStatus::Later, Stage::You));
        assert!(ob.next().await.is_err(), "not open while later");
        let s = ob.reopen().await.expect("reopen");
        assert_eq!((s.status, s.stage), (OnboardingStatus::Open, Stage::You));
        let s = ob.back().await.expect("back");
        assert_eq!(s.stage, Stage::Welcome);

        ob.db.close().await;
        let _ = std::fs::remove_dir_all(dir);
    }
}
