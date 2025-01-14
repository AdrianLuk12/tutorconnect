"use client";

import useSWR, { mutate } from "swr";
import { fetcher } from "@/app/fetcher";
import { useRouter } from "next/navigation";
import wretch from "wretch";
import { getToken } from "@/app/auth/utils";

interface PotentialMatch {
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

export default function Dashboard() {
    const router = useRouter();
    const { data: user } = useSWR("/auth/users/me", fetcher);
    const { data: matches } = useSWR<PotentialMatch[]>("/potential-matches", fetcher);
    const { data: matchRequests } = useSWR<any[]>('/match-requests', fetcher);

    const handleMatch = async (userId: number) => {
        try {
            // Immediately remove the matched profile from the UI
            if (matches) {
                const updatedMatches = matches.filter(match => match.user.id !== userId);
                mutate('/potential-matches', updatedMatches, false); // Update UI immediately
            }

            // Make the API call
            await wretch(process.env.NEXT_PUBLIC_API_URL)
                .auth(`Bearer ${getToken("access")}`)
                .url(`/matches/${userId}/`)
                .post({ action: 'accept' });
            
            // Refresh the data in the background
            mutate('/potential-matches');
        } catch (error) {
            console.error('Error matching:', error);
            // If there's an error, refresh the data to restore the original state
            mutate('/potential-matches');
        }
    };

    const handlePass = async (userId: number) => {
        try {
            // Immediately remove the passed profile from the UI
            if (matches) {
                const updatedMatches = matches.filter(match => match.user.id !== userId);
                mutate('/potential-matches', updatedMatches, false); // Update UI immediately
            }

            // Make the API call
            await wretch(process.env.NEXT_PUBLIC_API_URL)
                .auth(`Bearer ${getToken("access")}`)
                .url(`/matches/${userId}/`)
                .post({ action: 'reject' });
            
            // Refresh the data in the background
            mutate('/potential-matches');
        } catch (error) {
            console.error('Error passing:', error);
            // If there's an error, refresh the data to restore the original state
            mutate('/potential-matches');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="absolute top-4 right-4 space-x-4">
                <button
                    onClick={() => router.push('/matches')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    My Matches
                </button>
                <button
                    onClick={() => router.push('/match-requests')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors relative"
                >
                    Match Requests
                    {matchRequests && matchRequests.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            {matchRequests.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => router.push('/profile')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    My Profile
                </button>
            </div>
            
            <div className="container mx-auto px-4 py-8">
                {/* <h1 className="text-3xl font-bold mb-8 text-center">
                    Welcome, {user?.username || user?.first_name}!
                </h1> */}
                <h1 className="text-3xl font-bold mb-8 text-center">
                    LearnMatch
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {matches?.map((match, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center mb-4">
                                {/* {match.user.profile_picture ? (
                                    <img
                                        src={match.user.profile_picture}
                                        alt={match.user.username}
                                        className="w-12 h-12 rounded-full mr-4"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-200 mr-4" />
                                )} */}
                                <div>
                                    <h2 className="text-xl font-semibold">{match.user.username}</h2>
                                    <p className="text-gray-600">{match.school}</p>
                                </div>
                            </div>

                            {match.can_help_with.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="font-semibold text-green-600">Can help you with:</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {match.can_help_with.map(subject => (
                                            <span key={subject} className="px-2 py-1 bg-green-100 rounded text-sm">
                                                {subject}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {match.can_get_help_with.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="font-semibold text-blue-600">You can help with:</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {match.can_get_help_with.map(subject => (
                                            <span key={subject} className="px-2 py-1 bg-blue-100 rounded text-sm">
                                                {subject}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="text-gray-700 mb-4">{match.bio}</p>

                            <div className="flex justify-end space-x-2">
                                <button 
                                    onClick={() => handleMatch(match.user.id)}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    Match
                                </button>
                                <button 
                                    onClick={() => handlePass(match.user.id)}
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Pass
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}