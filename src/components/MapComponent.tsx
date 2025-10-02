import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import { layers, namedFlavor } from "@protomaps/basemaps";

const MapComponent = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (!mapContainer.current) return;

        const protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    protomaps: {
                        type: "vector",
                        url: "pmtiles:///planet.pmtiles",
                        attribution: "© Protomaps | © OpenStreetMap",
                    },
                },
                layers: layers("protomaps", namedFlavor("light"), {
                    lang: "en",
                }),
                "sprite": `${globalThis.location.origin}/sprites/v4/light`,
                "glyphs":
                    `${globalThis.location.origin}/fonts/{fontstack}/{range}.pbf`,
            },
            center: [-74.006, 40.7128],
            zoom: 10,
            attributionControl: {
                compact: false,
                customAttribution: "MapLibre",
            },
        });

        map.current.addControl(new maplibregl.NavigationControl());

        return () => {
            map.current?.remove();
            maplibregl.removeProtocol("pmtiles");
        };
    }, []);

    return (
        <div className="map-container">
            <div ref={mapContainer} className="map" />
        </div>
    );
};

export default MapComponent;
