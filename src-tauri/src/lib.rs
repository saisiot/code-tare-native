mod commands;
mod scanner;
mod settings;
mod tags;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::get_projects,
      commands::get_available_tags,
      commands::get_tags,
      commands::save_tags,
      commands::manage_tag,
      commands::open_project,
      commands::get_settings,
      commands::update_settings,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
