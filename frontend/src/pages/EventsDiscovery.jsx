import React, { useState } from 'react';
import { Search, Code2, Music, Trophy, BookOpen, Layers } from 'lucide-react';
import EventCard from '../components/EventCard';

export default function EventsDiscovery({ events, onDetails, onRegister }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'All', icon: Layers },
    { name: 'Technical', icon: Code2 },
    { name: 'Cultural', icon: Music },
    { name: 'Sports', icon: Trophy },
    { name: 'Workshops', icon: BookOpen }
  ];

  const filtered = events.filter(e => {
    if (activeCategory !== 'All' && e.category.toLowerCase() !== activeCategory.toLowerCase()) return false;
    if (selectedDept !== 'All' && !e.department.toLowerCase().includes(selectedDept.toLowerCase()) && e.department !== 'All Branches') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = e.title.toLowerCase().includes(q) ||
        (e.tagline || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.coordinator_name || '').toLowerCase().includes(q) ||
        (e.venue_name || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
        
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {cat.name}
              </button>
            );
          })}
        </div>

        {/* Dept filter & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-400"
          >
            <option value="All">All Departments</option>
            <option value="Computer Science">CSE Department</option>
            <option value="Electronics">ECE Department</option>
            <option value="Mechanical">Mechanical Engineering</option>
            <option value="Physical Education">Sports Council</option>
            <option value="All Branches">Inter-Branch Events</option>
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, coordinator, venue..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

      </div>

      {/* Header bar */}
      <div className="flex items-center justify-between mt-8 mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">Upcoming Campus Events</h2>
          <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
            {filtered.length} Events Available
          </span>
        </div>
        <div className="text-xs text-slate-400 hidden sm:block">
          RGUKT IIIT RK Valley Verified Calendar
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 glass-panel rounded-3xl p-8 border border-slate-800">
          <p className="text-base text-slate-300">No events found matching current criteria.</p>
          <button
            onClick={() => { setActiveCategory('All'); setSelectedDept('All'); setSearchQuery(''); }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(evt => (
            <EventCard
              key={evt.id}
              event={evt}
              onDetails={onDetails}
              onRegister={onRegister}
            />
          ))}
        </div>
      )}

    </div>
  );
}
