import protobuf from 'protobufjs';
import type { GroupChatMsg, GroupMessage, Marker } from '../interfaces/group';
import { $wakuChatChannel } from '../stores/wakuStore';

export const newMsgProtoBuilder = () =>
    new protobuf.Type('GroupChatMsg')
        .add(new protobuf.Field('time', 1, 'string'))
        .add(new protobuf.Field('sender_id', 2, 'string'))
        .add(new protobuf.Field('text', 3, 'string'));

export const newMarkerProtoBuilder = () =>
    new protobuf.Type('Marker')
        .add(new protobuf.Field('latitude', 1, 'float'))
        .add(new protobuf.Field('longitude', 2, 'float'))
        .add(new protobuf.Field('name', 3, 'string'));

export const newGroupMessageProtoBuilder = () =>
    new protobuf.Type('GroupMessage')
        .add(new protobuf.Field('time', 1, 'string'))
        .add(new protobuf.Field('sender_id', 2, 'string'))
        .add(new protobuf.Field('type', 3, 'string'))
        .add(new protobuf.Field('content', 4, 'bytes'));

export async function sendGroupMessage(msg: GroupChatMsg) {
    const reliableChannel = $wakuChatChannel.get();
    if (!reliableChannel) return;

    const groupMessage: GroupMessage = {
        time: msg.time,
        senderId: msg.senderId,
        type: 'group_message',
        content: msg,
    };

    await sendGroupMessageInternal(groupMessage);
}

export async function sendMarkerMessage(marker: Marker, senderId: string) {
    const reliableChannel = $wakuChatChannel.get();
    if (!reliableChannel) return;

    const groupMessage: GroupMessage = {
        time: new Date().toISOString(),
        senderId,
        type: 'marker',
        content: marker,
    };

    await sendGroupMessageInternal(groupMessage);
}

async function sendGroupMessageInternal(msg: GroupMessage) {
    const reliableChannel = $wakuChatChannel.get();
    if (!reliableChannel) return;

    const builder = newGroupMessageProtoBuilder();

    // Serialize content based on type
    let contentBytes: Uint8Array;
    if (msg.type === 'group_message') {
        const chatMsg = msg.content as GroupChatMsg;
        const chatMsgBuilder = newMsgProtoBuilder();
        const chatMsgProto = chatMsgBuilder.create({
            time: chatMsg.time,
            sender_id: chatMsg.senderId,
            text: chatMsg.text,
        });
        contentBytes = chatMsgBuilder.encode(chatMsgProto).finish();
    } else {
        const marker = msg.content as Marker;
        const markerBuilder = newMarkerProtoBuilder();
        const markerProto = markerBuilder.create({
            latitude: marker.latitude,
            longitude: marker.longitude,
            name: marker.name,
        });
        contentBytes = markerBuilder.encode(markerProto).finish();
    }

    const msgProto = builder.create({
        time: msg.time,
        sender_id: msg.senderId,
        type: msg.type,
        content: contentBytes,
    });

    const serialized = builder.encode(msgProto).finish();
    reliableChannel.send(serialized);
}
