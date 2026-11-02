//! Stage 2 — "You": your name, email and projects folder.
//!
//! The form is a Rust type; its schema goes to the UI, which renders it
//! (plan 0001 A2). A submission is validated against that schema, then the
//! rules a schema cannot express are checked here (a name that is only
//! spaces, a folder that does not exist), then the profile row is written
//! and the first-run state republished (the name gate may now be met).

use std::collections::BTreeMap;
use std::path::Path;

use anyhow::Result;
use devpulse_clyffy::cortex::persistence::SqlAdapter;
use schemars::JsonSchema;
use serde::Deserialize;
use serde_json::json;

use super::detect::{self, GitLookup};
use super::workflow::Onboarding;
use crate::platform::forms::{
    self, ErrorCode, FieldError, FieldSuggestion, FieldSuggestionSource, FormOutcome, FormView,
};
use crate::platform::profile;

/// The "You" form.
#[derive(Debug, Clone, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct YouForm {
    /// Your name, shown across `DevPulse`.
    #[schemars(length(min = 1, max = 80))]
    pub display_name: String,
    /// Your email.
    #[schemars(email, length(max = 254))]
    pub email: Option<String>,
    /// The folder your projects live in.
    #[schemars(length(min = 1, max = 1024), extend("x-devpulse-input" = "folder"))]
    pub projects_root: Option<String>,
}

/// The fields, in the order they are shown.
pub const FIELDS: [&str; 3] = ["displayName", "email", "projectsRoot"];

/// The form: schema, your stored values, and what this machine suggests.
///
/// # Errors
/// Returns an error if the profile cannot be read or the schema built.
pub async fn view(db: &dyn SqlAdapter, data_dir: &Path) -> Result<FormView> {
    let me = profile::ensure(db).await?;
    let mut suggestions: BTreeMap<String, Vec<FieldSuggestion>> = BTreeMap::new();
    if let GitLookup::Found(git) = detect::git_identity().await {
        let from_git = |v: String| FieldSuggestion {
            value: v,
            source: FieldSuggestionSource::GitConfig,
            detail: None,
        };
        suggestions.insert(
            "displayName".into(),
            git.name.into_iter().map(from_git).collect(),
        );
        suggestions.insert(
            "email".into(),
            git.email.into_iter().map(from_git).collect(),
        );
    }
    let home = std::env::home_dir();
    let data_dir = data_dir.to_path_buf();
    let folders = devpulse_telemetry::spawn_blocking(move || {
        detect::repo_folders(&data_dir, home.as_deref())
    })
    .await??;
    suggestions.insert(
        "projectsRoot".into(),
        folders
            .into_iter()
            .map(|f| FieldSuggestion {
                value: f.path.display().to_string(),
                source: FieldSuggestionSource::Folder,
                detail: Some(f.repo_count.to_string()),
            })
            .collect(),
    );
    Ok(FormView {
        schema: forms::schema_of::<YouForm>()?,
        values: json!({
            "displayName": me.display_name,
            "email": me.email,
            "projectsRoot": me.projects_root,
        }),
        fields: FIELDS.iter().map(|f| (*f).to_owned()).collect(),
        suggestions,
    })
}

/// The rules the schema cannot express, read from the raw submission so
/// they are reported together with the schema's (every refused field at
/// once). A field the schema already refused is not reported twice.
fn check(payload: &serde_json::Value, refused: &[FieldError]) -> Vec<FieldError> {
    let already = |field: &str| refused.iter().any(|e| e.field == field);
    let text = |field: &str| {
        payload
            .get(field)
            .and_then(serde_json::Value::as_str)
            .map(str::trim)
    };
    let mut errors = Vec::new();
    if !already("displayName") && text("displayName").is_some_and(str::is_empty) {
        errors.push(FieldError::new("displayName", ErrorCode::Required));
    }
    if let Some(root) = text("projectsRoot").filter(|r| !r.is_empty() && !already("projectsRoot"))
        && !Path::new(root).is_dir()
    {
        errors.push(FieldError::new("projectsRoot", ErrorCode::NotAFolder));
    }
    errors
}

