import maplibregl from 'maplibre-gl';
import { useCallback, useEffect, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '@nanostores/react';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';
import type { Marker } from '../interfaces/group';
import type { Locality } from '../interfaces/localitysrv.ts';
import { sendMarkerMessage } from '../service/chatService';
import { $storeDeviceId } from '../stores/jsonStore';
import { createPMTilesProtocol } from '../utils/pmtiles-protocol.ts';
import MarkerComponent from './MarkerComponent';

interface MapComponentProps {
    locality: Locality | null;
}

const MapComponent = ({ locality }: MapComponentProps) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const deviceId = useStore($storeDeviceId);

    const addMarkerToMap = useCallback((lat: number, lng: number) => {
        if (!map.current) return;

        new maplibregl.Marker().setLngLat([lng, lat]).addTo(map.current);
    }, []);

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
                        sprite: `https://protomaps.github.io/basemaps-assets/sprites/v4/dark`,
                        glyphs: `https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf`,
                    },
                    center: [locality.longitude, locality.latitude],
                    zoom: 18,
                    pitch: 85,
                    attributionControl: false,
                    pitchWithRotate: false,
                    rollEnabled: false,
                });

                // Add click event listener to the map
                map.current.on('click', (e) => {
                    if (!deviceId) return;

                    const { lng, lat } = e.lngLat;
                    const markerData: Marker = {
                        latitude: lat,
                        longitude: lng,
                    };

                    // Send marker to other users
                    sendMarkerMessage(markerData, deviceId);

                    // Add marker to local map
                    addMarkerToMap(lat, lng);
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
    }, [locality, deviceId, addMarkerToMap]);

    return (
        <>
            <div ref={mapContainer} className="size-full" />
            <MarkerComponent map={map.current} />
        </>
    );
};

export default MapComponent;
