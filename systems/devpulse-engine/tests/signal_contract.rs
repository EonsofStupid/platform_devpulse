//! Signal wire contract.
//!
//! Pins what the UI compiles against: the TypeScript shape of
//! `SignalVariant` and one JSON sample of every kind. A payload or tag change
//! fails here until the snapshot is reviewed (`cargo insta review`) — the
//! job `buf breaking` does for Protobuf contracts.
//!
#![allow(
    clippy::expect_used,
    reason = "test assertions — a failed expect is the test failure"
)]

use devpulse_engine::platform::containers::{Answers, ContainersState, Usage};
use devpulse_engine::platform::onboarding::{
    Detected, DetectedFolder, OnboardingState, OnboardingStatus, Requirement, Stage,
};
use devpulse_engine::platform::projects::{Project, ProjectsState};
use devpulse_engine::platform::providers::{
    AdapterKind, ConnectorReport, ProviderAction, ProviderActionRun, ProviderId, ProviderKind,
    ProviderReport, ProvidersReport, ProvidersState, SignedIn,
};
use devpulse_engine::platform::{HardwareMetrics, InitEvent};
use devpulse_engine::signals::{
    AnalyticsEventType, AnalyticsPayload, AnalyticsProperties, BootPhase, BootStatus, ChatPayload,
    ChatRole, ContextChunk, ContextPayload, Delivery, GovernanceEvent, GovernancePayload,
    InferencePayload, ModelsReadiness, SignalKind, SignalVariant, SystemPayload, SystemStatus,
};
use specta_typescript::{BigIntExportBehavior, Typescript};
use strum::IntoEnumIterator;

/// One representative payload per kind. Exhaustive on purpose: a new kind
/// does not compile here until it has a sample in the contract.
fn sample(kind: SignalKind) -> SignalVariant {
    match kind {
        SignalKind::Chat => SignalVariant::Chat(ChatPayload {
            content: "hello".into(),
            role: ChatRole::Assistant,
            model: Some("qwen3-30b-a3b".into()),
        }),
        SignalKind::Analytics => SignalVariant::Analytics(AnalyticsPayload {
            event_type: AnalyticsEventType::FeatureUsed,
            properties: AnalyticsProperties {
                target: Some("model-loader".into()),
                ..AnalyticsProperties::default()
            },
        }),
        SignalKind::Context => SignalVariant::Context(ContextPayload {
            chunks: vec![ContextChunk {
                content: "fn main() {}".into(),
                source: "src/main.rs".into(),
                score: 0.5,
            }],
            query: "entry point".into(),
        }),
        SignalKind::Inference => SignalVariant::Inference(InferencePayload {
            tokens_in: 12,
            tokens_out: 34,
            latency_ms: 56,
            model: "qwen3-30b-a3b".into(),
        }),
        SignalKind::System => SignalVariant::System(SystemPayload {
            status: SystemStatus::Ready,
            message: "Engine started".into(),
        }),
        SignalKind::Governance => SignalVariant::Governance(GovernancePayload {
            event: GovernanceEvent::ProviderSelected,
            lane: "chat".into(),
            provider: Some("local".into()),
            detail: "fastest ready endpoint".into(),
        }),
        SignalKind::Hardware => SignalVariant::Hardware(HardwareMetrics {
            cpu_name: "test cpu".into(),
            cpu_cores: 8,
            ..HardwareMetrics::default()
        }),
        SignalKind::Models => SignalVariant::Models(ModelsReadiness {
            ready: false,
            setup_complete: false,
            first_run: true,
            model_count: 3,
            slot_count: 16,
            assigned_count: 1,
        }),
        SignalKind::Boot => SignalVariant::Boot(BootStatus {
            phase: BootPhase::Initializing,
            error: None,
            steps: vec![InitEvent::running("System relational", "opening")],
        }),
        SignalKind::Onboarding => SignalVariant::Onboarding(OnboardingState {
            status: OnboardingStatus::Open,
            stage: Stage::You,
            stages: vec![Stage::Welcome, Stage::You],
            needs: vec![Requirement::Name],
            flow_problem: None,
            detected: Detected {
                done: true,
                git_name: Some("Ada Lovelace".into()),
                folders: vec![DetectedFolder {
                    path: "/home/ada/code".into(),
                    repo_count: 4,
                }],
            },
        }),
        SignalKind::Projects => SignalVariant::Projects(ProjectsState {
            projects: vec![Project {
                id: "6f1c2a4e-0b7d-4c1e-9a3f-2d5e8b7c1a90".into(),
                name: "analytical-engine".into(),
                root_path: "/home/ada/code/analytical-engine".into(),
                project_type: "personal".into(),
                slug: None,
                description: None,
                tool: None,
                tech_stack: None,
                active: true,
                created_at: 1_760_000_000,
                last_active_at: Some(1_760_000_100),
            }],
            active_id: Some("6f1c2a4e-0b7d-4c1e-9a3f-2d5e8b7c1a90".into()),
        }),
        SignalKind::Containers => SignalVariant::Containers(Box::new(ContainersState {
            checking: false,
            report: None,
            answers: Some(Answers {
                usage: Usage::Personal,
                needs_gpu: false,
                prefers_app: true,
            }),
            advice: None,
            running: None,
            last_run: None,
            problem: None,
        })),
        SignalKind::Providers => SignalVariant::Providers(Box::new(ProvidersState {
            checking: false,
            report: Some(ProvidersReport {
                providers: vec![ProviderReport {
                    id: ProviderId::Codex,
                    name: "Codex".into(),
                    kind: ProviderKind::SubscriptionAgent,
                    adapter: AdapterKind::AcpAgent,
                    docs: "https://github.com/openai/codex".into(),
                    note: None,
                    installed: true,
                    location: Some("/home/ada/.local/bin/codex".into()),
                    version: Some("0.163.0".into()),
                    latest: Some("0.163.0".into()),
                    update_available: false,
                    signed_in: SignedIn::Yes,
                    sign_in_command: Some("codex login".into()),
                    install_source: Some("npm @openai/codex".into()),
                    installed_by_devpulse: false,
                    actions: vec![
                        ProviderAction::SignIn,
                        ProviderAction::Update,
                        ProviderAction::Test,
                        ProviderAction::InstallConnector,
                    ],
                    connector: Some(ConnectorReport {
                        package: "@agentclientprotocol/codex-acp".into(),
                        installed: true,
                        version: Some("2.2.2".into()),
                    }),
                    problems: Vec::new(),
                }],
                catalog_problems: Vec::new(),
                checked_at: 1_760_000_000,
            }),
            running: None,
            last_action: Some(ProviderActionRun {
                provider_id: ProviderId::Codex,
                action: ProviderAction::Test,
                ok: true,
                guided: false,
                command: "codex-acp".into(),
                output: "Hello!".into(),
                agent: Some("Codex 2.2.2".into()),
                elapsed_ms: 3_200,
                finished_at: 1_760_000_100,
            }),
            problem: None,
        })),
        SignalKind::Resync => SignalVariant::Resync,
    }
}

