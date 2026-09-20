import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../services/api';

export default function LegacySignup() {
  const navigate = useNavigate();
  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [role,setRole] = useState('PATIENT');
  const [error,setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await signup({ name, email, password, role }); navigate('/home'); }
    catch (err) { setError(err.message || 'Signup failed'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">ArogyaSakhi - Register</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" required placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} className="w-full border px-3 py-2 rounded-lg" />
          <input type="email" required placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border px-3 py-2 rounded-lg" />
          <input type="password" required placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border px-3 py-2 rounded-lg" />
          <button type="submit" className="w-full bg-green-700 text-white py-2.5 rounded-lg">Create Account</button>
        </form>
        <p className="mt-4 text-center text-sm"><Link to="/legacy/login" className="text-green-700 underline">Sign in</Link></p>
      </div>
    </div>
  );
}
