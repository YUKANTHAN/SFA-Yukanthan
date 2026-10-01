import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'indigo', subtext }) {
  const colorStyles = {
    indigo: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      text: 'text-indigo-400',
      shadow: 'hover:shadow-indigo-500/10'
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      shadow: 'hover:shadow-amber-500/10'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      shadow: 'hover:shadow-emerald-500/10'
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      shadow: 'hover:shadow-rose-500/10'
    },
    slate: {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20',
      text: 'text-slate-300',
      shadow: 'hover:shadow-slate-500/10'
    }
  };

  const style = colorStyles[color] || colorStyles.indigo;

  return (
    <div className={`glass-card p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 border ${style.border} ${style.shadow}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{value}</h3>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-xl ${style.bg} ${style.text}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
}
