export interface Group {
    id: string;
    name: string;
    mapData: Record<string, unknown>;
    chatHistory: GroupChatMsg[];
}

export interface GroupChatMsg {
    time: string;
    senderId: string;
    text: string;
}

export interface Marker {
    latitude: number;
    longitude: number;
    name: string;
}

export interface GroupMessage {
    time: string;
    senderId: string;
    type: 'group_message' | 'marker';
    content: GroupChatMsg | Marker;
}
