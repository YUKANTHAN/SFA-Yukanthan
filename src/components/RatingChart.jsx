import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function RatingChart({ feedbackList }) {
  // Count frequency of ratings 1 through 5
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbackList.forEach(item => {
    if (counts[item.rating] !== undefined) {
      counts[item.rating]++;
    }
  });

  const data = {
    labels: ['1 Star (Poor)', '2 Stars (Fair)', '3 Stars (Average)', '4 Stars (Good)', '5 Stars (Excellent)'],
    datasets: [
      {
        label: 'Number of Feedbacks',
        data: [counts[1], counts[2], counts[3], counts[4], counts[5]],
        backgroundColor: [
          'rgba(239, 68, 68, 0.75)',
          'rgba(245, 158, 11, 0.75)',
          'rgba(156, 163, 175, 0.75)',
          'rgba(59, 130, 246, 0.75)',
          'rgba(16, 185, 129, 0.75)'
        ],
        borderColor: [
          '#EF4444',
          '#F59E0B',
          '#9CA3AF',
          '#3B82F6',
          '#10B981'
        ],
        borderWidth: 1.5,
        borderRadius: 8
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94A3B8', font: { family: 'Plus Jakarta Sans', size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94A3B8', precision: 0, font: { family: 'Plus Jakarta Sans', size: 11 } }
      }
    }
  };

  return (
    <div className="glass-card p-5 h-72 flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Ratings Distribution</h4>
        <p className="text-xs text-slate-400 mb-2">Breakdown of student ratings from 1 to 5 stars</p>
      </div>
      <div className="relative flex-1 w-full mt-2">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
