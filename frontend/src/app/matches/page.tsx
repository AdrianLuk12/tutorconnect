"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/app/fetcher';

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

    if (!matches) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="absolute top-4 right-4 space-x-4">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
            
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 text-center">Your Matches</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {matches.map((match, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center mb-4">
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
                                    <h2 className="text-xl font-semibold">{match.user.username}</h2>
                                    <p className="text-gray-600">{match.school}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="font-semibold text-green-600">Subjects they can teach:</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {match.subjects_can_teach.map(subject => (
                                        <span key={subject} className="px-2 py-1 bg-green-100 rounded text-sm">
                                            {subject}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="font-semibold text-blue-600">Subjects they need help with:</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {match.subjects_need_help.map(subject => (
                                        <span key={subject} className="px-2 py-1 bg-blue-100 rounded text-sm">
                                            {subject}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <p className="text-gray-700 mb-4">{match.bio}</p>

                            <div className="flex justify-end">
                                <button 
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    onClick={() => {/* Implement chat/message functionality */}}
                                >
                                    Message
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 