import { useStore } from '@nanostores/react';
import { Button, Input, Typography } from '@nipsysdev/lsd-react';
import { Send } from 'lucide-react';
import protobuf from 'protobufjs';
import { useEffect, useRef, useState } from 'react';
import type { GroupChatMsg } from '../interfaces/group';
import { sendGroupMessage } from '../service/chatService';
import { $storeDeviceId, $storeSelectedGroup } from '../stores/jsonStore';
import { $wakuChatChannel } from '../stores/wakuStore';

export default function GroupChatComponent() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<GroupChatMsg[]>([]);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const deviceId = useStore($storeDeviceId);
    const selectedGroup = useStore($storeSelectedGroup);
    const wakuChatChannel = useStore($wakuChatChannel);

    // Initialize message listener when component mounts or channel changes
    useEffect(() => {
        if (!wakuChatChannel) return;

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

                const GroupChatMsg = new protobuf.Type('GroupChatMsg')
                    .add(new protobuf.Field('time', 1, 'string'))
                    .add(new protobuf.Field('sender_id', 2, 'string'))
                    .add(new protobuf.Field('text', 3, 'string'));

                const Marker = new protobuf.Type('Marker')
                    .add(new protobuf.Field('latitude', 1, 'float'))
                    .add(new protobuf.Field('longitude', 2, 'float'));

                // Create a root namespace and add the message types
                const root = new protobuf.Root();
                root.add(GroupMessage);
                root.add(GroupChatMsg);
                root.add(Marker);

                const decodedMessage = GroupMessage.decode(payload);
                const data = decodedMessage.toJSON();

                // Only process group messages in this component
                if (data.type !== 'group_message') return;

                // Decode the content
                const contentBytes = (decodedMessage as any)
                    .content as Uint8Array;
                const decodedContent = GroupChatMsg.decode(contentBytes);
                const contentData = decodedContent.toJSON();

                const newMsg: GroupChatMsg = {
                    time: contentData.time,
                    senderId: contentData.sender_id,
                    text: contentData.text,
                };
                console.log('Received chat message:', newMsg);

                setMessages((prev: GroupChatMsg[]) => {
                    // Check if message already exists by comparing all fields
                    const isDuplicate = prev.some(
                        (msg: GroupChatMsg) =>
                            msg.time === newMsg.time &&
                            msg.senderId === newMsg.senderId &&
                            msg.text === newMsg.text,
                    );

                    if (!isDuplicate) {
                        return [...prev, newMsg];
                    }
                    return prev;
                });
            } catch (error) {
                console.error('Error decoding message:', error);
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
    }, [wakuChatChannel]);

    // Load chat history when selected group changes
    useEffect(() => {
        if (selectedGroup?.chatHistory) {
            setMessages(selectedGroup.chatHistory);
        } else {
            setMessages([]);
        }
    }, [selectedGroup]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop =
                scrollAreaRef.current.scrollHeight;
        }
    });

    const handleSendMessage = () => {
        if (!message.trim() || !deviceId) return;

        try {
            const newMessage: GroupChatMsg = {
                time: new Date().toISOString(),
                senderId: deviceId,
                text: message,
            };
            sendGroupMessage(newMessage);

            setMessages((prev) => {
                // Check if message already exists by comparing all fields
                const isDuplicate = prev.some(
                    (msg) =>
                        msg.time === newMessage.time &&
                        msg.senderId === newMessage.senderId &&
                        msg.text === newMessage.text,
                );

                if (!isDuplicate) {
                    return [...prev, newMessage];
                }
                return prev;
            });
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (time: string) => {
        const date = new Date(time);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-[400px]">
            <div
                className="flex-grow p-4 border rounded-lg mb-4 overflow-y-auto"
                ref={scrollAreaRef}
            >
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <Typography variant="body2" color="secondary">
                            No messages yet
                        </Typography>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.time}
                                className={`flex ${
                                    msg.senderId === deviceId
                                        ? 'justify-end'
                                        : 'justify-start'
                                }`}
                            >
                                <div className="max-w-[80%] rounded-lg p-3">
                                    <Typography variant="body2">
                                        {msg.text}
                                    </Typography>
                                    <Typography
                                        variant="subtitle4"
                                        color="secondary"
                                        className="block mt-1 text-right"
                                    >
                                        {formatTime(msg.time)}
                                    </Typography>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-grow"
                />
                <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || !deviceId}
                    size="icon"
                >
                    <Send size={16} />
                </Button>
            </div>
        </div>
    );
}
