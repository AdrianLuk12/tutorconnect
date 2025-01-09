import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import wretch from 'wretch';
import { AuthActions } from "@/app/auth/utils";

type OnboardingData = {
    role: 'student' | 'tutor' | 'both' | 'select';
    school: string;
    profile_picture?: FileList;
    subjects_need_help: string[];
    subjects_can_teach: string[];
    bio: string;
};

const AVAILABLE_SUBJECTS = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'English', 'History', 'Computer Science', 'Economics'
];

const Onboarding = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<OnboardingData>();

    const router = useRouter();
    const [selectedSubjectsNeed, setSelectedSubjectsNeed] = useState<string[]>([]);
    const [selectedSubjectsTeach, setSelectedSubjectsTeach] = useState<string[]>([]);
    const role = watch('role');

    const { getToken } = AuthActions();

    const onSubmit = async (data: OnboardingData) => {
        const formData = new FormData();
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
                .url("/profile/onboarding/")
                .post(formData)
                .json();

            console.log('Onboarding result:', result);
            router.push('/dashboard');
        } catch (error) {
            console.error('Onboarding error:', error);
            // You might want to show an error message to the user here
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg w-2/3">
                <h3 className="text-2xl font-bold text-center mb-8">Complete Your Profile</h3>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block mb-2">I want to...</label>
                        <select
                            {...register('role', { 
                                required: true,
                                validate: (value) => value !== 'select' || 'Please select a role' 
                            })}
                            className="w-full p-2 border rounded"
                            defaultValue="select"
                        >
                            <option value="select" disabled>Select an option</option>
                            <option value="student">Get Help with Studies</option>
                            <option value="tutor">Tutor Others</option>
                            <option value="both">Both</option>
                        </select>
                        {errors.role && (
                            <span className="text-xs text-red-600">
                                {errors.role.message || 'This field is required'}
                            </span>
                        )}
                    </div>

                    <div>
                        <label className="block mb-2">School/University</label>
                        <input
                            type="text"
                            {...register('school', { required: true })}
                            className="w-full p-2 border rounded"
                            placeholder="Enter your school name"
                        />
                    </div>

                    <div>
                        <label className="block mb-2">Profile Picture</label>
                        <input
                            type="file"
                            accept="image/*"
                            {...register('profile_picture')}
                            className="w-full p-2 border rounded"
                        />
                    </div>

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
                            placeholder="Tell us a bit about yourself..."
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Complete Profile
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Onboarding;