import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { Lock, Mail } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(username, password);
      const role = result.user?.role;
      if (role === 'DOCTOR' || role === 'SPECIALIST') navigate('/doctor');
      else if (role === 'ADMIN' || role === 'AUDITOR') navigate('/admin');
      else if (role === 'PATIENT') navigate('/patient');
      else navigate('/asha');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-medical-white via-medical-soft-white to-blue-50">
      {/* Left Side - Branding */}
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
          <h2 className="mb-4 text-4xl font-bold leading-tight">Healthcare for Everyone</h2>
          <p className="mb-8 text-lg text-white/90">AI-powered symptom analysis, emergency assistance, and rural health management in one platform.</p>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">✓</div>
              <div>
                <p className="font-semibold">Instant AI Diagnosis</p>
                <p className="text-sm text-white/80">Real-time symptom analysis</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">✓</div>
              <div>
                <p className="font-semibold">Emergency Response</p>
                <p className="text-sm text-white/80">SOS alerts to nearby hospitals</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">✓</div>
              <div>
                <p className="font-semibold">Doctor Collaboration</p>
                <p className="text-sm text-white/80">Connected care teams</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-medical-blue-light to-medical-blue-dark text-3xl shadow-lg">
              🏥
            </div>
            <h1 className="text-3xl font-bold text-medical-gray-900">ArogyaSakhi AI</h1>
            <p className="mt-2 text-sm text-medical-gray-600">AI-powered rural healthcare</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-medical-gray-900">Welcome back</h2>
            <p className="mt-2 text-sm text-medical-gray-600">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-medical-red/10 border border-medical-red/20 px-4 py-3">
              <p className="text-sm font-medium text-medical-red">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-medical-gray-700">
                Username
              </label>
              <div className="relative mt-2">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-medical-gray-400" />
                <input
                  id="username"
                  type="text"
                  className="w-full rounded-lg border border-medical-gray-200 bg-medical-white pl-12 pr-4 py-3 text-medical-gray-900 outline-none shadow-medical transition focus:border-medical-blue-light focus:ring-2 focus:ring-medical-blue-light/20"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-medical-gray-700">
                Password
              </label>
              <div className="relative mt-2">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-medical-gray-400" />
                <input
                  id="password"
                  type="password"
                  className="w-full rounded-lg border border-medical-gray-200 bg-medical-white pl-12 pr-4 py-3 text-medical-gray-900 outline-none shadow-medical transition focus:border-medical-blue-light focus:ring-2 focus:ring-medical-blue-light/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-medical-blue-light to-medical-blue-dark px-5 py-3 text-sm font-semibold text-white shadow-medical_md transition hover:shadow-medical_lg disabled:opacity-50 hover:from-medical-blue-dark hover:to-medical-blue-dark/90"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-medical-gray-200" />
            <span className="text-sm text-medical-gray-500">Demo credentials</span>
            <div className="h-px flex-1 bg-medical-gray-200" />
          </div>

          <div className="mt-6 rounded-lg bg-medical-soft-white p-4 text-xs text-medical-gray-600">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded bg-white p-2">
                <div className="font-semibold text-medical-gray-900">ASHA</div>
                <div className="text-medical-gray-700">pcw1 / pcw123</div>
              </div>
              <div className="rounded bg-white p-2">
                <div className="font-semibold text-medical-gray-900">Doctor</div>
                <div className="text-medical-gray-700">doctor1 / doc123</div>
              </div>
              <div className="rounded bg-white p-2">
                <div className="font-semibold text-medical-gray-900">Patient</div>
                <div className="text-medical-gray-700">patient1 / pat123</div>
              </div>
              <div className="rounded bg-white p-2">
                <div className="font-semibold text-medical-gray-900">Admin</div>
                <div className="text-medical-gray-700">admin / admin123</div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-medical-gray-600">
            Don't have an account? <Link to="/signup" className="font-semibold text-medical-blue-light hover:text-medical-blue-dark">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
