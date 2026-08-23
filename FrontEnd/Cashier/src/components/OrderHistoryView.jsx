import React, { useState, useEffect } from 'react';
import { ShoppingCart, RefreshCw, FileText, Loader2, AlertCircle, CheckCircle, Clock, Truck } from 'lucide-react';
import { apiCall, API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

export const OrderHistoryView = ({ onToast }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Group flat transaction rows by order_id — multiple rows can share
  // one order_id (multi-product carts), so we collapse them into a
  // single order summary for display.
  const groupOrdersById = (rows) => {
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.order_id]) {
        grouped[row.order_id] = {
          ...row,
          total_price: 0,
          item_count: 0,
        };
      }
      grouped[row.order_id].total_price += row.total_price || 0;
      grouped[row.order_id].item_count += 1;
    }
    return Object.values(grouped).sort(
      (a, b) => new Date(b.order_date) - new Date(a.order_date)
    );
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall('/billing/?skip=0&limit=50');
      setOrders(groupOrdersById(data || []));
    } catch (err) {
      setError(err.message || 'Failed to fetch order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await apiCall(`/billing/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ order_status: newStatus }),
      });
      onToast(`Order ${orderId} status updated to ${newStatus}.`, 'success');
      setOrders((prev) =>
        prev.map((ord) => (ord.order_id === orderId ? { ...ord, order_status: newStatus } : ord))
      );
    } catch (err) {
      onToast(err.message || 'Failed to update order status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'processing').toLowerCase();
    if (s === 'delivered') {
      return {
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <CheckCircle className="w-3 h-3 text-emerald-600" />,
      };
    }
    if (s === 'shipped') {
      return {
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Truck className="w-3 h-3 text-blue-600" />,
      };
    }
    // processing (amber)
    return {
      bg: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: <Clock className="w-3 h-3 text-amber-600" />,
    };
  };

  return (
    <div className="space-y-4">
      {/* Header & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Order History</h2>
          <p className="text-xs text-slate-500">Recent customer transactions and billing logs</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm transition-colors"
          title="Refresh Orders"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#f2643a] animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Loading order records...</p>
          </div>
        ) : error ? (
          <div className="py-12 px-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-xs font-semibold text-slate-800">{error}</p>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 rounded-full border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No orders recorded yet</h3>
            <p className="text-xs text-slate-500">Generated bills will automatically appear in this history list.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">ORDER ID</th>
                  <th className="py-3.5 px-4">CUSTOMER NAME</th>
                  <th className="py-3.5 px-4">DATE & TIME</th>
                  <th className="py-3.5 px-4">TOTAL PRICE</th>
                  <th className="py-3.5 px-4">ORDER STATUS</th>
                  <th className="py-3.5 px-6 text-right">INVOICE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {orders.map((ord) => {
                  const badge = getStatusBadge(ord.order_status);
                  const isUpdating = updatingId === ord.order_id;
                  const formattedDate = ord.order_date
                    ? new Date(ord.order_date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }) + (ord.order_time ? ` ${ord.order_time}` : '')
                    : '-';

                  return (
                    <tr key={ord.order_id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Order ID */}
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        {ord.order_id}
                        {ord.item_count > 1 && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {ord.item_count} items
                          </span>
                        )}
                      </td>

                      {/* Customer Name */}
                      <td className="py-4 px-4 font-semibold text-slate-800">
                        {ord.customer_name || 'Walk-in Customer'}
                        {ord.customer_phone && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {ord.customer_phone}
                          </span>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-4 text-slate-500">
                        {formattedDate}
                      </td>

                      {/* Total Price */}
                      <td className="py-4 px-4 font-bold text-slate-900">
                        ₹{Number(ord.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Order Status Pill + Editable Dropdown */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${badge.bg}`}>
                            {badge.icon}
                            <span className="capitalize">{ord.order_status || 'processing'}</span>
                          </span>

                          <select
                            value={(ord.order_status || 'processing').toLowerCase()}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(ord.order_id, e.target.value)}
                            className="text-[10px] py-0.5 px-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="processing">processing</option>
                            <option value="shipped">shipped</option>
                            <option value="delivered">delivered</option>
                          </select>
                        </div>
                      </td>

                      {/* Invoice Button */}
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const businessName = user?.business_name || '';
                            const businessPhone = user?.phone_number || '';
                            const invoiceUrl = `${API_BASE_URL}/billing/${ord.order_id}/invoice?business_name=${encodeURIComponent(businessName)}&business_phone=${encodeURIComponent(businessPhone)}`;
                            window.open(invoiceUrl, '_blank');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5 text-orange-500" />
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};