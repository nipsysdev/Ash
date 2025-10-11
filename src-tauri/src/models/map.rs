use pmtiles::tilejson::Bounds;

#[derive(serde::Deserialize, serde::Serialize, Clone)]
pub struct Country {
    pub country_code: String,
    pub country_name: String,
    pub locality_count: u32,
}

#[derive(serde::Deserialize)]
pub struct CountriesResponse {
    pub data: Vec<Country>,
}

#[derive(serde::Deserialize, serde::Serialize, Clone)]
pub struct Locality {
    pub id: u64,
    pub name: String,
    pub country: String,
    pub placetype: String,
    pub latitude: f64,
    pub longitude: f64,
    pub min_latitude: f64,
    pub max_latitude: f64,
    pub min_longitude: f64,
    pub max_longitude: f64,
    pub file_size: u64,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct Pagination {
    pub total: u64,
    pub page: u64,
    pub limit: u64,
    pub total_pages: u64,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct LocalitiesResponse {
    pub data: Vec<Locality>,
    pub pagination: Pagination,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct PmtilesMetadata {
    pub tile_type: String,
    pub min_zoom: u8,
    pub max_zoom: u8,
    pub min_longitude: f32,
    pub max_longitude: f32,
    pub min_latitude: f32,
    pub max_latitude: f32,
    pub bounds: Bounds,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct TileResponse {
    pub data: Option<Vec<u8>>,
    pub cache_control: Option<String>,
    pub expires: Option<String>,
}
