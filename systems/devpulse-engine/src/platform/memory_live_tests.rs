//! Your notes through the engine's own threads and rooms, with real agents
//! (plan 0001 B6.3e): the same code the app's commands call, on a throwaway
//! database and in a throwaway project, so this repo's hooks do not run and your
//! real memory and history are not touched. Stop the app first: starting
//! `Agents` clears the data folder's session files. Run with
//! `DEVPULSE_DATA_DIR=<the DevPulse data folder>
//! DEVPULSE_MEMORY_RELAY=<the built devpulse-persona-mcp> cargo test -p
//! devpulse-engine --lib real_thread_and_room -- --ignored --nocapture`, with
//! `CLAUDECODE` unset, as `DevPulse` runs.
#![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

use std::time::Duration;

use devpulse_clyffy::cortex::persistence::{SqlAdapter, SqlValue, TursoOptions};
use devpulse_clyffy::providers::ProviderId;

use super::*;
use crate::platform::agenthub::live::LiveState;
use crate::platform::agents::{AgentEvent, Agents};
use crate::platform::projects::{CreateProjectInput, Projects};
use crate::platform::providers::Providers;
use crate::platform::rooms::{Assignment, RoomEvent, Rooms};
use crate::platform::services::relational::{RelationalService, USER_STORE};

const ASK_FOR_THE_CODEWORD: &str = "Without using any tool, reply with only the codeword in the \
    notes you were given about this project and nothing else. If you were given no codeword, \
    reply exactly NONE.";

fn codeword(prefix: &str) -> String {
    let id = uuid::Uuid::now_v7().simple().to_string();
    format!("{prefix}-{}", &id[id.len() - 8..])
}

/// A throwaway project with one note you approved and one held back.
struct Fixture {
    _scratch: tempfile::TempDir,
    _store: RelationalService,
    db: Arc<TursoAdapter>,
    data_dir: PathBuf,
    agents: Arc<Agents>,
    project: String,
    approved: String,
    held_back: String,
}

impl Fixture {
    async fn start() -> Self {
        let data_dir = PathBuf::from(std::env::var("DEVPULSE_DATA_DIR").expect("data folder"));
        let relay = PathBuf::from(std::env::var("DEVPULSE_MEMORY_RELAY").expect("relay"));
        let scratch = tempfile::tempdir().unwrap();
        let store = RelationalService::boot(
            &scratch.path().join("user.db"),
            USER_STORE,
            "live test",
            TursoOptions::default(),
        )
        .await
        .unwrap();
        let db = Arc::clone(store.adapter());
        let engine = crate::Engine::boot();
        let memory = Arc::new(
            Memory::start_with(Arc::clone(&db), Some(relay))
                .await
                .unwrap(),
        );
        let projects = Arc::new(
            Projects::start(Arc::clone(&db), None, engine.clone())
                .await
                .unwrap(),
        );
        let workspace = scratch.path().join("workspace");
        std::fs::create_dir_all(&workspace).unwrap();
        let project = projects
            .create(CreateProjectInput {
                name: "live test".into(),
                root_path: workspace.to_string_lossy().into_owned(),
                project_type: None,
                description: None,
                tool: None,
                tech_stack: None,
                set_active: true,
            })
            .await
            .unwrap()
            .id;
        let (approved, held_back) = (codeword("plum"), codeword("fig"));
        for (label, word, include) in [("facts", &approved, true), ("held-back", &held_back, false)]
        {
            let body = format!("The codeword is {word}.");
            memory
                .save(Some(&project), label, &body, None, include)
                .await
                .unwrap();
        }
        let agents = Arc::new(Agents::new(
            Arc::clone(&db),
            data_dir.clone(),
            Providers::start(data_dir.clone(), engine),
            Some(projects),
            Some(memory),
            Arc::new(LiveState::default()),
        ));
        Self {
            _scratch: scratch,
            _store: store,
            db,
            data_dir,
            agents,
            project,
            approved,
            held_back,
        }
    }

