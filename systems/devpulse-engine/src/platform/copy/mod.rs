//! The UI copy catalog — every visible string, typed.
//!
//! Configuration with shipped defaults (`config/copy.default.toml`). Your
//! file at `{data_dir}/config/copy.toml` overrides any key; keys you leave
//! out keep the defaults (a deep merge, per key). A key `DevPulse` does not
//! know, or a value of the wrong type, refuses your file with the reason,
//! which is returned with the catalog so the UI can show it — never
//! silently ignored.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use specta::Type;

/// The bundled catalog.
const BUNDLED: &str = include_str!("../../../config/copy.default.toml");

/// Text shared by every first-run stage.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct OnboardingCommonCopy {
    /// Continue button.
    pub r#continue: String,
    /// Back button.
    pub back: String,
    /// "Set up later" button.
    pub later: String,
    /// Final button.
    pub finish: String,
    /// "Step {current} of {total}".
    pub progress: String,
    /// Shown when your flow file was not used.
    pub flow_problem: String,
    /// The top-bar chip that reopens first run.
    pub reopen: String,
    /// Settings: heading of the section that runs first run again.
    pub run_again_title: String,
    /// Settings: what running it again does.
    pub run_again_hint: String,
    /// Settings: the button that runs first run again (after it finished).
    pub run_again: String,
}

/// The Welcome stage.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct WelcomeCopy {
    /// Greeting.
    pub title: String,
    /// What first run does.
    pub subtitle: String,
    /// Mascot image description.
    pub mascot_alt: String,
    /// Main button.
    pub cta: String,
    /// Under "Set up later".
    pub later_hint: String,
    /// While detection runs.
    pub looking: String,
    /// Above the found chips.
    pub found_heading: String,
    /// When detection found nothing.
    pub nothing_found: String,
    /// Chip: "Git knows you as {name}".
    pub found_git: String,
    /// Chip: "{path} · {count} repositories".
    pub found_folder: String,
}

/// The "You" stage.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct YouCopy {
    /// Heading.
    pub title: String,
    /// What the stage is for.
    pub subtitle: String,
    /// Name field label.
    pub name_label: String,
    /// Name field hint.
    pub name_hint: String,
    /// Email field label.
    pub email_label: String,
    /// Email field hint.
    pub email_hint: String,
    /// Projects folder field label.
    pub projects_label: String,
    /// Projects folder field hint.
    pub projects_hint: String,
    /// Folder picker button.
    pub browse: String,
    /// Folder picker window title.
    pub picker_title: String,
    /// Shown with a suggestion from git.
    pub from_git: String,
    /// "{count} repositories" next to a suggested folder.
    pub folder_repos: String,
    /// Above the repository list.
    pub repos_heading: String,
    /// Under the heading.
    pub repos_hint: String,
    /// Scan button.
    pub repos_find: String,
    /// While scanning.
    pub repos_finding: String,
    /// When the folder holds no repositories.
    pub repos_none: String,
    /// "Add {count} to `DevPulse`".
    pub repos_add: String,
    /// Badge on `DevPulse`'s own repository.
    pub repo_devpulse: String,
    /// Badge on a repository registered before.
    pub repo_registered: String,
    /// Badge on a repository just added.
    pub repo_added: String,
}

