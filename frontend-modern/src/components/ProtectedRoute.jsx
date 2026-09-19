import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { loading } = useAuth();
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const normalized = role === 'ASHA_WORKER' ? 'PCW' : role;
  const allowed = allowedRoles.map((r) => (r === 'ASHA_WORKER' ? 'PCW' : r));

  if (allowed.length > 0 && !allowed.includes(normalized) && !allowed.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
