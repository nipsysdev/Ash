use anyhow::Result;
use bytes::Bytes;
use http_body_util::BodyExt;
use http_body_util::Empty;
use hyper::client::conn::http1;
use hyper_util::rt::TokioIo;
use std::sync::Arc;
use tokio::sync::Mutex as TokioMutex;

use crate::models::tor::TorClientWrapper;

pub type ProgressCallback = Arc<TokioMutex<Box<dyn Fn(usize) + Send + Sync>>>;

pub struct HttpClient;

impl HttpClient {
    pub fn new() -> Self {
        Self
    }

    fn validate_onion_url(&self, url: &str) -> Result<()> {
        let uri = url.parse::<hyper::Uri>()?;
        let host = uri
            .host()
            .ok_or_else(|| anyhow::anyhow!("Invalid host in URL"))?;

        if !host.ends_with(".onion") {
            return Err(anyhow::anyhow!("Only .onion domains are allowed"));
        }

        if let Some(scheme) = uri.scheme() {
            if scheme != &hyper::http::uri::Scheme::HTTP {
                return Err(anyhow::anyhow!(
                    "Only HTTP scheme is allowed for .onion domains"
                ));
            }
        }

        Ok(())
    }

    pub async fn get(
        &self,
        url: &str,
        tor_client: &TorClientWrapper,
        progress_callback: Option<ProgressCallback>,
    ) -> Result<(Vec<u8>, u16)> {
        self.validate_onion_url(url)?;

        let uri = url.parse::<hyper::Uri>()?;
        let host = uri
            .host()
            .ok_or_else(|| anyhow::anyhow!("Invalid host in URL"))?;
        let port = uri.port_u16().unwrap_or(80);

        self.make_http_tor_request(host, port, url, tor_client, progress_callback)
            .await
    }

    async fn make_http_tor_request(
        &self,
        host: &str,
        port: u16,
        original_url: &str,
        tor_client: &TorClientWrapper,
        progress_callback: Option<ProgressCallback>,
    ) -> Result<(Vec<u8>, u16)> {
        let stream = tor_client.connect(host, port).await?;
        let stream = TokioIo::new(stream);

        let (mut request_sender, connection) = http1::handshake(stream).await?;

        tokio::spawn(async move {
            if let Err(e) = connection.await {
                eprintln!("Connection error: {}", e);
            }
        });

        let request = hyper::Request::builder()
            .uri(original_url)
            .method("GET")
            .header("Host", host)
            .body(Empty::<Bytes>::new())?;

        let response = request_sender.send_request(request).await?;
        let status = response.status().as_u16();

        if let Some(callback) = progress_callback {
            let mut body_bytes = Vec::new();
            let mut body = response.into_body();

            while let Some(chunk) = body.frame().await {
                let chunk = chunk?;
                let data = chunk.into_data().unwrap_or_default();
                let chunk_len = data.len();
                body_bytes.extend_from_slice(&data);

                let callback = callback.lock().await;
                callback(chunk_len);
            }

            Ok((body_bytes, status))
        } else {
            let body_bytes = response.into_body().collect().await?.to_bytes();
            Ok((body_bytes.to_vec(), status))
        }
    }
}

impl Default for HttpClient {
    fn default() -> Self {
        Self::new()
    }
}
