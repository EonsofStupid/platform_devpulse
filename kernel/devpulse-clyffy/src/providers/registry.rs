//! Static SSOT registry of every AI provider `DevPulse` knows about.
//!
//! Adding a provider:
//! 1. Add a variant to `ProviderId` and `Vendor` in `types.rs`.
//! 2. Append an `AiProvider` entry below.
//! 3. Verify capabilities + transports against the vendor's docs.
//! 4. Run `cargo check -p devpulse-engine`.
//!
//! Removing a provider is a breaking change — the wire identifier is in
//! user config files, telemetry, devtool URLs. Deprecate first.
//!
//! # Capability data accuracy
//! Capabilities reflect the published surface as of April 2026. They
//! describe what the *vendor* offers, not what `DevPulse` currently uses.
//! The lane router consults this to decide which providers can serve a
//! given task type (chat, embedding, vision, voice).

use super::types::{
    AgentProtocol, AiProvider, BillingModel, Capabilities, Classification, McpClient, ProviderId,
    SdkBackend, Transport, Vendor,
};

/// What a coding agent on your subscription offers through its own program.
const AGENT_CAPABILITIES: Capabilities = Capabilities {
    chat: true,
    embedding: false,
    tool_use: true,
    vision: false,
    voice: false,
    structured_outputs: false,
};

/// A desktop app: no programmatic chat; `DevPulse` offers it context.
const DESKTOP_APP_CAPABILITIES: Capabilities = Capabilities {
    chat: false,
    embedding: false,
    tool_use: false,
    vision: false,
    voice: false,
    structured_outputs: false,
};

