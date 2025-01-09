"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import wretch from 'wretch';
import { AuthActions } from "@/app/auth/utils";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/app/fetcher";
import { mutate } from 'swr';

type ProfileData = {
    username: string;
    role: 'student' | 'tutor' | 'both';
    school: string;
    profile_picture?: FileList;
    subjects_need_help: string[];
    subjects_can_teach: string[];
    bio: string;
};

// Add interface for API response
interface ProfileResponse {
    username: string;
    role: 'student' | 'tutor' | 'both';
    school: string;
    profile_picture: string | null;
    subjects_need_help: string[];
    subjects_can_teach: string[];
    bio: string;
}

// Add user interface
interface User {
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
}

const AVAILABLE_SUBJECTS = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'English', 'History', 'Computer Science', 'Economics'
];

const { logout, removeTokens } = AuthActions();

export default function Profile() {
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [selectedSubjectsNeed, setSelectedSubjectsNeed] = useState<string[]>([]);
    const [selectedSubjectsTeach, setSelectedSubjectsTeach] = useState<string[]>([]);
    
    const { getToken } = AuthActions();
    const router = useRouter();
    
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors }
    } = useForm<ProfileData>();

    const role = watch('role');

    const { data: user } = useSWR<User>("/auth/users/me", fetcher);

    // Fetch profile data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await wretch("http://localhost:8000")
                    .auth(`Bearer ${getToken("access")}`)
                    .url("/profile/")
                    .get()
                    .json<ProfileResponse>();
                
                const profileData: ProfileData = {
                    ...data,
                    username: user?.username || '',
                    profile_picture: undefined // Convert string to undefined since we can't show the existing image in the form
                };
                
                setProfileData(profileData);
                setSelectedSubjectsNeed(data.subjects_need_help);
                setSelectedSubjectsTeach(data.subjects_can_teach);
                reset(profileData);
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };

        fetchProfile();
    }, []);

    const onSubmit = async (data: ProfileData) => {
        const formData = new FormData();
        formData.append('username', data.username);
        formData.append('role', data.role);
        formData.append('school', data.school);
        formData.append('subjects_need_help', JSON.stringify(selectedSubjectsNeed));
        formData.append('subjects_can_teach', JSON.stringify(selectedSubjectsTeach));
        formData.append('bio', data.bio);
        
        if (data.profile_picture?.[0]) {
            formData.append('profile_picture', data.profile_picture[0]);
        }

        try {
            const result = await wretch("http://localhost:8000")
                .auth(`Bearer ${getToken("access")}`)
                .url("/profile/")
                .put(formData)
                .json<ProfileResponse>();

            setProfileData({
                ...result,
                username: result.username,
                profile_picture: undefined
            });
            
            mutate("/auth/users/me", { ...user, username: result.username }, false);
            
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleLogout = () => {
        logout()
            .res(() => {
                removeTokens();
                router.push("/");
            })
            .catch(() => {
                removeTokens();
                router.push("/");
            });
    };

    if (!profileData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg w-2/3">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold">Your Profile</h3>
                    <div className="space-x-4">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                            {isEditing ? 'Cancel' : 'Edit Profile'}
                        </button>
                        {!isEditing && (
                            <>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
                                >
                                    Back to Dashboard
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
                                >
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="block mb-2">Username</label>
                            <input
                                type="text"
                                {...register('username', { required: true })}
                                defaultValue={user?.username}
                                className="w-full p-2 border rounded"
                            />
                            {errors.username && (
                                <span className="text-red-500 text-sm">Username is required</span>
                            )}
                        </div>

                        <div>
                            <label className="block mb-2">I want to...</label>
                            <select
                                {...register('role', { required: true })}
                                className="w-full p-2 border rounded"
                            >
                                <option value="student">Get Help with Studies</option>
                                <option value="tutor">Tutor Others</option>
                                <option value="both">Both</option>
                            </select>
                        </div>

                        <div>
                            <label className="block mb-2">School/University</label>
                            <input
                                type="text"
                                {...register('school', { required: true })}
                                className="w-full p-2 border rounded"
                            />
                        </div>

                        {/* <div>
                            <label className="block mb-2">Profile Picture</label>
                            <input
                                type="file"
                                accept="image/*"
                                {...register('profile_picture')}
                                className="w-full p-2 border rounded"
                            />
                        </div> */}

                        {(role === 'student' || role === 'both') && (
                            <div>
                                <label className="block mb-2">Subjects I Need Help With</label>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_SUBJECTS.map(subject => (
                                        <label key={subject} className="inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                value={subject}
                                                checked={selectedSubjectsNeed.includes(subject)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedSubjectsNeed([...selectedSubjectsNeed, subject]);
                                                    } else {
                                                        setSelectedSubjectsNeed(selectedSubjectsNeed.filter(s => s !== subject));
                                                    }
                                                }}
                                                className="mr-2"
                                            />
                                            {subject}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(role === 'tutor' || role === 'both') && (
                            <div>
                                <label className="block mb-2">Subjects I Can Teach</label>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_SUBJECTS.map(subject => (
                                        <label key={subject} className="inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                value={subject}
                                                checked={selectedSubjectsTeach.includes(subject)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedSubjectsTeach([...selectedSubjectsTeach, subject]);
                                                    } else {
                                                        setSelectedSubjectsTeach(selectedSubjectsTeach.filter(s => s !== subject));
                                                    }
                                                }}
                                                className="mr-2"
                                            />
                                            {subject}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block mb-2">Bio</label>
                            <textarea
                                {...register('bio', { required: true })}
                                className="w-full p-2 border rounded"
                                rows={4}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Save Changes
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold mb-2">Account Details</h4>
                            <div className="space-y-2">
                                <p><span className="font-medium">Username:</span> {user?.username}</p>
                                <p><span className="font-medium">Email:</span> {user?.email}</p>
                                {user?.first_name && (
                                    <p><span className="font-medium">First Name:</span> {user?.first_name}</p>
                                )}
                                {user?.last_name && (
                                    <p><span className="font-medium">Last Name:</span> {user?.last_name}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Role</h4>
                            <p>{profileData.role === 'both' ? 'Student & Tutor' : 
                               profileData.role === 'student' ? 'Student' : 'Tutor'}</p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">School/University</h4>
                            <p>{profileData.school}</p>
                        </div>

                        {/* {profileData.profile_picture && (
                            <div>
                                <h4 className="font-semibold mb-2">Profile Picture</h4>
                                <img 
                                    src={profileData.profile_picture.toString()} 
                                    alt="Profile" 
                                    className="w-32 h-32 object-cover rounded-full"
                                />
                            </div>
                        )} */}

                        {(profileData.role === 'student' || profileData.role === 'both') && (
                            <div>
                                <h4 className="font-semibold mb-2">Subjects I Need Help With</h4>
                                <div className="flex flex-wrap gap-2">
                                    {profileData.subjects_need_help.map(subject => (
                                        <span key={subject} className="px-2 py-1 bg-blue-100 rounded">
                                            {subject}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(profileData.role === 'tutor' || profileData.role === 'both') && (
                            <div>
                                <h4 className="font-semibold mb-2">Subjects I Can Teach</h4>
                                <div className="flex flex-wrap gap-2">
                                    {profileData.subjects_can_teach.map(subject => (
                                        <span key={subject} className="px-2 py-1 bg-green-100 rounded">
                                            {subject}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <h4 className="font-semibold mb-2">Bio</h4>
                            <p>{profileData.bio}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}