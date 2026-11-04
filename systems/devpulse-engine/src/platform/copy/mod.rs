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

/// One choice in a Voice Lab list.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct VoiceLabOptionCopy {
    /// What is saved.
    pub value: String,
    /// What you see.
    pub label: String,
}

/// Voice Lab: the TTS Setup tab.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct VoiceLabTtsCopy {
    /// Why no text-to-speech endpoint can be chosen. Placeholder `{slot}`.
    pub endpoint_unavailable: String,
    /// Heading over the slot cards.
    pub runtime_title: String,
    /// The output slot's name when the registry has none.
    pub output_fallback: String,
    /// Button that loads the output slot.
    pub load_output: String,
    /// The conversation slot's name when the registry has none.
    pub conversation_fallback: String,
    /// What the conversation slot is for. Placeholder `{brain}`.
    pub conversation_note: String,
    /// Heading over the voices. Placeholder `{count}`.
    pub preview_title: String,
    /// Label of the voice filter.
    pub filter_label: String,
    /// Filter: every voice.
    pub filter_all: String,
    /// Filter: female voices.
    pub filter_female: String,
    /// Filter: male voices.
    pub filter_male: String,
    /// Filter: neutral voices.
    pub filter_neutral: String,
    /// The voice registry did not load. Placeholder `{error}`.
    pub registry_failed: String,
    /// The registry is empty.
    pub no_voices: String,
    /// Label of the speed slider.
    pub speed: String,
    /// The speed shown beside the slider. Placeholder `{speed}`.
    pub speed_value: String,
    /// Heading of the audio file card.
    pub file_title: String,
    /// What the audio file card does.
    pub file_hint: String,
    /// Title of the native file picker.
    pub pick_title: String,
    /// Button: pick a file and transcribe it.
    pub upload_transcribe: String,
    /// Button: pick a file and run speech-to-speech on it.
    pub run_sts: String,
    /// Heading of the transcript result.
    pub transcript: String,
    /// Heading of the reply result.
    pub reply: String,
    /// Label before the default voice.
    pub default_voice: String,
    /// Shown when no default voice is set.
    pub no_default: String,
    /// While the default voice saves.
    pub saving: String,
    /// Button that saves the default voice.
    pub set_default: String,
}

/// Voice Lab: the STT Setup tab.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct VoiceLabSttCopy {
    /// Why no speech-to-text endpoint can be chosen. Placeholder `{slot}`.
    pub endpoint_unavailable: String,
    /// The input slot's name when the registry has none.
    pub input_fallback: String,
    /// Label of the language list.
    pub language: String,
    /// Button that loads the input slot.
    pub load: String,
    /// Heading of the microphone card.
    pub mic_title: String,
    /// A microphone answered.
    pub mic_detected: String,
    /// No microphone answered.
    pub mic_missing: String,
    /// Label of the level meter.
    pub level: String,
    /// The measured levels. Placeholders `{peak}`, `{avg}`, `{floor}`.
    pub levels: String,
    /// While the microphone records.
    pub recording: String,
    /// Button that tests the microphone.
    pub test_mic: String,
    /// Label of the VAD slider.
    pub vad: String,
    /// What the VAD slider does.
    pub vad_hint: String,
    /// Button that saves the settings.
    pub save: String,
    /// Button that discards unsaved settings.
    pub reset: String,
    /// What saving the settings does today.
    pub settings_note: String,
    /// Heading of the runtime note.
    pub note_title: String,
    /// The runtime note. Placeholder `{slot}`.
    pub note_body: String,
    /// The note's button once loaded.
    pub ready: String,
    /// The note's button before loading.
    pub load_now: String,
    /// The languages you can pick.
    pub languages: Vec<VoiceLabOptionCopy>,
}

/// Voice Lab: the Profiles tab.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct VoiceLabProfilesCopy {
    /// Heading.
    pub title: String,
    /// Button that starts a new profile.
    pub new: String,
    /// Marks the active profile.
    pub active: String,
    /// One profile's settings. Placeholders `{voice}`, `{quality}`.
    pub summary: String,
    /// Button that activates a profile.
    pub activate: String,
    /// Button that edits a profile.
    pub edit: String,
    /// Button that deletes a profile.
    pub delete: String,
    /// Label of the name field.
    pub name: String,
    /// Label of the voice list.
    pub voice: String,
    /// Label of the quality list.
    pub quality: String,
    /// Button that saves the profile being edited.
    pub save: String,
    /// Button that drops the profile being edited.
    pub cancel: String,
    /// What a profile does today.
    pub settings_note: String,
    /// The STT qualities you can pick.
    pub qualities: Vec<VoiceLabOptionCopy>,
}

