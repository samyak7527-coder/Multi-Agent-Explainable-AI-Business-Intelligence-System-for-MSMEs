import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Sparkles, History, Users, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminSidebar = ({ activeNav, setActiveNav }) => {
  const { user, logoutUser } = useAuth();

  const businessName = user?.business_name || 'BizAI Enterprise';
  const fullName = user?.full_name || user?.username || 'Admin User';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'forecasting',
      label: 'Future Forecasting',
      icon: Sparkles,
    },
    {
      id: 'order-history',
      label: 'Order History',
      icon: History,
    },
    {
      id: 'staff',
      label: 'Staff Costs',
      icon: Users,
    },
  ];

  return (
    <aside className="w-full lg:w-[260px] shrink-0 bg-white/80 backdrop-blur-xl border-r border-slate-200/80 p-5 flex flex-col justify-between h-full min-h-[600px] lg:min-h-screen shadow-sm z-20 sticky top-0">
      {/* Top Section */}
      <div className="space-y-6">
        {/* Business Branding */}
        <div className="pb-4 border-b border-slate-100 space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#f2643a] to-[#ff416c] p-0.5 flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <div className="w-full h-full bg-[#0d111e] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-orange-400" />
              </div>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 truncate tracking-tight" title={businessName}>
              {businessName}
            </h2>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-10">
            ADMINISTRATOR PORTAL
          </p>
        </div>

        {/* Navigation Items with Animated Active Pill */}
        <nav className="space-y-1.5 relative">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
            MAIN MENU
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-bold transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="adminSidebarPill"
                    className="absolute inset-0 rounded-full btn-gradient shadow-md shadow-orange-500/25"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 shrink-0 z-10 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Info & Logout */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-100 to-pink-100 text-[#f2643a] font-bold text-xs flex items-center justify-center shrink-0 border border-orange-200/50 shadow-sm">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-slate-800 truncate">{fullName}</div>
            <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full mt-0.5">
              <ShieldCheck className="w-3 h-3 text-purple-600" />
              <span>Admin</span>
            </div>
          </div>
        </div>

        <button
          onClick={logoutUser}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