    /// One turn on a thread, refusing anything but your memory's tools.
    async fn turn(&self, session: &str, prompt: &str) -> String {
        let mut events = self.agents.prompt(session, prompt).await.unwrap();
        let mut answer = String::new();
        while let Some(event) = tokio::time::timeout(Duration::from_secs(240), events.recv())
            .await
            .expect("the agent answers in time")
        {
            match event {
                AgentEvent::Text { text } => answer.push_str(&text),
                AgentEvent::Tool { title, status, .. } if !title.is_empty() => {
                    println!("    tool {title:?} {status}");
                }
                AgentEvent::PermissionAsked {
                    request,
                    title,
                    choices,
                } => {
                    let memory_tool = title.contains("persona") || title.contains("memory");
                    let choice = choices
                        .iter()
                        .find(|choice| choice.allows && memory_tool)
                        .map(|choice| choice.id.clone());
                    self.agents.answer(session, &request, choice).await;
                }
                AgentEvent::Failed { message } => panic!("{message}"),
                AgentEvent::TurnEnded { .. } => break,
                _ => {}
            }
        }
        answer
    }

    /// A real Claude Code thread: your notes unasked on every turn, the rest
    /// through its memory tool, and only your words in your history.
    async fn check_a_thread(&self) {
        let thread = self
            .agents
            .start_thread(&self.project, ProviderId::ClaudeCode)
            .await
            .unwrap();
        for turn in ["first", "second"] {
            let answer = self.turn(&thread.session_id, ASK_FOR_THE_CODEWORD).await;
            println!("claude code thread, {turn} turn: {answer:?}");
            assert!(answer.contains(&self.approved), "{answer:?}");
            assert!(!answer.contains(&self.held_back), "{answer:?}");
        }
        let look_up = "Use your devpulse-memory tools to load this project's memory blocks \
                       (scope \"project\"; leave the project unnamed). Reply with only the \
                       codeword in the note named held-back.";
        let looked_up = self.turn(&thread.session_id, look_up).await;
        println!("claude code thread, looking a note up: {looked_up:?}");
        assert!(looked_up.contains(&self.held_back), "{looked_up:?}");

        let rows = self
            .db
            .query(
                "SELECT content FROM turns WHERE session_id = ? AND role = 'user'",
                &[thread.session_id.as_str().into()],
            )
            .await
            .unwrap();
        let your_words: Vec<&str> = rows
            .iter()
            .filter_map(|row| row.first().and_then(SqlValue::as_text))
            .collect();
        assert_eq!(
            your_words,
            [ASK_FOR_THE_CODEWORD, ASK_FOR_THE_CODEWORD, look_up]
        );
        self.agents.close(&thread.session_id).await;
    }

    /// A real Council: every shipped role only talks, so no seat gets your notes.
    async fn check_a_room(&self) {
        let rooms = Rooms::new(
            Arc::clone(&self.db),
            self.data_dir.clone(),
            Arc::clone(&self.agents),
        );
        let seat = |seat: &str, place: u32, provider: ProviderId| Assignment {
            seat: seat.to_owned(),
            place,
            provider,
            persona: None,
        };
        let room = rooms
            .start(
                &self.project,
                "council",
                vec![
                    seat("answerer", 0, ProviderId::ClaudeCode),
                    seat("answerer", 1, ProviderId::ClaudeCode),
                    seat("answerer", 2, ProviderId::ClaudeCode),
                    seat("selector", 0, ProviderId::Codex),
                ],
            )
            .await
            .unwrap();
        let mut events = rooms
            .ask(&room.session_id, ASK_FOR_THE_CODEWORD)
            .await
            .unwrap();
        let mut turns = Vec::new();
        let mut finished = false;
        while let Some(event) = tokio::time::timeout(Duration::from_secs(300), events.recv())
            .await
            .expect("the room answers in time")
        {
            match event {
                RoomEvent::Turn { turn } => {
                    println!("council, {}: {:?}", turn.place, turn.text);
                    turns.push(turn.text);
                }
                RoomEvent::Finished { outcome } => {
                    println!("council finished: {outcome:?}");
                    finished = true;
                    break;
                }
                RoomEvent::Failed { message } => panic!("{message}"),
                RoomEvent::Agent { .. } => {}
            }
        }
        assert!(finished, "the room finished");
        assert_eq!(turns.len(), 4, "three answers and a selection: {turns:?}");
        for text in &turns {
            assert!(!text.contains(&self.approved), "a talking seat: {text:?}");
            assert!(!text.contains(&self.held_back), "a talking seat: {text:?}");
        }
        rooms.close(&room.session_id).await;
        let _ = std::fs::remove_dir_all(self.data_dir.join("rooms").join(&room.session_id));
    }
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
#[ignore = "talks to this machine's Claude Code and Codex on your own subscriptions"]
async fn real_thread_and_room_get_what_they_should_of_your_notes() {
    let fixture = Fixture::start().await;
    fixture.check_a_thread().await;
    fixture.check_a_room().await;
}