/// Voice Lab: the Test Bench tab.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct VoiceLabTestCopy {
    /// Heading of the speech test.
    pub tts_title: String,
    /// The line it starts with.
    pub default_text: String,
    /// Placeholder of the text box.
    pub placeholder: String,
    /// The voice in use. Placeholder `{voice}`.
    pub voice_line: String,
    /// Button that speaks.
    pub speak: String,
    /// Button that stops speaking.
    pub stop: String,
    /// How long it took. Placeholder `{ms}`.
    pub latency: String,
    /// Heading of the transcription test.
    pub stt_title: String,
    /// While the microphone listens.
    pub listening: String,
    /// Button that records and transcribes.
    pub record: String,
    /// Label over the transcription.
    pub transcription: String,
    /// Heading of the smoke test.
    pub smoke_title: String,
    /// What the smoke test does.
    pub smoke_hint: String,
    /// While the smoke test runs.
    pub running: String,
    /// Button that runs the smoke test.
    pub run_smoke: String,
    /// The speech stage worked.
    pub tts_ok: String,
    /// The speech stage failed.
    pub tts_failed: String,
    /// The transcription stage worked.
    pub stt_ok: String,
    /// The transcription stage failed.
    pub stt_failed: String,
    /// The line spoken. Placeholder `{text}`.
    pub spoken: String,
    /// The line heard. Placeholder `{text}`.
    pub transcript: String,
    /// How long the round trip took. Placeholder `{ms}`.
    pub duration: String,
}

/// The Voice Lab.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct VoiceLabCopy {
    /// Tab: TTS Setup.
    pub tab_tts: String,
    /// Tab: STT Setup.
    pub tab_stt: String,
    /// Tab: Profiles.
    pub tab_profiles: String,
    /// Tab: Test Bench.
    pub tab_test: String,
    /// Button that clears an error.
    pub dismiss: String,
    /// A slot's identity. Placeholder `{slot}`.
    pub slot_line: String,
    /// A slot's state. Placeholders `{state}`, `{runtime}`, `{loading}`.
    pub slot_status: String,
    /// The slot is not in the registry.
    pub slot_not_found: String,
    /// The slot has a model you assigned.
    pub slot_assigned: String,
    /// The slot has a bundled default.
    pub slot_bundled: String,
    /// The slot has no model.
    pub slot_unassigned: String,
    /// The slot is loaded.
    pub loaded: String,
    /// The slot is not loaded.
    pub not_loaded: String,
    /// The slot names no backend.
    pub unknown_backend: String,
    /// The slot names no loading strategy.
    pub unknown_loading: String,
    /// The TTS Setup tab.
    pub tts: VoiceLabTtsCopy,
    /// The STT Setup tab.
    pub stt: VoiceLabSttCopy,
    /// The Profiles tab.
    pub profiles: VoiceLabProfilesCopy,
    /// The Test Bench tab.
    pub test: VoiceLabTestCopy,
}

/// The `DevPulse` hub dashboard: the owner's tabs and system stats.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct HubsDashboardCopy {
    /// Overview tab.
    pub tab_overview: String,
    /// Wireless tab.
    pub tab_wireless: String,
    /// WAN/LAN tab.
    pub tab_wan_lan: String,
    /// Uptime stat.
    pub uptime: String,
    /// CPU stat.
    pub cpu: String,
    /// Memory stat.
    pub memory: String,
    /// Network stat.
    pub network: String,
    /// A value no backend supplies yet.
    pub unavailable: String,
    /// Wireless tab heading.
    pub wireless_title: String,
    /// What the Wireless tab is for.
    pub wireless_body: String,
    /// WAN/LAN tab heading.
    pub wan_lan_title: String,
    /// What the WAN/LAN tab is for.
    pub wan_lan_body: String,
    /// Says plainly that a tab has nothing behind it yet.
    pub no_backend: String,
}

/// The status bar's added zones. `{state}` and `{value}` are filled in.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct HubsStatusBarCopy {
    /// "Clyffy: {state}".
    pub clyffy: String,
    /// "CPU: {value}%".
    pub cpu: String,
    /// "MEM: {value}".
    pub memory: String,
}

/// The top bar's search and floating chat button.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct HubsTopBarCopy {
    /// The search field's placeholder.
    pub search_placeholder: String,
    /// Says that search has nothing behind it yet.
    pub search_unavailable: String,
    /// The button that opens the floating chat panel.
    pub chat_overlay: String,
}

/// The floating chat panel in the main window.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct HubsChatOverlayCopy {
    /// Panel title, and the name on answers without an agent's name.
    pub title: String,
    /// The message field's placeholder.
    pub placeholder: String,
    /// Shown while messages load.
    pub loading: String,
    /// Shown when there are no messages.
    pub empty: String,
    /// Minimize button.
    pub minimize: String,
    /// Expand button.
    pub expand: String,
    /// Close button.
    pub close: String,
    /// Send button.
    pub send: String,
    /// Send button before the platform is ready.
    pub waiting: String,
    /// The voice button, which has nothing behind it here yet.
    pub voice_unavailable: String,
}