/// The "Your dev environment" stage (containers).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct ContainersCopy {
    /// Heading.
    pub title: String,
    /// What the stage does.
    pub subtitle: String,
    /// Section: what was found.
    pub found_heading: String,
    /// While the machine is being checked.
    pub checking: String,
    /// Button: check again.
    pub check_again: String,
    /// Engine not installed.
    pub engine_missing: String,
    /// "Running · {version}".
    pub engine_running: String,
    /// "Installed · {version}, not running".
    pub engine_stopped: String,
    /// "Compose {version}".
    pub compose: String,
    /// "Machine {name}: running".
    pub machine_running: String,
    /// "Machine {name}: stopped".
    pub machine_stopped: String,
    /// "{gb} GB memory".
    pub host_ram: String,
    /// "{count} CPU cores".
    pub host_cores: String,
    /// "GPU: {name}".
    pub host_gpu: String,
    /// "WSL {version}".
    pub wsl_ok: String,
    /// WSL not installed.
    pub wsl_missing: String,
    /// Virtualization switched on.
    pub virtualization_on: String,
    /// Virtualization switched off in the firmware.
    pub virtualization_off: String,
    /// Section: the questions.
    pub questions_heading: String,
    /// The licence question.
    pub usage_label: String,
    /// The GPU question.
    pub gpu_label: String,
    /// The desktop-app question.
    pub app_label: String,
    /// Yes.
    pub yes: String,
    /// No.
    pub no: String,
    /// Button: use these answers.
    pub save_answers: String,
    /// Section: the recommendation.
    pub advice_heading: String,
    /// "Keep {name}" (an engine already here).
    pub keep: String,
    /// "Set up {name}".
    pub recommend: String,
    /// Shown before the answers are given.
    pub answer_first: String,
    /// Sub-heading: why.
    pub why: String,
    /// Sub-heading: warnings.
    pub warnings_heading: String,
    /// Sub-heading: blockers.
    pub blockers_heading: String,
    /// "Source: {title}".
    pub source: String,
    /// Sub-heading: the steps.
    pub steps_heading: String,
    /// Button: run a step.
    pub run: String,
    /// While a step runs.
    pub running: String,
    /// A step finished.
    pub done: String,
    /// A step did not work.
    pub failed: String,
    /// A step to run yourself.
    pub guided: String,
    /// After installing WSL.
    pub restart: String,
    /// Under the install step: "Installing accepts {name}'s licence terms."
    pub install_consent: String,
    /// The way back to this stage later.
    pub later_hint: String,
    /// Usage answers, by `Usage` value.
    pub usage: BTreeMap<String, String>,
    /// Reasons, warnings and blockers, by `PointCode` (`{name}` etc. filled).
    pub points: BTreeMap<String, String>,
    /// Step names, by `StepKind`.
    pub steps: BTreeMap<String, String>,
    /// OS names, by `std::env::consts::OS`.
    pub os: BTreeMap<String, String>,
}

/// The "Your AI" stage (subscriptions and desktop apps).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct YourAiCopy {
    /// Saved endpoint management, alongside subscriptions.
    pub endpoints: EndpointCopy,
    /// Heading.
    pub title: String,
    /// What the stage does.
    pub subtitle: String,
    /// Section: your subscriptions.
    pub subscriptions_heading: String,
    /// Section: desktop apps.
    pub apps_heading: String,
    /// While the machine is being checked.
    pub checking: String,
    /// Button: check again.
    pub check_again: String,
    /// Not installed.
    pub not_installed: String,
    /// "Installed · {version}".
    pub installed_version: String,
    /// Installed, version not reported.
    pub installed: String,
    /// "Latest {version}".
    pub latest: String,
    /// The installed version is the latest.
    pub up_to_date: String,
    /// "Update available: {version}".
    pub update_available: String,
    /// Signed in.
    pub signed_in: String,
    /// Not signed in.
    pub signed_out: String,
    /// Sign-in state can't be told.
    pub signed_in_unknown: String,
    /// Prerequisites are checked; a real operation still has to connect.
    pub ready_to_connect: String,
    /// This provider definition cannot hold a conversation.
    pub conversation_unsupported: String,
    /// Button: update.
    pub update: String,
    /// While updating.
    pub updating: String,
    /// Button: sign in.
    pub sign_in: String,
    /// While the sign-in window opens.
    pub opening: String,
    /// Button: ask it one question.
    pub test: String,
    /// While it is being asked.
    pub testing: String,
    /// The question Try it asks each AI.
    pub test_prompt: String,
    /// "I asked: “{prompt}”".
    pub asked: String,
    /// "Answered in {seconds} s".
    pub answered: String,
    /// It needs a connector that is not installed yet.
    pub connector_needed: String,
    /// "Connector {version}".
    pub connector_installed: String,
    /// The connector is installed, version not reported.
    pub connector_ready: String,
    /// Button: install its connector.
    pub install_connector: String,
    /// While the connector installs.
    pub installing: String,
    /// Link to the vendor's docs, for one that is not installed.
    pub docs: String,
    /// Link to the vendor's docs, for one that is installed.
    pub help: String,
    /// A desktop app updates itself.
    pub app_updates_itself: String,
    /// An action finished.
    pub done: String,
    /// An action did not work.
    pub failed: String,
    /// Nothing could be opened: run this yourself.
    pub guided: String,
    /// The way back to this stage later.
    pub later_hint: String,
    /// "Sign in to {agent}" — above the sign-in steps (plan 0001 B3.7).
    pub sign_in_heading: String,
    /// Step 1: copy the vendor's own sign-in command.
    pub step_copy: String,
    /// The copy button.
    pub copy: String,
    /// The copy button once it copied.
    pub copied: String,
    /// The clipboard refused: copy the command by hand.
    pub copy_failed: String,
    /// Step 2: paste it into a terminal, or open one here.
    pub step_paste: String,
    /// Button: open a terminal running the command.
    pub open_terminal: String,
    /// Step 3: finish in the vendor's own tool ("{agent}"); a code goes into
    /// its prompt, never into `DevPulse`.
    pub step_finish: String,
    /// While `DevPulse` waits to see you signed in.
    pub waiting: String,
    /// The wait ended without a sign-in: check again by hand.
    pub waiting_stopped: String,
    /// "{agent} is active." — signed in.
    pub now_active: String,
    /// Button: install the vendor's own build (plan 0001 B3.10).
    pub install: String,
    /// Under Install, before the click: what is installed from where
    /// (`{name}`, `{source}`), and that installing accepts its terms.
    pub install_consent: String,
    /// On a card whose program `DevPulse` installed in its own folder.
    pub in_devpulse_folder: String,
    /// Button: close the steps.
    pub close: String,
}

