import React, { useState } from 'react';
import { User, Lock, Sparkles, ArrowRight, ShieldCheck, Cpu, Zap, BarChart3, HelpCircle } from 'lucide-react';
import { apiCall } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { RegisterForm } from './RegisterForm';

export const LoginPage = ({ onSuccessToast }) => {
  const { loginUser } = useAuth();
  const [viewState, setViewState] = useState('login'); // 'login' | 'register'
  
  // Login Form States
  const [selectedRole, setSelectedRole] = useState('CASHIER'); // 'CASHIER' | 'ADMIN'
  const [userId, setUserId] = useState(''); // Display-only per spec
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both Username and Password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Call POST /auth/login with { username, password }
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      // 2. Role validation
      const returnedRole = data.role || 'Cashier';
      if (returnedRole.toLowerCase() !== selectedRole.toLowerCase()) {
        setError(`This account is registered as ${returnedRole}, not ${selectedRole}.`);
        setLoading(false);
        return;
      }

      // 3. Fetch full user profile to get phone_number (not returned by /auth/login)
      let userProfile = {};
      try {
        userProfile = await apiCall(`/users/${data.user_id}`);
      } catch (_profileErr) {
        // Non-fatal: proceed without phone_number if profile fetch fails
      }

      // 4. Merge login response + profile, then save to AuthContext / localStorage
      //    Fields from /auth/login: user_id, username, full_name, business_name, role
      //    Additional from /users/{id}: phone_number (and any other profile fields)
      const mergedUser = {
        ...data,
        phone_number: userProfile.phone_number ?? null,
      };
      loginUser(mergedUser);
      if (onSuccessToast) {
        onSuccessToast(`Welcome back, ${data.full_name}! Logged in as ${data.role}.`, 'success');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo buttons autofill
  const handleDemoFill = (roleType) => {
    setSelectedRole(roleType);
    if (roleType === 'CASHIER') {
      setUsername('cashier1');
      setPassword('cashier123');
      setUserId('USR-CASH-001');
    } else {
      setUsername('admin1');
      setPassword('admin123');
      setUserId('USR-ADM-001');
    }
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f4f3f8]">
      {/* LEFT PANEL: Branding & Visual Identity (~45% width) */}
      <div className="w-full lg:w-[45%] relative bg-gradient-to-br from-[#0b0f19] via-[#161836] to-[#0f172a] p-8 lg:p-14 flex flex-col justify-between overflow-hidden min-h-[400px] lg:min-h-screen text-white">
        {/* Ambient Gradient Blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-tr from-[#f2643a]/30 to-[#ff416c]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-indigo-600/20 to-purple-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Logo / Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#f2643a] to-[#ff416c] p-0.5 shadow-lg shadow-orange-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0d111e] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-orange-400 animate-pulse" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-orange-200 bg-clip-text text-transparent">
                Biz<span className="text-[#f2643a]">AI</span>
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Business Intelligence
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert("BizAI empowers Micro, Small & Medium Enterprises (MSMEs) with predictive sales forecasting, automated inventory optimization, financial analytics, and customer behavior insights.")}
            className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-slate-200 hover:bg-white/20 transition-all shadow-sm"
          >
            <span>Learn More</span>
            <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
          </button>
        </div>

        {/* Center Content / Hero Messaging */}
        <div className="relative z-10 my-auto py-12 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>AI-Powered Platform for MSMEs</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
            Welcome to <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-300 bg-clip-text text-transparent">BizAI</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
            Transform your store operations with smart sales prediction, automated inventory tracking, instant billing POS, and real-time customer insights designed specifically for growing MSMEs.
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <BarChart3 className="w-5 h-5 text-orange-400 mb-1" />
              <div className="text-xs font-bold text-slate-200">Sales AI</div>
              <div className="text-[10px] text-slate-400">Forecast Demand</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Cpu className="w-5 h-5 text-pink-400 mb-1" />
              <div className="text-xs font-bold text-slate-200">Smart POS</div>
              <div className="text-[10px] text-slate-400">Fast Billing</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-purple-400 mb-1" />
              <div className="text-xs font-bold text-slate-200">Role Access</div>
              <div className="text-[10px] text-slate-400">Cashier & Admin</div>
            </div>
          </div>
        </div>

        {/* Footer info inside Left Panel */}
        <div className="relative z-10 text-xs text-slate-500 pt-4 border-t border-white/10 flex items-center justify-between">
          <span>&copy; 2026 BizAI Technologies</span>
          <span className="text-[11px] text-slate-400">Connected to FastAPI: localhost:8000</span>
        </div>
      </div>

      {/* RIGHT PANEL: Auth Container (~55% width) */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl p-8 sm:p-10 transition-all duration-300">
          {viewState === 'register' ? (
            <RegisterForm
              onSwitchToLogin={() => setViewState('login')}
              onSuccessMessage={(msg) => {
                if (onSuccessToast) onSuccessToast(msg, 'success');
              }}
            />
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to BizAI</h2>
                <p className="text-sm text-slate-500 mt-1">Select your role and enter your credentials</p>
              </div>

              {/* Role Toggle: Pill-shaped Segmented Control */}
              <div className="p-1 bg-slate-200/80 rounded-full flex items-center shadow-inner relative">
                <button
                  type="button"
                  onClick={() => setSelectedRole('CASHIER')}
                  className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    selectedRole === 'CASHIER'
                      ? 'bg-white text-slate-900 shadow-md font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-orange-500" />
                  <span>CASHIER</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('ADMIN')}
                  className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    selectedRole === 'ADMIN'
                      ? 'bg-white text-slate-900 shadow-md font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                  <span>ADMIN</span>
                </button>
              </div>

              {/* Inline Error Display */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5 animate-shake">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* LOGIN FORM */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* User ID Field (Display-only per spec: NOT sent to login API) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      USER ID
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium lowercase">
                      (display-only notice)
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Your user ID (e.g. USR001)"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all shadow-inner"
                  />
                </div>

                {/* Username Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    USERNAME <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-sm"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                {/* Password Field */}
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

                {/* Primary CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full btn-gradient font-bold text-sm shadow-xl flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In as {selectedRole}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {/* Demo Helper Buttons */}
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-center text-slate-400 uppercase tracking-wider mb-2">
                    Quick Demo Credentials
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDemoFill('CASHIER')}
                      className="px-3 py-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:border-orange-300 text-xs font-semibold text-slate-600 hover:text-[#f2643a] transition-all text-center"
                    >
                      Demo Cashier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoFill('ADMIN')}
                      className="px-3 py-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 text-xs font-semibold text-slate-600 hover:text-purple-600 transition-all text-center"
                    >
                      Demo Admin
                    </button>
                  </div>
                </div>
              </form>

              {/* Create Account Link */}
              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setViewState('register')}
                    className="font-bold text-[#f2643a] hover:underline"
                  >
                    Create one
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