/// The boot views, friendly and technical.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct HubsBootCopy {
    /// The name at the top of the friendly view.
    pub wordmark: String,
    /// A step that finished.
    pub status_ready: String,
    /// A step that is running.
    pub status_loading: String,
    /// A step that failed.
    pub status_failed: String,
    /// A step that was skipped.
    pub status_skipped: String,
    /// A step that has not started.
    pub status_waiting: String,
    /// Bottom message: something failed.
    pub message_failed: String,
    /// Bottom message: done.
    pub message_ready: String,
    /// Bottom message: from 75%.
    pub message_almost: String,
    /// Bottom message: from 50%.
    pub message_workspace: String,
    /// Bottom message: before 50%.
    pub message_starting: String,
    /// Technical view banner; `{version}` is filled in.
    pub title: String,
    /// The boot log's accessible name.
    pub log_label: String,
    /// Log heading while booting.
    pub section_boot: String,
    /// Log heading when ready.
    pub section_ready: String,
    /// Log line when ready.
    pub platform_healthy: String,
    /// `{elapsed}` spent across the steps.
    pub total: String,
    /// Technical view footer when a step failed.
    pub errors_detected: String,
}

/// The owner's hubs and boot experience, restored (plan 0009).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct HubsCopy {
    /// The `DevPulse` hub dashboard.
    pub dashboard: HubsDashboardCopy,
    /// The status bar.
    pub statusbar: HubsStatusBarCopy,
    /// The top bar.
    pub topbar: HubsTopBarCopy,
    /// The floating chat panel.
    pub chat_overlay: HubsChatOverlayCopy,
    /// The boot views.
    pub boot: HubsBootCopy,
}

// ── Setup wizard copy (plan 0009) ──

/// Setup wizard text for one kind of model.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardCapabilityCopy {
    /// Its layman name.
    pub label: String,
    /// What it does.
    pub desc: String,
}

/// Setup wizard text for one slot.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardSlotWordsCopy {
    /// Its layman name.
    pub label: String,
    /// Its short name in sentences.
    pub friendly_name: String,
    /// What it does.
    pub desc: String,
}

/// Setup wizard text: shell.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardShellCopy {
    /// Text: kicker.
    pub kicker: String,
    /// Text: title.
    pub title: String,
    /// Text: setup button.
    pub setup_button: String,
    /// Text: setup aria.
    pub setup_aria: String,
    /// Text: close aria.
    pub close_aria: String,
    /// Text: progress aria.
    pub progress_aria: String,
}

/// Setup wizard text: repair.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardRepairCopy {
    /// Text: downloading.
    pub downloading: String,
    /// Text: missing title.
    pub missing_title: String,
    /// Text: missing copy.
    pub missing_copy: String,
    /// Text: missing badge.
    pub missing_badge: String,
    /// Text: redownload.
    pub redownload: String,
    /// Text: downloading short.
    pub downloading_short: String,
    /// Text: pick different.
    pub pick_different: String,
    /// Text: skip.
    pub skip: String,
    /// Text: resolved.
    pub resolved: String,
    /// Text: continue.
    pub r#continue: String,
    /// Text: no source.
    pub no_source: String,
    /// Text: hardware title.
    pub hardware_title: String,
    /// Text: hardware copy.
    pub hardware_copy: String,
    /// Text: redetect.
    pub redetect: String,
    /// Text: keep current.
    pub keep_current: String,
}

/// Setup wizard text: validate.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardValidateCopy {
    /// Text: voice on.
    pub voice_on: String,
    /// Text: voice off.
    pub voice_off: String,
    /// Text: voice unavailable.
    pub voice_unavailable: String,
}

/// Setup wizard text: slot card.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardSlotCardCopy {
    /// Text: empty.
    pub empty: String,
    /// Text: ready.
    pub ready: String,
    /// Text: loading.
    pub loading: String,
    /// Text: warm.
    pub warm: String,
    /// Text: failed.
    pub failed: String,
    /// Text: assigned.
    pub assigned: String,
}

/// Setup wizard text: local.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardLocalCopy {
    /// Text: heading.
    pub heading: String,
    /// Text: intro.
    pub intro: String,
    /// Text: mascot alt.
    pub mascot_alt: String,
    /// Text: loading.
    pub loading: String,
    /// Text: status assigned.
    pub status_assigned: String,
    /// Text: find models.
    pub find_models: String,
    /// Text: assign slots.
    pub assign_slots: String,
    /// Text: guided setup.
    pub guided_setup: String,
}

/// Setup wizard text: preset card.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardPresetCardCopy {
    /// Text: title.
    pub title: String,
    /// Text: cpu label.
    pub cpu_label: String,
    /// Text: tier.
    pub tier: String,
    /// Text: on computer.
    pub on_computer: String,
    /// Text: download needed.
    pub download_needed: String,
    /// Text: to download one.
    pub to_download_one: String,
    /// Text: to download many.
    pub to_download_many: String,
    /// Text: already on disk.
    pub already_on_disk: String,
    /// Text: all downloaded.
    pub all_downloaded: String,
    /// Text: setting up.
    pub setting_up: String,
    /// Text: download and setup.
    pub download_and_setup: String,
    /// Text: set up now.
    pub set_up_now: String,
}

