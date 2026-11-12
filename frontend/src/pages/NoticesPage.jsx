import React from 'react';
import { Bell, Calendar, UserCheck } from 'lucide-react';

export default function NoticesPage({ announcements }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold font-heading text-white">Campus Notice Board</h2>
        <p className="text-sm text-slate-400 mt-1">Official circulars, timetable changes, spot registration alerts, and fest guidelines.</p>
      </div>

      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a.id} className="p-5 rounded-2xl glass-panel border border-slate-700/60 shadow-lg">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                a.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              }`}>
                {a.priority.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</span>
            </div>
            <h3 className="text-lg font-bold text-white font-heading">{a.title}</h3>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">{a.content}</p>
            <div className="mt-3 text-xs text-slate-400 font-medium">Issued by: <b className="text-blue-400">{a.issued_by}</b></div>
          </div>
        ))}
      </div>
    </div>
  );
}
