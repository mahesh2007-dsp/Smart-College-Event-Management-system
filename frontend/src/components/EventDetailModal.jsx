import React from 'react';
import { X, Calendar, MapPin, Trophy, Users, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';

export default function EventDetailModal({ event, onClose, onRegister }) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl glass-panel rounded-3xl border border-slate-700 overflow-hidden shadow-2xl my-8">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative h-64 bg-slate-900 overflow-hidden">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {event.category}
              </span>
              <span className="text-xs font-medium text-slate-300">{event.department} • {event.club_name || 'IIIT RKV'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">{event.title}</h2>
            {event.tagline && <p className="text-xs sm:text-sm text-sky-300 font-medium mt-0.5">{event.tagline}</p>}
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Venue</span>
              <span className="font-bold text-white truncate block">{event.venue_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Date & Time</span>
              <span className="font-bold text-white block">{new Date(event.start_date).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Format</span>
              <span className="font-bold text-white block">{event.team_type}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Prize Pool</span>
              <span className="font-bold text-amber-400 block">{event.prize_pool}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Event Overview</h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{event.description}</p>
          </div>

          {/* Rules */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Rules & Guidelines</h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {Array.isArray(event.rules) && event.rules.length > 0 ? (
                event.rules.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))
              ) : (
                <li>Standard RGUKT campus code of conduct applies.</li>
              )}
            </ul>
          </div>

          {/* Coordinator Details */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-3">
            <div>
              <span className="text-slate-400 block text-[11px]">Event Coordinator</span>
              <span className="font-bold text-white text-sm">{event.coordinator_name}</span>
              {event.faculty_advisor && <div className="text-[11px] text-slate-400">Advisor: {event.faculty_advisor}</div>}
            </div>
            <div className="text-slate-300 space-y-1 text-right">
              {event.coordinator_phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{event.coordinator_phone}</span>
                </div>
              )}
              {event.coordinator_email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>{event.coordinator_email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onRegister(event);
            }}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all"
          >
            Register Pass Now &rarr;
          </button>
        </div>

      </div>
    </div>
  );
}
