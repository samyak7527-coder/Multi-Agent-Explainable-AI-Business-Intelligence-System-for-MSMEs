import React from 'react';
import { ShieldCheck, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminPlaceholder = () => {
  const { user, logoutUser } = useAuth();

  return (
    <div className="min-h-screen bg-[#f4f3f8] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl shadow-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Welcome, <span className="font-semibold text-slate-800">{user?.full_name || user?.username}</span> ({user?.business_name}).
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-bold text-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>Admin Control Panel (Stub View)</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          The Admin Role dashboard is currently locked/under construction as per design specs. Cashier POS and Inventory modules are fully operational today.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={logoutUser}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