/// Setup wizard text: models step.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardModelsStepCopy {
    /// Text: guidance.
    pub guidance: String,
    /// Text: help tip.
    pub help_tip: String,
    /// Text: help button.
    pub help_button: String,
    /// Text: help summary.
    pub help_summary: String,
    /// Text, one per point: help points.
    pub help_points: Vec<String>,
    /// Text: loading alt.
    pub loading_alt: String,
    /// Text: loading title.
    pub loading_title: String,
    /// Text: hardware fallback.
    pub hardware_fallback: String,
    /// Text: loading copy.
    pub loading_copy: String,
    /// Text: error title.
    pub error_title: String,
    /// Text: brain options.
    pub brain_options: String,
    /// Text: brain tip.
    pub brain_tip: String,
    /// Text: brain copy.
    pub brain_copy: String,
    /// Text: vram estimate.
    pub vram_estimate: String,
    /// Text: active preset.
    pub active_preset: String,
    /// Text: baseline kicker.
    pub baseline_kicker: String,
    /// Text: baseline tip.
    pub baseline_tip: String,
    /// Text: baseline copy.
    pub baseline_copy: String,
    /// Text: guidance kicker.
    pub guidance_kicker: String,
    /// Text: guidance copy.
    pub guidance_copy: String,
    /// Text: no assigned.
    pub no_assigned: String,
    /// Text: no preset.
    pub no_preset: String,
    /// Text: on disk.
    pub on_disk: String,
    /// Text: recommended size.
    pub recommended_size: String,
    /// Text: manual pick.
    pub manual_pick: String,
    /// Text: use recommended.
    pub use_recommended: String,
    /// Text: download recommended.
    pub download_recommended: String,
    /// Text: find best fit.
    pub find_best_fit: String,
    /// Text: browse.
    pub browse: String,
    /// Text: search hf.
    pub search_hf: String,
    /// Text: live kicker.
    pub live_kicker: String,
    /// Text: live downloads.
    pub live_downloads: String,
    /// Text: live applying.
    pub live_applying: String,
    /// Text: live assigning.
    pub live_assigning: String,
    /// Text: error real title.
    pub error_real_title: String,
    /// Text: some failed.
    pub some_failed: String,
    /// Text: setup failed.
    pub setup_failed: String,
    /// Text: retry unavailable.
    pub retry_unavailable: String,
    /// Text: slot updated.
    pub slot_updated: String,
    /// Text: not in registry.
    pub not_in_registry: String,
    /// Text: now recommended.
    pub now_recommended: String,
    /// Text: group reasoning title.
    pub group_reasoning_title: String,
    /// Text: group reasoning subtitle.
    pub group_reasoning_subtitle: String,
    /// Text: group observation title.
    pub group_observation_title: String,
    /// Text: group observation subtitle.
    pub group_observation_subtitle: String,
    /// Text: group encoder title.
    pub group_encoder_title: String,
    /// Text: group encoder subtitle.
    pub group_encoder_subtitle: String,
    /// Text: group voice title.
    pub group_voice_title: String,
    /// Text: group voice subtitle.
    pub group_voice_subtitle: String,
    /// Text by key: state labels.
    pub state_labels: BTreeMap<String, String>,
    /// Text by key: slot tips.
    pub slot_tips: BTreeMap<String, String>,
}

/// Setup wizard text: browse step.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardBrowseStepCopy {
    /// Text: back.
    pub back: String,
    /// Text: title.
    pub title: String,
    /// Text: subtitle.
    pub subtitle: String,
    /// Text: help tip.
    pub help_tip: String,
    /// Text: help button.
    pub help_button: String,
    /// Text: help title.
    pub help_title: String,
    /// Text: help summary.
    pub help_summary: String,
    /// Text, one per point: help points.
    pub help_points: Vec<String>,
    /// Text: baseline aria.
    pub baseline_aria: String,
    /// Text: baseline kicker.
    pub baseline_kicker: String,
    /// Text: baseline copy.
    pub baseline_copy: String,
    /// Text: hardware aria.
    pub hardware_aria: String,
    /// Text: gpu free.
    pub gpu_free: String,
    /// Text: cpu only.
    pub cpu_only: String,
    /// Text: ram.
    pub ram: String,
    /// Text: disk free.
    pub disk_free: String,
    /// Text: recommended.
    pub recommended: String,
    /// Text: manage.
    pub manage: String,
    /// Text: browse.
    pub browse: String,
    /// Text: search hf.
    pub search_hf: String,
    /// Text: tab local.
    pub tab_local: String,
    /// Text: tab online.
    pub tab_online: String,
    /// Text: downloading.
    pub downloading: String,
    /// Text: group empty.
    pub group_empty: String,
    /// Text: download from hf.
    pub download_from_hf: String,
    /// Text: use for.
    pub use_for: String,
    /// Text: importing.
    pub importing: String,
    /// Text: import.
    pub import: String,
    /// Text: dismiss.
    pub dismiss: String,
    /// Text: done.
    pub done: String,
    /// Text: no assigned.
    pub no_assigned: String,
    /// Text: imported.
    pub imported: String,
    /// Text: import failed.
    pub import_failed: String,
    /// Text: assigned to.
    pub assigned_to: String,
    /// Text: capability other.
    pub capability_other: String,
    /// Text: group reasoning title.
    pub group_reasoning_title: String,
    /// Text: group reasoning desc.
    pub group_reasoning_desc: String,
    /// Text: group encoder title.
    pub group_encoder_title: String,
    /// Text: group encoder desc.
    pub group_encoder_desc: String,
    /// Text: group voice title.
    pub group_voice_title: String,
    /// Text: group voice desc.
    pub group_voice_desc: String,
    /// Text: group observation title.
    pub group_observation_title: String,
    /// Text: group observation desc.
    pub group_observation_desc: String,
    /// Text by key: state labels.
    pub state_labels: BTreeMap<String, String>,
    /// Text by key: capabilities.
    pub capabilities: BTreeMap<String, SetupWizardCapabilityCopy>,
}