/// Human-facing labels for saved AI server connections.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct EndpointCopy {
    /// Section heading.
    pub title: String,
    /// Scope of connection checks.
    pub description: String,
    /// Database unavailable.
    pub unavailable: String,
    /// Empty state.
    pub empty: String,
    /// Add action.
    pub add: String,
    /// Edit action.
    pub edit: String,
    /// Connection label.
    pub name: String,
    /// Adapter selection label.
    pub provider: String,
    /// API base field.
    pub endpoint: String,
    /// Credential intent selector.
    pub credential: String,
    /// Retain current key intent.
    pub keep_key: String,
    /// Replace key intent.
    pub replace_key: String,
    /// No key intent.
    pub clear_key: String,
    /// Password field label.
    pub key: String,
    /// Secure storage explanation.
    pub key_hint: String,
    /// Saved key indicator.
    pub key_saved: String,
    /// Save action.
    pub save: String,
    /// Cancel action.
    pub cancel: String,
    /// Check action.
    pub check: String,
    /// No evidence in this process.
    pub unchecked: String,
    /// Successful model list, with {count} and {time}.
    pub checked: String,
    /// Remove action.
    pub remove: String,
    /// Inline removal confirmation, with {name}.
    pub remove_confirm: String,
    /// Text operation controls and scope.
    pub try_description: String,
    /// Exact question sent by the engine when the person clicks Try model.
    pub try_prompt: String,
    /// Model selector label.
    pub try_model: String,
    /// Explicit generation action.
    pub try_action: String,
    /// Completed operation label with {model} and {time}.
    pub try_answered: String,
}

