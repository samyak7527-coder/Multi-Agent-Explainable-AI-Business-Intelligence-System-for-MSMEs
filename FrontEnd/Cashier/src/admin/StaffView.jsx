import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Megaphone,
  Users,
  Building,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Pencil,
  Check,
  X,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { apiCall } from '../config/api';
import { useAuth } from '../context/AuthContext';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const StaffView = () => {
  const { user } = useAuth();
  const businessName = user?.business_name || 'BizAI Enterprise';

  const [financeRecords, setFinanceRecords] = useState([]);
  const [currentCosts, setCurrentCosts] = useState({
    marketing_cost: 0,
    salary_cost: 0,
    rent_cost: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingField, setEditingField] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthNum = today.getMonth() + 1;

  const fetchStaffData = async () => {
    setLoading(true);
    setError('');

    try {
      let curRecord = null;
      try {
        curRecord = await apiCall(`/finance/${currentYear}/${currentMonthNum}`);
      } catch (e) {
        // Fallback
      }

      const allRecords = await apiCall('/finance/');

      const sortedFinance = (allRecords || []).sort((a, b) => {
        const yearA = Number(a.order_year) || 0;
        const yearB = Number(b.order_year) || 0;
        if (yearA !== yearB) return yearA - yearB;
        const monthA = Number(a.order_month) || 0;
        const monthB = Number(b.order_month) || 0;
        return monthA - monthB;
      });

      setFinanceRecords(sortedFinance);

      if (curRecord) {
        setCurrentCosts({
          marketing_cost: curRecord.marketing_cost || 0,
          salary_cost: curRecord.salary_cost || 0,
          rent_cost: curRecord.rent_cost || 0,
        });
      } else if (sortedFinance && sortedFinance.length > 0) {
        const latest = sortedFinance[sortedFinance.length - 1];
        setCurrentCosts({
          marketing_cost: latest.marketing_cost || 0,
          salary_cost: latest.salary_cost || 0,
          rent_cost: latest.rent_cost || 0,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch business cost breakdown.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const startEdit = (fieldKey, currentAmount) => {
    setEditingField(fieldKey);
    setInputValue(String(currentAmount || 0));
    setSaveError('');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setInputValue('');
    setSaveError('');
  };

  const saveEdit = async (fieldKey, apiFieldName) => {
    const parsed = Number(inputValue);
    if (Number.isNaN(parsed) || parsed < 0) {
      setSaveError('Enter a valid non-negative number.');
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      await apiCall(`/finance/${currentYear}/${currentMonthNum}`, {
        method: 'PATCH',
        body: JSON.stringify({ [apiFieldName]: parsed }),
      });
      await fetchStaffData();
      setEditingField(null);
      setInputValue('');
    } catch (err) {
      setSaveError(err.message || 'Failed to save cost.');
    } finally {
      setSaving(false);
    }
  };

  const chartData = financeRecords.map((item) => {
    const monthNum = Number(item.order_month) || 1;
    const monthIdx = Math.max(0, Math.min(11, monthNum - 1));
    const monthLabel = MONTH_NAMES[monthIdx];
    const yearStr = item.order_year ? String(item.order_year).slice(-2) : '';

    return {
      month: `${monthLabel} '${yearStr}`,
      marketing: Number(item.marketing_cost || 0),
      salary: Number(item.salary_cost || 0),
      rent: Number(item.rent_cost || 0),
    };
  });

  const tickInterval = chartData.length > 12
    ? Math.max(1, Math.floor(chartData.length / 10))
    : 0;

  const costCards = [
    {
      id: 'marketing',
      apiField: 'marketing_cost',
      label: 'Marketing Cost',
      amount: currentCosts.marketing_cost,
      icon: Megaphone,
      colorBg: 'bg-orange-500/10 text-orange-600 border-orange-200/50',
      badgeColor: 'bg-orange-100 text-orange-700',
      description: 'Campaigns, ads, & customer acquisition',
    },
    {
      id: 'salary',
      apiField: 'salary_cost',
      label: 'Salary Cost',
      amount: currentCosts.salary_cost,
      icon: Users,
      colorBg: 'bg-pink-500/10 text-pink-600 border-pink-200/50',
      badgeColor: 'bg-pink-100 text-pink-700',
      description: 'Staff payroll, bonuses, & employee benefits',
    },
    {
      id: 'rent',
      apiField: 'rent_cost',
      label: 'Rent Cost',
      amount: currentCosts.rent_cost,
      icon: Building,
      colorBg: 'bg-purple-500/10 text-purple-600 border-purple-200/50',
      badgeColor: 'bg-purple-100 text-purple-700',
      description: 'Physical space lease & store location rent',
    },
  ];

  const totalFixedCosts = costCards.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-8 pb-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-pink-600 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-pink-500" />
            <span>OPERATIONAL EXPENSES</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff & Recurring Costs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Breakdown of fixed business expenses (Marketing, Salary, Rent) from the finance table
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={fetchStaffData}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-pink-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Costs</span>
        </motion.button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchStaffData} className="underline font-bold hover:text-rose-800 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {costCards.map((card, idx) => {
          const Icon = card.icon;
          const isEditing = editingField === card.id;

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.35, ease: 'easeOut' }}
              whileHover={{ scale: 1.015, y: -2 }}
              className="glass-panel rounded-3xl p-6 border border-white/90 shadow-xl shadow-slate-200/40 relative overflow-hidden flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {card.label}
                  </span>

                  {loading ? (
                    <div className="h-8 w-28 bg-slate-200 rounded-lg animate-pulse my-1" />
                  ) : isEditing ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-extrabold text-slate-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          autoFocus
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(card.id, card.apiField);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="w-28 text-xl font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                        />
                        <button
                          onClick={() => saveEdit(card.id, card.apiField)}
                          disabled={saving}
                          className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center hover:bg-emerald-200 transition-colors cursor-pointer"
                          title="Save"
                        >
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {saveError && (
                        <p className="text-[10px] font-semibold text-rose-600">{saveError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        ₹{Number(card.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <button
                        onClick={() => startEdit(card.id, card.amount)}
                        className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title={`Edit ${card.label}`}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-sm shrink-0 ${card.colorBg}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium flex items-center justify-between">
                <span>{card.description}</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${card.badgeColor}`}>
                  Monthly
                </span>
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
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <span>COST COMPARISON TREND</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Month-over-Month Cost Categories</h2>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="text-xs font-semibold text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-full">
              Total Current Outflow: <span className="font-bold text-slate-900">₹{totalFixedCosts.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          {loading ? (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin mb-2" />
              <span className="text-xs font-semibold text-slate-400">Loading cost comparison chart...</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50/60 rounded-2xl text-center p-4">
              <p className="text-xs font-bold text-slate-500">No finance cost records available to display</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                  cursor={{ fill: 'rgba(255, 65, 108, 0.05)' }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    fontSize: '12px',
                    padding: '10px 14px',
                  }}
                  formatter={(val, name) => [
                    `₹${Number(val).toLocaleString('en-IN')}`,
                    name.charAt(0).toUpperCase() + name.slice(1) + ' Cost',
                  ]}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '15px', fontSize: '12px', fontWeight: 600 }}
                  iconType="circle"
                />
                <Bar dataKey="marketing" name="Marketing" fill="#f2643a" radius={[6, 6, 0, 0]} maxBarSize={30} isAnimationActive={true} />
                <Bar dataKey="salary" name="Salary" fill="#ff416c" radius={[6, 6, 0, 0]} maxBarSize={30} isAnimationActive={true} />
                <Bar dataKey="rent" name="Rent" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={30} isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};