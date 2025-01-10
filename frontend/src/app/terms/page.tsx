"use client";

import React from 'react';
import Link from 'next/link';

export default function TermsOfUse() {
    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
                <h1 className="text-3xl font-bold mb-6">Terms of Use</h1>
                
                <div className="space-y-6 text-gray-600">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using LearnMatch, you accept and agree to be bound by the terms and 
                            provisions of this agreement.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">2. User Responsibilities</h2>
                        <p>
                            Users agree to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide accurate and complete information</li>
                            <li>Maintain the confidentiality of their account</li>
                            <li>Use the platform responsibly and ethically</li>
                            <li>Respect other users and their privacy</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">3. Platform Rules</h2>
                        <p>
                            Users must not:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Share inappropriate or offensive content</li>
                            <li>Harass or bully other users</li>
                            <li>Use the platform for commercial purposes</li>
                            <li>Share personal information of others</li>
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