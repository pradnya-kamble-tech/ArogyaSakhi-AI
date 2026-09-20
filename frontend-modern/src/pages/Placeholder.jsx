import React from 'react';
import AppLayout from '../components/design/AppLayout';

export default function Placeholder({ title = 'Coming in the next stage' }) {
    // A clean, editorial placeholder matching the new aesthetics
    return (
        <AppLayout user={{ name: 'Dr. Priya Iyer', role: 'DOCTOR' }}>
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-16 text-center page-enter">
                <div className="w-16 h-16 rounded-full bg-[#F2EDE6] flex items-center justify-center mb-6">
                    <span className="text-2xl text-[#C4704B]">✨</span>
                </div>
                <h1 className="text-display-xl text-[#2C2C2C] mb-4 max-w-lg">{title}</h1>
                <p className="text-body text-[#6B6B6B] max-w-md mx-auto">
                    This module is part of the future feature roadmap. The layout and navigation framework is ready for its implementation.
                </p>
            </div>
        </AppLayout>
    );
}
