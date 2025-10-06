import maplibregl from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { Protocol } from 'pmtiles';

const MapComponent = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (!mapContainer.current) return;

        const protocol = new Protocol();
        maplibregl.addProtocol('pmtiles', protocol.tile);

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    protomaps: {
                        type: 'vector',
                        url: 'pmtiles://http://lokhlass:8080/countries/CZ/localities/101748113/pmtiles',
                        attribution: '© Protomaps | © OpenStreetMap',
                    },
                },
                layers: layers('protomaps', namedFlavor('light'), {
                    lang: 'en',
                }),
                sprite: `http://lokhlass/sprites/light`,
                glyphs: `http://lokhlass/fonts/{fontstack}/{range}.pbf`,
            },
            center: [14.460249, 50.06694],
            zoom: 12,
            attributionControl: {
                compact: false,
                customAttribution: 'MapLibre',
            },
        });

        map.current.addControl(new maplibregl.NavigationControl());

        return () => {
            map.current?.remove();
            maplibregl.removeProtocol('pmtiles');
        };
    }, []);

    return (
        <div className="map-container">
            <div ref={mapContainer} className="map" />
        </div>
    );
};

export default MapComponent;
