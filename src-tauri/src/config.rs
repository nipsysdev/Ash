use anyhow::Result;
use std::env;

pub struct Config {
    pub onion_service_url: String,
}

impl Config {
    pub fn load() -> Result<Self> {
        let onion_service_url = env!("ONION_SERVICE_URL").to_string();

        Ok(Self { onion_service_url })
    }
}