#[test]
fn every_kind_has_a_spec_and_its_wire_tag_is_its_name() {
    for kind in SignalKind::iter() {
        let spec = kind.spec();
        assert!(spec.version >= 1, "{kind:?}: contract version starts at 1");
        if spec.delivery == Delivery::State {
            assert!(
                kind.reaches_ui(),
                "{kind:?}: state that never reaches the UI has no reader"
            );
        }

        let name: &'static str = kind.into();
        let wire = serde_json::to_value(sample(kind)).expect("sample serializes");
        assert_eq!(
            wire["type"], name,
            "{kind:?}: wire tag must equal the kind name"
        );
    }
}

#[test]
fn every_kind_round_trips_through_json() {
    for kind in SignalKind::iter() {
        let json = serde_json::to_string(&sample(kind)).expect("sample serializes");
        let back: SignalVariant = serde_json::from_str(&json).expect("sample deserializes");
        assert_eq!(SignalKind::from(&back), kind);
        assert_eq!(serde_json::to_string(&back).expect("re-serializes"), json);
    }
}

/// The same JSON with every object's keys in sorted order. Key order carries
/// no meaning on the wire, and `serde_json`'s own map order changes with its
/// `preserve_order` feature (which any crate in the workspace can switch on),
/// so the snapshot pins content, not order.
fn sorted(value: serde_json::Value) -> serde_json::Value {
    match value {
        serde_json::Value::Object(map) => {
            let mut entries: Vec<_> = map.into_iter().collect();
            entries.sort_by(|a, b| a.0.cmp(&b.0));
            serde_json::Value::Object(entries.into_iter().map(|(k, v)| (k, sorted(v))).collect())
        }
        serde_json::Value::Array(items) => {
            serde_json::Value::Array(items.into_iter().map(sorted).collect())
        }
        other => other,
    }
}

#[test]
fn wire_samples_are_stable() {
    let samples: Vec<_> = SignalKind::iter()
        .map(|kind| sorted(serde_json::to_value(sample(kind)).expect("sample serializes")))
        .collect();
    insta::assert_snapshot!(serde_json::to_string_pretty(&samples).expect("samples render"));
}

#[test]
fn typescript_shape_is_stable() {
    let ts = specta_typescript::export::<SignalVariant>(
        &Typescript::default().bigint(BigIntExportBehavior::Number),
    )
    .expect("SignalVariant exports to TypeScript");
    insta::assert_snapshot!(ts);
}
