import React, { useState, useEffect } from 'react';
import { FAQ_CATEGORIES, FAQ_ITEMS } from '../data/faqData';
import { getStoredFaqs, saveStoredFaqs } from '../utils/storage';
import {
  HelpCircle,
  PlusCircle,
  Edit3,
  Trash2,
  CheckCircle2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export const AdminFaqManager = () => {
  const [faqs, setFaqs] = useState([]);
  const [notice, setNotice] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);

  // Form State
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState(FAQ_CATEGORIES[0]?.id || 'general');
  const [formError, setFormError] = useState('');

  const formRef = React.useRef(null);

  useEffect(() => {
    const reloadFaqs = () => {
      setFaqs(getStoredFaqs(FAQ_ITEMS));
    };
    reloadFaqs();

    window.addEventListener('lazrhub_faqs_updated', reloadFaqs);
    return () => window.removeEventListener('lazrhub_faqs_updated', reloadFaqs);
  }, []);

  const showFeedback = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleResetForm = () => {
    setEditingFaq(null);
    setQuestion('');
    setAnswer('');
    setCategory(FAQ_CATEGORIES[0]?.id || 'general');
    setFormError('');
    setShowAddForm(false);
  };

  const handleStartEdit = (item) => {
    setEditingFaq(item);
    setQuestion(item.question || '');
    setAnswer(item.answer || '');
    setCategory(item.category || 'general');
    setShowAddForm(true);

    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const cleanQ = question.trim();
    const cleanA = answer.trim();

    if (!cleanQ || !cleanA) {
      setFormError('Please enter both a question and an answer.');
      return;
    }

    if (editingFaq) {
      const updated = faqs.map((f) =>
        f.id === editingFaq.id
          ? {
              ...f,
              question: cleanQ,
              answer: cleanA,
              category,
            }
          : f
      );
      setFaqs(updated);
      saveStoredFaqs(updated);
      showFeedback('Successfully updated FAQ item!');
    } else {
      const newFaq = {
        id: `q-${Date.now()}`,
        category,
        question: cleanQ,
        answer: cleanA,
        views: 0,
        helpfulYes: 0,
        helpfulNo: 0,
      };
      const updated = [newFaq, ...faqs];
      setFaqs(updated);
      saveStoredFaqs(updated);
      showFeedback('Successfully added new FAQ item!');
    }

    handleResetForm();
  };

  const handleDelete = (faqId) => {
    const updated = faqs.filter((f) => f.id !== faqId);
    setFaqs(updated);
    saveStoredFaqs(updated);
    showFeedback('Deleted FAQ item.');
  };

  const handleResetStats = (faqId) => {
    const updated = faqs.map((f) =>
      f.id === faqId ? { ...f, views: 0, helpfulYes: 0, helpfulNo: 0 } : f
    );
    setFaqs(updated);
    saveStoredFaqs(updated);
    showFeedback('Reset views & votes for this FAQ.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-purple-900/40 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-purple-400" />
            <span>FAQ Page Content Manager</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage official questions, answers, and categories on <code className="text-purple-300">/FAQ</code>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showAddForm) handleResetForm();
            else setShowAddForm(true);
          }}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center space-x-2 transition-all shadow-md shadow-purple-600/30"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showAddForm ? 'Cancel' : 'Add New Question'}</span>
        </button>
      </div>

      {/* Add / Edit Form */}
      {showAddForm && (
        <form ref={formRef} onSubmit={handleSubmit} className="p-5 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              {editingFaq ? 'Edit FAQ Item' : 'Add New FAQ Item'}
            </h4>
            {editingFaq && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-purple-400 hover:underline font-bold"
              >
                Cancel Editing
              </button>
            )}
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-red-950 border border-red-500/60 text-red-300 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-purple-500 outline-none"
              >
                {FAQ_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Question Title *</label>
              <input
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. How do I request a new game?"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Detailed Answer *</label>
            <textarea
              rows={4}
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Provide a clear, helpful response..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-purple-500 outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md"
            >
              {editingFaq ? 'Save Changes' : 'Publish FAQ'}
            </button>
          </div>
        </form>
      )}

      {/* FAQ Items List */}
      <div className="space-y-3">
        {faqs.map((faq) => {
          const categoryObj = FAQ_CATEGORIES.find((c) => c.id === faq.category) || FAQ_CATEGORIES[0];

          return (
            <div
              key={faq.id}
              className="p-4 rounded-2xl bg-slate-950 border border-purple-900/30 hover:border-purple-600/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-500/30 text-[10px] font-black uppercase">
                    {categoryObj.name}
                  </span>
                  <h4 className="text-xs font-bold text-white truncate">{faq.question}</h4>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2">{faq.answer}</p>

                <div className="flex items-center space-x-3 text-[10px] text-slate-400 pt-1 font-mono">
                  <span className="flex items-center space-x-1 text-purple-300">
                    <Eye className="w-3 h-3" />
                    <span>{faq.views || 0} views</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{faq.helpfulYes || 0}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1 text-rose-400">
                    <ThumbsDown className="w-3 h-3" />
                    <span>{faq.helpfulNo || 0}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleResetStats(faq.id)}
                  className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition-colors"
                  title="Reset Views & Votes"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleStartEdit(faq)}
                  className="p-2 rounded-xl bg-purple-900/40 hover:bg-purple-800 text-purple-300 transition-colors"
                  title="Edit FAQ"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(faq.id)}
                  className="p-2 rounded-xl bg-red-950/50 hover:bg-red-900 text-red-400 hover:text-red-200 transition-colors"
                  title="Delete FAQ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
