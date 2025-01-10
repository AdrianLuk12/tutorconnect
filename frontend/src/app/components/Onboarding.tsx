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

    const handleSubjectNeedChange = (subject: string, checked: boolean) => {
        if (checked) {
            // Only add if not in can teach list
            if (!selectedSubjectsTeach.includes(subject)) {
                setSelectedSubjectsNeed([...selectedSubjectsNeed, subject]);
            } else {
                // Optionally show an error message
                alert("You cannot select a subject you can already teach!");
            }
        } else {
            setSelectedSubjectsNeed(selectedSubjectsNeed.filter(s => s !== subject));
        }
    };

    const handleSubjectTeachChange = (subject: string, checked: boolean) => {
        if (checked) {
            // Only add if not in need help list
            if (!selectedSubjectsNeed.includes(subject)) {
                setSelectedSubjectsTeach([...selectedSubjectsTeach, subject]);
            } else {
                // Optionally show an error message
                alert("You cannot teach a subject you need help with!");
            }
        } else {
            setSelectedSubjectsTeach(selectedSubjectsTeach.filter(s => s !== subject));
        }
    };

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
            await wretch(process.env.NEXT_PUBLIC_API_URL)
                .auth(`Bearer ${AuthActions().getToken("access")}`)
                .url("/profile/onboarding/")
                .post(formData)
                .res();

            router.push("/dashboard");
        } catch (error) {
            console.error("Error during onboarding:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">Complete Your Profile</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-4">
                        <label className="block mb-2">Role</label>
                        <select
                            {...register('role', { required: true })}
                            className="w-full p-2 border rounded"
                        >
                            <option value="select">Select a role</option>
                            <option value="student">Student</option>
                            <option value="tutor">Tutor</option>
                            <option value="both">Both</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2">School/University</label>
                        <input
                            type="text"
                            {...register('school', { required: true })}
                            className="w-full p-2 border rounded"
                            placeholder="Enter your school or university"
                        />
                    </div>

                    {(role === 'student' || role === 'both') && (
                        <div className="mb-4">
                            <label className="block mb-2">Subjects I Need Help With</label>
                            <div className="grid grid-cols-2 gap-2">
                                {AVAILABLE_SUBJECTS.map(subject => (
                                    <label key={subject} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedSubjectsNeed.includes(subject)}
                                            onChange={(e) => handleSubjectNeedChange(subject, e.target.checked)}
                                            className="mr-2"
                                        />
                                        {subject}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {(role === 'tutor' || role === 'both') && (
                        <div className="mb-4">
                            <label className="block mb-2">Subjects I Can Teach</label>
                            <div className="grid grid-cols-2 gap-2">
                                {AVAILABLE_SUBJECTS.map(subject => (
                                    <label key={subject} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedSubjectsTeach.includes(subject)}
                                            onChange={(e) => handleSubjectTeachChange(subject, e.target.checked)}
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
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4"
                    >
                        Complete Profile
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Onboarding;