/// Every provider `DevPulse` knows about, in display order.
///
/// Ordering convention: subscription path first, hosted vendors next,
/// local runtimes last. Keep entries grouped by classification so the
/// devtool's tabbed view renders coherently when filtered.
pub const PROVIDERS: &[AiProvider] = &[
    // ── Subscription path: your own subscriptions, through the vendor's
    // own program (it owns the login and the billing) ──────────────────
    AiProvider {
        id: ProviderId::ClaudeCode,
        display_name: "Claude Code",
        vendor: Vendor::Anthropic,
        billing: BillingModel::Subscription,
        transports: &[
            Transport::AgentCli {
                protocol: AgentProtocol::Headless,
            },
            Transport::SubprocessMcp {
                client: McpClient::ClaudeCode,
            },
        ],
        capabilities: Capabilities {
            chat: true,
            embedding: false,
            tool_use: true,
            vision: true,
            voice: false,
            structured_outputs: true,
        },
        sdk: SdkBackend::VendorHeadless,
        docs_url: "https://code.claude.com/docs/en/setup",
        classifications: &[Classification::SubscriptionPath],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::Codex,
        display_name: "Codex",
        vendor: Vendor::OpenAi,
        billing: BillingModel::Subscription,
        transports: &[Transport::AgentCli {
            protocol: AgentProtocol::Acp,
        }],
        capabilities: AGENT_CAPABILITIES,
        sdk: SdkBackend::AgentClientProtocol,
        docs_url: "https://github.com/openai/codex",
        classifications: &[Classification::SubscriptionPath],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::GrokBuild,
        display_name: "Grok Build",
        vendor: Vendor::Xai,
        billing: BillingModel::Subscription,
        transports: &[Transport::AgentCli {
            protocol: AgentProtocol::Acp,
        }],
        capabilities: AGENT_CAPABILITIES,
        sdk: SdkBackend::AgentClientProtocol,
        docs_url: "https://docs.x.ai/build/overview",
        classifications: &[Classification::SubscriptionPath],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::AntigravityCli,
        display_name: "Antigravity CLI",
        vendor: Vendor::Google,
        billing: BillingModel::Subscription,
        transports: &[Transport::AgentCli {
            protocol: AgentProtocol::Headless,
        }],
        capabilities: AGENT_CAPABILITIES,
        sdk: SdkBackend::VendorHeadless,
        docs_url: "https://antigravity.google/docs/cli/overview",
        classifications: &[Classification::SubscriptionPath],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::GeminiCli,
        display_name: "Gemini CLI",
        vendor: Vendor::Google,
        billing: BillingModel::Subscription,
        transports: &[Transport::AgentCli {
            protocol: AgentProtocol::Acp,
        }],
        capabilities: AGENT_CAPABILITIES,
        sdk: SdkBackend::AgentClientProtocol,
        docs_url: "https://github.com/google-gemini/gemini-cli",
        classifications: &[Classification::SubscriptionPath],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::Cursor,
        display_name: "Cursor CLI",
        vendor: Vendor::Cursor,
        billing: BillingModel::Subscription,
        transports: &[Transport::AgentCli {
            protocol: AgentProtocol::Acp,
        }],
        capabilities: AGENT_CAPABILITIES,
        sdk: SdkBackend::AgentClientProtocol,
        docs_url: "https://cursor.com/docs/cli/overview",
        classifications: &[Classification::SubscriptionPath],
        dev_only: false,
    },
    // ── Desktop apps: no programmatic chat; they host DevPulse's MCP ──
    AiProvider {
        id: ProviderId::ClaudeDesktop,
        display_name: "Claude Desktop",
        vendor: Vendor::Anthropic,
        billing: BillingModel::Subscription,
        transports: &[Transport::SubprocessMcp {
            client: McpClient::ClaudeDesktop,
        }],
        capabilities: DESKTOP_APP_CAPABILITIES,
        sdk: SdkBackend::SubprocessMcp,
        docs_url: "https://claude.ai/download",
        classifications: &[Classification::DesktopApp],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::Antigravity,
        display_name: "Antigravity",
        vendor: Vendor::Google,
        billing: BillingModel::Subscription,
        transports: &[Transport::SubprocessMcp {
            client: McpClient::Antigravity,
        }],
        capabilities: DESKTOP_APP_CAPABILITIES,
        sdk: SdkBackend::SubprocessMcp,
        docs_url: "https://antigravity.google",
        classifications: &[Classification::DesktopApp],
        dev_only: false,
    },
    // ── Native API clients (hand-rolled, vendor-specific protocols) ──
    AiProvider {
        id: ProviderId::AnthropicApi,
        display_name: "Anthropic API",
        vendor: Vendor::Anthropic,
        billing: BillingModel::PerToken,
        transports: &[Transport::ApiKey {
            base_url: "https://api.anthropic.com/v1",
        }],
        capabilities: Capabilities {
            chat: true,
            embedding: false,
            tool_use: true,
            vision: true,
            voice: false,
            structured_outputs: true,
        },
        sdk: SdkBackend::AnthropicNative,
        docs_url: "https://docs.claude.com/en/api/overview",
        classifications: &[Classification::Native],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::GoogleGemini,
        display_name: "Google Gemini",
        vendor: Vendor::Google,
        billing: BillingModel::PerToken,
        transports: &[Transport::ApiKey {
            base_url: "https://generativelanguage.googleapis.com/v1beta",
        }],
        capabilities: Capabilities {
            chat: true,
            embedding: true,
            tool_use: true,
            vision: true,
            voice: true,
            structured_outputs: true,
        },
        sdk: SdkBackend::GeminiNative,
        docs_url: "https://ai.google.dev/gemini-api/docs",
        classifications: &[Classification::Native],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::Cohere,
        display_name: "Cohere",
        vendor: Vendor::Cohere,
        billing: BillingModel::PerToken,
        transports: &[Transport::ApiKey {
            base_url: "https://api.cohere.com/v2",
        }],
        capabilities: Capabilities {
            chat: true,
            embedding: true,
            tool_use: true,
            vision: false,
            voice: false,
            structured_outputs: true,
        },
        sdk: SdkBackend::CohereNative,
        docs_url: "https://docs.cohere.com/reference",
        classifications: &[Classification::Native],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::Replicate,
        display_name: "Replicate",
        vendor: Vendor::Replicate,
        billing: BillingModel::PerToken,
        transports: &[Transport::ApiKey {
            base_url: "https://api.replicate.com/v1",
        }],
        capabilities: Capabilities {
            chat: true,
            embedding: true,
            tool_use: false,
            vision: true,
            voice: true,
            structured_outputs: false,
        },
        sdk: SdkBackend::ReplicateNative,
        docs_url: "https://replicate.com/docs/reference/http",
        classifications: &[Classification::Native],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::HuggingFace,
        display_name: "Hugging Face Inference",
        vendor: Vendor::HuggingFace,
        billing: BillingModel::PerToken,
        transports: &[Transport::ApiKey {
            base_url: "https://api-inference.huggingface.co",
        }],
        capabilities: Capabilities {
            chat: true,
            embedding: true,
            tool_use: false,
            vision: true,
            voice: true,
            structured_outputs: false,
        },
        sdk: SdkBackend::HuggingFaceNative,
        docs_url: "https://huggingface.co/docs/api-inference",
        classifications: &[Classification::Native],
        dev_only: false,
    },
    // ── OpenAI-compatible (single client, multiple base URLs) ────────
    AiProvider {
        id: ProviderId::OpenAi,
        display_name: "OpenAI",
        vendor: Vendor::OpenAi,
        billing: BillingModel::PerToken,
        transports: &[Transport::OpenAiCompatible {
            base_url: "https://api.openai.com/v1",
        }],
        capabilities: Capabilities {
            chat: true,
            embedding: true,
            tool_use: true,
            vision: true,
            voice: true,
            structured_outputs: true,
        },
        sdk: SdkBackend::AsyncOpenAi,
        docs_url: "https://platform.openai.com/docs",
        classifications: &[Classification::OpenAiCompatible],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::Mistral,
        display_name: "Mistral",
        vendor: Vendor::Mistral,
        billing: BillingModel::PerToken,
        transports: &[Transport::OpenAiCompatible {
            base_url: "https://api.mistral.ai/v1",
        }],
        capabilities: Capabilities {
            chat: true,
            embedding: true,
            tool_use: true,
            vision: true,
            voice: false,
            structured_outputs: true,
        },
        sdk: SdkBackend::AsyncOpenAi,
        docs_url: "https://docs.mistral.ai",
        classifications: &[Classification::OpenAiCompatible],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::Xai,
        display_name: "xAI Grok",
        vendor: Vendor::Xai,
        billing: BillingModel::PerToken,
        transports: &[Transport::OpenAiCompatible {
            base_url: "https://api.x.ai/v1",
        }],
        capabilities: Capabilities {
            chat: true,
            embedding: false,
            tool_use: true,
            vision: true,
            voice: false,
            structured_outputs: true,
        },
        sdk: SdkBackend::AsyncOpenAi,
        docs_url: "https://docs.x.ai",
        classifications: &[Classification::OpenAiCompatible],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::DeepSeek,
        display_name: "DeepSeek",
        vendor: Vendor::DeepSeek,
        billing: BillingModel::PerToken,
        transports: &[Transport::OpenAiCompatible {
            base_url: "https://api.deepseek.com/v1",
        }],
        capabilities: Capabilities {
            chat: true,
            embedding: false,
            tool_use: true,
            vision: false,
            voice: false,
            structured_outputs: true,
        },
        sdk: SdkBackend::AsyncOpenAi,
        docs_url: "https://api-docs.deepseek.com",
        classifications: &[Classification::OpenAiCompatible],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::Groq,
        display_name: "Groq",
        vendor: Vendor::Groq,
        billing: BillingModel::PerToken,
        transports: &[Transport::OpenAiCompatible {
            base_url: "https://api.groq.com/openai/v1",
        }],
        capabilities: Capabilities {
            chat: true,
            embedding: false,
            tool_use: true,
            vision: true,
            voice: true,
            structured_outputs: true,
        },
        sdk: SdkBackend::AsyncOpenAi,
        docs_url: "https://console.groq.com/docs",
        classifications: &[Classification::OpenAiCompatible],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::Together,
        display_name: "Together AI",
        vendor: Vendor::Together,
        billing: BillingModel::PerToken,
        transports: &[Transport::OpenAiCompatible {
            base_url: "https://api.together.xyz/v1",
        }],
        capabilities: Capabilities {
            chat: true,
            embedding: true,
            tool_use: true,
            vision: true,
            voice: false,
            structured_outputs: true,
        },
        sdk: SdkBackend::AsyncOpenAi,
        docs_url: "https://docs.together.ai",
        classifications: &[Classification::OpenAiCompatible],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::Fireworks,
        display_name: "Fireworks AI",
        vendor: Vendor::Fireworks,
        billing: BillingModel::PerToken,
        transports: &[Transport::OpenAiCompatible {
            base_url: "https://api.fireworks.ai/inference/v1",
        }],
        capabilities: Capabilities {
            chat: true,
            embedding: true,
            tool_use: true,
            vision: true,
            voice: false,
            structured_outputs: true,
        },
        sdk: SdkBackend::AsyncOpenAi,
        docs_url: "https://docs.fireworks.ai",
        classifications: &[Classification::OpenAiCompatible],
        dev_only: false,
    },
    // ── Local runtimes (operator's own compute) ──────────────────────
    AiProvider {
        id: ProviderId::Ollama,
        display_name: "Ollama (local)",
        vendor: Vendor::Ollama,
        billing: BillingModel::Local,
        transports: &[
            Transport::LocalHttp {
                default_port: 11434,
            },
            Transport::OpenAiCompatible {
                base_url: "http://localhost:11434/v1",
            },
        ],
        capabilities: Capabilities {
            chat: true,
            embedding: true,
            tool_use: true,
            vision: true,
            voice: false,
            structured_outputs: true,
        },
        sdk: SdkBackend::OllamaNative,
        docs_url: "https://github.com/ollama/ollama/blob/main/docs/api.md",
        classifications: &[Classification::Local, Classification::OpenAiCompatible],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::LmStudio,
        display_name: "LM Studio (local)",
        vendor: Vendor::LmStudio,
        billing: BillingModel::Local,
        transports: &[Transport::OpenAiCompatible {
            base_url: "http://localhost:1234/v1",
        }],
        capabilities: Capabilities {
            chat: true,
            embedding: true,
            tool_use: true,
            vision: true,
            voice: false,
            structured_outputs: true,
        },
        sdk: SdkBackend::AsyncOpenAi,
        docs_url: "https://lmstudio.ai/docs/local-server",
        classifications: &[Classification::Local, Classification::OpenAiCompatible],
        dev_only: false,
    },
    AiProvider {
        id: ProviderId::Vllm,
        display_name: "vLLM (self-hosted)",
        vendor: Vendor::Vllm,
        billing: BillingModel::Local,
        transports: &[Transport::OpenAiCompatible {
            base_url: "http://localhost:8000/v1",
        }],
        capabilities: Capabilities {
            chat: true,
            embedding: true,
            tool_use: true,
            vision: true,
            voice: false,
            structured_outputs: true,
        },
        sdk: SdkBackend::AsyncOpenAi,
        docs_url: "https://docs.vllm.ai",
        classifications: &[Classification::Local, Classification::OpenAiCompatible],
        dev_only: false,
    },
];

