import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  Clock,
  Truck,
  CheckCircle,
  Building2,
  Calendar,
  Wallet,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { apiCall } from '../config/api';
import { useAuth } from '../context/AuthContext';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const groupOrdersById = (rows) => {
  const map = new Map();

  for (const row of rows) {
    const existing = map.get(row.order_id);

    if (!existing) {
      map.set(row.order_id, {
        ...row,
        total_price: Number(row.total_price || 0),
        item_count: 1,
      });
    } else {
      existing.total_price += Number(row.total_price || 0);
      existing.item_count += 1;
    }
  }

  return Array.from(map.values());
};

export const DashboardView = () => {
  const { user } = useAuth();
  const businessName = user?.business_name || 'BizAI Enterprise';

  const [totalOrders, setTotalOrders] = useState(0);
  const [grossProfit, setGrossProfit] = useState(null);
  const [netProfit, setNetProfit] = useState(null);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState(null);

  const [financeRecords, setFinanceRecords] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthNum = today.getMonth() + 1;

    try {
      const allBilling = await apiCall('/billing/?skip=0&limit=1000');
      const groupedAll = groupOrdersById(Array.isArray(allBilling) ? allBilling : []);
      setTotalOrders(groupedAll.length);

      const top10Orders = await apiCall('/billing/?skip=0&limit=10');
      const groupedRecent = groupOrdersById(top10Orders || []).slice(0, 10);
      setRecentOrders(groupedRecent);

      const allFinance = await apiCall('/finance/');

      const sortedFinance = (allFinance || []).sort((a, b) => {
        const yearA = Number(a.order_year) || 0;
        const yearB = Number(b.order_year) || 0;
        if (yearA !== yearB) return yearA - yearB;
        const monthA = Number(a.order_month) || 0;
        const monthB = Number(b.order_month) || 0;
        return monthA - monthB;
      });

      setFinanceRecords(sortedFinance);

      try {
        const curRecord = await apiCall(`/finance/${currentYear}/${currentMonthNum}`);
        if (curRecord) {
          setCurrentMonthRevenue(curRecord.monthly_revenue ?? 0);
          setGrossProfit(curRecord.gross_profit ?? 0);
          setNetProfit(curRecord.net_profit ?? 0);
        }
      } catch (err) {
        if (sortedFinance.length > 0) {
          const latest = sortedFinance[sortedFinance.length - 1];
          setCurrentMonthRevenue(latest.monthly_revenue ?? 0);
          setGrossProfit(latest.gross_profit ?? 0);
          setNetProfit(latest.net_profit ?? 0);
        }
      }

    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formattedChartData = financeRecords.map((item) => {
    const monthNum = Number(item.order_month) || 1;
    const monthIdx = Math.max(0, Math.min(11, monthNum - 1));
    const monthLabel = MONTH_NAMES[monthIdx];
    const yearStr = item.order_year ? String(item.order_year).slice(-2) : '';

    return {
      month: `${monthLabel} '${yearStr}`,
      revenue: Number(item.monthly_revenue || 0),
    };
  });

  const displayedChartData = showAllMonths
    ? formattedChartData
    : formattedChartData.slice(-12);

  const tickInterval = displayedChartData.length > 12
    ? Math.max(1, Math.floor(displayedChartData.length / 10))
    : 0;

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
    return {
      bg: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: <Clock className="w-3 h-3 text-amber-600" />,
    };
  };

  const formattedMonthName = MONTH_NAMES[new Date().getMonth()];
  const formattedYear = new Date().getFullYear();

  const topMetrics = [
    {
      id: 'total-orders',
      label: 'Total Orders',
      value: loading ? null : totalOrders.toLocaleString('en-IN'),
      icon: ShoppingBag,
      iconBg: 'bg-orange-100 text-orange-600 border-orange-200/60',
      caption: 'All-time recorded billing transactions',
    },
    {
      id: 'gross-profit',
      label: 'Gross Profit',
      value: loading
        ? null
        : `₹${Number(grossProfit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200/60',
      caption: `Current month gross margin (${formattedMonthName} '${String(formattedYear).slice(-2)})`,
    },
    {
      id: 'net-profit',
      label: 'Net Profit',
      value: loading
        ? null
        : `₹${Number(netProfit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      iconBg: 'bg-purple-100 text-purple-600 border-purple-200/60',
      caption: `Current month net profit (${formattedMonthName} '${String(formattedYear).slice(-2)})`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-8 pb-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Building2 className="w-3.5 h-3.5 text-orange-500" />
            <span className="font-bold text-slate-700">{businessName}</span>
            <span>•</span>
            <span>Admin Control Panel</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Business Overview</h1>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={loadDashboardData}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </motion.button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadDashboardData} className="underline font-bold hover:text-rose-800 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {topMetrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.35, ease: 'easeOut' }}
              whileHover={{ scale: 1.015, y: -2 }}
              className="glass-panel rounded-3xl p-6 border border-white/90 shadow-xl shadow-slate-200/40 relative overflow-hidden flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {metric.label}
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {loading ? (
                      <div className="h-8 w-28 bg-slate-200 rounded-lg animate-pulse my-1" />
                    ) : (
                      metric.value
                    )}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-sm shrink-0 ${metric.iconBg}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                {metric.caption}
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className="glass-panel rounded-3xl border border-white/90 shadow-xl shadow-slate-200/50 p-6 lg:p-8 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span>REVENUE TREND</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Monthly Revenue</h2>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {formattedChartData.length > 12 && (
              <button
                onClick={() => setShowAllMonths((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100/80 hover:bg-slate-200/70 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <Filter className="w-3 h-3" />
                {showAllMonths ? 'Show Last 12 Months' : 'Show All Months'}
              </button>
            )}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-full">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Current Period: {formattedMonthName} {formattedYear}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4 space-y-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-[#1e1b2e] text-white shadow-lg relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-500/30 transition-all duration-500" />

              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                <span>Current Month Revenue</span>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-orange-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>

              {loading ? (
                <div className="space-y-2 py-2">
                  <div className="h-10 w-40 bg-slate-700/50 rounded-xl animate-pulse" />
                  <div className="h-3 w-28 bg-slate-800 rounded-md" />
                </div>
              ) : (
                <>
                  <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                    ₹{Number(currentMonthRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1 font-medium flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">GET /finance</span>
                    <span>• {formattedMonthName} {formattedYear}</span>
                  </p>
                </>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-100 text-slate-700 text-xs space-y-1">
              <div className="font-bold text-orange-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Real-Time Financial Sync
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Sales automatically roll up from billing transactions into monthly financial totals.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 h-72 w-full">
            {loading ? (
              <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mb-2" />
                <span className="text-xs font-semibold text-slate-400">Rendering Revenue Chart...</span>
              </div>
            ) : displayedChartData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50/60 rounded-2xl text-center p-4">
                <p className="text-xs font-bold text-slate-500">No finance records available to chart</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayedChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardRevenueBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f2643a" stopOpacity={1} />
                      <stop offset="100%" stopColor="#ff416c" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    interval={tickInterval}
                    angle={0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(242, 100, 58, 0.06)' }}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                      fontSize: '12px',
                      padding: '10px 14px',
                    }}
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="url(#dashboardRevenueBarGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                    isAnimationActive={true}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </motion.div>

      {/* Recent Orders Section */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className="glass-panel rounded-3xl border border-white/90 shadow-xl shadow-slate-200/50 overflow-hidden p-6 lg:p-8 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-widest mb-0.5">
              <ShoppingBag className="w-4 h-4 text-purple-500" />
              <span>LIVE TRANSACTIONS</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Recent Orders</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Latest 10 Orders
          </span>
        </div>

        {loading ? (
          <div className="py-12 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse w-full" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            No recent orders recorded in the system yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-xl">ORDER ID</th>
                  <th className="py-3 px-4">CUSTOMER</th>
                  <th className="py-3 px-4">TOTAL PRICE</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 rounded-r-xl">ORDER DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentOrders.map((ord) => {
                  const badge = getStatusBadge(ord.order_status);
                  const formattedDate = ord.order_date
                    ? new Date(ord.order_date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                    : '-';

                  return (
                    <tr
                      key={ord.order_id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-default"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                        {ord.order_id}
                        {ord.item_count > 1 && (
                          <span className="ml-2 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            {ord.item_count} items
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {ord.customer_name || 'Walk-in Customer'}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        ₹{Number(ord.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${badge.bg}`}
                        >
                          {badge.icon}
                          <span className="capitalize">{ord.order_status || 'processing'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {formattedDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};