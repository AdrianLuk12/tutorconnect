"use client";

import useSWR from "swr";
import { fetcher } from "@/app/fetcher";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const { data: user } = useSWR("/auth/users/me", fetcher);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
            <div className="absolute top-4 right-4">
                <button
                    onClick={() => router.push('/profile')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    My Profile
                </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3 text-center">
                <h1 className="text-2xl font-bold mb-4">
                    Hi, {user?.username || user?.first_name}!
                </h1>
            </div>
        </div>
    );
}