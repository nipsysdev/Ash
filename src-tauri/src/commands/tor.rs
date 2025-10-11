use crate::anyhow_tauri::TAResult;
use crate::models::AppState;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn bootstrap_tor(app: AppHandle, app_state: State<'_, AppState>) -> TAResult<bool> {
    let client = app_state.tor_client();

    if client.is_ready() {
        return Ok(true);
    }

    client.listen_bootstrap_events(app.clone()).await?;
    client.bootstrap().await?;
    Ok(false)
}

#[tauri::command]
pub async fn is_tor_ready(app_state: State<'_, AppState>) -> TAResult<bool> {
    Ok(app_state.tor_client().is_ready())
}
