import React, { useState } from 'react';
import { Search, Download, Filter, Star, User, Calendar, Tag, AlertCircle } from 'lucide-react';

export default function FeedbackTable({ feedbackList, showFilters = true, limit }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('');

  const categories = [
    'Teaching Quality',
    'Course Content',
    'Lab Facilities',
    'Classroom Facilities',
    'Assessment / Exams',
    'Faculty Interaction',
    'Other'
  ];

  // Filter logic
  let filteredData = feedbackList.filter(item => {
    const matchesSearch = 
      (item.comment && item.comment.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.course_name && item.course_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.faculty_name && item.faculty_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (!item.is_anonymous && item.student_name && item.student_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    const matchesRating = selectedRating ? String(item.rating) === String(selectedRating) : true;
    const matchesSentiment = selectedSentiment ? item.sentiment_label === selectedSentiment : true;

    return matchesSearch && matchesCategory && matchesRating && matchesSentiment;
  });

  if (limit) {
    filteredData = filteredData.slice(0, limit);
  }

  // Export CSV feature
  const exportToCSV = () => {
    const headers = ['ID', 'Course', 'Faculty', 'Category', 'Rating', 'Comment', 'Sentiment', 'Anonymous', 'Date'];
    const rows = filteredData.map(f => [
      f.id,
      `"${f.course_name || ''}"`,
      `"${f.faculty_name || ''}"`,
      `"${f.category || ''}"`,
      f.rating,
      `"${(f.comment || '').replace(/"/g, '""')}"`,
      f.sentiment_label,
      f.is_anonymous ? 'Yes' : 'No',
      new Date(f.created_at).toLocaleDateString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Feedback_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSentimentBadge = (label) => {
    if (label === 'positive') return <span className="badge badge-positive">Positive</span>;
    if (label === 'negative') return <span className="badge badge-negative">Negative</span>;
    return <span className="badge badge-neutral">Neutral</span>;
  };

  return (
    <div className="space-y-4">
      
      {showFilters && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search feedback comments, course, or faculty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control pl-9 text-sm"
              />
            </div>

            {/* Export Button */}
            <button 
              onClick={exportToCSV}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 shrink-0"
              disabled={filteredData.length === 0}
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-800">
            <div>
              <label className="form-label text-[11px] mb-1">Filter Category</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-select text-xs py-1.5"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label text-[11px] mb-1">Filter Rating</label>
              <select 
                value={selectedRating} 
                onChange={(e) => setSelectedRating(e.target.value)}
                className="form-select text-xs py-1.5"
              >
                <option value="">All Ratings (1-5)</option>
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label text-[11px] mb-1">Filter Sentiment</label>
              <select 
                value={selectedSentiment} 
                onChange={(e) => setSelectedSentiment(e.target.value)}
                className="form-select text-xs py-1.5"
              >
                <option value="">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Showing {filteredData.length} response{filteredData.length !== 1 ? 's' : ''}</span>
        {(searchTerm || selectedCategory || selectedRating || selectedSentiment) && (
          <button 
            onClick={() => { setSearchTerm(''); setSelectedCategory(''); setSelectedRating(''); setSelectedSentiment(''); }}
            className="text-indigo-400 hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Display */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Student / Dept</th>
                <th className="p-3.5">Course & Faculty</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Rating</th>
                <th className="p-3.5">Comment</th>
                <th className="p-3.5">Sentiment</th>
                <th className="p-3.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <User size={13} className="text-slate-500" />
                        {row.is_anonymous ? (
                          <span className="text-slate-400 italic">Anonymous Student</span>
                        ) : (
                          row.student_name || 'Student'
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{row.department || 'General'}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-medium text-slate-200">{row.course_name}</div>
                      <div className="text-xs text-indigo-400">{row.faculty_name || 'Department Faculty'}</div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        <Tag size={11} className="text-slate-400" />
                        {row.category}
                      </span>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star size={14} className="fill-amber-400" />
                        {row.rating} / 5
                      </div>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <p className="line-clamp-2 text-slate-300 text-xs leading-relaxed" title={row.comment}>
                        "{row.comment}"
                      </p>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      {getSentimentBadge(row.sentiment_label)}
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap text-xs text-slate-400">
                      <div className="flex items-center justify-end gap-1">
                        <Calendar size={12} />
                        {new Date(row.created_at).toLocaleDateString()}
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <AlertCircle size={24} className="mx-auto mb-2 text-slate-600" />
                    No feedback entries match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
