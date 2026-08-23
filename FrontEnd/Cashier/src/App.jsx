import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { CashierSidebar } from './components/CashierSidebar';
import { InventoryView } from './components/InventoryView';
import { BillingView } from './components/BillingView';
import { AdminView } from './admin/AdminView';
import { Toast } from './components/Toast';

const AppContent = () => {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('inventory'); // 'inventory' | 'billing'

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleCloseToast = () => {
    setToast(null);
  };

  if (!user) {
    return (
      <>
        <LoginPage onSuccessToast={showToast} />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={handleCloseToast}
          />
        )}
      </>
    );
  }

  // Admin user dashboard view
  if (user.role?.toLowerCase() === 'admin') {
    return (
      <>
        <AdminView onToast={showToast} />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={handleCloseToast}
          />
        )}
      </>
    );
  }

  // Cashier Dashboard view
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f4f3f8] text-slate-800">
      {/* Cashier Sidebar */}
      <CashierSidebar activeNav={activeNav} setActiveNav={setActiveNav} />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeNav === 'inventory' ? (
          <InventoryView onToast={showToast} />
        ) : (
          <BillingView onToast={showToast} />
        )}
      </main>

      {/* Global Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={handleCloseToast}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
