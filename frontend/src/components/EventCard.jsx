import React from 'react';
import { Calendar, Clock, MapPin, Trophy, UserCheck, Users } from 'lucide-react';

export default function EventCard({ event, onDetails, onRegister }) {
  const capPercent = Math.min(100, Math.round(((event.registered_count || 0) / event.capacity) * 100));
  const isFull = (event.registered_count || 0) >= event.capacity;

  const dateFormatted = new Date(event.start_date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  const timeFormatted = new Date(event.start_date).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  const catColors = {
    Technical: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    Cultural: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    Sports: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    Workshops: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    Hackathons: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl group">
      {/* Poster */}
      <div className="relative h-48 overflow-hidden bg-slate-900">
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${catColors[event.category] || 'bg-slate-800 text-white'}`}>
            {event.category}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700">
            {event.team_type}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">{event.department}</span>
          <h3 className="text-lg font-bold text-white font-heading leading-snug line-clamp-2 drop-shadow-md">
            {event.title}
          </h3>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
            {event.tagline || event.description}
          </p>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{dateFormatted} • {timeFormatted}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate">{event.venue_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate">Coord: <b className="text-slate-200">{event.coordinator_name}</b></span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-amber-300 truncate">{event.prize_pool}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800">
          {/* Capacity Gauge */}
          <div className="mb-3.5">
            <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
              <span>Capacity: <b className="text-white">{event.registered_count || 0}/{event.capacity}</b></span>
              <span className={capPercent > 85 ? 'text-amber-400 font-bold' : 'text-slate-400'}>{capPercent}% Filled</span>
            </div>
            <div className="w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${capPercent > 85 ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
                style={{ width: `${capPercent}%` }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDetails(event)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Details & Rules
            </button>
            <button
              onClick={() => onRegister(event)}
              disabled={isFull}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                isFull 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20'
              }`}
            >
              {isFull ? 'Capacity Full' : 'Register Pass'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
