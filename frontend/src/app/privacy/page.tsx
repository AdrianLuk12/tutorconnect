"use client";

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
                <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
                
                <div className="space-y-6 text-gray-600">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">1. Information We Collect</h2>
                        <p>
                            We collect information that you provide directly to us, including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Name and contact information</li>
                            <li>Academic information and preferences</li>
                            <li>Messages and communication content</li>
                            <li>Profile information and photos</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">2. How We Use Your Information</h2>
                        <p>
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide and improve our services</li>
                            <li>Match you with potential study partners</li>
                            <li>Communicate with you about our services</li>
                            <li>Ensure platform safety and security</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">3. Information Sharing</h2>
                        <p>
                            We do not sell your personal information. We share your information only:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>With your consent</li>
                            <li>With other users as part of the platform functionality</li>
                            <li>To comply with legal obligations</li>
                        </ul>
                    </section>

                    <div className="mt-8 pt-6 border-t">
                        <Link href="/" className="text-blue-600 hover:underline">
                            Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
} 