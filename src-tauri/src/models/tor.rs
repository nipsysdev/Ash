use anyhow::Result;
use arti_client::{config::CfgPath, BootstrapBehavior, TorClient, TorClientConfig};
use futures::StreamExt;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::OnceCell;
use tor_rtcompat::PreferredRuntime;

#[derive(Debug, Clone, Serialize)]
pub struct BootstrapStatus {
    pub progress: u32,
    pub tag: String,
    pub description: String,
}

impl From<arti_client::status::BootstrapStatus> for BootstrapStatus {
    fn from(status: arti_client::status::BootstrapStatus) -> Self {
        Self {
            progress: (status.as_frac() * 100.0) as u32,
            tag: format!("{:?}", status),
            description: status.to_string(),
        }
    }
}

pub struct TorClientWrapper {
    client: OnceCell<TorClient<PreferredRuntime>>,
    app_handle: AppHandle,
}

impl TorClientWrapper {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            client: OnceCell::new(),
            app_handle,
        }
    }

    async fn ensure_client(&self) -> Result<()> {
        if self.client.get().is_none() {
            let mut builder = TorClientConfig::builder();
            builder.address_filter().allow_onion_addrs(true);

            if let Ok(app_data_dir) = self.app_handle.path().app_data_dir() {
                let tor_path = &app_data_dir.join("tor");
                std::fs::create_dir_all(tor_path)?;
                if let Some(tor_path) = tor_path.to_str() {
                    builder
                        .storage()
                        .cache_dir(CfgPath::new(tor_path.into()))
                        .state_dir(CfgPath::new(tor_path.into()));
                }
            }

            let config = builder.build()?;

            let tor_client = TorClient::builder()
                .config(config)
                .bootstrap_behavior(BootstrapBehavior::OnDemand)
                .create_unbootstrapped()?;

            self.client
                .set(tor_client)
                .map_err(|_| anyhow::anyhow!("Tor client already initialized"))?;
        }
        Ok(())
    }

    pub async fn bootstrap(&self) -> Result<()> {
        self.ensure_client().await?;
        let client = self
            .client
            .get()
            .ok_or_else(|| anyhow::anyhow!("Tor client not initialized"))?;

        client
            .bootstrap()
            .await
            .map_err(|e: arti_client::Error| anyhow::anyhow!(e))
    }

    pub fn is_ready(&self) -> bool {
        let client = match self.client.get() {
            Some(client) => client,
            None => return false,
        };

        let status = client.bootstrap_status();
        status.ready_for_traffic()
    }

    pub fn get_client(&self) -> Option<&TorClient<PreferredRuntime>> {
        self.client.get()
    }

    pub async fn connect(
        &self,
        host: &str,
        port: u16,
    ) -> Result<impl tokio::io::AsyncRead + tokio::io::AsyncWrite + Send + Unpin> {
        if !self.is_ready() {
            return Err(anyhow::anyhow!("Tor client is not enabled"));
        }

        let client = self
            .get_client()
            .ok_or_else(|| anyhow::anyhow!("Tor client is not initialized"))?;

        client
            .connect((host, port))
            .await
            .map_err(|e: arti_client::Error| anyhow::anyhow!(e))
    }

    pub async fn listen_bootstrap_events(&self, app: AppHandle) -> Result<()> {
        self.ensure_client().await?;

        let mut bootstrap_events = self
            .get_client()
            .ok_or_else(|| anyhow::anyhow!("Tor client not initialized"))?
            .bootstrap_events();

        tokio::spawn(async move {
            while let Some(status) = bootstrap_events.next().await {
                let bootstrap_status: BootstrapStatus = status.into();
                if let Err(e) = app.emit("tor-bootstrap-status", bootstrap_status) {
                    eprintln!("Failed to emit bootstrap status: {}", e);
                }
            }
        });

        Ok(())
    }
}
