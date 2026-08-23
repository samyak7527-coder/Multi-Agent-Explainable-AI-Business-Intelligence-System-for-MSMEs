import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  RefreshCw,
  Search,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  ShoppingCart
} from 'lucide-react';
import { apiCall } from '../config/api';

// Collapses flat per-product transaction rows (multiple rows can share
// one order_id since the multi-item cart fix) into one row per order_id.
const groupOrdersById = (rows) => {
  const map = new Map();

  for (const row of rows) {
    const existing = map.get(row.order_id);

    if (!existing) {
      map.set(row.order_id, {
        ...row,
        total_price: Number(row.total_price || 0),
        item_count: 1,
        products: [
          {
            product_id: row.product_id,
            product_count: row.product_count,
            product_categories: row.product_categories,
          },
        ],
      });
    } else {
      existing.total_price += Number(row.total_price || 0);
      existing.item_count += 1;
      existing.products.push({
        product_id: row.product_id,
        product_count: row.product_count,
        product_categories: row.product_categories,
      });
    }
  }

  return Array.from(map.values());
};

export const AdminOrderHistoryView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall('/billing/?skip=0&limit=50');
      setOrders(groupOrdersById(data || []));
    } catch (err) {
      setError(err.message || 'Failed to fetch order history records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    const s = (status || 'processing').toLowerCase();
    if (s === 'delivered') {
      return {
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />,
      };
    }
    if (s === 'shipped') {
      return {
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Truck className="w-3.5 h-3.5 text-blue-600" />,
      };
    }
    return {
      bg: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    };
  };

  const filteredOrders = orders.filter((ord) => {
    const status = (ord.order_status || 'processing').toLowerCase();
    if (activeTab !== 'all' && status !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchId = (ord.order_id || '').toLowerCase().includes(query);
      const matchName = (ord.customer_name || '').toLowerCase().includes(query);
      const matchPhone = (ord.customer_phone || '').toLowerCase().includes(query);
      return matchId || matchName || matchPhone;
    }
    return true;
  });

  const filterTabs = [
    { id: 'all', label: 'All Orders', count: orders.length },
    {
      id: 'processing',
      label: 'Processing',
      count: orders.filter((o) => (o.order_status || 'processing').toLowerCase() === 'processing').length,
    },
    {
      id: 'shipped',
      label: 'Shipped',
      count: orders.filter((o) => (o.order_status || '').toLowerCase() === 'shipped').length,
    },
    {
      id: 'delivered',
      label: 'Delivered',
      count: orders.filter((o) => (o.order_status || '').toLowerCase() === 'delivered').length,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6 pb-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
            <History className="w-4 h-4 text-orange-500" />
            <span>AUDIT TRAIL & LOGS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Order History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Read-only administrative ledger of all customer transactions (GET /billing/?skip=0&limit=50)
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={fetchOrders}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </motion.button>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-2.5 rounded-2xl border border-white/80 shadow-md">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 shrink-0 flex items-center gap-2 cursor-pointer ${isActive
                  ? 'btn-gradient text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, ID, phone..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-100/80 border border-slate-200/80 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-white/90 shadow-xl shadow-slate-200/50 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#f2643a] animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Loading order records...</p>
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-xs font-semibold text-slate-800">{error}</p>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 rounded-full border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No matching orders found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || activeTab !== 'all'
                ? 'Try clearing your search query or selecting a different status filter tab.'
                : 'No order billing records exist in the backend database yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">ORDER ID</th>
                  <th className="py-4 px-4">CUSTOMER DETAILS</th>
                  <th className="py-4 px-4">PRODUCT DETAILS</th>
                  <th className="py-4 px-4">TOTAL PRICE</th>
                  <th className="py-4 px-4">ORDER STATUS</th>
                  <th className="py-4 px-4">ORDER DATE</th>
                  <th className="py-4 px-6 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOrders.map((ord) => {
                  const badge = getStatusBadge(ord.order_status);
                  const formattedDate = ord.order_date
                    ? new Date(ord.order_date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }) + (ord.order_time ? ` ${ord.order_time}` : '')
                    : '-';

                  return (
                    <tr key={ord.order_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        {ord.order_id}
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-800">
                        <div>{ord.customer_name || 'Walk-in Customer'}</div>
                        {ord.customer_phone ? (
                          <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                            📞 {ord.customer_phone}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 font-normal italic">No phone</div>
                        )}
                      </td>

                      <td className="py-4 px-4 font-medium text-slate-700">
                        {ord.item_count > 1 ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-slate-900">{ord.products[0].product_id}</span>
                            <span className="ml-2 text-slate-500 font-bold">× {ord.products[0].product_count}</span>
                            <span className="block text-[10px] text-slate-400 font-semibold">
                              +{ord.item_count - 1} more item{ord.item_count - 1 > 1 ? 's' : ''}
                            </span>
                          </div>
                        ) : (
                          <>
                            <span className="font-mono text-slate-900">{ord.product_id || 'PROD'}</span>
                            {ord.product_count && (
                              <span className="ml-2 text-slate-500 font-bold">× {ord.product_count}</span>
                            )}
                            {ord.product_categories && (
                              <span className="block text-[10px] text-slate-400 capitalize">
                                Category: {ord.product_categories}
                              </span>
                            )}
                          </>
                        )}
                      </td>

                      <td className="py-4 px-4 font-extrabold text-slate-900 text-sm">
                        ₹{Number(ord.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${badge.bg}`}
                        >
                          {badge.icon}
                          <span className="capitalize">{ord.order_status || 'processing'}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-500 font-medium">
                        {formattedDate}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => {
                            window.open(`http://localhost:8000/billing/${ord.order_id}/invoice`, '_blank');
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-sm hover:shadow cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-orange-500" />
                          <span>Invoice</span>
                        </motion.button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};