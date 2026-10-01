import React from 'react';
import { ThumbsUp, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';

export default function TopInsights({ themesList }) {
  // Aggregate praises and issues
  const praiseMap = {};
  const issueMap = {};

  themesList.forEach(item => {
    if (item.theme_type === 'praise') {
      praiseMap[item.theme] = (praiseMap[item.theme] || 0) + 1;
    } else if (item.theme_type === 'issue') {
      issueMap[item.theme] = (issueMap[item.theme] || 0) + 1;
    }
  });

  const topPraises = Object.entries(praiseMap)
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const topIssues = Object.entries(issueMap)
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Generate readable dynamic summary text
  const praiseText = topPraises.length > 0 
    ? topPraises.map(p => p.theme.toLowerCase()).join(', ') 
    : 'consistent academic effort';

  const issueText = topIssues.length > 0 
    ? topIssues.map(i => i.theme.toLowerCase()).join(', ') 
    : 'minor operational details';

  const generatedSummary = `Students appreciate ${praiseText}. The most recurring concerns reported by students are ${issueText}.`;

  return (
    <div className="space-y-6">
      
      {/* Generated Dashboard Summary Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 flex items-start gap-3 shadow-lg">
        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 mt-0.5 shrink-0">
          <Sparkles size={20} />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5 mb-1">
            Automated Executive Insights Summary
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed italic">
            "{generatedSummary}"
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top 3 Praises Card */}
        <div className="glass-card p-5 border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-emerald-500/20">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ThumbsUp size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Top 3 Praises</h4>
              <p className="text-xs text-slate-400">Most frequent positive themes extracted</p>
            </div>
          </div>

          <div className="space-y-3">
            {topPraises.length > 0 ? (
              topPraises.map((item, idx) => (
                <div key={item.theme} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-200">{item.theme}</span>
                  </div>
                  <span className="badge badge-positive">
                    {item.count} mention{item.count > 1 ? 's' : ''}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-2">No praise themes extracted yet.</p>
            )}
          </div>
        </div>

        {/* Top 3 Issues Card */}
        <div className="glass-card p-5 border-rose-500/20 bg-rose-950/10">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-rose-500/20">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertCircle size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Top 3 Critical Issues</h4>
              <p className="text-xs text-slate-400">Most urgent concern areas requiring faculty action</p>
            </div>
          </div>

          <div className="space-y-3">
            {topIssues.length > 0 ? (
              topIssues.map((item, idx) => (
                <div key={item.theme} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-200">{item.theme}</span>
                  </div>
                  <span className="badge badge-negative">
                    {item.count} mention{item.count > 1 ? 's' : ''}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-2">No issue themes extracted yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
