import maplibregl from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';
import { PMTiles } from 'pmtiles';
import type { Locality } from '../interfaces/locality.ts';
import { createPMTilesProtocol } from '../utils/pmtiles-protocol.ts';

interface MapComponentProps {
    locality: Locality | null;
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
                const protocol = createPMTilesProtocol(pmtilesInstance);
                maplibregl.addProtocol('pmtiles', protocol);

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
                    pitch: 0,
                    attributionControl: {
                        compact: false,
                        customAttribution: 'MapLibre',
                    },
                });

                map.current.on('zoom', () => {
                    if (map.current) {
                        const currentZoom = map.current.getZoom();
                        const newPitch = currentZoom <= 14 ? 0 : 85;
                        map.current.setPitch(newPitch);
                    }
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
