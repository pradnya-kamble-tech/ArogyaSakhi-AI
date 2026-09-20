import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/design/Editorial';

export default function Register() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#FAF8F5] flex flex-col md:flex-row-reverse selection:bg-[#C5D4C2] selection:text-[#2D5A3D]">
            {/* Right Branding side */}
            <div className="hidden md:flex flex-col justify-between w-[400px] lg:w-[500px] border-l border-[#E5E0D8] p-12 bg-[#FDFCFA]">
                <div className="text-display-md tracking-tighter text-[#2D5A3D]">
                    ArogyaSakhi.<span className="text-[#C4704B]">*</span>
                </div>

                <div>
                    <h2 className="text-display-lg text-[#2C2C2C] mb-4 leading-tight">Join the network.</h2>
                    <p className="text-body text-[#6B6B6B]">Empower your community with intelligent, localized healthcare insights.</p>
                </div>

                <div className="text-label text-[#A3B8A0]">Clinical Intelligence Platform v2.0</div>
            </div>

            {/* Left Content side */}
            <main className="flex-1 flex flex-col justify-center p-6 md:p-16 lg:px-32 page-enter">
                <div className="md:hidden text-display-sm tracking-tighter text-[#2D5A3D] mb-12">
                    ArogyaSakhi.<span className="text-[#C4704B]">*</span>
                </div>

                <div className="max-w-md w-full">
                    <h1 className="text-display-xl mb-8">Register</h1>

                    <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); navigate('/login'); }}>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="FIRST NAME" id="first_name" placeholder="E.g., Sunita" required />
                            <Input label="LAST NAME" id="last_name" placeholder="E.g., Kamble" required />
                        </div>
                        <Input label="HEALTH ID OR EMAIL" id="email" placeholder="E.g., HID-4589" required />
                        <Input label="ROLE" id="role" placeholder="E.g., Community Health Worker" required />
                        <Input label="PASSWORD" id="password" type="password" placeholder="Create secure password" required />

                        <Button variant="primary" type="submit" className="w-full mt-4 py-4">Create Account</Button>
                        <Button variant="secondary" type="button" onClick={() => navigate('/login')} className="w-full mt-2">Back to Login</Button>
                    </form>

                </div>
            </main>
        </div>
    );
}
