import React, { useState, useEffect } from 'react';
import {
  getStoredPolls,
  saveStoredPolls,
  DEFAULT_INITIAL_POLL,
} from '../utils/storage';
import {
  Vote,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Clock,
  Users,
  BarChart2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export const AdminPollsManager = () => {
  const [polls, setPolls] = useState([]);
  const [notice, setNotice] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Poll Form
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['Minecraft', 'Roblox', 'More Horror Games', 'Flash Games']);
  const [daysDuration, setDaysDuration] = useState('14');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const loadPolls = () => {
      setPolls(getStoredPolls());
    };
    loadPolls();

    window.addEventListener('lazrhub_polls_updated', loadPolls);
    return () => window.removeEventListener('lazrhub_polls_updated', loadPolls);
  }, []);

  const showFeedback = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleAddOptionField = () => {
    if (options.length >= 6) return;
    setOptions([...options, '']);
  };

  const handleRemoveOptionField = (idx) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleOptionChange = (idx, value) => {
    const updated = [...options];
    updated[idx] = value;
    setOptions(updated);
  };

  const handleCreatePoll = (e) => {
    e.preventDefault();
    setFormError('');

    const cleanQuestion = question.trim();
    const cleanOpts = options.map((o) => o.trim()).filter(Boolean);

    if (!cleanQuestion) {
      setFormError('Please provide a poll question.');
      return;
    }
    if (cleanOpts.length < 2) {
      setFormError('Please provide at least 2 valid options.');
      return;
    }

    const durationDays = parseInt(daysDuration) || 14;
    const newPoll = {
      id: `poll-${Date.now()}`,
      question: cleanQuestion,
      options: cleanOpts.map((optText, i) => ({
        id: `opt-${Date.now()}-${i}`,
        text: optText,
        votes: 0,
      })),
      totalVotes: 0,
      endsAt: new Date(Date.now() + durationDays * 86400000).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    // Set all other polls inactive when a new poll is activated
    const updatedPolls = polls.map((p) => ({ ...p, isActive: false }));
    const finalPolls = [newPoll, ...updatedPolls];

    setPolls(finalPolls);
    saveStoredPolls(finalPolls);

    setQuestion('');
    setOptions(['Minecraft', 'Roblox', 'More Horror Games', 'Flash Games']);
    setShowAddForm(false);
    showFeedback('Successfully created and activated new Community Poll!');
  };

  const handleSetActivePoll = (pollId) => {
    const updated = polls.map((p) => ({
      ...p,
      isActive: p.id === pollId,
    }));
    setPolls(updated);
    saveStoredPolls(updated);
    showFeedback('Active poll updated successfully!');
  };

  const handleDeletePoll = (pollId) => {
    const updated = polls.filter((p) => p.id !== pollId);
    if (updated.length > 0 && !updated.some((p) => p.isActive)) {
      updated[0].isActive = true;
    }
    setPolls(updated);
    saveStoredPolls(updated);
    showFeedback('Poll deleted successfully.');
  };

  const handleResetPollVotes = (pollId) => {
    const updated = polls.map((p) => {
      if (p.id === pollId) {
        return {
          ...p,
          totalVotes: 0,
          options: p.options.map((o) => ({ ...o, votes: 0 })),
        };
      }
      return p;
    });
    setPolls(updated);
    saveStoredPolls(updated);
    showFeedback('Reset poll votes to 0.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
            <Vote className="w-4 h-4 text-purple-400" />
            <span>Community Polls Manager</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, manage, and inspect voting results for homepage community polls.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center space-x-2 transition-all shadow-md shadow-purple-600/30"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showAddForm ? 'Cancel' : 'Create New Poll'}</span>
        </button>
      </div>

      {/* New Poll Form */}
      {showAddForm && (
        <form onSubmit={handleCreatePoll} className="p-5 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-4 animate-fadeIn">
          <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Create New Community Poll</h4>

          {formError && (
            <div className="p-3 rounded-xl bg-red-950 border border-red-500/60 text-red-300 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Poll Question *</label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What game should we add next?"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-purple-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300">Poll Options * (Minimum 2, Maximum 6)</label>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOptionField}
                  className="text-xs text-purple-400 hover:underline font-bold"
                >
                  + Add Option
                </button>
              )}
            </div>

            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="text"
                  required
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-purple-500 outline-none"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOptionField(idx)}
                    className="p-1.5 rounded-lg bg-red-950 text-red-400 hover:text-red-200 text-xs font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Poll Duration (Days)</label>
            <select
              value={daysDuration}
              onChange={(e) => setDaysDuration(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
            >
              <option value="3">3 Days</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md"
            >
              Publish Poll
            </button>
          </div>
        </form>
      )}

      {/* Polls List */}
      <div className="space-y-4">
        {polls.map((poll) => (
          <div
            key={poll.id}
            className={`p-5 rounded-2xl bg-slate-950 border transition-all ${
              poll.isActive ? 'border-purple-500 shadow-lg shadow-purple-950/40' : 'border-slate-800 opacity-90'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-extrabold text-white">{poll.question}</h4>
                  {poll.isActive ? (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase">
                      ACTIVE HOMEPAGE POLL
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold uppercase">
                      INACTIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>{poll.totalVotes.toLocaleString()} votes</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-pink-400" />
                    <span>Ends: {new Date(poll.endsAt).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {!poll.isActive && (
                  <button
                    type="button"
                    onClick={() => handleSetActivePoll(poll.id)}
                    className="px-3 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-xs font-bold"
                  >
                    Set as Active
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleResetPollVotes(poll.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  title="Reset Votes"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeletePoll(poll.id)}
                  className="p-2 rounded-xl bg-red-950/50 hover:bg-red-900 text-red-400 hover:text-red-200 text-xs font-bold"
                  title="Delete Poll"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Options breakdown */}
            <div className="space-y-2">
              {poll.options.map((opt) => {
                const percentage = poll.totalVotes > 0
                  ? Math.round((opt.votes / poll.totalVotes) * 100)
                  : 0;

                return (
                  <div key={opt.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>{opt.text}</span>
                      <span className="font-mono text-purple-300">
                        {opt.votes.toLocaleString()} votes ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
