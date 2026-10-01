import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFeedbackList, getCurrentAdminSession } from '../lib/supabase';
import FeedbackTable from '../components/FeedbackTable';
import { Table, RefreshCw, ShieldAlert } from 'lucide-react';

export default function FeedbackDetails() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedbackList, setFeedbackList] = useState([]);
  const [authorized, setAuthorized] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const session = await getCurrentAdminSession();
      if (!session || (!session.data?.session && !session.user)) {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setAuthorized(true);

      const listData = await fetchFeedbackList();
      setFeedbackList(listData || []);
    } catch (err) {
      console.error('Error fetching feedback list:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw size={36} className="animate-spin text-indigo-400 mx-auto" />
        <p className="text-sm text-slate-400">Loading student feedback database...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 glass-card p-8 border-rose-500/30">
        <ShieldAlert size={48} className="text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-slate-300">
          Viewing detailed student feedback records requires an active Admin session.
        </p>
        <button onClick={() => navigate('/login')} className="btn btn-primary btn-sm">
          Go to Admin Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 animate-fade-in">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Table size={28} className="text-indigo-400" />
            Feedback Database & Details
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter by category/rating/sentiment, and export feedback records to CSV.
          </p>
        </div>

        <button 
          onClick={loadData}
          className="btn btn-secondary btn-sm flex items-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw size={14} />
          Refresh List
        </button>
      </div>

      <FeedbackTable feedbackList={feedbackList} showFilters={true} />

    </div>
  );
}
