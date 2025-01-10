"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/app/fetcher';
import wretch from "wretch";
import { getToken } from "@/app/auth/utils";

interface MatchRequest {
    user: {
        id: number;
        username: string;
        profile_picture: string | null;
    };
    school: string;
    subjects_need_help: string[];
    subjects_can_teach: string[];
    bio: string;
    can_help_with: string[];
    can_get_help_with: string[];
}

export default function MatchRequests() {
    const router = useRouter();
    const { data: requests } = useSWR<MatchRequest[]>('/match-requests', fetcher);

    const handleAccept = async (userId: number) => {
        try {
            // Immediately remove the request from the UI
            if (requests) {
                const updatedRequests = requests.filter(request => request.user.id !== userId);
                mutate('/match-requests', updatedRequests, false); // Update UI immediately
            }

            // Make the API call
            await wretch(process.env.NEXT_PUBLIC_API_URL)
                .auth(`Bearer ${getToken("access")}`)
                .url(`/matches/${userId}/`)
                .post({ action: 'accept' });
            
            // Refresh both match requests and matches
            mutate('/match-requests');
            mutate('/matches');
        } catch (error) {
            console.error('Error accepting match:', error);
            // If there's an error, refresh the data to restore the original state
            mutate('/match-requests');
        }
    };

    const handleReject = async (userId: number) => {
        try {
            // Immediately remove the request from the UI
            if (requests) {
                const updatedRequests = requests.filter(request => request.user.id !== userId);
                mutate('/match-requests', updatedRequests, false); // Update UI immediately
            }

            // Make the API call
            await wretch(process.env.NEXT_PUBLIC_API_URL)
                .auth(`Bearer ${getToken("access")}`)
                .url(`/matches/${userId}/`)
                .post({ action: 'reject' });
            
            // Refresh match requests
            mutate('/match-requests');
        } catch (error) {
            console.error('Error rejecting match:', error);
            // If there's an error, refresh the data to restore the original state
            mutate('/match-requests');
        }
    };

    if (!requests) {
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
                <h1 className="text-3xl font-bold mb-8 text-center">Match Requests</h1>
                
                {requests.length === 0 ? (
                    <p className="text-center text-gray-600">No pending match requests</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {requests.map((request, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex items-center mb-4">
                                    {request.user.profile_picture ? (
                                        <img
                                            src={request.user.profile_picture}
                                            alt={request.user.username}
                                            className="w-12 h-12 rounded-full mr-4"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gray-200 mr-4" />
                                    )}
                                    <div>
                                        <h2 className="text-xl font-semibold">{request.user.username}</h2>
                                        <p className="text-gray-600">{request.school}</p>
                                    </div>
                                </div>

                                {request.can_help_with.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="font-semibold text-green-600">Can help you with:</h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {request.can_help_with.map(subject => (
                                                <span key={subject} className="px-2 py-1 bg-green-100 rounded text-sm">
                                                    {subject}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {request.can_get_help_with.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="font-semibold text-blue-600">You can help with:</h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {request.can_get_help_with.map(subject => (
                                                <span key={subject} className="px-2 py-1 bg-blue-100 rounded text-sm">
                                                    {subject}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <p className="text-gray-700 mb-4">{request.bio}</p>

                                <div className="flex justify-end space-x-2">
                                    <button 
                                        onClick={() => handleAccept(request.user.id)}
                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        onClick={() => handleReject(request.user.id)}
                                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 