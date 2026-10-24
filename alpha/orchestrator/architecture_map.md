# Architecture Map: Layman vs Sensitive

**Status:** Audit in Progress | **Date:** 2026-01-13
**Purpose:** Define the strict "Black Box" boundary between the Sensitive Orchestrator and the Public Engine Facade.

## The Boundary Contract
*   **Internal (Sensitive)**: `orchestrator/src/*`. Holds the "Brain", detailed logic, raw types, and direct driver access.
*   **Public (Layman)**: `engine/src/facade/*` & `shared/src/*`. The "Control Panel". Consumers (UI/Desktop) only talk to this.
*   **SSOT Rule**: There is ONE definition for shared types in `shared/src/types`. Engine must NOT redefine them.

---

## 1. The Brain (Cortex & Logic)

**Observation**: `orchestrator/src/cortex` holds the cognitive architecture. "Cortex IS the LLM Loader" (User).

| Capability | Orchestrator (Internal IP) | Shared (SSOT) | Engine Mapping |
| :--- | :--- | :--- | :--- |
| **Logic Core** | `cortex::Cortex` (Central Hub) | *None* | `facade::ReasoningFacade` <br> *(Wraps Rumination/Mission)* |
| **Routing** | `cortex::Router` <br> *(Dispatches via Profile)* | `types::signal::SignalProfile` <br> *(Routing Rules)* | **Duplicate in Engine**. <br> `engine::signals::router` must be Deleted. |
| **Rumination** | `cortex::Rumination` <br> *(Multi-hop loop, 4-15 hops)* | `types::profile::Processing::Rumination` | `facade::reasoning::ReasoningFacade` <br> *(Exposes progress/hops)* |
| **Context** | `cortex::CAG` <br> *(Context Assembly Graph)* | `types::profile::CollectionSet` | *Hidden*. |
| **Prompting** | `cortex::COSTAR` <br> *(Prompt Builder)* | *None* | *Hidden*. |

---

## 2. Signals & Routing (CRITICAL DUPLICATION)

**Observation**: `shared/src/types/signal.rs` defines `SignalKind` (SSOT Router). `engine/src/signals` contains legacy re-implementation.

| Capability | Orchestrator (Internal IP) | Shared (SSOT) | Engine (Legacy/Duplicate) | Action |
| :--- | :--- | :--- | :--- | :--- |
| **Signal Definition** | `types::infra_signal::InfraSignal` (Internal) | `shared::types::signal::SignalKind` | `engine::signals::variants::SignalVariant` | **MERGE**. Engine must use `shared::SignalKind` or map 1:1. |
| **Routing Logic** | `cortex::Router` | `shared::types::signal::SignalProfile` | `engine::signals::router::SignalRouter` | **Simplify Engine**. Engine Router should just dispatch `SignalKind`. |

## 3. Model Types (CRITICAL DUPLICATION)

**Observation**: `engine/src/types/model.rs` is a direct copy of `shared`.

| Capability | Orchestrator (Internal IP) | Shared (SSOT) | Engine (Legacy/Duplicate) | Action |
| :--- | :--- | :--- | :--- | :--- |
| **Model Info** | `infra::catalog::adapter::ModelInfo` | `shared::types::models::ModelInfo` | `engine::types::model::ModelInfo` | **DELETE Engine Type**. Facade MUST return `shared::ModelInfo`. |
| **Discovered** | *N/A (Transient)* | `shared::types::models::ModelInfo` | `engine::types::model::DiscoveredModel` | **MERGE**. Use `shared` types. |

---

---

## 4. Inference & Adapters (Detail)

**Observation**: Orchestrator has a newer `ServiceRegistry` and `ProviderProvider`. Engine uses a simplified `AdapterFacade`.

| Capability | Orchestrator (Internal IP) | Shared (SSOT) | Engine Facade (Public) | Mapped? |
| :--- | :--- | :--- | :--- | :--- |
| **Service Manager** | `infra::core::services::ServiceRegistry` <br> *(Manages Embedder, Reranker, LLM)* | *None* | `facade::DiscoveryFacade` <br> *(Partial overlap)* | **Partial**. Engine Facade iterates providers manually. |
| **Web Providers** | `adapters::web::ProviderProvider` <br> *(Anthropic, OpenAI, etc via Vault)* | `types::provider::LlmProvider` | `facade::AdapterFacade` <br> *(Wraps logic, uses `ActiveAdapter`)* | **Yes**. |
| **Local Inference** | `adapters::local::CandleAdapter` <br> *(Candle/GGUF)* | `types::adapter::AdapterKind::Local` | `facade::AdapterFacade` <br> *(Local Mode)* | **Yes**. |
| **Cache** | `adapters::memory::MokaAdapter` | *None* | *Hidden* | **Yes**. (Internal Detail) |
| **Model Config** | `services::descriptors::LlmDescriptor` | `types::AdapterInfo` | *Hidden* | **Registry Lookup Needed**. |


---

## 5. Configuration (CLEAN)

**Observation**: Internal uses rich TOML structs; Engine uses safe Key/Value DTOs.

| Capability | Orchestrator (Internal IP) | Shared (SSOT) | Engine (Public Wrapper) | Action |
| :--- | :--- | :--- | :--- | :--- |
| **Features** | `infra::core::config::DevPulseConfig` <br> *(Complex TOML)* | *None* | `engine::types::config::ConfigEntry` <br> *(Simple KV Pair)* | **Keep**. Good separation. Engine exposes safe slice of config. |

---

## 6. Persistence & Entities (CLEAN)

**Observation**: Internal uses SQL Structs; Shared uses clean DTOs.

| Capability | Orchestrator (Internal IP) | Shared (SSOT) | Engine Facade | Action |
| :--- | :--- | :--- | :--- | :--- |
| **Projects** | `persistence::sql::Project` | `shared::types::project::ProjectRecord` | *Missing Facade* | **Monitor**. Desktop likely accesses DB directly (Acceptable for now). |
| **Profiles** | `persistence::sql::Persona` | `config::Persona` | `facade::PersonaFacade` | **Keep**. Mapped correctly. |
