import maplibregl from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';
import { PMTiles, Protocol, TileType } from 'pmtiles';
import type { Locality } from '../interfaces/locality.ts';

interface MapComponentProps {
    locality: Locality | null;
}

// Custom protocol class that extends PMTiles Protocol
class CustomPMTilesProtocol extends Protocol {
    constructor(
        private pmtilesInstance: PMTiles,
        options?: {
            metadata?: boolean;
            errorOnMissingTile?: boolean;
        },
    ) {
        super(options);
    }

    // Override the tile method to handle custom tile loading based on the original implementation
    tile = async (
        request: Parameters<Protocol['tile']>[0],
        _abortController: Parameters<Protocol['tile']>[1],
    ) => {
        if (!this.pmtilesInstance) {
            throw new Error('PMTiles instance not set');
        }

        try {
            // Handle JSON metadata requests
            if (request.type === 'json') {
                if (this.metadata) {
                    return {
                        data: await this.pmtilesInstance.getTileJson(
                            request.url,
                        ),
                    };
                }

                const header = await this.pmtilesInstance.getHeader();

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

            // Handle tile requests using regex matching like the original
            const re = new RegExp(/pmtiles:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/);
            const result = request.url.match(re);

            if (!result) {
                throw new Error('Invalid PMTiles protocol URL');
            }

            const z = result[2];
            const x = result[3];
            const y = result[4];

            const header = await this.pmtilesInstance.getHeader();
            const resp = await this.pmtilesInstance.getZxy(+z, +x, +y);

            if (resp) {
                return {
                    data: new Uint8Array(resp.data),
                    cacheControl: resp.cacheControl,
                    expires: resp.expires,
                };
            }

            if (header.tileType === TileType.Mvt) {
                if (this.errorOnMissingTile) {
                    throw new Error('Tile not found.');
                }
                return { data: new Uint8Array() };
            }

            return { data: null };
        } catch (error) {
            console.error('Error loading PMTiles tile:', error);
            throw error;
        }
    };
}

const MapComponent = ({ locality }: MapComponentProps) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (!mapContainer.current || !locality) return;

        let mapInstance: maplibregl.Map | null = null;

        const initMap = async () => {
            if (!mapContainer.current) return;
            try {
                const appDir = await appDataDir();
                const pmtilesPath = await join(
                    appDir,
                    `${locality.id}.pmtiles`,
                );
                const assetUrl = convertFileSrc(pmtilesPath);
                const pmtilesInstance = new PMTiles(assetUrl);
                const protocol = new CustomPMTilesProtocol(pmtilesInstance, {
                    metadata: true,
                    errorOnMissingTile: false,
                });
                maplibregl.addProtocol('pmtiles', protocol.tile);

                map.current = new maplibregl.Map({
                    container: mapContainer.current,
                    style: {
                        version: 8,
                        sources: {
                            protomaps: {
                                type: 'vector',
                                url: `pmtiles://${assetUrl}`,
                                attribution: '© Protomaps | © OpenStreetMap',
                            },
                        },
                        layers: layers('protomaps', namedFlavor('light'), {
                            lang: 'en',
                        }),
                        sprite: `http://lokhlass/sprites/light`,
                        glyphs: `http://lokhlass/fonts/{fontstack}/{range}.pbf`,
                    },
                    center: [locality.longitude, locality.latitude],
                    zoom: 12,
                    pitch: 75,
                    attributionControl: {
                        compact: false,
                        customAttribution: 'MapLibre',
                    },
                });

                map.current.addControl(new maplibregl.NavigationControl());
            } catch (error) {
                console.error('Error initializing map:', error);
            }
        };

        initMap();

        return () => {
            if (mapInstance) {
                mapInstance.remove();
                mapInstance = null;
                maplibregl.removeProtocol('pmtiles');
            }
        };
    }, [locality]);

    return <div ref={mapContainer} className="size-full" />;
};

export default MapComponent;
