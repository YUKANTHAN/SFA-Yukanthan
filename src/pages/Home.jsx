import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquarePlus, LayoutDashboard, Sparkles, ShieldCheck, Database, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-16 py-6 animate-fade-in">
      
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto space-y-6 pt-8">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles size={14} className="text-indigo-400" />
          Automated Academic Intelligence
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Empowering Education Through <br />
          <span className="gradient-text">Real-Time Student Insights</span>
        </h1>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          A seamless feedback platform powered by <strong className="text-white">Supabase PostgreSQL</strong> triggers. Automatically analyzes sentiment score, extracts top recurring praises & issues, and provides faculty with actionable analytics.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/submit" className="btn btn-primary btn-lg w-full sm:w-auto shadow-indigo-500/30">
            <MessageSquarePlus size={20} />
            Give Feedback Now
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg w-full sm:w-auto">
            <LayoutDashboard size={20} />
            Admin Login
          </Link>
        </div>

        <div className="pt-6 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> Anonymous Submissions</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-indigo-400" /> Automatic PL/pgSQL Sentiment</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-cyan-400" /> Top 3 Issue Extraction</span>
        </div>

      </section>


      {/* Core Architectural Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        
        <div className="glass-card glass-card-interactive p-6 space-y-3 border-indigo-500/20">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <MessageSquarePlus size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">Student Feedback Portal</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Students submit detailed feedback with rating choices, category tags, and open-text comments with option for complete anonymity.
          </p>
        </div>

        <div className="glass-card glass-card-interactive p-6 space-y-3 border-cyan-500/20">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Database size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">Supabase Sentiment Trigger</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            PostgreSQL <code className="text-cyan-300">analyze_feedback_sentiment()</code> trigger automatically calculates sentiment score and label on every insert.
          </p>
        </div>

        <div className="glass-card glass-card-interactive p-6 space-y-3 border-purple-500/20">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <BarChart3 size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">Admin Analytics Dashboard</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Faculty and management gain instant access to interactive Chart.js visualizations, top 3 praises/issues, and CSV export tools.
          </p>
        </div>

      </section>


      {/* How it works pipeline */}
      <section className="glass-card p-8 max-w-5xl mx-auto space-y-8 border-slate-800">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-white">Automated Processing Pipeline</h2>
          <p className="text-sm text-slate-400">How feedback flows from student submission to faculty intelligence</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto text-sm">1</div>
            <h4 className="font-semibold text-white text-sm">Student Form</h4>
            <p className="text-xs text-slate-400">Completes ratings, category, & comments</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center mx-auto text-sm">2</div>
            <h4 className="font-semibold text-white text-sm">Supabase RLS Insert</h4>
            <p className="text-xs text-slate-400">Secure insertion with Row Level Security</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center mx-auto text-sm">3</div>
            <h4 className="font-semibold text-white text-sm">Database Trigger</h4>
            <p className="text-xs text-slate-400">PL/pgSQL labels Positive / Negative / Neutral</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto text-sm">4</div>
            <h4 className="font-semibold text-white text-sm">Dashboard Update</h4>
            <p className="text-xs text-slate-400">Charts & top 3 issues refresh live</p>
          </div>

        </div>
      </section>

    </div>
  );
}
