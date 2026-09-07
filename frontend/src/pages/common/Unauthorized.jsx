import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import useAuthStore, { getDefaultDashboardRoute } from '../../store/authStore';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { roles, user } = useAuthStore();

  const handleBackToDashboard = () => {
    const target = getDefaultDashboardRoute(roles);
    navigate(target, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 text-center shadow-xl border border-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShieldAlert size={32} />
        </div>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">403 — Access Restricted</h1>
        
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          You are signed in as <strong className="text-slate-900">{user?.name || user?.email || 'Authenticated User'}</strong>, but your account does not have permission to view this page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
          
          <button
            onClick={handleBackToDashboard}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-600/30 hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Home size={16} />
            <span>My Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
