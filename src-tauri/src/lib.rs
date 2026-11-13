//! Workstation app: Tauri setup that wires the plugins, modules and commands together.

mod commands;
mod git;
mod kit;
mod scan;
mod settings;
#[cfg(test)]
mod test_support;
mod update;
mod watch;
mod window;
mod workstations;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(watch::Watcher::default())
        .setup(|app| {
            let look = commands::config_dir(app.handle()).map(|dir| settings::load(&dir).look).unwrap_or_default();
            let frame = window::open(app, &look)?;
            app.manage(frame);
            app.manage(update::Updates::default());
            update::start_checks(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::app_info,
            commands::get_settings,
            commands::set_look,
            commands::set_preferences,
            commands::list_workstations,
            commands::add_workstation,
            commands::remove_workstation,
            commands::setup_workstation,
            commands::open_workstation,
            commands::scan_workstation,
            commands::open_folder,
            commands::git_status,
            commands::git_history,
            commands::guess_stack,
            commands::register_project,
            commands::set_tags,
            commands::update_status,
            commands::check_for_update,
            commands::install_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running the Workstation app");
}
