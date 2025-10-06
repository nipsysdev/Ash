import type { GetResourceResponse, RequestParameters } from 'maplibre-gl';
import { type PMTiles, TileType } from 'pmtiles';

export function createPMTilesProtocol(pmtilesInstance: PMTiles) {
    return async (
        request: RequestParameters,
        abortController: AbortController,
    ): Promise<GetResourceResponse<unknown>> => {
        // Check if the request was aborted
        if (abortController.signal.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }
        if (!pmtilesInstance) {
            throw new Error('PMTiles instance not set');
        }

        try {
            if (request.type === 'json') {
                const header = await pmtilesInstance.getHeader();

                if (
                    header.minLon >= header.maxLon ||
                    header.minLat >= header.maxLat
                ) {
                    console.error(
                        `Bounds of PMTiles archive ${header.minLon},${header.minLat},${header.maxLon},${header.maxLat} are not valid.`,
                    );
                }

                return {
                    data: {
                        tiles: [`${request.url}/{z}/{x}/{y}`],
                        minzoom: header.minZoom,
                        maxzoom: header.maxZoom,
                        bounds: [
                            header.minLon,
                            header.minLat,
                            header.maxLon,
                            header.maxLat,
                        ],
                    },
                };
            }

            const re = new RegExp(/pmtiles:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/);
            const result = request.url.match(re);

            if (!result) {
                throw new Error('Invalid PMTiles protocol URL');
            }

            const z = result[2];
            const x = result[3];
            const y = result[4];

            const header = await pmtilesInstance.getHeader();
            const resp = await pmtilesInstance.getZxy(+z, +x, +y);

            if (resp) {
                return {
                    data: new Uint8Array(resp.data),
                    cacheControl: resp.cacheControl || null,
                    expires: resp.expires || null,
                };
            }

            if (header.tileType === TileType.Mvt) {
                return {
                    data: new Uint8Array(),
                    cacheControl: null,
                    expires: null,
                };
            }

            return {
                data: null,
                cacheControl: null,
                expires: null,
            };
        } catch (error) {
            console.error('Error loading PMTiles tile:', error);
            throw error;
        }
    };
}
