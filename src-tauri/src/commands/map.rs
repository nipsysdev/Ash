use pmtiles::{AsyncPmTilesReader, TileCoord};
use std::io::Write;
use std::path::PathBuf;
use tauri::{ipc::Channel, AppHandle, Manager, State};

use crate::anyhow_tauri::TAResult;
use crate::models::map::PmtilesMetadata;
use crate::models::AppState;

fn get_pmtiles_dir(app: &AppHandle) -> TAResult<PathBuf> {
    Ok(app.path().app_data_dir()?.join("pmtiles"))
}

fn get_pmtiles_file_path(app: &AppHandle, locality_id: &str) -> TAResult<PathBuf> {
    Ok(get_pmtiles_dir(app)?.join(format!("{}.pmtiles", locality_id)))
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum DownloadEvent {
    Progress { chunk_length: usize },
    Finished {},
}

#[tauri::command]
pub async fn download_map(
    app: AppHandle,
    onion_link: String,
    locality_id: String,
    on_event: Channel<DownloadEvent>,
    app_state: State<'_, AppState>,
) -> TAResult<()> {
    let url = onion_link;

    let pmtiles_dir = get_pmtiles_dir(&app)?;
    std::fs::create_dir_all(&pmtiles_dir)?;
    let file_path = get_pmtiles_file_path(&app, &locality_id)?;
    let mut file = std::fs::File::create(&file_path)?;

    let on_event_clone = on_event.clone();
    let callback = std::sync::Arc::new(tokio::sync::Mutex::new(Box::new(
        move |chunk_length: usize| {
            if let Err(e) = on_event_clone.send(DownloadEvent::Progress { chunk_length }) {
                eprintln!("Failed to send progress event: {}", e);
            }
        },
    )
        as Box<dyn Fn(usize) + Send + Sync>));

    let (body_bytes, status) = app_state
        .http_client()
        .get(&url, app_state.tor_client(), Some(callback))
        .await?;

    if !hyper::StatusCode::from_u16(status)?.is_success() {
        return Err(anyhow::anyhow!("Request failed with status: {}", status).into());
    }

    file.write_all(&body_bytes)?;
    on_event.send(DownloadEvent::Finished {})?;

    Ok(())
}

#[tauri::command]
pub async fn get_pmtiles_header(app: AppHandle, locality_id: String) -> TAResult<PmtilesMetadata> {
    let file_path = get_pmtiles_file_path(&app, &locality_id)?;
    let reader = AsyncPmTilesReader::new_with_path(file_path).await?;
    let header = reader.get_header();

    Ok(PmtilesMetadata {
        tile_type: format!("{:?}", header.tile_type),
        min_zoom: header.min_zoom,
        max_zoom: header.max_zoom,
        min_longitude: header.min_longitude,
        min_latitude: header.min_latitude,
        max_longitude: header.max_longitude,
        max_latitude: header.max_latitude,
        bounds: header.get_bounds(),
    })
}

#[tauri::command]
pub async fn get_pmtiles_tile(
    app: AppHandle,
    locality_id: String,
    z: u8,
    x: u32,
    y: u32,
) -> TAResult<tauri::ipc::Response> {
    let file_path = get_pmtiles_file_path(&app, &locality_id)?;
    let reader = AsyncPmTilesReader::new_with_path(file_path).await?;
    let coord = TileCoord::new(z, x, y)?;
    let tile_data = reader.get_tile_decompressed(coord).await?;

    Ok(tile_data
        .map(|data| tauri::ipc::Response::new(data.to_vec()))
        .ok_or_else(|| anyhow::anyhow!("Tile not found"))?)
}
