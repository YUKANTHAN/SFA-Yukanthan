import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchFeedbackList, fetchFeedbackThemes, getCurrentAdminSession } from '../lib/supabase';
import StatCard from '../components/StatCard';
import RatingChart from '../components/RatingChart';
import SentimentChart from '../components/SentimentChart';
import CategoryChart from '../components/CategoryChart';
import TopInsights from '../components/TopInsights';
import FeedbackTable from '../components/FeedbackTable';
import { LayoutDashboard, MessageSquare, Star, Smile, Frown, Meh, RefreshCw, ArrowRight, ShieldAlert } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedbackList, setFeedbackList] = useState([]);
  const [themesList, setThemesList] = useState([]);
  const [authorized, setAuthorized] = useState(true);

  useEffect(() => {
    verifyAndLoadData();
  }, []);

  const verifyAndLoadData = async () => {
    setLoading(true);
    try {
      const session = await getCurrentAdminSession();
      if (!session || (!session.data?.session && !session.user)) {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setAuthorized(true);

      const [listData, themesData] = await Promise.all([
        fetchFeedbackList(),
        fetchFeedbackThemes()
      ]);

      setFeedbackList(listData || []);
      setThemesList(themesData || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw size={36} className="animate-spin text-indigo-400 mx-auto" />
        <p className="text-sm text-slate-400">Loading Supabase analytics dashboard...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 glass-card p-8 border-rose-500/30">
        <ShieldAlert size={48} className="text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-slate-300">
          The Analytics Dashboard is restricted to authenticated Admin users. Please log in first.
        </p>
        <button onClick={() => navigate('/login')} className="btn btn-primary btn-sm">
          Go to Admin Login
        </button>
      </div>
    );
  }

  // Calculated Stats
  const totalFeedback = feedbackList.length;
  const avgRating = totalFeedback > 0 
    ? (feedbackList.reduce((acc, curr) => acc + curr.rating, 0) / totalFeedback).toFixed(2)
    : '0.00';

  const positiveCount = feedbackList.filter(f => f.sentiment_label === 'positive').length;
  const negativeCount = feedbackList.filter(f => f.sentiment_label === 'negative').length;
  const neutralCount = feedbackList.filter(f => f.sentiment_label === 'neutral').length;

  return (
    <div className="space-y-8 py-4 animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <LayoutDashboard size={28} className="text-indigo-400" />
            Admin Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time student feedback statistics & PostgreSQL sentiment metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={verifyAndLoadData}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            title="Refresh analytics data"
          >
            <RefreshCw size={14} />
            Refresh Data
          </button>

          <Link to="/details" className="btn btn-primary btn-sm flex items-center gap-1.5">
            Full Details & Export
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="stat-grid">
        <StatCard
          title="Total Feedback"
          value={totalFeedback}
          icon={MessageSquare}
          color="indigo"
          subtext="Submissions received"
        />

        <StatCard
          title="Average Rating"
          value={`${avgRating} / 5`}
          icon={Star}
          color="amber"
          subtext="Overall campus score"
        />

        <StatCard
          title="Positive Feedback"
          value={positiveCount}
          icon={Smile}
          color="emerald"
          subtext={`${totalFeedback ? Math.round((positiveCount/totalFeedback)*100) : 0}% of responses`}
        />

        <StatCard
          title="Negative Feedback"
          value={negativeCount}
          icon={Frown}
          color="rose"
          subtext={`${totalFeedback ? Math.round((negativeCount/totalFeedback)*100) : 0}% of responses`}
        />

        <StatCard
          title="Neutral Feedback"
          value={neutralCount}
          icon={Meh}
          color="slate"
          subtext={`${totalFeedback ? Math.round((neutralCount/totalFeedback)*100) : 0}% of responses`}
        />
      </div>

      {/* Charts Grid Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RatingChart feedbackList={feedbackList} />
        <SentimentChart feedbackList={feedbackList} />
        <CategoryChart feedbackList={feedbackList} />
      </div>

      {/* Recurring Praise & Issue Insights */}
      <TopInsights themesList={themesList} />

      {/* Recent Feedback Preview Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Recent Student Submissions</h3>
          <Link to="/details" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
            View All Responses & CSV Export <ArrowRight size={12} />
          </Link>
        </div>

        <FeedbackTable feedbackList={feedbackList} showFilters={false} limit={5} />
      </div>

    </div>
  );
}
