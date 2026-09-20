import React from 'react';
import { motion } from 'framer-motion';

export default function ComingSoon({ title, description, icon }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 rounded-full bg-[#E8C4B0] text-[#C4704B] flex items-center justify-center text-4xl mb-8"
            >
                {icon}
            </motion.div>
            <h1 className="text-display-xl text-[#2C2C2C] mb-4">Coming Soon</h1>
            <h2 className="text-display-sm text-[#2D5A3D] mb-4">{title}</h2>
            <p className="text-body text-[#6B6B6B] max-w-md mx-auto">
                {description}
            </p>

            <div className="mt-12 inline-flex items-center space-x-2 bg-[#F2EDE6] px-4 py-2 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#C4704B] animate-pulse"></span>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B]">In Development</span>
            </div>
        </div>
    );
}
