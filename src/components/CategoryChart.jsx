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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function CategoryChart({ feedbackList }) {
  const categoryStats = {};

  feedbackList.forEach(item => {
    const cat = item.category || 'Other';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { totalRating: 0, count: 0 };
    }
    categoryStats[cat].totalRating += item.rating;
    categoryStats[cat].count += 1;
  });

  const categories = Object.keys(categoryStats);
  const avgRatings = categories.map(cat => 
    Number((categoryStats[cat].totalRating / categoryStats[cat].count).toFixed(2))
  );

  const data = {
    labels: categories,
    datasets: [
      {
        label: 'Average Rating (1-5)',
        data: avgRatings,
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        borderColor: '#6366F1',
        borderWidth: 1.5,
        borderRadius: 6
      }
    ]
  };

  const options = {
    indexAxis: 'y',
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
        callbacks: {
          label: (context) => `Avg Rating: ${context.parsed.x} / 5 (${categoryStats[categories[context.dataIndex]].count} responses)`
        }
      }
    },
    scales: {
      x: {
        min: 0,
        max: 5,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94A3B8', font: { family: 'Plus Jakarta Sans', size: 11 } }
      },
      y: {
        grid: { display: false },
        ticks: { color: '#CBD5E1', font: { family: 'Plus Jakarta Sans', size: 11 } }
      }
    }
  };

  return (
    <div className="glass-card p-5 h-72 flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Category Performance</h4>
        <p className="text-xs text-slate-400">Average student satisfaction score per category</p>
      </div>
      <div className="relative flex-1 w-full mt-2">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