/// Setup wizard text: swap popup.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardSwapPopupCopy {
    /// Text: manage aria.
    pub manage_aria: String,
    /// Text: kicker.
    pub kicker: String,
    /// Text: what does.
    pub what_does: String,
    /// Text: close.
    pub close: String,
    /// Text: knowledge drop.
    pub knowledge_drop: String,
    /// Text: callout recommended.
    pub callout_recommended: String,
    /// Text: callout local.
    pub callout_local: String,
    /// Text: callout search.
    pub callout_search: String,
    /// Text, one per point: drops recommended.
    pub drops_recommended: Vec<String>,
    /// Text, one per point: drops local.
    pub drops_local: Vec<String>,
    /// Text, one per point: drops search.
    pub drops_search: Vec<String>,
    /// Text: source aria.
    pub source_aria: String,
    /// Text: tab recommended.
    pub tab_recommended: String,
    /// Text: tab local.
    pub tab_local: String,
    /// Text: tab search.
    pub tab_search: String,
    /// Text: preset title.
    pub preset_title: String,
    /// Text: preset copy.
    pub preset_copy: String,
    /// Text: preset tip label.
    pub preset_tip_label: String,
    /// Text: rec meta.
    pub rec_meta: String,
    /// Text: rec on disk.
    pub rec_on_disk: String,
    /// Text: rec download.
    pub rec_download: String,
    /// Text: working.
    pub working: String,
    /// Text: use recommended.
    pub use_recommended: String,
    /// Text: download recommended.
    pub download_recommended: String,
    /// Text: no pick title.
    pub no_pick_title: String,
    /// Text: no pick copy.
    pub no_pick_copy: String,
    /// Text: browse local.
    pub browse_local: String,
    /// Text: search online.
    pub search_online: String,
    /// Text: local title.
    pub local_title: String,
    /// Text: local copy.
    pub local_copy: String,
    /// Text: free vram.
    pub free_vram: String,
    /// Text: importing.
    pub importing: String,
    /// Text: import file.
    pub import_file: String,
    /// Text: no local title.
    pub no_local_title: String,
    /// Text: no local copy.
    pub no_local_copy: String,
    /// Text: import from file.
    pub import_from_file: String,
    /// Text: local meta.
    pub local_meta: String,
    /// Text: fits.
    pub fits: String,
    /// Text: tight fit.
    pub tight_fit: String,
    /// Text: assigned.
    pub assigned: String,
    /// Text: best local fit.
    pub best_local_fit: String,
    /// Text: search title.
    pub search_title: String,
    /// Text: search copy.
    pub search_copy: String,
    /// Text: token tip label.
    pub token_tip_label: String,
    /// Text: open browser.
    pub open_browser: String,
    /// Text: done.
    pub done: String,
    /// Text: not in registry.
    pub not_in_registry: String,
}

/// Setup wizard text: resources.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardResourcesCopy {
    /// Text: title.
    pub title: String,
    /// Text: gpu vram.
    pub gpu_vram: String,
    /// Text: segment.
    pub segment: String,
    /// Text: over budget.
    pub over_budget: String,
    /// Text: no gpu.
    pub no_gpu: String,
    /// Text: ram.
    pub ram: String,
    /// Text: ram free.
    pub ram_free: String,
    /// Text: disk.
    pub disk: String,
    /// Text: disk free.
    pub disk_free: String,
}

/// Setup wizard text: model browser.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardModelBrowserCopy {
    /// Text: title.
    pub title: String,
    /// Text: close.
    pub close: String,
    /// Text: search placeholder.
    pub search_placeholder: String,
    /// Text: slot label.
    pub slot_label: String,
    /// Text: format label.
    pub format_label: String,
    /// Text: format gguf.
    pub format_gguf: String,
    /// Text: format safetensors.
    pub format_safetensors: String,
    /// Text: format all.
    pub format_all: String,
    /// Text: fits only.
    pub fits_only: String,
    /// Text: recommended for.
    pub recommended_for: String,
    /// Text: download aria.
    pub download_aria: String,
    /// Text: get.
    pub get: String,
    /// Text: searching.
    pub searching: String,
    /// Text: results.
    pub results: String,
    /// Text: no results.
    pub no_results: String,
    /// Text: local heading.
    pub local_heading: String,
    /// Text: import aria.
    pub import_aria: String,
    /// Text: import path.
    pub import_path: String,
    /// Text: symlink aria.
    pub symlink_aria: String,
    /// Text: symlink.
    pub symlink: String,
    /// Text: fit green.
    pub fit_green: String,
    /// Text: fit yellow.
    pub fit_yellow: String,
    /// Text: fit red.
    pub fit_red: String,
    /// Text: fit gray.
    pub fit_gray: String,
}