/// Validate and save the form, then republish the first-run state.
///
/// # Errors
/// Returns an error if the profile cannot be written; refused fields are
/// returned in the outcome, with nothing written.
pub async fn submit(
    db: &dyn SqlAdapter,
    onboarding: &Onboarding,
    payload: &serde_json::Value,
) -> Result<FormOutcome> {
    let (form, mut errors) = match forms::validate::<YouForm>(payload)? {
        Ok(form) => (Some(form), Vec::new()),
        Err(errors) => (None, errors),
    };
    let more = check(payload, &errors);
    errors.extend(more);
    let Some(form) = form.filter(|_| errors.is_empty()) else {
        return Ok(FormOutcome::refused(errors));
    };
    profile::update_identity(
        db,
        Some(form.display_name),
        Some(form.email.unwrap_or_default()),
    )
    .await?;
    if let Some(root) = form.projects_root {
        profile::set_projects_root(db, root.trim()).await?;
    }
    tracing::info!(target: "onboarding", "you: name, email and projects folder saved");
    onboarding.publish().await?;
    Ok(FormOutcome::saved())
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use std::sync::Arc;

    use super::*;
    use crate::platform::onboarding::{OnboardingStatus, Requirement, Stage};
    use crate::platform::profile::tests::user_db;

    #[tokio::test]
    async fn saves_valid_input_and_refuses_bad_input_per_field() {
        let (db, dir) = user_db("you").await;
        let db = Arc::new(db);
        let ob = Onboarding::start(Arc::clone(&db), &dir, crate::Engine::boot())
            .await
            .expect("start");
        ob.next().await.expect("to you");
        assert_eq!(ob.state().await.unwrap().needs, [Requirement::Name]);

        let view = view(db.as_ref(), &dir).await.expect("view");
        assert_eq!(
            view.schema["properties"]["projectsRoot"]["x-devpulse-input"],
            "folder"
        );
        assert_eq!(view.values["displayName"], serde_json::Value::Null);

        let refused = submit(
            db.as_ref(),
            &ob,
            &json!({ "displayName": "   ", "email": "not-an-email", "projectsRoot": dir.join("nope").display().to_string() }),
        )
        .await
        .expect("submit");
        assert!(!refused.saved);
        let codes: Vec<_> = refused
            .errors
            .iter()
            .map(|e| (e.field.as_str(), e.code))
            .collect();
        assert!(codes.contains(&("email", ErrorCode::Email)), "{codes:?}");
        assert!(
            codes.contains(&("displayName", ErrorCode::Required)),
            "every field at once: {codes:?}"
        );
        assert!(
            codes.contains(&("projectsRoot", ErrorCode::NotAFolder)),
            "{codes:?}"
        );
        assert!(
            profile::read(db.as_ref())
                .await
                .unwrap()
                .unwrap()
                .display_name
                .is_none(),
            "nothing written"
        );

        let blank = submit(
            db.as_ref(),
            &ob,
            &json!({ "displayName": "   ", "email": null, "projectsRoot": null }),
        )
        .await
        .unwrap();
        assert_eq!(
            blank.errors,
            [FieldError::new("displayName", ErrorCode::Required)]
        );

        let no_folder = submit(
            db.as_ref(),
            &ob,
            &json!({ "displayName": "Ada", "email": null, "projectsRoot": dir.join("nope").display().to_string() }),
        )
        .await
        .unwrap();
        assert_eq!(
            no_folder.errors,
            [FieldError::new("projectsRoot", ErrorCode::NotAFolder)]
        );

        let saved = submit(
            db.as_ref(),
            &ob,
            &json!({ "displayName": " Ada ", "email": "ada@example.com", "projectsRoot": dir.display().to_string() }),
        )
        .await
        .unwrap();
        assert!(saved.saved, "{:?}", saved.errors);
        let me = profile::read(db.as_ref()).await.unwrap().unwrap();
        assert_eq!(me.display_name.as_deref(), Some("Ada"));
        assert_eq!(me.email.as_deref(), Some("ada@example.com"));
        assert_eq!(
            me.projects_root.as_deref(),
            Some(dir.display().to_string().as_str())
        );

        let state = ob.state().await.unwrap();
        assert!(state.needs.is_empty(), "the name gate is met");
        assert_eq!(
            (state.status, state.stage),
            (OnboardingStatus::Open, Stage::You)
        );

        db.close().await;
        let _ = std::fs::remove_dir_all(dir);
    }
}
