import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, Send, Mic, ArrowUpRight, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ForecastingView = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState(null);

  const fullName = user?.full_name || user?.username || 'Admin';
  const firstName = fullName.split(' ')[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 5) return `Up late, ${firstName}?`;
    if (hour >= 5 && hour < 12) return `Good morning, ${firstName}`;
    if (hour >= 12 && hour < 17) return `Good afternoon, ${firstName}`;
    return `Good evening, ${firstName}`;
  };

  const samplePrompts = [
    "Predict inventory demand for the next 30 days",
    "Identify top product categories driving profit margin",
    "Recommend optimal staff scheduling based on order volume",
    "Show cost variance between marketing and monthly revenue"
  ];

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setSubmittedQuery(query);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="min-h-[calc(100vh-4rem)] bg-[#0d0d0f] text-[#f4f3f8] rounded-3xl p-6 sm:p-10 flex flex-col justify-center items-center relative overflow-hidden border border-white/5 shadow-2xl"
    >
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-[#f2643a]/15 to-[#ff416c]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#ff416c]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Content */}
      <div className="w-full max-w-2xl mx-auto space-y-8 text-center relative z-10 my-auto">
        {/* Top Heading Badge with Brand Orange-to-Pink Accent */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/30 backdrop-blur-md shadow-inner text-xs font-bold text-orange-400"
        >
          <Sparkles className="w-4 h-4 text-[#f2643a] animate-pulse" />
          <span className="tracking-wide bg-gradient-to-r from-[#f2643a] to-[#ff416c] bg-clip-text text-transparent">
            AI - Business Insight Demand Forecast
          </span>
        </motion.div>

        {/* Personalized Time-Aware Greeting */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-3"
        >
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-serif">
            {getGreeting()}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto font-sans font-light leading-relaxed">
            Ask BizAI to forecast demand trends, optimize inventory, or uncover cost optimizations.
          </p>
        </motion.div>

        {/* Input Bar Container */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[#18181c] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl text-left space-y-3 focus-within:border-orange-500/50 transition-all duration-300 group"
        >
          <textarea
            rows={2}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Enter your Query"
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base focus:outline-none resize-none px-2"
          />

          {/* Bottom Bar inside Input Box */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5 px-1">
            {/* Bottom Left Plus Icon */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
              title="Add Context or Attachment"
            >
              <Plus className="w-4 h-4" />
            </motion.button>

            {/* Bottom Right Action Icons */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Voice Input"
              >
                <Mic className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="w-9 h-9 rounded-xl btn-gradient text-white flex items-center justify-center shadow-lg shadow-orange-500/25 transition-all duration-200 cursor-pointer"
                title="Submit Query"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.form>

        {/* Stub Query Output Notification */}
        {submittedQuery && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/40 to-pink-950/40 border border-orange-500/30 text-left text-xs text-orange-200 flex items-start gap-3"
          >
            <Cpu className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-orange-300 block mb-0.5">Query Received:</span>
              <p className="text-slate-300 font-mono text-[11px] mb-2">"{submittedQuery}"</p>
              <p className="text-[11px] text-slate-400 italic">
                AI Forecasting Model placeholder active. Logic ready for backend predictive integration.
              </p>
            </div>
          </motion.div>
        )}

        {/* Quick Suggestion Chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-4 space-y-3"
        >
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            SUGGESTED FORECAST QUERIES
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
            {samplePrompts.map((prompt, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setQuery(prompt)}
                className="text-xs bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 hover:text-white px-3.5 py-2 rounded-full transition-all duration-200 flex items-center gap-1.5 hover:border-orange-400/40 text-left cursor-pointer shadow-xs"
              >
                <span>{prompt}</span>
                <ArrowUpRight className="w-3 h-3 text-orange-400 shrink-0" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-4 text-center text-[11px] text-slate-500 font-medium">
        BizAI Predictive Engine v1.0 • Frontend Interface Preview
      </div>
    </motion.div>
  );
};