/// Setup wizard text: loader step.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardLoaderStepCopy {
    /// Text: title.
    pub title: String,
    /// Text: intro.
    pub intro: String,
    /// Text: gpu free.
    pub gpu_free: String,
    /// Text: no gpu.
    pub no_gpu: String,
    /// Text: back.
    pub back: String,
    /// Text: continue.
    pub r#continue: String,
}

/// Setup wizard text: tips.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardAssignmentTipsCopy {
    /// Text: ready active.
    pub ready_active: String,
    /// Text: ready assigned.
    pub ready_assigned: String,
    /// Text: ready empty.
    pub ready_empty: String,
    /// Text: auto.
    pub auto: String,
    /// Text: review.
    pub review: String,
    /// Text: device unavailable.
    pub device_unavailable: String,
    /// Text: detail.
    pub detail: String,
    /// Text: delete.
    pub delete: String,
    /// Text: fit green.
    pub fit_green: String,
    /// Text: fit yellow.
    pub fit_yellow: String,
    /// Text: fit red.
    pub fit_red: String,
    /// Text: fit gray.
    pub fit_gray: String,
    /// Text: context unavailable.
    pub context_unavailable: String,
    /// Text: download.
    pub download: String,
    /// Text: change.
    pub change: String,
    /// Text: pick.
    pub pick: String,
    /// Text: load.
    pub load: String,
    /// Text: unload.
    pub unload: String,
    /// Text: configure.
    pub configure: String,
    /// Text: import.
    pub import: String,
    /// Text: gguf.
    pub gguf: String,
    /// Text: safetensors.
    pub safetensors: String,
}

/// Setup wizard text: assignment.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardAssignmentCopy {
    /// Text: format unknown.
    pub format_unknown: String,
    /// Text: hw gpu.
    pub hw_gpu: String,
    /// Text: hw cpu.
    pub hw_cpu: String,
    /// Text: hw ram.
    pub hw_ram: String,
    /// Text: hw disk.
    pub hw_disk: String,
    /// Text: auto aria.
    pub auto_aria: String,
    /// Text: auto button.
    pub auto_button: String,
    /// Text: review aria.
    pub review_aria: String,
    /// Text: review button.
    pub review_button: String,
    /// Text: browse aria.
    pub browse_aria: String,
    /// Text: browse button.
    pub browse_button: String,
    /// Text: active count.
    pub active_count: String,
    /// Text: suggested on disk.
    pub suggested_on_disk: String,
    /// Text: suggested download.
    pub suggested_download: String,
    /// Text: device aria.
    pub device_aria: String,
    /// Text: device gpu.
    pub device_gpu: String,
    /// Text: device cpu.
    pub device_cpu: String,
    /// Text: status ready.
    pub status_ready: String,
    /// Text: status loading.
    pub status_loading: String,
    /// Text: status failed.
    pub status_failed: String,
    /// Text: status assigned.
    pub status_assigned: String,
    /// Text: status empty.
    pub status_empty: String,
    /// Text: found one.
    pub found_one: String,
    /// Text: found many.
    pub found_many: String,
    /// Text: use for aria.
    pub use_for_aria: String,
    /// Text: use file.
    pub use_file: String,
    /// Text: detail aria.
    pub detail_aria: String,
    /// Text: delete aria.
    pub delete_aria: String,
    /// Text: context.
    pub context: String,
    /// Text: context aria.
    pub context_aria: String,
    /// Text: tokens.
    pub tokens: String,
    /// Text: recommended.
    pub recommended: String,
    /// Text: rec cpu.
    pub rec_cpu: String,
    /// Text: rec gpu.
    pub rec_gpu: String,
    /// Text: low disk.
    pub low_disk: String,
    /// Text: download aria.
    pub download_aria: String,
    /// Text: download.
    pub download: String,
    /// Text: no model.
    pub no_model: String,
    /// Text: cancel download aria.
    pub cancel_download_aria: String,
    /// Text: cancel.
    pub cancel: String,
    /// Text: retry aria.
    pub retry_aria: String,
    /// Text: retry.
    pub retry: String,
    /// Text: change aria.
    pub change_aria: String,
    /// Text: pick aria.
    pub pick_aria: String,
    /// Text: change.
    pub change: String,
    /// Text: pick.
    pub pick: String,
    /// Text: load aria.
    pub load_aria: String,
    /// Text: load.
    pub load: String,
    /// Text: unload aria.
    pub unload_aria: String,
    /// Text: unload.
    pub unload: String,
    /// Text: configure aria.
    pub configure_aria: String,
    /// Text: configure.
    pub configure: String,
    /// Text: import aria.
    pub import_aria: String,
    /// Text: compatible.
    pub compatible: String,
    /// Text: all.
    pub all: String,
    /// Text: no format.
    pub no_format: String,
    /// Text: none compatible.
    pub none_compatible: String,
    /// Text: assign aria.
    pub assign_aria: String,
    /// Text: vram.
    pub vram: String,
    /// Text: waiting.
    pub waiting: String,
    /// Text: summary.
    pub summary: String,
    /// Text: close dialog.
    pub close_dialog: String,
    /// Text: too large title.
    pub too_large_title: String,
    /// Text: too large copy.
    pub too_large_copy: String,
    /// Text: cancel load aria.
    pub cancel_load_aria: String,
    /// Text: load anyway.
    pub load_anyway: String,
    /// Text: delete title.
    pub delete_title: String,
    /// Text: delete copy.
    pub delete_copy: String,
    /// Text: cancel delete aria.
    pub cancel_delete_aria: String,
    /// Text: delete confirm.
    pub delete_confirm: String,
    /// Text: close detail.
    pub close_detail: String,
    /// Text: detail format.
    pub detail_format: String,
    /// Text: detail architecture.
    pub detail_architecture: String,
    /// Text: detail quantization.
    pub detail_quantization: String,
    /// Text: detail file size.
    pub detail_file_size: String,
    /// Text: detail vram.
    pub detail_vram: String,
    /// Text: detail context.
    pub detail_context: String,
    /// Text: detail fit.
    pub detail_fit: String,
    /// Text: detail compatible.
    pub detail_compatible: String,
    /// Text: detail id.
    pub detail_id: String,
    /// Text: delete detail.
    pub delete_detail: String,
    /// Text: review title.
    pub review_title: String,
    /// Text: review copy.
    pub review_copy: String,
    /// Text: already assigned.
    pub already_assigned: String,
    /// Text: will assign on disk.
    pub will_assign_on_disk: String,
    /// Text: will assign download.
    pub will_assign_download: String,
    /// Text: no recommendation.
    pub no_recommendation: String,
    /// Text: will download.
    pub will_download: String,
    /// Text: on disk one.
    pub on_disk_one: String,
    /// Text: on disk many.
    pub on_disk_many: String,
    /// Text: cancel auto aria.
    pub cancel_auto_aria: String,
    /// Text: approve.
    pub approve: String,
    /// Text by key: capabilities.
    pub capabilities: BTreeMap<String, SetupWizardSlotWordsCopy>,
    /// Text: tips.
    pub tips: SetupWizardAssignmentTipsCopy,
}

