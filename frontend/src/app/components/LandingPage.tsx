import React from 'react';
import Link from 'next/link';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <div className="container mx-auto px-4 py-16 flex-grow">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-6">Welcome to TutorMatch</h1>
                    <h2 className="text-2xl font-bold mb-6">A peer learning platform</h2>
                    <p className="text-xl mb-8">The platform connects students who want to teach and learn from each other. It matches users based on their skills and learning goals, enabling them to exchange knowledge in a peer-to-peer manner.</p>
                    <div className="space-x-4">
                        <Link 
                            href="/auth/login" 
                            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Login
                        </Link>
                        <Link 
                            href="/auth/register" 
                            className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                            Register
                        </Link>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <footer className="bg-white border-t py-4">
                <div className="container mx-auto px-4 text-center text-sm text-gray-600">
                    <Link href="/terms" className="hover:underline mx-2">Terms of Use</Link>
                    |
                    <Link href="/privacy" className="hover:underline mx-2">Privacy Policy</Link>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;