export enum TileType {
    Unknown = 0,
    Mvt = 1,
    Png = 2,
    Jpeg = 3,
    Webp = 4,
    Avif = 5,
}

export type PmtileHeader = {
    tile_type: TileType;
    min_zoom: number;
    max_zoom: number;
    min_longitude: number;
    max_longitude: number;
    min_latitude: number;
    max_latitude: number;
    bounds: number[];
};
