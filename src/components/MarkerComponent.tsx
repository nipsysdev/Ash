import { useStore } from '@nanostores/react';
import type maplibregl from 'maplibre-gl';
import { effect } from 'nanostores';
import protobuf from 'protobufjs';
import { useEffect, useRef } from 'react';
import type { Marker } from '../interfaces/group';
import { $storeSelectedGroup } from '../stores/jsonStore';
import { $wakuChatChannel } from '../stores/wakuStore';
import { createMarkerWithName } from '../utils/mapUtils';

interface MarkerComponentProps {
    map: maplibregl.Map | null;
    clearLocalMarkers?: () => void;
}

const MarkerComponent = ({ map, clearLocalMarkers }: MarkerComponentProps) => {
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const popupsRef = useRef<maplibregl.Popup[]>([]);
    const wakuChatChannel = useStore($wakuChatChannel);
    const previousGroupIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!wakuChatChannel || !map) return;

        const handleMessageReceived = (event: {
            detail: { payload: Uint8Array };
        }) => {
            try {
                const payload = event.detail.payload;
                if (!payload) return;

                const GroupMessage = new protobuf.Type('GroupMessage')
                    .add(new protobuf.Field('time', 1, 'string'))
                    .add(new protobuf.Field('sender_id', 2, 'string'))
                    .add(new protobuf.Field('type', 3, 'string'))
                    .add(new protobuf.Field('content', 4, 'bytes'));

                const MarkerProto = new protobuf.Type('Marker')
                    .add(new protobuf.Field('latitude', 1, 'float'))
                    .add(new protobuf.Field('longitude', 2, 'float'))
                    .add(new protobuf.Field('name', 3, 'string'));

                const root = new protobuf.Root();
                root.add(GroupMessage);
                root.add(MarkerProto);

                const decodedMessage = GroupMessage.decode(payload);
                const data = decodedMessage.toJSON();

                if (data.type !== 'marker') return;

                const contentBytes = (decodedMessage as any)
                    .content as Uint8Array;
                const decodedContent = MarkerProto.decode(contentBytes);
                const contentData = decodedContent.toJSON();
                const markerData: Marker = {
                    latitude: contentData.latitude,
                    longitude: contentData.longitude,
                    name: contentData.name || '',
                };

                console.log('Received marker:', markerData);

                const { marker, popup } = createMarkerWithName(
                    map,
                    markerData.latitude,
                    markerData.longitude,
                    markerData.name,
                );

                markersRef.current.push(marker);
                popupsRef.current.push(popup);
            } catch (error) {
                console.error('Error decoding marker message:', error);
            }
        };

        wakuChatChannel.addEventListener(
            'message-received',
            handleMessageReceived,
        );

        return () => {
            wakuChatChannel.removeEventListener(
                'message-received',
                handleMessageReceived,
            );
        };
    }, [wakuChatChannel, map]);

    effect([$storeSelectedGroup], (selectedGroup) => {
        const currentGroupId = selectedGroup?.id || null;

        if (previousGroupIdRef.current !== currentGroupId) {
            for (const marker of markersRef.current) {
                marker.remove();
            }

            for (const popup of popupsRef.current) {
                popup.remove();
            }

            markersRef.current = [];
            popupsRef.current = [];

            if (clearLocalMarkers) {
                clearLocalMarkers();
            }

            previousGroupIdRef.current = currentGroupId;
        }
    });

    useEffect(() => {
        return () => {
            for (const marker of markersRef.current) {
                marker.remove();
            }
            for (const popup of popupsRef.current) {
                popup.remove();
            }
            markersRef.current = [];
            popupsRef.current = [];
        };
    }, []);

    return null;
};

export default MarkerComponent;
