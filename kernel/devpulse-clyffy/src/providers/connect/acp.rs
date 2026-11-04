//! One question to an agent over the Agent Client Protocol, with the
//! official SDK: start its program, initialize, open a session in a folder,
//! send the prompt, and collect the agent's text until the turn ends.
//!
//! `DevPulse` grants nothing during a question: any permission the agent
//! asks for (running a command, editing a file) is refused.

use std::path::{Path, PathBuf};

use agent_client_protocol::schema::ProtocolVersion;
use agent_client_protocol::v1::schema::{
    Implementation, InitializeRequest, PermissionOptionKind, RequestPermissionOutcome,
    RequestPermissionRequest, RequestPermissionResponse, SelectedPermissionOutcome,
};
use agent_client_protocol::v1::{ConnectionTo, SessionSetup};
use agent_client_protocol::{AcpAgent, AcpAgentConfig, Agent, Client, ErrorCode};
use anyhow::{Result, anyhow};

/// What the agent said.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AcpAnswer {
    /// Its text, as sent.
    pub text: String,
    /// The agent's own name and version, when it gave them.
    pub agent: Option<String>,
}

/// The refusal for a permission request: the agent's own "reject once"
/// option when it offers one, else the request is cancelled.
pub(crate) fn refuse(request: &RequestPermissionRequest) -> RequestPermissionResponse {
    let reject = request
        .options
        .iter()
        .find(|o| o.kind == PermissionOptionKind::RejectOnce)
        .or_else(|| {
            request
                .options
                .iter()
                .find(|o| o.kind == PermissionOptionKind::RejectAlways)
        });
    RequestPermissionResponse::new(match reject {
        Some(option) => RequestPermissionOutcome::Selected(SelectedPermissionOutcome::new(
            option.option_id.clone(),
        )),
        None => RequestPermissionOutcome::Cancelled,
    })
}

/// Ask `program args…` (with `env`) one question, in the folder `cwd`.
/// The caller bounds the time; dropping the future ends the agent.
///
/// # Errors
/// Returns the agent's or the protocol's own error; "sign in first" when the
/// agent says it needs a login.
pub async fn ask(
    program: &Path,
    args: &[String],
    env: &[(String, String)],
    cwd: &Path,
    prompt: &str,
) -> Result<AcpAnswer> {
    let agent = AcpAgent::new(
        AcpAgentConfig::new(program)
            .args(args.iter().cloned())
            .envs(env.iter().cloned()),
    );
    let cwd: PathBuf = cwd.to_path_buf();
    let prompt = prompt.to_owned();
    Client
        .v1()
        .on_receive_request(
            async move |request: RequestPermissionRequest, responder, _connection| {
                tracing::info!(target: "providers", "a permission the agent asked for was refused");
                responder.respond(refuse(&request))
            },
            agent_client_protocol::on_receive_request!(),
        )
        .connect_with(agent, async move |connection: ConnectionTo<Agent>| {
            let initialized = connection
                .send_request(
                    InitializeRequest::new(ProtocolVersion::V1)
                        .client_info(Implementation::new("DevPulse", env!("CARGO_PKG_VERSION"))),
                )
                .block_task()
                .await?;
            let text = connection
                .build_session(&cwd)
                .block_task()
                .run_until(async |SessionSetup { mut session, .. }| {
                    session.send_prompt(&prompt)?;
                    session.read_to_string().await
                })
                .await?;
            Ok(AcpAnswer {
                text,
                agent: initialized
                    .agent_info
                    .map(|info| format!("{} {}", info.title.unwrap_or(info.name), info.version)),
            })
        })
        .await
        .map_err(|e| {
            if e.code == ErrorCode::AUTH_REQUIRED {
                anyhow!("Sign in first — the agent says: {e}")
            } else {
                anyhow!("{e}")
            }
        })
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use agent_client_protocol::v1::schema::{
        PermissionOption, ToolCallUpdate, ToolCallUpdateFields,
    };

    use super::*;

    fn request(kinds: &[PermissionOptionKind]) -> RequestPermissionRequest {
        RequestPermissionRequest::new(
            "s1",
            ToolCallUpdate::new("t1", ToolCallUpdateFields::default()),
            kinds
                .iter()
                .enumerate()
                .map(|(i, kind)| {
                    PermissionOption::new(format!("o{i}"), format!("option {i}"), *kind)
                })
                .collect::<Vec<_>>(),
        )
    }

    fn selected(response: &RequestPermissionResponse) -> Option<String> {
        match &response.outcome {
            RequestPermissionOutcome::Selected(s) => Some(s.option_id.0.to_string()),
            _ => None,
        }
    }

    #[test]
    fn a_permission_request_is_refused_never_granted() {
        let once = refuse(&request(&[
            PermissionOptionKind::AllowOnce,
            PermissionOptionKind::RejectAlways,
            PermissionOptionKind::RejectOnce,
        ]));
        assert_eq!(selected(&once).as_deref(), Some("o2"));
        let always = refuse(&request(&[
            PermissionOptionKind::AllowAlways,
            PermissionOptionKind::RejectAlways,
        ]));
        assert_eq!(selected(&always).as_deref(), Some("o1"));
        let none = refuse(&request(&[PermissionOptionKind::AllowOnce]));
        assert!(matches!(none.outcome, RequestPermissionOutcome::Cancelled));
    }
}
