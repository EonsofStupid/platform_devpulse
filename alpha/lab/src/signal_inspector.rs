// lab/src/signal_inspector.rs

//! Signal Inspector TUI
//!
//! Real-time view of signals flowing through the system.

use anyhow::Result;
use crossterm::{
    event::{self, Event, KeyCode},
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
    ExecutableCommand,
};
use ratatui::{
    prelude::*,
    widgets::{Block, Borders, List, ListItem, Paragraph},
};
use std::io::stdout;

pub async fn run() -> Result<()> {
    // Setup terminal
    enable_raw_mode()?;
    stdout().execute(EnterAlternateScreen)?;
    let mut terminal = Terminal::new(CrosstermBackend::new(stdout()))?;

    // Main loop
    let result = run_app(&mut terminal).await;

    // Restore terminal
    disable_raw_mode()?;
    stdout().execute(LeaveAlternateScreen)?;

    result
}

async fn run_app<B: Backend>(terminal: &mut Terminal<B>) -> Result<()> {
    let mut signals: Vec<String> = vec![
        "Ready. Waiting for signals...".to_string(),
    ];

    loop {
        terminal.draw(|frame| {
            let chunks = Layout::default()
                .direction(Direction::Vertical)
                .constraints([
                    Constraint::Length(3),
                    Constraint::Min(0),
                    Constraint::Length(3),
                ])
                .split(frame.area());

            // Header
            let header = Paragraph::new("DevPulse Lab - Signal Inspector")
                .style(Style::default().fg(Color::Cyan).bold())
                .block(Block::default().borders(Borders::ALL));
            frame.render_widget(header, chunks[0]);

            // Signal list
            let items: Vec<ListItem> = signals
                .iter()
                .map(|s| ListItem::new(s.as_str()))
                .collect();
            let list = List::new(items)
                .block(Block::default().title("Signals").borders(Borders::ALL));
            frame.render_widget(list, chunks[1]);

            // Footer
            let footer = Paragraph::new("Press 'q' to quit | 'c' to clear")
                .style(Style::default().fg(Color::DarkGray))
                .block(Block::default().borders(Borders::ALL));
            frame.render_widget(footer, chunks[2]);
        })?;

        // Handle input
        #[allow(clippy::collapsible_if)]
        if event::poll(std::time::Duration::from_millis(100))? {
            if let Event::Key(key) = event::read()? {
                match key.code {
                    KeyCode::Char('q') => break,
                    KeyCode::Char('c') => signals.clear(),
                    _ => {}
                }
            }
        }

        // TODO: Poll for new signals from orchestrator
    }

    Ok(())
}