/// Settings → Memory: the notes your agents can read.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct MemoryCopy {
    /// What the page is, and where the notes go.
    pub subtitle: String,
    /// Heading of your own notes.
    pub yours_title: String,
    /// Who reads and changes your own notes.
    pub yours_description: String,
    /// Heading of a project's notes.
    pub project_title: String,
    /// Who reads and changes a project's notes.
    pub project_description: String,
    /// The project picker's name.
    pub project_label: String,
    /// There are no projects to keep notes about.
    pub no_projects: String,
    /// Memory did not start.
    pub unavailable: String,
    /// A list with no notes.
    pub empty: String,
    /// Adds a note.
    pub add: String,
    /// A note's name.
    pub name: String,
    /// What a good name looks like.
    pub name_hint: String,
    /// That name is in use (`{name}`).
    pub name_taken: String,
    /// A note's text.
    pub body: String,
    /// How long a note is (`{used}`, `{limit}`).
    pub characters: String,
    /// Saves a note.
    pub save: String,
    /// Leaves the form.
    pub cancel: String,
    /// Opens a note to change it.
    pub edit: String,
    /// Starts deleting a note.
    pub remove: String,
    /// What deleting does (`{name}`).
    pub remove_confirm: String,
    /// Deletes it.
    pub remove_yes: String,
    /// Does not delete it.
    pub keep: String,
    /// The switch that sends a note with every conversation.
    pub include_label: String,
    /// An agent saved over a note you approved.
    pub changed_by_agent: String,
    /// Your choice came too late: the note had changed.
    pub include_moved: String,
    /// Your save came too late: an agent had changed the note.
    pub save_moved: String,
    /// Your save came too late: the note had been deleted.
    pub save_gone: String,
    /// Heading of the note's newer text.
    pub current_title: String,
    /// Heading of what goes to your agents.
    pub sending_title: String,
    /// Who gets it, and when.
    pub sending_description: String,
    /// Nothing goes yet.
    pub sending_none: String,
    /// How much goes (`{used}`, `{limit}`).
    pub sending_used: String,
    /// Notes that did not fit (`{names}`).
    pub sending_left_out: String,
    /// Shows the exact text.
    pub sending_show: String,
    /// Hides the exact text.
    pub sending_hide: String,
}

/// First run.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct OnboardingCopy {
    /// Shared text.
    pub common: OnboardingCommonCopy,
    /// Welcome.
    pub welcome: WelcomeCopy,
    /// You.
    pub you: YouCopy,
    /// Your AI.
    pub your_ai: YourAiCopy,
    /// Your dev environment.
    pub containers: ContainersCopy,
}

/// Why a form field was refused, one line per code (`{limit}` is filled).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct FormErrorsCopy {
    /// Required and empty.
    pub required: String,
    /// Too short.
    pub too_short: String,
    /// Too long.
    pub too_long: String,
    /// A number below its floor.
    pub below_minimum: String,
    /// Not an email.
    pub email: String,
    /// Folder does not exist.
    pub not_a_folder: String,
    /// No such field.
    pub unknown: String,
    /// Anything else.
    pub invalid: String,
}

/// Text shared by every form.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct FormsCopy {
    /// Field errors.
    pub errors: FormErrorsCopy,
}

/// A route's name and the lines shown with it.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct RouteCopy {
    /// Name in navigation, tiles and section headers.
    pub label: String,
    /// One line under the name on a tile.
    #[serde(default)]
    pub blurb: Option<String>,
    /// One line under the name on the page or section itself.
    #[serde(default)]
    pub description: Option<String>,
    /// Glossary term shown as an info chip next to the name.
    #[serde(default)]
    pub term: Option<String>,
    /// What the entry's attention dot means, for a route that shows one.
    #[serde(default)]
    pub badge: Option<String>,
}

/// The app sidebar's own text; its entries are route names (`nav`).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SidebarCopy {
    /// Accessible name of the navigation landmark.
    pub label: String,
    /// The expand button (accessible name and tooltip).
    pub expand: String,
    /// The collapse button (accessible name and tooltip).
    pub collapse: String,
    /// The collapse button's text while the sidebar is expanded.
    pub collapse_short: String,
}

