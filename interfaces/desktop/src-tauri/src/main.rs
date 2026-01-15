#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Keep main thin. The library handles the logic.
    desktop_lib::run();
}