/// The model setup flow (restored from the owner's wizard, plan 0009).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct SetupWizardCopy {
    /// Text: shell.
    pub shell: SetupWizardShellCopy,
    /// Text: repair.
    pub repair: SetupWizardRepairCopy,
    /// Text: validate.
    pub validate: SetupWizardValidateCopy,
    /// Text: slot card.
    pub slot_card: SetupWizardSlotCardCopy,
    /// Text: local.
    pub local: SetupWizardLocalCopy,
    /// Text: preset card.
    pub preset_card: SetupWizardPresetCardCopy,
    /// Text: models step.
    pub models_step: SetupWizardModelsStepCopy,
    /// Text: browse step.
    pub browse_step: SetupWizardBrowseStepCopy,
    /// Text: swap popup.
    pub swap_popup: SetupWizardSwapPopupCopy,
    /// Text: resources.
    pub resources: SetupWizardResourcesCopy,
    /// Text: model browser.
    pub model_browser: SetupWizardModelBrowserCopy,
    /// Text: loader step.
    pub loader_step: SetupWizardLoaderStepCopy,
    /// Text: assignment.
    pub assignment: SetupWizardAssignmentCopy,
}

// ── Setup wizard copy end ──

/// A palette category's, block kind's or template's name and line.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct VpbEntryCopy {
    /// Its name.
    pub label: String,
    /// One line about it.
    pub description: String,
}

