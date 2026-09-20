import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/design/Editorial';
import { login } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const roleQuickLogins = [
    { label: 'Health Worker', role: 'PCW', name: 'Worker User', username: 'pcw1' },
    { label: 'Doctor', role: 'DOCTOR', name: 'Dr. Smith', username: 'doctor1' },
    { label: 'Admin', role: 'ADMIN', name: 'Admin User', username: 'admin' }
  ];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submitLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  const handleRoleLogin = async (mock) => {
    try {
      await login(mock.username, 'password123');
      navigate('/home');
    } catch {
      localStorage.setItem('userRole', mock.role);
      localStorage.setItem('userName', mock.name);
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col md:flex-row selection:bg-[#C5D4C2] selection:text-[#2D5A3D]">
      {/* Left Branding side */}
      <div className="hidden md:flex flex-col justify-between w-[400px] lg:w-[500px] border-r border-[#E5E0D8] p-12 bg-[#FDFCFA]">
        <div className="text-display-md tracking-tighter text-[#2D5A3D]">
          ArogyaSakhi.<span className="text-[#C4704B]">*</span>
        </div>

        <div>
          <h2 className="text-display-lg text-[#2C2C2C] mb-4 leading-tight">Welcome back to the network.</h2>
          <p className="text-body text-[#6B6B6B]">Please authenticate to access your intelligence dashboard and community records.</p>
        </div>

        <div className="text-label text-[#A3B8A0]">Clinical Intelligence Platform v2.0</div>
      </div>

      {/* Right Content side */}
      <main className="flex-1 flex flex-col justify-center p-6 md:p-16 lg:px-32 page-enter">
        <div className="md:hidden text-display-sm tracking-tighter text-[#2D5A3D] mb-12">
          ArogyaSakhi.<span className="text-[#C4704B]">*</span>
        </div>

        <div className="max-w-md w-full">
          <h1 className="text-display-xl mb-8">Sign In</h1>

          <form className="flex flex-col gap-6" onSubmit={submitLogin}>
            {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded">{error}</div>}
            <Input label="HEALTH ID OR EMAIL" id="email" placeholder="E.g., HID-4589" required value={email} onChange={e => setEmail(e.target.value)} />
            <Input label="PASSWORD" id="password" type="password" placeholder="Enter secure password" required value={password} onChange={e => setPassword(e.target.value)} />

            <div className="flex justify-between items-center mt-2">
              <label className="flex items-center text-body-sm text-[#6B6B6B] gap-2">
                <input type="checkbox" className="accent-[#2D5A3D]" /> Remember me
              </label>
              <button type="button" className="text-body-sm text-[#C4704B] hover:underline">Forgot password?</button>
            </div>

            <Button variant="primary" type="submit" className="w-full mt-4 py-4">Authenticate</Button>
          </form>

          <div className="my-10 flex items-center gap-4">
            <div className="flex-1 h-px bg-[#E5E0D8]"></div>
            <span className="text-label text-[#A3B8A0]">OR QUICK LOGIN AS</span>
            <div className="flex-1 h-px bg-[#E5E0D8]"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {roleQuickLogins.map(r => (
              <Button key={r.role} variant="secondary" onClick={() => handleRoleLogin(r)}>{r.label}</Button>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-body-sm text-[#6B6B6B]">
              Looking for the previous version? <button onClick={() => navigate('/legacy/login')} className="text-[#C4704B] underline hover:text-[#2D5A3D]">Go to Legacy System</button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
