import React from 'react';
import { Users, MapPin, Check, Trees, Building } from 'lucide-react';

export default function VenuesPage({ venues }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      
      {/* Scenic Campus Landscape Header */}
      <div className="relative rounded-3xl overflow-hidden mb-10 border border-slate-700/80 shadow-2xl h-64 sm:h-80">
        <img 
          src="/assets/rk_valley_campus.jpg" 
          alt="RGUKT RK Valley Campus Landscape" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        
        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 border border-blue-500/40 text-blue-300 backdrop-blur-md mb-2">
              <Trees className="w-3.5 h-3.5 text-emerald-400" />
              <span>Idupulapaya Valley Plateau Campus</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-white">
              Campus Venues & Facilities
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Nestled against the picturesque cliffs of Kadapa, RGUKT RK Valley features world-class student facilities for academic, cultural, and sports activities.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700">
            <Building className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white">{venues.length} Premier University Hubs</span>
          </div>
        </div>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map(v => (
          <div key={v.id} className="glass-panel rounded-2xl overflow-hidden border border-slate-700/60 hover:border-blue-500/40 transition-all shadow-xl flex flex-col group">
            <div className="h-44 relative overflow-hidden bg-slate-900">
              <img src={v.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={v.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900/80 backdrop-blur-md text-blue-400 border border-blue-500/30">
                {v.short_code}
              </span>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300">
                <span className="font-medium flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" /> Max Capacity: <b className="text-white">{v.capacity.toLocaleString()}</b>
                </span>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">{v.name}</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" /> {v.location}
                </p>

                <div className="mt-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Facility Highlights:</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {v.facilities.split(',').map((f, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md text-[11px] bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> {f.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Available for Scheduling
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
