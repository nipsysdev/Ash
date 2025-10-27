import maplibregl from 'maplibre-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '@nanostores/react';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';
import type { Marker } from '../interfaces/group';
import type { Locality } from '../interfaces/localitysrv.ts';
import { sendMarkerMessage } from '../service/chatService';
import { $storeDeviceId } from '../stores/jsonStore';
import { $isMarkerNameDialogOpened } from '../stores/mainViewStore';
import { createMarkerWithName } from '../utils/mapUtils';
import { createPMTilesProtocol } from '../utils/pmtiles-protocol.ts';
import MarkerComponent from './MarkerComponent';
import MarkerNameDialog from './MarkerNameDialog';

interface MapComponentProps {
    locality: Locality | null;
}

const MapComponent = ({ locality }: MapComponentProps) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const deviceId = useStore($storeDeviceId);
    const [pendingMarker, setPendingMarker] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const localMarkersRef = useRef<maplibregl.Marker[]>([]);
    const localPopupsRef = useRef<maplibregl.Popup[]>([]);

    const addMarkerToMap = useCallback(
        (lat: number, lng: number, name: string) => {
            if (!map.current) return;

            const { marker, popup } = createMarkerWithName(
                map.current,
                lat,
                lng,
                name,
            );

            localMarkersRef.current.push(marker);
            localPopupsRef.current.push(popup);
        },
        [],
    );

    const clearLocalMarkers = useCallback(() => {
        for (const marker of localMarkersRef.current) {
            marker.remove();
        }

        for (const popup of localPopupsRef.current) {
            popup.remove();
        }

        localMarkersRef.current = [];
        localPopupsRef.current = [];
    }, []);

    const handleMarkerNameSubmit = useCallback(
        (name: string) => {
            if (!pendingMarker || !deviceId) return;

            const { lat, lng } = pendingMarker;
            const markerData: Marker = {
                latitude: lat,
                longitude: lng,
                name: name,
            };

            sendMarkerMessage(markerData, deviceId);
            addMarkerToMap(lat, lng, name);
            setPendingMarker(null);
        },
        [pendingMarker, deviceId, addMarkerToMap],
    );

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
                    maxBounds: [
                        [locality.min_longitude, locality.min_latitude],
                        [locality.max_longitude, locality.max_latitude],
                    ],
                    zoom: 18,
                    pitch: 85,
                    attributionControl: false,
                    pitchWithRotate: false,
                    touchPitch: false,
                    rollEnabled: false,
                });

                // Add click event listener to the map
                map.current.on('click', (e) => {
                    if (!deviceId) return;

                    const { lng, lat } = e.lngLat;

                    setPendingMarker({ lat, lng });
                    $isMarkerNameDialogOpened.set(true);
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
    }, [locality, deviceId]);

    return (
        <>
            <div ref={mapContainer} className="size-full" />
            <MarkerComponent
                map={map.current}
                clearLocalMarkers={clearLocalMarkers}
            />
            <MarkerNameDialog onMarkerNameSubmit={handleMarkerNameSubmit} />
        </>
    );
};

export default MapComponent;
