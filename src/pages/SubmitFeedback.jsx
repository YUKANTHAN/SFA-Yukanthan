import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RatingInput from '../components/RatingInput';
import { submitFeedbackData } from '../lib/supabase';
import { MessageSquarePlus, Send, User, BookOpen, Building, UserCheck, Tag, Lock, AlertCircle } from 'lucide-react';

export default function SubmitFeedback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    course_name: '',
    faculty_name: '',
    department: 'Computer Science',
    category: 'Teaching Quality',
    rating: 5,
    comment: '',
    is_anonymous: true,
    student_name: ''
  });

  const categories = [
    'Teaching Quality',
    'Course Content',
    'Lab Facilities',
    'Classroom Facilities',
    'Assessment / Exams',
    'Faculty Interaction',
    'Other'
  ];

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics & Comm',
    'Electrical Eng',
    'Mechanical Eng',
    'Civil Eng',
    'General Sciences'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.course_name.trim()) {
      setErrorMsg('Please enter the Course / Subject name.');
      return;
    }

    if (!formData.comment.trim()) {
      setErrorMsg('Please enter your feedback comment.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        course_name: formData.course_name.trim(),
        faculty_name: formData.faculty_name.trim() || 'Department Faculty',
        department: formData.department,
        category: formData.category,
        rating: Number(formData.rating),
        comment: formData.comment.trim(),
        is_anonymous: formData.is_anonymous,
        student_name: formData.is_anonymous ? null : (formData.student_name.trim() || 'Student')
      };

      const submittedResult = await submitFeedbackData(payload);
      
      // Save submission summary to session storage for the success page
      sessionStorage.setItem('last_submitted_feedback', JSON.stringify(submittedResult));

      navigate('/success');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 animate-fade-in space-y-6">
      
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
          <MessageSquarePlus size={24} />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Student Feedback Form</h1>
        <p className="text-sm text-slate-400">
          Your feedback helps improve teaching quality, lab facilities, and campus life.
        </p>
      </div>

      <div className="glass-card p-6 sm:p-8 border-slate-800">
        
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Course Name & Faculty Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-1.5">
                <BookOpen size={14} className="text-indigo-400" />
                Course / Subject <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Data Structures, Web Dev"
                value={formData.course_name}
                onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-1.5">
                <UserCheck size={14} className="text-indigo-400" />
                Faculty Name
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Aris Thorne"
                value={formData.faculty_name}
                onChange={(e) => setFormData({ ...formData, faculty_name: e.target.value })}
                className="form-control"
              />
            </div>

          </div>

          {/* Department & Category Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-1.5">
                <Building size={14} className="text-indigo-400" />
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="form-select"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-1.5">
                <Tag size={14} className="text-indigo-400" />
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-select"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Star Rating */}
          <div className="form-group">
            <label className="form-label">
              Rating (1 to 5 Stars) <span className="text-rose-400">*</span>
            </label>
            <RatingInput
              value={formData.rating}
              onChange={(newRating) => setFormData({ ...formData, rating: newRating })}
            />
          </div>

          {/* Open-text Comment */}
          <div className="form-group">
            <label className="form-label">
              Open-text Feedback Comment <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Provide specific details (e.g. teaching style, lab computer speed, Wi-Fi connectivity, or exam difficulty)..."
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="form-control"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Tip: Including keywords like "helpful", "clear", "slow", or "unclear" helps the automated sentiment trigger.
            </p>
          </div>

          {/* Anonymous Option Toggle */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="anon-toggle" className="flex items-center gap-2 cursor-pointer">
                <input
                  id="anon-toggle"
                  type="checkbox"
                  checked={formData.is_anonymous}
                  onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                />
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                  <Lock size={14} className="text-indigo-400" /> Submit Anonymously
                </span>
              </label>

              <span className={`badge ${formData.is_anonymous ? 'badge-positive' : 'badge-neutral'}`}>
                {formData.is_anonymous ? 'Name Hidden' : 'Name Public'}
              </span>
            </div>

            {!formData.is_anonymous && (
              <div className="pt-2 animate-fade-in">
                <label className="form-label flex items-center gap-1.5">
                  <User size={14} className="text-indigo-400" />
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivers"
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  className="form-control"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Submitting to Supabase...</span>
            ) : (
              <>
                <Send size={18} />
                Submit Student Feedback
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