/// Threads with your agents in the chat (plan 0001 B3.4).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct AgentChatCopy {
    /// The switch that sends your notes with this conversation.
    pub notes_label: String,
    /// This conversation gets your notes.
    pub notes_yes: String,
    /// This conversation does not.
    pub notes_no: String,
    /// What the switch does, and what turning it off cannot undo.
    pub notes_help: String,
    /// Opens the page that chooses them.
    pub notes_change: String,
    /// The choice could not be saved (`{reason}`).
    pub notes_failed: String,
    /// Label of the agent picker.
    pub new_thread: String,
    /// Shown when no agent can hold a conversation yet.
    pub none_ready: String,
    /// "{agent} — sign in first": an installed agent you are signed out of,
    /// listed but not pickable.
    pub sign_in_first: String,
    /// The local brain, as the author of its answers.
    pub local: String,
    /// While the agent works and has not answered yet.
    pub working: String,
    /// "Using: {title}" — a tool the agent is using.
    pub using_tool: String,
    /// "{agent} asks:" — before a permission request.
    pub asks: String,
    /// Button: refuse a permission request.
    pub refuse: String,
    /// Button: stop the running turn.
    pub stop: String,
    /// A copy retained when an agent's turn fails.
    pub retained_answer: String,
    /// Explains that the copy is not proof of a durable history write.
    pub retained_note: String,
    /// Dismiss the in-window copy, without deleting a recovery file.
    pub dismiss_retained: String,
}

/// Saved endpoint conversations, using plain-language controls.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct EndpointChatCopy {
    /// Picker heading.
    pub title: String,
    /// Named saved connection field.
    pub connection: String,
    /// Explicit advertised model field.
    pub model: String,
    /// Start without sending any conversation text.
    pub start: String,
    /// Cancel the current response.
    pub stop: String,
    /// Return to a new ordinary model conversation.
    pub new_local: String,
    /// Where to add and check connections.
    pub empty: String,
    /// Explain when content leaves the app and billing can apply.
    pub disclosure: String,
    /// Archived conversation state.
    pub read_only: String,
}

/// The chat.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct ChatCopy {
    /// Conversations through saved model endpoints.
    pub endpoints: EndpointChatCopy,
    /// Threads with your agents.
    pub agents: AgentChatCopy,
    /// Rooms: your agents seated in roles.
    pub rooms: RoomChatCopy,
}

