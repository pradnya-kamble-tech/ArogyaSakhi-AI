import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../services/api';
import { User, Mail, Lock, Building2 } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', role: 'PATIENT' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await signup(form);
      const role = data.user?.role;
      if (role === 'DOCTOR') navigate('/doctor');
      else if (role === 'ADMIN') navigate('/admin');
      else if (role === 'PATIENT') navigate('/patient');
      else navigate('/asha');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'PATIENT', label: 'Patient', description: 'Access health records & AI diagnosis' },
    { value: 'ASHA_WORKER', label: 'ASHA Worker', description: 'Patient care & registration' },
    { value: 'DOCTOR', label: 'Doctor', description: 'Manage cases & consultations' }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-medical-white via-medical-soft-white to-blue-50">
      {/* Left Side - Benefits */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-medical-blue-dark to-medical-blue-light p-12 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm text-2xl font-bold">
              🏥
            </div>
            <div>
              <h1 className="text-2xl font-bold">ArogyaSakhi AI</h1>
              <p className="text-sm text-white/80">Rural Healthcare Platform</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-4xl font-bold leading-tight">Join the Healthcare Revolution</h2>
          <p className="mb-8 text-lg text-white/90">Be part of a community transforming rural healthcare with AI and modern technology.</p>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">✓</div>
              <div>
                <p className="font-semibold">Easy Registration</p>
                <p className="text-sm text-white/80">Quick setup for all roles</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">✓</div>
              <div>
                <p className="font-semibold">Secure & Safe</p>
                <p className="text-sm text-white/80">HIPAA-compliant data protection</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">✓</div>
              <div>
                <p className="font-semibold">Instant Access</p>
                <p className="text-sm text-white/80">Start using the platform immediately</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-medical-gray-900">Create account</h1>
            <p className="mt-2 text-sm text-medical-gray-600">Join ArogyaSakhi AI and start your healthcare journey</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-medical-red/10 border border-medical-red/20 px-4 py-3">
              <p className="text-sm font-medium text-medical-red">{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-medical-gray-700">Full name</label>
              <div className="relative mt-2">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-medical-gray-400" />
                <input
                  id="name"
                  className="w-full rounded-lg border border-medical-gray-200 bg-medical-white pl-12 pr-4 py-3 text-medical-gray-900 outline-none shadow-medical transition focus:border-medical-blue-light focus:ring-2 focus:ring-medical-blue-light/20"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-medical-gray-700">Username</label>
              <div className="relative mt-2">
                <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-medical-gray-400" />
                <input
                  id="username"
                  className="w-full rounded-lg border border-medical-gray-200 bg-medical-white pl-12 pr-4 py-3 text-medical-gray-900 outline-none shadow-medical transition focus:border-medical-blue-light focus:ring-2 focus:ring-medical-blue-light/20"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  placeholder="Choose a username"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-medical-gray-700">Email</label>
              <div className="relative mt-2">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-medical-gray-400" />
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-lg border border-medical-gray-200 bg-medical-white pl-12 pr-4 py-3 text-medical-gray-900 outline-none shadow-medical transition focus:border-medical-blue-light focus:ring-2 focus:ring-medical-blue-light/20"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-medical-gray-700">Password</label>
              <div className="relative mt-2">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-medical-gray-400" />
                <input
                  id="password"
                  type="password"
                  className="w-full rounded-lg border border-medical-gray-200 bg-medical-white pl-12 pr-4 py-3 text-medical-gray-900 outline-none shadow-medical transition focus:border-medical-blue-light focus:ring-2 focus:ring-medical-blue-light/20"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-medical-gray-700 mb-3">Select your role</label>
              <div className="space-y-2">
                {roleOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 rounded-lg border-2 border-medical-gray-200 p-3 cursor-pointer transition hover:border-medical-blue-light hover:bg-medical-soft-white" style={{borderColor: form.role === option.value ? '#0EA5E9' : '#E5E7EB', backgroundColor: form.role === option.value ? '#F0F9FF' : 'transparent'}}>
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={form.role === option.value}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="h-4 w-4 accent-medical-blue-light"
                    />
                    <div>
                      <p className="font-semibold text-medical-gray-900">{option.label}</p>
                      <p className="text-xs text-medical-gray-500">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-medical-blue-light to-medical-blue-dark px-5 py-3 text-sm font-semibold text-white shadow-medical transition hover:shadow-medical_lg disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-medical-gray-600">
            Already have an account? <Link to="/login" className="font-semibold text-medical-blue-light hover:text-medical-blue-dark">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
