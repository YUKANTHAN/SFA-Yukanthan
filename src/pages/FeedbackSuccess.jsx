import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, MessageSquarePlus, Home, Sparkles, Tag, Star } from 'lucide-react';

export default function FeedbackSuccess() {
  const lastFeedbackRaw = sessionStorage.getItem('last_submitted_feedback');
  const lastFeedback = lastFeedbackRaw ? JSON.parse(lastFeedbackRaw) : null;

  useEffect(() => {
    // Launch celebratory confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Ignore if canvas confetti isn't supported
    }
  }, []);

  return (
    <div className="max-w-xl mx-auto py-12 text-center animate-fade-in space-y-6">
      
      <div className="glass-card p-8 sm:p-10 border-emerald-500/30 bg-emerald-950/10 space-y-6">
        
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 size={44} />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">Feedback Submitted Successfully!</h1>
          <p className="text-sm text-slate-300">
            Thank you for taking the time to share your academic feedback. Your input helps us continuously refine the educational experience.
          </p>
        </div>

        {lastFeedback && (
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold text-white">{lastFeedback.course_name}</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star size={13} className="fill-amber-400" /> {lastFeedback.rating} / 5
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Category: <strong className="text-slate-200">{lastFeedback.category}</strong></span>
              <span className="capitalize badge badge-positive">
                <Sparkles size={11} /> {lastFeedback.sentiment_label || 'Neutral'} Sentiment
              </span>
            </div>

            <div className="pt-1 text-slate-400 italic">
              "{lastFeedback.comment}"
            </div>
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/submit" className="btn btn-primary w-full sm:w-auto">
            <MessageSquarePlus size={16} />
            Submit Another Feedback
          </Link>

          <Link to="/" className="btn btn-secondary w-full sm:w-auto">
            <Home size={16} />
            Return to Home
          </Link>
        </div>

      </div>

    </div>
  );
}
