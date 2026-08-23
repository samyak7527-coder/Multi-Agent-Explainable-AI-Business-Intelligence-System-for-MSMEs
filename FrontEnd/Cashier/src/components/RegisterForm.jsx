import React, { useState, useEffect } from 'react';
import { User, Lock, Building2, Phone, Shield, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { apiCall } from '../config/api';

export const RegisterForm = ({ onSwitchToLogin, onSuccessMessage }) => {
  const [generatedId, setGeneratedId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('Cashier');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Generate a clean preview User ID like USR1042
    const randomId = 'USR' + Math.floor(1000 + Math.random() * 9000);
    setGeneratedId(randomId);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim() || !fullName.trim()) {
      setError('Please fill in all required fields (Username, Password, Full Name).');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        user_id: generatedId,
        username: username.trim(),
        password: password.trim(),
        full_name: fullName.trim(),
        business_name: businessName.trim() || 'BizAI Enterprise',
        phone_number: phoneNumber.trim() || undefined,
        role: role, // "Cashier" or "Admin"
      };

      await apiCall('/users/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      onSuccessMessage('Registration successful! Please log in with your new account.');
      onSwitchToLogin();
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onSwitchToLogin}
          type="button"
          className="p-2 rounded-full hover:bg-slate-200/60 transition-colors text-slate-600 hover:text-slate-900"
          title="Back to Sign In"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h2>
          <p className="text-sm text-slate-500">Join BizAI to empower your business operations</p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-shake">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User ID (Auto-generated / read-only) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            USER ID <span className="text-slate-400 font-normal lowercase">(auto-generated)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={generatedId}
              className="w-full px-4 py-2.5 bg-slate-100/80 border border-slate-200 rounded-2xl text-sm text-slate-600 font-mono focus:outline-none cursor-not-allowed"
            />
            <Sparkles className="w-4 h-4 text-orange-400 absolute right-3.5 top-3" />
          </div>
        </div>

        {/* Username & Full Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              USERNAME <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. john_doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-sm"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              FULL NAME <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-sm"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            PASSWORD <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-sm"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
        </div>

        {/* Business Name & Phone Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              BUSINESS NAME
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Apex Retail"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-sm"
              />
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              PHONE NUMBER
            </label>
            <div className="relative">
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-sm"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            ROLE
          </label>
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="Cashier">Cashier</option>
              <option value="Admin">Admin</option>
            </select>
            <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <div className="absolute right-3.5 top-3.5 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-full btn-gradient font-semibold text-sm shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      {/* Switch back to Login */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-500">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            type="button"
            className="font-semibold text-[#f2643a] hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};
