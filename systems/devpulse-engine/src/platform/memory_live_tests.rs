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
use crate::platform::rooms::{Assignment, LibraryKind, Outcome, RoomEvent, RoomThread, Rooms};
use crate::platform::services::relational::{RelationalService, USER_STORE};

const ASK_FOR_THE_CODEWORD: &str = "Without using any tool, reply with only the codeword in the \
    notes you were given about this project and nothing else. If you were given no codeword, \
    reply exactly NONE.";

fn seat(seat: &str, place: u32, provider: ProviderId) -> Assignment {
    Assignment {
        seat: seat.to_owned(),
        place,
        provider,
        persona: None,
        notes: None,
        role: None,
        parameters: std::collections::BTreeMap::new(),
    }
}

/// One question to a room, to the end of its stream: each turn's place and text,
/// the last outcome, and the Council it escalated to.
async fn room_run(
    rooms: &Arc<Rooms>,
    session: &str,
    question: &str,
) -> (Vec<(String, String)>, Outcome, Option<RoomThread>) {
    let mut events = rooms.ask(session, question).await.unwrap();
    let mut turns = Vec::new();
    let mut escalated = None;
    while let Some(event) = tokio::time::timeout(Duration::from_secs(300), events.recv())
        .await
        .expect("the room answers in time")
    {
        match event {
            RoomEvent::Turn { turn } => {
                println!("  {}: {:?}", turn.place, turn.text);
                assert_eq!(turn.contract_problem, None, "{}", turn.text);
                turns.push((turn.place, turn.text));
            }
            RoomEvent::Escalated { room, .. } => escalated = Some(room),
            RoomEvent::Finished { outcome } => return (turns, outcome, escalated),
            RoomEvent::Failed { message } => panic!("{message}"),
            RoomEvent::Agent { .. } => {}
        }
    }
    panic!("the stream ended with no outcome");
}

fn codeword(prefix: &str) -> String {
    let id = uuid::Uuid::now_v7().simple().to_string();
    format!("{prefix}-{}", &id[id.len() - 8..])
}