/// Look up a provider by stable id. `None` if not registered.
pub fn find(id: ProviderId) -> Option<&'static AiProvider> {
    PROVIDERS.iter().find(|p| p.id == id)
}

/// Filter providers by classification.
pub fn by_classification(c: Classification) -> impl Iterator<Item = &'static AiProvider> {
    PROVIDERS
        .iter()
        .filter(move |p| p.classifications.contains(&c))
}

/// Filter providers by capability — used by the lane router.
pub fn by_capability(
    filter: impl Fn(&Capabilities) -> bool,
) -> impl Iterator<Item = &'static AiProvider> {
    PROVIDERS.iter().filter(move |p| filter(&p.capabilities))
}

/// The entries a build shows. A release build passes `false` and hides
/// every `dev_only = true` provider; the engine decides (its `kernel`
/// feature marks a dev build).
pub fn visible(include_dev_only: bool) -> impl Iterator<Item = &'static AiProvider> {
    PROVIDERS
        .iter()
        .filter(move |p| !p.dev_only || include_dev_only)
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    #[test]
    fn every_provider_has_at_least_one_transport() {
        for p in PROVIDERS {
            assert!(
                !p.transports.is_empty(),
                "{:?} has no transports — at least one required",
                p.id
            );
        }
    }

    #[test]
    fn every_provider_has_at_least_one_classification() {
        for p in PROVIDERS {
            assert!(
                !p.classifications.is_empty(),
                "{:?} has no classifications — at least one required",
                p.id
            );
        }
    }

    #[test]
    fn provider_ids_are_unique() {
        let mut seen = std::collections::HashSet::new();
        for p in PROVIDERS {
            assert!(seen.insert(p.id), "duplicate ProviderId: {:?}", p.id);
        }
    }

    #[test]
    fn find_returns_what_we_put_in() {
        assert_eq!(find(ProviderId::OpenAi).unwrap().vendor, Vendor::OpenAi);
        assert_eq!(
            find(ProviderId::AnthropicApi).unwrap().sdk,
            SdkBackend::AnthropicNative
        );
    }

    #[test]
    fn openai_compatible_classification_groups_ten_or_more() {
        let count = by_classification(Classification::OpenAiCompatible).count();
        assert!(
            count >= 10,
            "expected at least 10 OpenAI-compatible providers, found {count}"
        );
    }

    #[test]
    fn subscriptions_are_reached_only_through_the_vendors_own_program() {
        // A subscription never takes an API key in DevPulse: the vendor's
        // program owns the login (owner rulings 2026-10-20).
        for p in by_classification(Classification::SubscriptionPath) {
            assert_eq!(p.billing, BillingModel::Subscription, "{:?}", p.id);
            assert!(
                p.transports.iter().all(|t| matches!(
                    t,
                    Transport::AgentCli { .. } | Transport::SubprocessMcp { .. }
                )),
                "{:?} has a transport that is not the vendor's own program",
                p.id
            );
        }
        let claude = find(ProviderId::ClaudeCode).unwrap();
        assert!(claude.transports.contains(&Transport::AgentCli {
            protocol: AgentProtocol::Headless
        }));
    }

    #[test]
    fn capability_filter_finds_chat_providers() {
        // Desktop apps have no programmatic chat; everything else does.
        let chat_count = by_capability(|c| c.chat).count();
        let desktop_apps = by_classification(Classification::DesktopApp).count();
        assert_eq!(
            chat_count,
            PROVIDERS.len() - desktop_apps,
            "every provider but a desktop app should advertise chat"
        );
    }

    #[test]
    fn every_key_is_the_wire_id_serde_writes() {
        for p in PROVIDERS {
            assert_eq!(
                serde_json::to_string(&p.id).unwrap(),
                format!("\"{}\"", p.id.key()),
                "{:?}",
                p.id
            );
        }
    }

    #[test]
    fn every_docs_link_is_https() {
        for p in PROVIDERS {
            assert!(p.docs_url.starts_with("https://"), "{:?}", p.id);
        }
    }

    #[test]
    fn a_release_build_hides_dev_only_rows() {
        let all = visible(true).count();
        let release = visible(false).count();
        let dev_only = PROVIDERS.iter().filter(|p| p.dev_only).count();
        assert_eq!(all - release, dev_only);
    }
}