/// The Visual Page Builder: the V icon, its panel, scan and Builder (its
/// name and lines are `nav`).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct VpbCopy {
    /// The wordmark's first half.
    pub brand_dev: String,
    /// The wordmark's accented half.
    pub brand_pulse: String,
    /// The Inspector tab.
    pub tab_inspector: String,
    /// The Builder tab.
    pub tab_builder: String,
    /// Status while no scan runs.
    pub status_ready: String,
    /// Status while a scan runs.
    pub status_scanning: String,
    /// Status while a scan is paused.
    pub status_paused: String,
    /// The floating panel's drag handle.
    pub drag_label: String,
    /// Minimize button.
    pub minimize: String,
    /// Minimize button, for screen readers.
    pub minimize_label: String,
    /// Close button.
    pub close: String,
    /// Close button, for screen readers.
    pub close_label: String,
    /// The toolbar, for screen readers.
    pub controls_label: String,
    /// Play button.
    pub start_scan: String,
    /// Play button while paused.
    pub resume_scan: String,
    /// Pause button.
    pub pause_scan: String,
    /// Stop button.
    pub stop_scan: String,
    /// Stop button after one press.
    pub force_stop: String,
    /// Detach the panel.
    pub float_panel: String,
    /// Dock the panel.
    pub dock_panel: String,
    /// Opens the full-window builder.
    pub open_workspace: String,
    /// Toast.
    pub toast_scan_resumed: String,
    /// Toast.
    pub toast_scan_started: String,
    /// Toast.
    pub toast_scan_paused: String,
    /// Toast.
    pub toast_scan_force_stopped: String,
    /// Toast.
    pub toast_scan_stopped: String,
    /// Toast.
    pub toast_docked: String,
    /// Toast.
    pub toast_floating: String,
    /// The V icon, for screen readers.
    pub icon_menu_label: String,
    /// The V icon's hover text.
    pub icon_title: String,
    /// Menu: open the panel.
    pub menu_open: String,
    /// Menu: open the panel and start a scan.
    pub menu_scan: String,
    /// Menu: settings (not built yet, shown disabled).
    pub menu_settings: String,
    /// Toast.
    pub toast_restored: String,
    /// Toast.
    pub toast_scan_enabled: String,
    /// Its title.
    pub element_title: String,
    /// Close button.
    pub close_inspector: String,
    /// Its drag handle.
    pub drag_inspector: String,
    /// Row label.
    pub row_tag: String,
    /// Row label.
    pub row_id: String,
    /// Row label.
    pub row_classes: String,
    /// Row label.
    pub row_file: String,
    /// Copy button.
    pub copy_id: String,
    /// Copy button.
    pub copy_classes: String,
    /// Copies the element as AI context.
    pub copy_all: String,
    /// Toast; `{field}` is what was copied.
    pub toast_copied: String,
    /// Toast.
    pub toast_copy_failed: String,
    /// Its heading.
    pub inspector_heading: String,
    /// Empty state: heading about scanning.
    pub inspector_mode_title: String,
    /// Empty state: how a scan works.
    pub inspector_mode_body: String,
    /// Empty state: heading.
    pub no_block: String,
    /// Empty state: what to do.
    pub no_block_body: String,
    /// Section heading.
    pub section_recipe: String,
    /// Section heading.
    pub section_color: String,
    /// Section heading.
    pub section_surface: String,
    /// Section heading.
    pub section_frame: String,
    /// Section heading.
    pub section_depth: String,
    /// Section heading.
    pub section_motion: String,
    /// Section heading.
    pub section_panel: String,
    /// Section heading.
    pub section_slots: String,
    /// A recipe outside the list.
    pub custom_recipe: String,
    /// A setting left at its default.
    pub axis_default: String,
    /// How many blocks a slot holds.
    pub slot_items: String,
    /// Says the Color section cannot edit anything.
    pub color_unavailable: String,
    /// Says the Panel section cannot edit anything.
    pub panel_unavailable: String,
    /// Footer button.
    pub copy: String,
    /// Footer button.
    pub cut: String,
    /// Footer button.
    pub paste: String,
    /// Footer button.
    pub delete: String,
    /// Toast when a slot refuses a block.
    pub refused: String,
    /// Its heading.
    pub builder_heading: String,
    /// How many top-level blocks the document has.
    pub block_count: String,
    /// The palette search.
    pub search_placeholder: String,
    /// Section heading.
    pub templates_heading: String,
    /// Section heading.
    pub palette_heading: String,
    /// Section heading.
    pub tree_heading: String,
    /// Empties the tree.
    pub clear: String,
    /// The tree's top-level drop zone.
    pub root_drop: String,
    /// A loaded document breaks slot rules.
    pub tree_problems: String,
    /// Footer button.
    pub undo: String,
    /// Footer button.
    pub redo: String,
    /// Footer button.
    pub save: String,
    /// Where to find it.
    pub devtool_where: String,
    /// Shown on the Simple display.
    pub devtool_needs_advanced: String,
    /// Health label on the Simple display.
    pub devtool_needs_advanced_short: String,
    /// Switches the display.
    pub devtool_turn_on_advanced: String,
    /// Palette categories, by `ColdLight` category id.
    pub categories: BTreeMap<String, VpbEntryCopy>,
    /// Block kinds, by kind id.
    pub kinds: BTreeMap<String, VpbEntryCopy>,
    /// Block templates, by template id.
    pub templates: BTreeMap<String, VpbEntryCopy>,
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
    /// The Visual Page Builder.
    pub vpb: VpbCopy,
    /// The chat.
    pub chat: ChatCopy,
    /// Settings → Memory.
    pub memory: MemoryCopy,
    /// The `DevPulse` account: sign-in, sign-up, sign-out (moved from the
    /// model-loader wizard copy; auth is not AI, so its text is the engine's).
    pub auth: AuthCopy,
    /// The Voice Lab.
    pub voice_lab: VoiceLabCopy,
    /// The owner's hubs and boot experience.
    pub hubs: HubsCopy,
    /// The model setup flow.
    pub setup_wizard: SetupWizardCopy,
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