/// The words of the room window (plan 0001 B4.5). `{…}` is filled in.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct RoomChatCopy {
    /// Opens the templates.
    pub new_room: String,
    /// Above the templates.
    pub templates_title: String,
    /// What a template is.
    pub templates_help: String,
    /// Marks a room, role or character of yours.
    pub yours: String,
    /// A template's seat count (`{count}`).
    pub places_count: String,
    /// Deletes a room of yours.
    pub delete_yours: String,
    /// What deleting one does.
    pub delete_help: String,
    /// Back out of a screen.
    pub back: String,
    /// The seating screen's label for assistive technology.
    pub seating_label: String,
    /// What the seating screen is for.
    pub seating_help: String,
    /// A seat's count of places.
    pub places: String,
    /// Why changing that needs a saved room.
    pub places_help: String,
    /// One place's agent.
    pub agent: String,
    /// That choice, for assistive technology (`{seat}`).
    pub agent_aria: String,
    /// The agent choice before you made one.
    pub choose_agent: String,
    /// One place's role.
    pub role: String,
    /// That choice, for assistive technology (`{seat}`).
    pub role_aria: String,
    /// One place's character.
    pub character: String,
    /// That choice, for assistive technology (`{seat}`).
    pub character_aria: String,
    /// The character choice when there is none.
    pub no_character: String,
    /// A value its role needs (`{name}`).
    pub value_needed: String,
    /// It answers without seeing the others.
    pub blind: String,
    /// It sees everything said.
    pub open: String,
    /// It picks the answer.
    pub selects: String,
    /// It sends each question on.
    pub routes: String,
    /// It has no tools.
    pub access_talks: String,
    /// It reads the project and changes nothing.
    pub access_reads: String,
    /// It reads the project and the web, and changes nothing.
    pub access_reads_web: String,
    /// It uses the web and changes nothing.
    pub access_web: String,
    /// It can change things and asks first.
    pub access_changes: String,
    /// Opens a seat's breakdown.
    pub costar_title: String,
    /// What it knows.
    pub costar_context: String,
    /// What it is for.
    pub costar_objective: String,
    /// How it works.
    pub costar_style: String,
    /// How it speaks.
    pub costar_tone: String,
    /// Who reads it.
    pub costar_audience: String,
    /// What it must produce.
    pub costar_response: String,
    /// It speaks in its own voice.
    pub tone_own: String,
    /// You read this seat's answer.
    pub audience_you: String,
    /// The selector reads it (`{seat}`).
    pub audience_selector: String,
    /// Sees only what you ask.
    pub context_blind: String,
    /// Sees everything said.
    pub context_open: String,
    /// Starts the room.
    pub start: String,
    /// Saves your changes as a room of yours.
    pub save_as: String,
    /// The name of that room.
    pub save_name: String,
    /// It was saved (`{name}`).
    pub saved: String,
    /// Changed seats need saving before starting.
    pub save_first: String,
    /// A seat's own problem stops the room.
    pub seats_have_problems: String,
    /// What a seated room shows above its seats.
    pub seats_title: String,
    /// One place is answering (`{place}`).
    pub answering: String,
    /// Stops the room.
    pub stop: String,
    /// The outcome's heading.
    pub outcome_title: String,
    /// It ran out of rounds (`{rounds}`).
    pub stopped_rounds: String,
    /// A round added nothing (`{rounds}`).
    pub stopped_stable: String,
    /// A reviewer found nothing left (`{rounds}`).
    pub stopped_passed: String,
    /// What it picked (`{place}`).
    pub picked: String,
    /// The next best (`{place}`).
    pub runner_up: String,
    /// Nothing was picked (`{reason}`).
    pub no_pick: String,
    /// The two readings disagreed.
    pub tie: String,
    /// Opens the JSON block a seat ended its answer with.
    pub structured: String,
    /// Why it picked that.
    pub reasons: String,
    /// What was held against it.
    pub dissent: String,
    /// Who changed their mind.
    pub flips: String,
    /// Where it sent the question (`{place}`).
    pub routed: String,
    /// It asked for a Council.
    pub escalated: String,
    /// Opens that Council.
    pub open_council: String,
    /// The room did not finish (`{reason}`).
    pub failed: String,
}

/// The devtools' shared text; each devtool's own name and lines are `nav`.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct DevtoolsCopy {
    /// Marker on a devtool that is not built yet.
    pub planned: String,
    /// What a planned devtool's page says.
    pub planned_body: String,
    /// The Action log devtool's own text (its name and lines are `nav`).
    pub action_log: ActionLogCopy,
}

/// The Action log devtool: today's wrapped app actions, tailed live.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct ActionLogCopy {
    /// Label of the filter field.
    pub filter_label: String,
    /// Hint inside the empty filter field.
    pub filter_placeholder: String,
    /// Accessible name of the list of log lines.
    pub log_label: String,
    /// Shown while today's log has no lines yet.
    pub empty: String,
    /// Shown when lines exist but none match the filter.
    pub no_match: String,
    /// Button: open the folder that holds every day's action log.
    pub open_folder: String,
    /// What that folder holds, beside the button.
    pub open_folder_body: String,
}

/// Text owned by the app's layouts.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct LayoutCopy {
    /// The app sidebar.
    pub sidebar: SidebarCopy,
}

