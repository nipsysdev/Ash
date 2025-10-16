use pmtiles::tilejson::Bounds;

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
