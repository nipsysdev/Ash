use crate::models::http::HttpClient;
use crate::models::tor::TorClientWrapper;
use anyhow::Result;
use tauri::AppHandle;

pub struct AppState {
    tor_client: TorClientWrapper,
    http_client: HttpClient,
}

impl AppState {
    pub fn new(app_handle: AppHandle) -> Result<Self> {
        Ok(Self {
            tor_client: TorClientWrapper::new(app_handle),
            http_client: HttpClient::new(),
        })
    }

    pub fn tor_client(&self) -> &TorClientWrapper {
        &self.tor_client
    }

    pub fn http_client(&self) -> &HttpClient {
        &self.http_client
    }
}
