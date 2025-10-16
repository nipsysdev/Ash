/* import { useStore } from '@nanostores/react';
import { Button, Typography } from '@nipsysdev/lsd-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { NetworkStatus } from '../interfaces/networkStatus';
import {
    $isWakuDialogOpened,
    $wakuError,
    $wakuSentMessages,
    $wakuStatus,
} from '../stores/wakuStore'; */

export default function WakuView() {
    /* const [message, setMessage] = useState('');
    const [username, setUsername] = useState('');
    const [topic, setTopic] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesLengthRef = useRef(0);

    const wakuStatus = useStore($wakuStatus);
    const wakuError = useStore($wakuError);
    const wakuSentMessages = useStore($wakuSentMessages);

    const isConnected = wakuStatus === NetworkStatus.Online;
    const error = wakuError;
    const messages = wakuSentMessages;

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > messagesLengthRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            messagesLengthRef.current = messages.length;
        }
    }, [messages]);

    const handleConnect = async () => {
        if (!topic.trim() || !username.trim()) return;

        setIsConnecting(true);
        try {
            $isWakuDialogOpened.set(true);
            // If already connected, we need to disconnect first
            if (isConnected) {
                // For now, we'll just let the new connection override the old one
                // In a more complete implementation, we would add a disconnect function
            }
            await connectToWaku(topic, username, '/ash/1/chat/proto');
        } catch (err) {
            console.error('Failed to connect to Waku:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleSendMessage = () => {
        if (!message.trim()) return;

        try {
            sendWakuMessage(message, username || 'Anonymous');
            setMessage('');
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <Typography variant="h3" color="primary">
                    Waku Error
                </Typography>
                <Typography variant="body1" className="mt-2">
                    {error}
                </Typography>
                <Button
                    onClick={() => window.location.reload()}
                    className="mt-4"
                >
                    Retry
                </Button>
            </div>
        );
    } */

    return (
        <div className="flex flex-col h-full">
            {/* <div className="border-b">
                {!isConnected ? (
                    <div className="space-y-3">
                        <div>
                            <Typography variant="body2" className="mb-1">
                                Topic
                            </Typography>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Enter topic..."
                                className="w-full p-2 border rounded-lg"
                                disabled={isConnecting}
                            />
                        </div>
                        <div>
                            <Typography variant="body2" className="mb-1">
                                Username
                            </Typography>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username..."
                                className="w-full p-2 border rounded-lg"
                                disabled={isConnecting}
                            />
                        </div>
                        <Button
                            onClick={handleConnect}
                            disabled={
                                !topic.trim() ||
                                !username.trim() ||
                                isConnecting
                            }
                            className="w-full"
                        >
                            {isConnecting ? 'Connecting...' : 'Connect'}
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-x-large">
                        <div className="flex items-center">
                            <div
                                className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}
                            ></div>
                            <Typography variant="body2" color="secondary">
                                Status: Connected
                            </Typography>
                            <Typography variant="body1">{username}</Typography>
                        </div>
                        <Typography
                            variant="body2"
                            color="secondary"
                            className="mt-1 text-sm"
                        >
                            Topic: {topic}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="secondary"
                            className="mt-1 text-sm"
                        >
                            Your Username: {username}
                        </Typography>
                    </div>
                )}
            </div>

            {isConnected && (
                <>
                    <div className="flex-1 overflow-y-auto p-4">
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <Typography variant="body1" color="secondary">
                                    No messages yet. Start the conversation!
                                </Typography>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg, index) => {
                                    // Create a more stable key using message ID or timestamp if available
                                    const messageKey =
                                        msg.messageId || msg.timestamp || index;

                                    // Check if the message is from the current user
                                    const isOwnMessage =
                                        msg.sender === username;

                                    return (
                                        <div
                                            key={messageKey}
                                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                    isOwnMessage
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-200 text-gray-800'
                                                }`}
                                            >
                                                <Typography variant="body2">
                                                    {msg.text}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    className={`block mt-1 text-xs ${
                                                        isOwnMessage
                                                            ? 'text-blue-100'
                                                            : 'text-gray-500'
                                                    }`}
                                                >
                                                    {msg.timestamp
                                                        ? new Date(
                                                              msg.timestamp,
                                                          ).toLocaleTimeString()
                                                        : ''}
                                                    {!isOwnMessage &&
                                                        ` • ${msg.sender?.substring(0, 8)}...`}
                                                </Typography>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t">
                        <div className="flex space-x-2">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                rows={2}
                                className="flex-1 p-2 border rounded-lg resize-none"
                                disabled={!isConnected}
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!isConnected || !message.trim()}
                                className="self-end"
                            >
                                Send
                            </Button>
                        </div>
                    </div>
                </>
            )} */}
        </div>
    );
}