/// Copy for the auth shell — sign-in route, sign-up route, sign-out
/// affordances, error templates, "cloud not yet configured" empty state.
///
/// One struct covers both routes (sign-in + sign-up) and the headers
/// in the post-login screen because they all share the same vocabulary
/// surface ("account," "password," "sign in," "sign out"). Customer
/// copy — layman English only, no jargon like "credentials," "session,"
/// "JWT."
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct AuthCopy {
    // ── Sign-in route ──────────────────────────────────────────────
    /// Page heading on the sign-in route.
    pub sign_in_heading: String,
    /// Subtitle below the sign-in heading.
    pub sign_in_subtitle: String,
    /// Visible button label that submits the sign-in form.
    pub sign_in_submit_label: String,
    /// `aria-label` on the sign-in submit button.
    pub sign_in_submit_aria: String,
    /// Button label rendered while the sign-in request is in flight.
    pub sign_in_submit_busy_label: String,

    // ── Sign-up route ──────────────────────────────────────────────
    /// Page heading on the sign-up route.
    pub sign_up_heading: String,
    /// Subtitle below the sign-up heading.
    pub sign_up_subtitle: String,
    /// Visible button label that submits the sign-up form.
    pub sign_up_submit_label: String,
    /// `aria-label` on the sign-up submit button.
    pub sign_up_submit_aria: String,
    /// Button label rendered while the sign-up request is in flight.
    pub sign_up_submit_busy_label: String,
    /// Heading shown after a successful sign-up while the user is
    /// waiting for the email confirmation link.
    pub sign_up_confirmation_heading: String,
    /// Body shown after a successful sign-up. Placeholder `{email}`
    /// renders the address we sent the confirmation link to.
    pub sign_up_confirmation_body_template: String,

    // ── Form fields ────────────────────────────────────────────────
    /// Label above the email input.
    pub email_label: String,
    /// Placeholder inside the email input.
    pub email_placeholder: String,
    /// `aria-label` on the email input.
    pub email_aria: String,
    /// Label above the password input.
    pub password_label: String,
    /// Placeholder inside the password input.
    pub password_placeholder: String,
    /// `aria-label` on the password input.
    pub password_aria: String,
    /// Label above the confirm-password input (sign-up only).
    pub confirm_password_label: String,
    /// Placeholder inside the confirm-password input.
    pub confirm_password_placeholder: String,
    /// `aria-label` on the confirm-password input.
    pub confirm_password_aria: String,

    // ── Switch links ───────────────────────────────────────────────
    /// Link on the sign-in route that swaps to the sign-up route.
    pub to_sign_up_link_label: String,
    /// Link on the sign-up route that swaps back to the sign-in route.
    pub to_sign_in_link_label: String,

    // ── Sign-out affordance (post-login surfaces) ──────────────────
    /// Visible "Sign out" button label.
    pub sign_out_label: String,
    /// `aria-label` on the sign-out button.
    pub sign_out_aria: String,

    // ── Errors ─────────────────────────────────────────────────────
    /// Banner text when the user tries to submit with empty fields.
    pub error_credentials_required: String,
    /// Banner text when the two password inputs don't match on sign-up.
    pub error_passwords_dont_match: String,
    /// Banner text when Supabase rejects the credentials. Deliberately
    /// vague — doesn't reveal whether the email or password was wrong
    /// (auth UX standard).
    pub error_invalid_credentials: String,
    /// Banner text when the sign-in request can't reach Supabase
    /// (network / DNS / cloud outage).
    pub error_network: String,
    /// Banner text when this copy of `DevPulse` has no sign-in configured
    /// (no anon key in `[integrations.cloud.auth]` or the keychain).
    pub error_supabase_not_configured: String,
    /// Catch-all template for unexpected errors. Placeholder `{error}`.
    pub error_unknown_template: String,
}

/// The whole catalog.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct CopyCatalog {
    /// First run.
    pub onboarding: OnboardingCopy,
    /// Forms.
    pub forms: FormsCopy,
    /// Layouts.
    pub layout: LayoutCopy,
    /// Devtools.
    pub devtools: DevtoolsCopy,
    /// The chat.
    pub chat: ChatCopy,
    /// Settings → Memory.
    pub memory: MemoryCopy,
    /// The `DevPulse` account: sign-in, sign-up, sign-out (moved from the
    /// model-loader wizard copy; auth is not AI, so its text is the engine's).
    pub auth: AuthCopy,
    /// Route names, keyed by the URL path the route folders give
    /// (`/devtools/system/datastores/turso`). The desktop's architecture
    /// test holds these keys equal to its route tree.
    pub nav: BTreeMap<String, RouteCopy>,
}

/// The catalog in effect, and why your file was not used (if it wasn't).
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LoadedCopy {
    /// The catalog.
    pub copy: CopyCatalog,
    /// Why your `copy.toml` was not used; `None` when it was, or there is none.
    pub override_problem: Option<String>,
}

