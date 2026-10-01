import React from 'react';
import { GraduationCap, ShieldCheck, Database, Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 py-8 px-4 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-500/30">
            <GraduationCap size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-200">Student Feedback Analyzer</p>
            <p className="text-[11px] text-slate-500">React + Vite + Supabase PostgreSQL RLS & Sentiment Triggers</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1">
            <Database size={13} className="text-indigo-400" /> PostgreSQL Views
          </span>
          <span className="flex items-center gap-1">
            <Cpu size={13} className="text-cyan-400" /> PL/pgSQL Sentiment Engine
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-400" /> Row Level Security (RLS)
          </span>
        </div>

        <div className="text-center md:text-right text-[11px] text-slate-500">
          &copy; {new Date().getFullYear()} Student Feedback Analytics System. Built for academic excellence.
        </div>

      </div>
    </footer>
  );
}
