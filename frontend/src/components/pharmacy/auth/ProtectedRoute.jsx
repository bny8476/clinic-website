import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/pharmacy/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, mustChangePassword } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (mustChangePassword && location.pathname !== '/force-change-password') {
    return <Navigate to="/force-change-password" replace />;
  }

  if (!mustChangePassword && location.pathname === '/force-change-password') {
    return <Navigate to="/" replace />;
  }

  return children;
}