/// A throwaway project with one note you approved and one held back.
struct Fixture {
    scratch: tempfile::TempDir,
    _store: RelationalService,
    db: Arc<TursoAdapter>,
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
            None,
            Arc::new(LiveState::default()),
        ));
        Self {
            scratch,
            _store: store,
            db,
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

        // You say no for this thread: a new one knows nothing, and yes brings it back.
        assert!(thread.notes);
        let no = self
            .agents
            .start_thread(&self.project, ProviderId::ClaudeCode)
            .await
            .unwrap();
        self.agents.set_notes(&no.session_id, false).await.unwrap();
        let answer = self.turn(&no.session_id, ASK_FOR_THE_CODEWORD).await;
        println!("claude code thread, notes off: {answer:?}");
        assert!(!answer.contains(&self.approved), "{answer:?}");
        self.agents.set_notes(&no.session_id, true).await.unwrap();
        let answer = self.turn(&no.session_id, ASK_FOR_THE_CODEWORD).await;
        println!("claude code thread, notes back on: {answer:?}");
        assert!(answer.contains(&self.approved), "{answer:?}");
        self.agents.close(&no.session_id).await;
        self.agents.close(&thread.session_id).await;
    }

    /// A seat's folder is made here, not in your data folder.
    fn rooms(&self) -> Arc<Rooms> {
        Arc::new(Rooms::new(
            Arc::clone(&self.db),
            self.scratch.path().to_path_buf(),
            Arc::clone(&self.agents),
        ))
    }

    /// A real Router room: one question goes to the one place it names, and one it
    /// escalates opens a real Council with the same agents.
    async fn check_a_router(&self) {
        let rooms = self.rooms();
        let room = rooms
            .start(
                &self.project,
                "router",
                vec![
                    seat("router", 0, ProviderId::Codex),
                    seat("code", 0, ProviderId::ClaudeCode),
                    seat("facts", 0, ProviderId::ClaudeCode),
                    seat("decisions", 0, ProviderId::ClaudeCode),
                ],
            )
            .await
            .unwrap();

        let (turns, outcome, escalated) = room_run(
            &rooms,
            &room.session_id,
            "In one short sentence, what does Rust's borrow checker check?",
        )
        .await;
        let route = outcome.route.expect("a route");
        println!("router, a code question: {route:?}, {} turns", turns.len());
        assert!(!route.escalate, "{route:?}");
        let named = route.place.expect("a place");
        assert_eq!(turns.len(), 2, "the router and one expert: {turns:?}");
        assert_eq!(turns[1].0, named);
        assert!(escalated.is_none());

        let (turns, outcome, escalated) = room_run(
            &rooms,
            &room.session_id,
            "Should a five-person company move to a four-day week? Router: this needs more \
             than one view, so set escalate to true.",
        )
        .await;
        println!("router, escalated: {escalated:?}, {} turns", turns.len());
        let council = escalated.expect("a Council was opened");
        assert_eq!(council.room_id, "council");
        assert_ne!(council.session_id, room.session_id);
        assert!(
            outcome.pick.is_some(),
            "the Council's own outcome ended the stream: {outcome:?}"
        );
        // The router, then three answers and a selection in the Council.
        assert_eq!(turns.len(), 5, "{turns:?}");
        assert_eq!(turns[4].0, "selector-1");
        rooms.close(&room.session_id).await;
        rooms.close(&council.session_id).await;
    }

    /// A real round-robin group of mixed agents: they take turns in order, each
    /// seeing what came before, and a room opened again continues its rotation.
    async fn check_a_group(&self) {
        let rooms = self.rooms();
        let room = rooms
            .start(
                &self.project,
                "round-robin",
                vec![
                    seat("member", 0, ProviderId::ClaudeCode),
                    seat("member", 1, ProviderId::Codex),
                    seat("member", 2, ProviderId::ClaudeCode),
                ],
            )
            .await
            .unwrap();
        let (turns, outcome, _) = room_run(
            &rooms,
            &room.session_id,
            "In one short sentence each, name one risk of storing passwords in plain text that \
             nobody before you has named. If you have nothing new, say so and set changed to \
             false.",
        )
        .await;
        println!(
            "group finished: {:?}, {} turns",
            outcome.stopped,
            turns.len()
        );
        let order: Vec<&str> = turns.iter().map(|(place, _)| place.as_str()).collect();
        assert_eq!(
            order[..3],
            ["member-1", "member-2", "member-3"],
            "{order:?}"
        );
        assert_eq!(outcome.pick, None, "a group picks no winner");
        rooms.close(&room.session_id).await;

        // A fresh engine, as after a restart: the next question starts one along.
        let reopened = self.rooms();
        let (turns, _, _) = room_run(
            &reopened,
            &room.session_id,
            "Reply with one short sentence saying you agree, and set changed to false.",
        )
        .await;
        println!("group reopened: first speaker {}", turns[0].0);
        assert_eq!(turns[0].0, "member-2", "{turns:?}");
        reopened.close(&room.session_id).await;
    }

    /// A real Code Review with mixed agents: each seat reads the project and none
    /// changes it, and a seat that tries still finishes its answer.
    async fn check_a_review(&self) {
        let folder = self.agents.folder(&self.project).await.unwrap();
        std::fs::write(folder.join("review-me.txt"), "the codeword is HERON-41\n").unwrap();
        let rooms = self.rooms();
        let room = rooms
            .start(
                &self.project,
                "code-review",
                vec![
                    seat("reviewer", 0, ProviderId::ClaudeCode),
                    seat("security", 0, ProviderId::Codex),
                    seat("tests", 0, ProviderId::ClaudeCode),
                ],
            )
            .await
            .unwrap();
        let (turns, outcome, _) = room_run(
            &rooms,
            &room.session_id,
            "Read review-me.txt in the project folder and put its codeword in your answer. Then \
             try to fix it by creating fixed.txt beside it, with whatever you have, and say \
             whether you could.",
        )
        .await;
        println!(
            "review finished: {:?}, {} turns",
            outcome.stopped,
            turns.len()
        );
        rooms.close(&room.session_id).await;
        assert!(
            !folder.join("fixed.txt").exists(),
            "a seat changed the project"
        );
        for place in ["reviewer-1", "security-1", "tests-1"] {
            let (_, text) = turns
                .iter()
                .find(|(key, _)| key == place)
                .unwrap_or_else(|| panic!("{place} did not answer: {turns:?}"));
            assert!(
                text.contains("HERON-41"),
                "{place} could not read: {text:?}"
            );
        }
    }

    /// A real Council you tailored: saved from the template with a fourth answerer,
    /// a reviewer that reads the project beside seats that only talk, a character,
    /// and one seat without your notes. It reloads as yours.
    async fn check_a_tailored_council(&self) {
        let folder = self.agents.folder(&self.project).await.unwrap();
        std::fs::write(folder.join("review-me.txt"), "the codeword is HERON-41\n").unwrap();
        let rooms = self.rooms();
        let mut council = serde_json::to_value(rooms.library().room("council").unwrap()).unwrap();
        council["id"] = "my-council".into();
        council["name"] = "My Council".into();
        let seats = council["seats"].as_array_mut().unwrap();
        let answerers = seats.iter_mut().find(|s| s["seat"] == "answerer").unwrap();
        answerers["count"] = 4.into();
        let id = rooms
            .save_to_library(LibraryKind::Room, &council.to_string())
            .unwrap();
        assert_eq!(rooms.library().yours.rooms, std::slice::from_ref(&id));

        let mut seating: Vec<Assignment> = (0..4)
            .map(|place| seat("answerer", place, ProviderId::ClaudeCode))
            .collect();
        seating[0].role = Some("code-reviewer@1".to_owned());
        seating[1].persona = Some("devils-advocate".to_owned());
        seating[2].notes = Some(false);
        seating.push(seat("selector", 0, ProviderId::Codex));
        let room = rooms.start(&self.project, &id, seating).await.unwrap();
        let (turns, outcome, _) = room_run(
            &rooms,
            &room.session_id,
            "If you can read review-me.txt in the project folder, give its codeword. If you \
             cannot, say so plainly and give no codeword.",
        )
        .await;
        // A place's notes change after the room started, and it reopens with that.
        rooms
            .set_place_notes(&room.session_id, "answerer-3", true)
            .await
            .unwrap();
        let reopened = rooms.threads(&self.project).await.unwrap();
        let seats = &reopened
            .iter()
            .find(|thread| thread.session_id == room.session_id)
            .expect("it is listed")
            .seating;
        assert_eq!(seats[2].notes, Some(true));
        println!("tailored council: {:?}", outcome.pick);
        let said = |place: &str| {
            turns
                .iter()
                .find(|(key, _)| key == place)
                .map_or("", |(_, text)| text.as_str())
        };
        assert!(said("answerer-1").contains("HERON-41"), "{turns:?}");
        assert!(!said("answerer-2").contains("HERON-41"), "{turns:?}");
        let pick = outcome.pick.expect("it picked one");
        assert_eq!(
            pick.winner_place.as_deref(),
            Some("answerer-1"),
            "only the reviewer could answer, and it must be among the candidates: {pick:?}"
        );
    }

    /// A real Clyffy Council: the Conductor sends a question to the seat it belongs
    /// to, and that seat speaks as its character.
    async fn check_the_clyffy_council(&self) {
        let rooms = self.rooms();
        let places = [
            "conductor",
            "researcher",
            "scribe",
            "guardian",
            "diary",
            "teacher",
            "human-diagnostics",
            "vision",
            "hardware",
            "software",
        ];
        let room = rooms
            .start(
                &self.project,
                "clyffy-council",
                places
                    .iter()
                    .map(|name| {
                        let provider = if *name == "conductor" {
                            ProviderId::Codex
                        } else {
                            ProviderId::ClaudeCode
                        };
                        seat(name, 0, provider)
                    })
                    .collect(),
            )
            .await
            .unwrap();
        let (turns, outcome, _) = room_run(
            &rooms,
            &room.session_id,
            "Is 8 GB of graphics memory enough to run a 40 GB local model? Reply briefly, and \
             start your answer with your character's name.",
        )
        .await;
        rooms.close(&room.session_id).await;
        let route = outcome.route.expect("the Conductor routed it");
        println!("council routed to {:?}: {:?}", route.place, route.rationale);
        assert_eq!(turns[0].0, "conductor-1", "{turns:?}");
        assert_eq!(route.place.as_deref(), Some("hardware-1"), "{turns:?}");
        assert!(
            turns[1].1.contains("Rusty"),
            "it spoke as itself: {:?}",
            turns[1].1
        );
    }

    /// A real Council whose seats only talk: they get your notes, except the seat
    /// you said no for, and none of them has the tools to look up the rest.
    async fn check_a_room(&self) {
        let rooms = self.rooms();
        let room = rooms
            .start(
                &self.project,
                "council",
                vec![
                    seat("answerer", 0, ProviderId::ClaudeCode),
                    seat("answerer", 1, ProviderId::ClaudeCode),
                    Assignment {
                        notes: Some(false),
                        ..seat("answerer", 2, ProviderId::ClaudeCode)
                    },
                    seat("selector", 0, ProviderId::Codex),
                ],
            )
            .await
            .unwrap();
        let (turns, outcome, _) = room_run(&rooms, &room.session_id, ASK_FOR_THE_CODEWORD).await;
        println!("council finished: {outcome:?}");
        assert_eq!(turns.len(), 4, "three answers and a selection: {turns:?}");
        let said = |place: &str| {
            let (_, text) = turns.iter().find(|(p, _)| p == place).expect(place);
            text.clone()
        };
        for place in ["answerer-1", "answerer-2"] {
            assert!(said(place).contains(&self.approved), "{place}: {turns:?}");
        }
        assert!(
            !said("answerer-3").contains(&self.approved),
            "notes off: {turns:?}"
        );
        for (_, text) in &turns {
            assert!(!text.contains(&self.held_back), "held back: {text:?}");
        }
        rooms.close(&room.session_id).await;
    }
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
#[ignore = "talks to this machine's Claude Code and Codex on your own subscriptions"]
async fn real_thread_and_room_get_what_they_should_of_your_notes() {
    let fixture = Fixture::start().await;
    fixture.check_a_thread().await;
    fixture.check_a_room().await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
#[ignore = "talks to this machine's Claude Code and Codex on your own subscriptions"]
async fn real_round_robin_group_takes_turns_and_continues_its_rotation() {
    Fixture::start().await.check_a_group().await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
#[ignore = "talks to this machine's Claude Code and Codex on your own subscriptions"]
async fn real_tailored_council_keeps_its_seats_apart() {
    Fixture::start().await.check_a_tailored_council().await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
#[ignore = "talks to this machine's Claude Code and Codex on your own subscriptions"]
async fn real_code_review_reads_the_project_and_changes_nothing() {
    Fixture::start().await.check_a_review().await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
#[ignore = "talks to this machine's Claude Code and Codex on your own subscriptions"]
async fn real_clyffy_council_routes_to_a_seat_that_speaks_as_its_character() {
    Fixture::start().await.check_the_clyffy_council().await;
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
#[ignore = "talks to this machine's Claude Code and Codex on your own subscriptions"]
async fn real_router_room_routes_one_question_and_escalates_another() {
    Fixture::start().await.check_a_router().await;
}
