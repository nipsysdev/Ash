import maplibregl from 'maplibre-gl';

export interface MarkerWithPopup {
    marker: maplibregl.Marker;
    popup: maplibregl.Popup;
}

export function createMarkerWithName(
    map: maplibregl.Map,
    lat: number,
    lng: number,
    name: string,
): MarkerWithPopup {
    const el = document.createElement('div');
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#000';
    el.style.border = '2px solid white';

    const popup = new maplibregl.Popup({
        offset: [0, -15],
        closeButton: false,
        closeOnClick: false,
        maxWidth: 'none',
    }).setHTML(`
        <div style="
            color: black;
            font-size: 11px;
            font-weight: bold;
            white-space: nowrap;
        ">${name}</div>
    `);

    const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center',
    })
        .setLngLat([lng, lat])
        .addTo(map);

    popup.setLngLat([lng, lat]).addTo(map);

    return { marker, popup };
}
