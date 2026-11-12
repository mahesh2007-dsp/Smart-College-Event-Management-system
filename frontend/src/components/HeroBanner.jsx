import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Users, Trophy, Building2, Flame, MapPin } from 'lucide-react';

export default function HeroBanner({ onExplore, onOpenAI }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date('2026-11-18T09:00:00').getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden border-b border-slate-800/80 py-16 lg:py-24">
      {/* Real Campus Scenic Landscape as Atmospheric Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000"
        style={{ backgroundImage: `url('/assets/rk_valley_campus.jpg')` }}
      />
      {/* Dark gradient overlay for optimal readability & modern glassmorphic feel */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-600/25 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Official College Emblem & Institution Header */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-slate-900/80 border border-blue-500/40 text-blue-300 backdrop-blur-md shadow-lg">
            <img src="/assets/rgukt_logo.png" className="w-5 h-5 object-contain bg-white rounded-full p-0.5" alt="RGUKT Logo" />
            <span>RAJIV GANDHI UNIVERSITY OF KNOWLEDGE TECHNOLOGIES</span>
            <span className="text-slate-500">•</span>
            <span className="text-blue-400 font-extrabold">IIIT RK VALLEY</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-700 backdrop-blur-md">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Idupulapaya, Kadapa, AP</span>
          </div>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-white tracking-tight leading-tight max-w-4xl mx-auto drop-shadow-lg">
          Smart College <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">Event Management</span> System
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed drop-shadow">
          Official digital campus portal for technical hackathons, cultural festivals, sports tournaments, and AI-powered event matching at RGUKT RK Valley.
        </p>

        {/* Live Countdown to Flagship Event */}
        <div className="mt-8 inline-block p-4 sm:p-5 rounded-2xl glass-panel border border-slate-700/80 shadow-2xl backdrop-blur-xl">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span className="text-slate-400">COUNTDOWN TO:</span>
            <span className="font-bold text-white">ABHIYAAN 2026 NATIONAL HACKATHON</span>
          </div>
          <div className="flex items-center justify-center gap-3 sm:gap-4 font-mono">
            <div className="bg-slate-900/90 border border-slate-700 px-3 py-2 rounded-xl text-center min-w-[60px]">
              <span className="text-xl sm:text-2xl font-extrabold text-blue-400">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="block text-[10px] text-slate-400 font-sans uppercase">Days</span>
            </div>
            <span className="text-xl font-bold text-slate-600">:</span>
            <div className="bg-slate-900/90 border border-slate-700 px-3 py-2 rounded-xl text-center min-w-[60px]">
              <span className="text-xl sm:text-2xl font-extrabold text-blue-400">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="block text-[10px] text-slate-400 font-sans uppercase">Hours</span>
            </div>
            <span className="text-xl font-bold text-slate-600">:</span>
            <div className="bg-slate-900/90 border border-slate-700 px-3 py-2 rounded-xl text-center min-w-[60px]">
              <span className="text-xl sm:text-2xl font-extrabold text-blue-400">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="block text-[10px] text-slate-400 font-sans uppercase">Mins</span>
            </div>
            <span className="text-xl font-bold text-slate-600">:</span>
            <div className="bg-slate-900/90 border border-slate-700 px-3 py-2 rounded-xl text-center min-w-[60px]">
              <span className="text-xl sm:text-2xl font-extrabold text-cyan-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="block text-[10px] text-slate-400 font-sans uppercase">Secs</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onExplore}
            className="px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all"
          >
            Explore Campus Events
          </button>
          <button
            onClick={onOpenAI}
            className="px-5 py-3 rounded-xl text-xs font-bold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" /> Python AI Recommendation
          </button>
        </div>

        {/* University Metric Highlights */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl glass-panel border border-slate-800 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-heading">50+</div>
            <div className="text-xs text-slate-300 mt-1">Events Every Year</div>
          </div>
          <div className="p-4 rounded-xl glass-panel border border-slate-800 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-heading">12,000+</div>
            <div className="text-xs text-slate-300 mt-1">Enrolled RGUKTians</div>
          </div>
          <div className="p-4 rounded-xl glass-panel border border-slate-800 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-heading">6 Venues</div>
            <div className="text-xs text-slate-300 mt-1">SAC, OAT, Computer Labs</div>
          </div>
          <div className="p-4 rounded-xl glass-panel border border-slate-800 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-heading">₹2.0L+</div>
            <div className="text-xs text-slate-300 mt-1">Cash Prizes & Awards</div>
          </div>
        </div>

      </div>
    </div>
  );
}
