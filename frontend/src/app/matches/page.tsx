"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/app/fetcher';
import { getToken } from '@/app/auth/utils';

interface Message {
    id: number;
    content: string;
    sender_id: number;
    receiver_id: number;
    timestamp: string;
    is_read: boolean;
}

interface MatchedUser {
    user: {
        id: number;
        username: string;
        profile_picture: string | null;
    };
    school: string;
    subjects_need_help: string[];
    subjects_can_teach: string[];
    bio: string;
}

export default function Matches() {
    const router = useRouter();
    const { data: matches } = useSWR<MatchedUser[]>('/matches', fetcher);
    const [selectedUser, setSelectedUser] = useState<MatchedUser | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (selectedUser) {
            // Initial fetch of message history
            fetcher(`/chat-history/${selectedUser.user.id}`).then(setMessages);

            // Set up SSE connection
            const eventSourceUrl = new URL(`http://localhost:8000/chat-stream/${selectedUser.user.id}/`);
            eventSourceUrl.searchParams.append('token', getToken('access') || '');

            const setupEventSource = () => {
                const eventSource = new EventSource(eventSourceUrl.toString(), {
                    withCredentials: true
                });

                eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        setMessages(prev => {
                            // Check if message already exists
                            if (!prev.find(msg => msg.id === data.id)) {
                                const newMessages = [...prev, data];
                                // Sort messages by timestamp
                                return newMessages.sort((a, b) => 
                                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                                );
                            }
                            return prev;
                        });
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                };

                eventSource.onerror = (error) => {
                    console.error('SSE error:', error);
                    eventSource.close();
                    // Try to reconnect after 1 second
                    setTimeout(setupEventSource, 1000);
                };

                eventSourceRef.current = eventSource;
            };

            // Initial setup
            setupEventSource();

            return () => {
                if (eventSourceRef.current) {
                    eventSourceRef.current.close();
                    eventSourceRef.current = null;
                }
            };
        }
    }, [selectedUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && selectedUser) {
            try {
                const response = await fetch(`http://localhost:8000/messages/${selectedUser.user.id}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken('access')}`
                    },
                    body: JSON.stringify({
                        message: newMessage
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to send message');
                }

                // Clear input immediately
                setNewMessage('');

                // Add the new message to the UI
                const newMessageData = await response.json();
                setMessages(prev => {
                    const newMessages = [...prev, newMessageData];
                    return newMessages.sort((a, b) => 
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );
                });
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    if (!matches) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Matches List */}
            <div className="w-1/3 bg-white border-r">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold">Your Matches</h1>
                </div>
                <div className="overflow-y-auto h-[calc(100vh-64px)]">
                    {matches.map((match) => (
                        <div
                            key={match.user.id}
                            className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                                selectedUser?.user.id === match.user.id ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => setSelectedUser(match)}
                        >
                            <div className="flex items-center">
                                {match.user.profile_picture ? (
                                    <img
                                        src={match.user.profile_picture}
                                        alt={match.user.username}
                                        className="w-12 h-12 rounded-full mr-4"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-200 mr-4" />
                                )}
                                <div>
                                    <h2 className="font-semibold">{match.user.username}</h2>
                                    <p className="text-sm text-gray-600">{match.school}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedUser ? (
                    <>
                        <div className="p-4 border-b bg-white">
                            <h2 className="text-xl font-semibold">{selectedUser.user.username}</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`mb-4 ${
                                        message.sender_id === parseInt(getToken('user_id') || '0')
                                            ? 'text-right'
                                            : 'text-left'
                                    }`}
                                >
                                    <div
                                        className={`inline-block p-3 rounded-lg ${
                                            message.sender_id === parseInt(getToken('user_id') || '0')
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200'
                                        }`}
                                    >
                                        {message.content}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {new Date(message.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={sendMessage} className="p-4 border-t bg-white">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="flex-1 border rounded-lg px-4 py-2"
                                    placeholder="Type a message..."
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                                >
                                    Send
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Select a match to start chatting
                    </div>
                )}
            </div>
        </div>
    );
} 