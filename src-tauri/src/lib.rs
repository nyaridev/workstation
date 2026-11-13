//! Workstation app: Tauri setup that wires the plugins, modules and commands together.

mod commands;
mod git;
mod kit;
mod scan;
mod settings;
mod start;
#[cfg(test)]
mod test_support;
mod tray;
mod update;
mod watch;
mod window;
mod workstations;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // First, so a second start hands over to the running app before anything else opens.
        .plugin(tauri_plugin_single_instance::init(|app, _, _| window::bring_forward(app)))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(start::plugin())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(watch::Watcher::default())
        .setup(|app| {
            let config_dir = commands::config_dir(app.handle());
            if let Ok(dir) = &config_dir {
                start::restore(app.handle(), dir);
            }
            let look = config_dir.map(|dir| settings::load(&dir).look).unwrap_or_default();
            tray::add(app)?;
            let shown = match (start::started_minimized(), tray::closes_to_tray(app.handle())) {
                (false, _) => window::Shown::Normal,
                (true, true) => window::Shown::Hidden,
                (true, false) => window::Shown::Minimized,
            };
            let frame = window::open(app, &look, shown)?;
            app.manage(frame);
            app.manage(update::Updates::default());
            update::start_checks(app.handle().clone());
            Ok(())
        })
        .on_window_event(tray::on_window_event)
        .invoke_handler(tauri::generate_handler![
            commands::app_info,
            commands::get_settings,
            commands::set_look,
            commands::set_preferences,
            commands::set_filters,
            commands::set_panel_width,
            commands::last_edited,
            commands::list_workstations,
            commands::add_workstation,
            commands::remove_workstation,
            commands::setup_workstation,
            commands::open_workstation,
            commands::scan_workstation,
            commands::open_folder,
            commands::open_repo_page,
            commands::git_status,
            commands::git_overview,
            commands::git_diffs,
            commands::git_commits,
            commands::git_pull,
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
