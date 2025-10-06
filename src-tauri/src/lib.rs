use tauri::{AppHandle, Manager, ipc::Channel};
use std::io::Write;

#[derive(serde::Deserialize, serde::Serialize, Clone)]
struct Country {
    #[serde(rename = "countryCode")]
    country_code: String,
    #[serde(rename = "countryName")]
    country_name: String,
    #[serde(rename = "localityCount")]
    locality_count: u32,
}

#[derive(serde::Deserialize)]
struct CountriesResponse {
    data: Vec<Country>,
}

#[derive(serde::Deserialize, serde::Serialize, Clone)]
struct Locality {
    id: u64,
    name: String,
    country: String,
    placetype: String,
    latitude: f64,
    longitude: f64,
    #[serde(rename = "fileSize")]
    file_size: u64,
}

#[derive(serde::Deserialize, serde::Serialize)]
struct Pagination {
    total: u64,
    page: u64,
    limit: u64,
    #[serde(rename = "totalPages")]
    total_pages: u64,
}

#[derive(serde::Deserialize, serde::Serialize)]
struct LocalitiesResponse {
    data: Vec<Locality>,
    pagination: Pagination,
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase", rename_all_fields = "camelCase", tag = "event", content = "data")]
enum DownloadEvent<'a> {
    Started {
        url: &'a str,
        download_id: usize,
        content_length: usize,
    },
    Progress {
        download_id: usize,
        chunk_length: usize,
    },
    Finished {
        download_id: usize,
    },
}

#[tauri::command]
async fn download_map<'a>(
    app: AppHandle,
    country_id: String,
    locality_id: String,
    on_event: Channel<DownloadEvent<'a>>,
) -> Result<(), String> {
    let download_id = 1;
    let url = format!("http://lokhlass:8080/countries/{}/localities/{}/pmtiles", country_id, locality_id);
    
    let client = tauri_plugin_http::reqwest::Client::new();
    
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Request failed with status: {}", response.status()));
    }
    
    let content_length = response
        .content_length()
        .ok_or("Failed to get content length")? as usize;
    
    on_event.send(DownloadEvent::Started {
        url: &url,
        download_id,
        content_length,
    }).map_err(|e| format!("Failed to send started event: {}", e))?;
    
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    if !app_data_dir.exists() {
        std::fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    }
    
    let file_path = app_data_dir.join(format!("{}.pmtiles", locality_id));
    let mut file = std::fs::File::create(&file_path)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response bytes: {}", e))?;
    
    let chunk_length = bytes.len();
    file.write_all(&bytes)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    on_event.send(DownloadEvent::Progress {
        download_id,
        chunk_length,
    }).map_err(|e| format!("Failed to send progress event: {}", e))?;
    
    on_event.send(DownloadEvent::Finished { download_id })
        .map_err(|e| format!("Failed to send finished event: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn get_countries() -> Result<Vec<Country>, String> {
    let client = tauri_plugin_http::reqwest::Client::new();
    let url = "http://lokhlass:8080/countries";

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Request failed with status: {}", response.status()));
    }

    let response_bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response bytes: {}", e))?;

    let countries_response: CountriesResponse = serde_json::from_slice(&response_bytes)
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let countries: Vec<Country> = countries_response.data;

    Ok(countries)
}

#[tauri::command]
async fn get_localities(
    country_code: String,
    query: Option<String>,
    page: Option<u64>,
) -> Result<Vec<Locality>, String> {
    let client = tauri_plugin_http::reqwest::Client::new();
    let mut url = format!("http://lokhlass:8080/countries/{}/localities", country_code);

    // Add query parameters
    let mut query_params = Vec::new();
    if let Some(q) = query {
        query_params.push(format!("q={}", q));
    }
    if let Some(p) = page {
        query_params.push(format!("page={}", p));
    }

    if !query_params.is_empty() {
        url.push_str(&format!("?{}", query_params.join("&")));
    }

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Request failed with status: {}", response.status()));
    }

    let response_bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response bytes: {}", e))?;

    let localities_response: LocalitiesResponse = serde_json::from_slice(&response_bytes)
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let localities = localities_response.data;

    Ok(localities)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle();
            let app_data_dir = handle.path().app_data_dir().unwrap();
            println!("{:#?}", app_data_dir);
            if !app_data_dir.exists() {
                println!("test123");
                std::fs::create_dir(&app_data_dir).unwrap();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_countries, get_localities, download_map])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