/// Where your overrides live.
#[must_use]
pub fn override_path(data_dir: &Path) -> PathBuf {
    data_dir.join("config").join("copy.toml")
}

/// Overlay `over` onto `base`, table by table; any other value replaces.
fn merge(base: &mut toml::Value, over: toml::Value) {
    match (base, over) {
        (toml::Value::Table(base), toml::Value::Table(over)) => {
            for (key, value) in over {
                match base.get_mut(&key) {
                    Some(existing) => merge(existing, value),
                    None => {
                        base.insert(key, value);
                    }
                }
            }
        }
        (base, over) => *base = over,
    }
}

fn bundled_value() -> Result<toml::Value> {
    toml::from_str(BUNDLED).context("bundled copy catalog")
}

/// The bundled catalog.
///
/// # Errors
/// Only if the bundled file is broken, which its test rules out.
pub fn bundled() -> Result<CopyCatalog> {
    bundled_value()?.try_into().context("bundled copy catalog")
}

/// Merge your overrides onto the bundled catalog.
///
/// # Errors
/// Returns an error if your text is not TOML, or names a key or type the
/// catalog does not have.
pub fn with_overrides(override_text: &str) -> Result<CopyCatalog> {
    let mut value = bundled_value()?;
    let over: toml::Value = toml::from_str(override_text).context("read your copy.toml")?;
    merge(&mut value, over);
    value.try_into().context("your copy.toml")
}

/// The catalog with your overrides, or the bundled one and the reason your
/// file was not used.
///
/// # Errors
/// Only if the bundled catalog is broken.
pub fn load(data_dir: &Path) -> Result<LoadedCopy> {
    let path = override_path(data_dir);
    let override_problem = match std::fs::read_to_string(&path) {
        Ok(text) => match with_overrides(&text) {
            Ok(copy) => {
                return Ok(LoadedCopy {
                    copy,
                    override_problem: None,
                });
            }
            Err(e) => Some(format!("{} was not used: {e:#}", path.display())),
        },
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
        Err(e) => Some(format!("{} could not be read: {e}", path.display())),
    };
    if let Some(reason) = &override_problem {
        tracing::warn!(target: "copy", %reason, "copy override rejected");
    }
    Ok(LoadedCopy {
        copy: bundled()?,
        override_problem,
    })
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    #[test]
    fn bundled_catalog_is_complete() {
        let copy = bundled().expect("bundled");
        assert_ne!(copy.onboarding.welcome.title, "");
        assert!(copy.onboarding.common.progress.contains("{current}"));
    }

    #[test]
    fn your_keys_win_and_the_rest_keep_their_defaults() {
        let copy = with_overrides("[onboarding.welcome]\ncta = \"Start\"\n").expect("override");
        assert_eq!(copy.onboarding.welcome.cta, "Start");
        assert_eq!(
            copy.onboarding.welcome.title,
            bundled().unwrap().onboarding.welcome.title
        );
    }

    #[test]
    fn every_route_has_a_name() {
        let copy = bundled().expect("bundled");
        assert!(copy.nav.contains_key("/devpulse"));
        for (path, route) in &copy.nav {
            assert!(path.starts_with('/'), "{path}");
            assert!(!route.label.trim().is_empty(), "{path} has no label");
        }
    }

    #[test]
    fn your_route_name_wins() {
        let copy = with_overrides("[nav.\"/devpulse\"]\nlabel = \"Start\"\n").expect("override");
        assert_eq!(copy.nav["/devpulse"].label, "Start");
        assert_eq!(
            copy.nav["/latest"].label,
            bundled().unwrap().nav["/latest"].label
        );
    }

    #[test]
    fn unknown_keys_and_wrong_types_are_refused_with_the_reason() {
        let unknown = with_overrides("[onboarding.welcome]\nctaa = \"x\"\n").unwrap_err();
        assert!(format!("{unknown:#}").contains("ctaa"), "{unknown:#}");
        assert!(with_overrides("[onboarding.welcome]\ncta = 3\n").is_err());
    }
}
