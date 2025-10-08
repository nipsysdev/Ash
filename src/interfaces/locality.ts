export interface Locality {
    id: number;
    name: string;
    country: string;
    placetype: string;
    latitude: number;
    longitude: number;
    file_size: number;
}

export interface LocalitiesResponse {
    data: Locality[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    };
}
