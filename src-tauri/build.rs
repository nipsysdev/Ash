fn main() {
    let onion_service_url = std::env::var("ONION_SERVICE_URL")
        .expect("ONION_SERVICE_URL environment variable not set at build time. Please set it in .cargo/config.toml or as an environment variable.");

    println!("cargo:rustc-env=ONION_SERVICE_URL={}", onion_service_url);

    tauri_build::build()
}
