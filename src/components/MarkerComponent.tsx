import { useStore } from '@nanostores/react';
import maplibregl from 'maplibre-gl';
import protobuf from 'protobufjs';
import { useEffect, useRef } from 'react';
import type { Marker } from '../interfaces/group';
import { $wakuChatChannel } from '../stores/wakuStore';

interface MarkerComponentProps {
    map: maplibregl.Map | null;
}

const MarkerComponent = ({ map }: MarkerComponentProps) => {
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const wakuChatChannel = useStore($wakuChatChannel);

    useEffect(() => {
        if (!wakuChatChannel || !map) return;

        const handleMessageReceived = (event: {
            detail: { payload: Uint8Array };
        }) => {
            try {
                const payload = event.detail.payload;
                if (!payload) return;

                // Decode the message using protobuf
                const GroupMessage = new protobuf.Type('GroupMessage')
                    .add(new protobuf.Field('time', 1, 'string'))
                    .add(new protobuf.Field('sender_id', 2, 'string'))
                    .add(new protobuf.Field('type', 3, 'string'))
                    .add(new protobuf.Field('content', 4, 'bytes'));

                const MarkerProto = new protobuf.Type('Marker')
                    .add(new protobuf.Field('latitude', 1, 'float'))
                    .add(new protobuf.Field('longitude', 2, 'float'));

                // Create a root namespace and add the message types
                const root = new protobuf.Root();
                root.add(GroupMessage);
                root.add(MarkerProto);

                const decodedMessage = GroupMessage.decode(payload);
                const data = decodedMessage.toJSON();

                // Only process marker messages in this component
                if (data.type !== 'marker') return;

                // Decode the content
                const contentBytes = (decodedMessage as any)
                    .content as Uint8Array;
                const decodedContent = MarkerProto.decode(contentBytes);
                const contentData = decodedContent.toJSON();
                const markerData: Marker = {
                    latitude: contentData.latitude,
                    longitude: contentData.longitude,
                };

                console.log('Received marker:', markerData);

                // Add marker to map
                const marker = new maplibregl.Marker()
                    .setLngLat([markerData.longitude, markerData.latitude])
                    .addTo(map);

                markersRef.current.push(marker);
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

    // Clean up markers when component unmounts
    useEffect(() => {
        return () => {
            for (const marker of markersRef.current) {
                marker.remove();
            }
            markersRef.current = [];
        };
    }, []);

    return null;
};

export default MarkerComponent;
