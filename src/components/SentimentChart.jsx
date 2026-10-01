import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SentimentChart({ feedbackList }) {
  let positive = 0;
  let negative = 0;
  let neutral = 0;

  feedbackList.forEach(item => {
    if (item.sentiment_label === 'positive') positive++;
    else if (item.sentiment_label === 'negative') negative++;
    else neutral++;
  });

  const data = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: [positive, negative, neutral],
        backgroundColor: [
          'rgba(16, 185, 129, 0.85)',
          'rgba(239, 68, 68, 0.85)',
          'rgba(148, 163, 184, 0.85)'
        ],
        borderColor: [
          '#10B981',
          '#EF4444',
          '#94A3B8'
        ],
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#CBD5E1',
          font: { family: 'Plus Jakarta Sans', size: 12 },
          usePointStyle: true,
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: '#0F172A',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12
      }
    },
    cutout: '70%'
  };

  const total = positive + negative + neutral;
  const positivePercentage = total > 0 ? Math.round((positive / total) * 100) : 0;

  return (
    <div className="glass-card p-5 h-72 flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Sentiment Distribution</h4>
        <p className="text-xs text-slate-400">Classified by PostgreSQL Trigger engine</p>
      </div>

      <div className="relative flex-1 w-full flex items-center justify-center my-2">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
          <span className="text-2xl font-extrabold text-emerald-400">{positivePercentage}%</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Positive</span>
        </div>
      </div>
    </div>
  );
}
