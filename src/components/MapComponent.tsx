import maplibregl from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';
import type { Locality } from '../interfaces/localitysrv.ts';
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
                const protocol = createPMTilesProtocol(locality.id);
                maplibregl.addProtocol('pmtiles', protocol);

                map.current = new maplibregl.Map({
                    container: mapContainer.current,
                    style: {
                        version: 8,
                        sources: {
                            protomaps: {
                                type: 'vector',
                                url: `pmtiles://${assetUrl}`,
                            },
                        },
                        layers: layers('protomaps', namedFlavor('dark'), {
                            lang: 'en',
                        }),
                        sprite: `http://lokhlass/sprites/dark`,
                        glyphs: `http://lokhlass/fonts/{fontstack}/{range}.pbf`,
                    },
                    center: [locality.longitude, locality.latitude],
                    zoom: 18,
                    pitch: 85,
                    attributionControl: false,
                    pitchWithRotate: false,
                    rollEnabled: false,
                });
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
