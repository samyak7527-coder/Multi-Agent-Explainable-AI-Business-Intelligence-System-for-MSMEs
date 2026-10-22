import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from './AdminSidebar';
import { DashboardView } from './DashboardView';
import { ForecastingView } from './ForecastingView';
import { AdminOrderHistoryView } from './AdminOrderHistoryView';
import { StaffView } from './StaffView';

export const AdminView = ({ onToast }) => {
  const [activeNav, setActiveNav] = useState('dashboard'); // 'dashboard' | 'forecasting' | 'order-history' | 'staff'

  const renderView = () => {
    switch (activeNav) {
      case 'dashboard':
        return <DashboardView />;
      case 'forecasting':
        return <ForecastingView />;
      case 'order-history':
        return <AdminOrderHistoryView />;
      case 'staff':
        return <StaffView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen flex flex-col lg:flex-row bg-[#f4f3f8] text-slate-800 selection:bg-orange-200 selection:text-orange-900"
    >
      {/* Left Sidebar */}
      <AdminSidebar activeNav={activeNav} setActiveNav={setActiveNav} />

      {/* Main Content Area with View Transition Animation */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeNav}
            initial={{ opacity: 0, x: 15, y: 5 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -15, y: -5 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </motion.div>
  );
};
