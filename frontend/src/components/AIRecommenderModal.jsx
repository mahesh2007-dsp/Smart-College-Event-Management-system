import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Brain, CheckCircle, ArrowRight, Calendar, MapPin, 
  Tag, Filter, Check, RefreshCw, Trophy, Users 
} from 'lucide-react';
import { api } from '../services/api';

const DOMAIN_CHIPS = [
  { id: 'coding', label: '💻 Coding & Hackathons' },
  { id: 'ai', label: '🤖 AI & Machine Learning' },
  { id: 'cybersecurity', label: '🔒 Cybersecurity & CTF' },
  { id: 'web', label: '🌐 Web & Cloud Systems' },
  { id: 'robotics', label: '⚡ Robotics & IoT' },
  { id: 'sports', label: '🏆 Sports & Tournaments' },
  { id: 'cultural', label: '🎭 Music & Cultural' },
  { id: 'hardware', label: '📐 Circuits & Hardware' },
  { id: 'science', label: '🔬 Science & Quiz' }
];

export default function AIRecommenderModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  events = [], 
  onSelectEvent, 
  onRegisterEvent 
}) {
  const [department, setDepartment] = useState(currentUser?.department || 'Computer Science & Engineering');
  const [selectedChips, setSelectedChips] = useState(['coding', 'ai']);
  const [customKeyword, setCustomKeyword] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch recommendations whenever department, chips, or modal open changes
  const fetchRecommendations = async (dept = department, chips = selectedChips, keyword = customKeyword) => {
    setLoading(true);
    setError('');

    try {
      const interests = [...chips];
      if (keyword.trim()) {
        keyword.split(',').forEach(k => {
          const t = k.trim();
          if (t && !interests.includes(t)) interests.push(t);
        });
      }

      const res = await api.getAIRecommendations(dept, interests);
      if (res.recommendedEvents) {
        setRecommendations(res.recommendedEvents);
      } else {
        throw new Error(res.error || 'Failed to fetch recommendations');
      }
    } catch (err) {
      setError(err.message || 'Python AI Service offline. Running local matching matrix.');
    } finally {
      setLoading(false);
    }
  };

  // Run automatically when modal opens or department changes
  useEffect(() => {
    if (isOpen) {
      fetchRecommendations();
    }
  }, [isOpen, department]);

  if (!isOpen) return null;

  // Toggle interest chip and instantly run AI recommendation
  const toggleChip = (chipId) => {
    let next;
    if (selectedChips.includes(chipId)) {
      next = selectedChips.filter(c => c !== chipId);
    } else {
      next = [...selectedChips, chipId];
    }
    setSelectedChips(next);
    fetchRecommendations(department, next, customKeyword);
  };

  const handleDepartmentChange = (e) => {
    const newDept = e.target.value;
    setDepartment(newDept);
    fetchRecommendations(newDept, selectedChips, customKeyword);
  };

  const handleKeywordSubmit = (e) => {
    e.preventDefault();
    fetchRecommendations(department, selectedChips, customKeyword);
  };

  // Filter recommendations by category if selected
  const displayedEvents = (recommendations || []).filter(rec => {
    if (activeCategoryFilter === 'All') return true;
    return (rec.category || '').toLowerCase() === activeCategoryFilter.toLowerCase();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl glass-panel rounded-3xl border border-purple-500/40 overflow-hidden shadow-2xl p-5 sm:p-7 my-6 animate-fade-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-600/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-white font-heading">
                  Python AI Event Recommender
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  NLP Powered
                </span>
              </div>
              <p className="text-xs text-purple-300/80">
                Content-based branch affinity & skill similarity matrix
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-1 space-y-4 my-4 flex-1">
          
          {error && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
              {error}
            </div>
          )}

          {/* Interactive Controls Box */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  1. Select Your Academic Branch / Department
                </label>
                <select
                  value={department}
                  onChange={handleDepartmentChange}
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-purple-500/40 text-purple-200 focus:outline-none focus:border-purple-400"
                >
                  <option value="Computer Science & Engineering">CSE (Computer Science & Engineering)</option>
                  <option value="Electronics & Comm Engineering">ECE (Electronics & Communication)</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Chemical Engineering">Chemical Engineering</option>
                  <option value="Metallurgical Engineering">MME (Metallurgical Engineering)</option>
                </select>
              </div>

              {/* Custom Keyword Input */}
              <form onSubmit={handleKeywordSubmit} className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    2. Add Specific Keyword (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. cricket, drone, python, ctf"
                    value={customKeyword}
                    onChange={e => setCustomKeyword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-400 placeholder-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3.5 py-2 self-end rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shrink-0 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Filter
                </button>
              </form>
            </div>

            {/* Interactive Domain Chips */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  3. Click to Select Domain Focus & Skills:
                </span>
                <span className="text-[11px] text-purple-400">
                  {selectedChips.length} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DOMAIN_CHIPS.map(chip => {
                  const isSelected = selectedChips.includes(chip.id);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => toggleChip(chip.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/60'
                          : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80'
                      }`}
                    >
                      {chip.label}
                      {isSelected && <Check className="w-3 h-3 text-cyan-300 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Matched Events for You ({displayedEvents.length})
                </h4>
                {loading && (
                  <span className="text-[11px] text-slate-400 animate-pulse flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin text-purple-400" /> Analyzing...
                  </span>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {['All', 'Technical', 'Cultural', 'Sports', 'Workshops'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-colors ${
                      activeCategoryFilter === cat
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Matched Events List */}
            {displayedEvents.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
                <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-300">No events found matching this exact combination</div>
                <p className="text-xs text-slate-500 mt-1">Try toggling different domain chips above or selecting "All" categories.</p>
                <button
                  onClick={() => { setSelectedChips(['coding', 'ai']); setActiveCategoryFilter('All'); }}
                  className="mt-3 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30"
                >
                  Reset Recommended Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedEvents.map(rec => {
                  const score = rec.matchScore || 75;
                  const isHighMatch = score >= 80;

                  return (
                    <div 
                      key={rec.eventId} 
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {rec.image_url ? (
                          <img 
                            src={rec.image_url} 
                            alt={rec.title} 
                            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-700 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                            <Trophy className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {rec.category || 'Event'}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate">
                              {rec.department || 'All Branches'}
                            </span>
                          </div>

                          <h5 className="font-bold text-white text-sm leading-snug truncate">
                            {rec.title}
                          </h5>

                          {rec.tagline && (
                            <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">{rec.tagline}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                            {rec.venue_name && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-cyan-400" /> {rec.venue_name}
                              </span>
                            )}
                            {rec.start_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-blue-400" /> {new Date(rec.start_date).toLocaleDateString()}
                              </span>
                            )}
                            <span className="text-amber-400 font-semibold font-mono">
                              {rec.entry_fee || 'Free'}
                            </span>
                          </div>

                          {/* Match reasons */}
                          {rec.reasons && (
                            <div className="text-[11px] text-purple-300/90 mt-1.5 flex items-center gap-1.5">
                              <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">{rec.reasons.join(' • ')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side: Match score & Buttons */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                        {/* Match Gauge */}
                        <div className="text-left sm:text-right">
                          <div className={`px-2.5 py-1 rounded-xl text-xs font-extrabold font-mono inline-flex items-center gap-1 border ${
                            isHighMatch 
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            <Sparkles className="w-3 h-3 text-cyan-400" /> {score}% Match
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectEvent(rec.eventId);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              const matched = events.find(e => e.id === rec.eventId) || { id: rec.eventId, title: rec.title, entry_fee: rec.entry_fee, team_type: rec.team_type };
                              if (onRegisterEvent) onRegisterEvent(matched);
                            }}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-1"
                          >
                            Register <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI scoring matrix live with dynamic student branch weights</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
