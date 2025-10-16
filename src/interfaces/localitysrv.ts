export interface Country {
    country_code: string;
    country_name: string;
    locality_count: number;
}

export interface CountrySearchRequest {
    query: string;
    page: number;
    limit: number;
}

export interface CountrySearchResponse {
    query_id: string;
    countries: Country[];
    page: number;
    total: number;
    total_pages: number;
}
export const emptyCountrySearchResponse: CountrySearchResponse = {
    query_id: '',
    countries: [],
    page: 0,
    total: 0,
    total_pages: 0,
};

export interface Locality {
    id: string;
    name: string;
    country: string;
    placetype: string;
    latitude: number;
    longitude: number;
    min_latitude: number;
    min_longitude: number;
    max_latitude: number;
    max_longitude: number;
    file_size: number;
    onion_link: string;
}

export interface LocalitySearchResponse {
    query_id: string;
    localities: Locality[];
    page: number;
    total: number;
    total_pages: number;
}
export const emptyLocalitySearchResponse: LocalitySearchResponse = {
    query_id: '',
    localities: [],
    page: 0,
    total: 0,
    total_pages: 0,
};
