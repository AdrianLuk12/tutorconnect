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
    sender?: {
        username: string;
        profile_picture: string | null;
    };
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
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    // Fetch messages for selected user
    const fetchMessages = async () => {
        if (selectedUser) {
            try {
                const data = await fetcher(`/chat-history/${selectedUser.user.id}`);
                setMessages(data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        }
    };

    useEffect(() => {
        if (selectedUser) {
            // Initial fetch
            fetchMessages();

            // Set up polling
            pollInterval.current = setInterval(fetchMessages, 3000); // Poll every 3 seconds

            return () => {
                if (pollInterval.current) {
                    clearInterval(pollInterval.current);
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

                const newMessageData = await response.json();
                setMessages(prev => [...prev, newMessageData]);
                setNewMessage('');
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
                            <div className="flex items-center">
                                {selectedUser.user.profile_picture ? (
                                    <img
                                        src={selectedUser.user.profile_picture}
                                        alt={selectedUser.user.username}
                                        className="w-10 h-10 rounded-full mr-3"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
                                )}
                                <h2 className="text-xl font-semibold">{selectedUser.user.username}</h2>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((message) => {
                                const isCurrentUser = message.sender_id === parseInt(getToken('user_id') || '0');
                                return (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {/* Message Content */}
                                        <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                            <span className="text-xs text-gray-500 mb-1">
                                                {message.sender?.username}
                                            </span>
                                            <div
                                                className={`p-3 rounded-lg max-w-[80%] ${
                                                    isCurrentUser
                                                        ? 'bg-blue-500 text-white rounded-br-none'
                                                        : 'bg-gray-200 rounded-bl-none'
                                                }`}
                                            >
                                                {message.content}
                                            </div>
                                            <span className="text-xs text-gray-400 mt-1">
                                                {new Date(message.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
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