mod anyhow_tauri;
mod commands;
mod models;

use anyhow::Result;
use models::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();

    if let Err(e) = try_run() {
        eprintln!("Failed to run application: {}", e);
        std::process::exit(1);
    }
}

fn try_run() -> Result<()> {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_state = AppState::new(app.handle().clone())?;
            app.manage(app_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::download_map,
            commands::get_pmtiles_header,
            commands::get_pmtiles_tile,
            commands::bootstrap_tor,
            commands::is_tor_ready,
        ])
        .run(tauri::generate_context!())?;

    Ok(())
}
