import { invoke } from '@tauri-apps/api/core';
import type { GetResourceResponse, RequestParameters } from 'maplibre-gl';
import { type PmtileHeader, TileType } from '../interfaces/pmtiles.ts';

export function createPMTilesProtocol(localityId: number) {
    return async (
        request: RequestParameters,
        abortController: AbortController,
    ): Promise<GetResourceResponse<unknown>> => {
        if (abortController.signal.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        try {
            const header = await invoke<PmtileHeader>('get_pmtiles_header', {
                localityId,
            });
            if (request.type === 'json') {
                if (
                    header.min_longitude >= header.max_longitude ||
                    header.min_latitude >= header.max_latitude
                ) {
                    console.error(
                        `Bounds of PMTiles archive ${header.min_longitude},${header.min_latitude},${header.max_longitude},${header.max_latitude} are not valid.`,
                    );
                }

                return {
                    data: {
                        tiles: [`${request.url}/{z}/{x}/{y}`],
                        minzoom: header.min_zoom,
                        maxzoom: header.max_zoom,
                        bounds: header.bounds,
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

            const data = await invoke<unknown>('get_pmtiles_tile', {
                localityId,
                z: +z,
                x: +x,
                y: +y,
            });

            if (data) {
                return {
                    data: new Uint8Array(data as number[]),
                };
            }

            if (header.tile_type === TileType.Mvt) {
                return {
                    data: new Uint8Array(),
                };
            }

            return {
                data: null,
            };
        } catch (error) {
            console.error('Error loading PMTiles tile:', error);
            throw error;
        }
    };
}
