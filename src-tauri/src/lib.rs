//! Workstation app: Tauri setup that wires the plugins, modules and commands together.

mod commands;
mod git;
mod kit;
mod scan;
#[cfg(test)]
mod test_support;
mod watch;
mod workstations;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(watch::Watcher::default())
        .invoke_handler(tauri::generate_handler![
            commands::list_workstations,
            commands::add_workstation,
            commands::remove_workstation,
            commands::setup_workstation,
            commands::open_workstation,
            commands::scan_workstation,
            commands::open_folder,
            commands::git_status,
            commands::guess_stack,
            commands::register_project,
            commands::set_tags,
        ])
        .run(tauri::generate_context!())
        .expect("error while running the Workstation app");
}
