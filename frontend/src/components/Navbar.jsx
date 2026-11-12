import React, { useState } from 'react';
import { 
  Compass, MapPin, Bell, UserCheck, CalendarPlus, ShieldAlert, 
  LogIn, LogOut, Sparkles, Menu, X 
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage, currentUser, onOpenAuth, onLogout, onOpenAI }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Official RGUKT College Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('events')}>
            <img 
              src="/assets/rgukt_logo.png" 
              alt="RGUKT Official Emblem" 
              className="h-10 sm:h-12 w-auto object-contain filter drop-shadow-md bg-white p-1 rounded-full border border-blue-500/40" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  RGUKT <span className="text-blue-500">RK VALLEY</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Smart CEMS
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 hidden sm:block">
                Smart College Event Management System • IIIT RKV
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => navigateTo('events')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activePage === 'events' ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-300 hover:text-blue-400'
              }`}
            >
              <Compass className="w-4 h-4" /> Explore Events
            </button>

            <button
              onClick={() => navigateTo('venues')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activePage === 'venues' ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-300 hover:text-blue-400'
              }`}
            >
              <MapPin className="w-4 h-4" /> Campus Venues
            </button>

            <button
              onClick={() => navigateTo('notices')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activePage === 'notices' ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-300 hover:text-blue-400'
              }`}
            >
              <Bell className="w-4 h-4" /> Notice Board
            </button>

            {currentUser && (
              <button
                onClick={() => navigateTo('student')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activePage === 'student' ? 'text-cyan-400 font-bold bg-cyan-500/10' : 'text-slate-300 hover:text-cyan-400'
                }`}
              >
                <UserCheck className="w-4 h-4 text-cyan-400" /> My Portal
              </button>
            )}

            {currentUser && (currentUser.role === 'coordinator' || currentUser.role === 'admin') && (
              <button
                onClick={() => navigateTo('organizer')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activePage === 'organizer' ? 'text-indigo-400 font-bold bg-indigo-500/10' : 'text-slate-300 hover:text-indigo-400'
                }`}
              >
                <CalendarPlus className="w-4 h-4 text-indigo-400" /> Organizer Hub
              </button>
            )}

            {currentUser && currentUser.role === 'admin' && (
              <button
                onClick={() => navigateTo('admin')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activePage === 'admin' ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-slate-300 hover:text-amber-400'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Dean Admin
              </button>
            )}
          </nav>

          {/* Action Tools: AI Recommender & Auth Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenAI}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-500/40 text-blue-300 hover:text-white transition-all shadow-sm"
              title="Python AI Event Recommender"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> AI Recommender
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <img 
                    src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.full_name}`} 
                    className="w-8 h-8 rounded-full border border-blue-400 bg-slate-800 object-cover" 
                    alt="avatar" 
                  />
                  <div className="hidden lg:block text-left text-xs">
                    <div className="font-bold text-white leading-tight">{currentUser.full_name}</div>
                    <span className="text-[10px] text-blue-400 uppercase font-semibold">{currentUser.role}</span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" /> <span className="hidden xs:inline">Sign In / Register</span><span className="xs:hidden">Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5 text-blue-400" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800 space-y-2 animate-fade-in">
            <button
              onClick={() => navigateTo('events')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                activePage === 'events' ? 'bg-blue-600/20 text-blue-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <Compass className="w-4 h-4 text-blue-400" /> Explore Events
            </button>

            <button
              onClick={() => navigateTo('venues')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                activePage === 'venues' ? 'bg-blue-600/20 text-blue-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4 text-blue-400" /> Campus Venues
            </button>

            <button
              onClick={() => navigateTo('notices')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                activePage === 'notices' ? 'bg-blue-600/20 text-blue-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <Bell className="w-4 h-4 text-blue-400" /> Notice Board
            </button>

            <button
              onClick={() => {
                onOpenAI();
                setMobileMenuOpen(false);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 flex items-center gap-2.5"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" /> Python AI Recommender
            </button>

            {currentUser && (
              <button
                onClick={() => navigateTo('student')}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                  activePage === 'student' ? 'bg-cyan-600/20 text-cyan-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4 text-cyan-400" /> My Student Portal
              </button>
            )}

            {currentUser && (currentUser.role === 'coordinator' || currentUser.role === 'admin') && (
              <button
                onClick={() => navigateTo('organizer')}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                  activePage === 'organizer' ? 'bg-indigo-600/20 text-indigo-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <CalendarPlus className="w-4 h-4 text-indigo-400" /> Organizer Hub & Gate Scanner
              </button>
            )}

            {currentUser && currentUser.role === 'admin' && (
              <button
                onClick={() => navigateTo('admin')}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                  activePage === 'admin' ? 'bg-amber-600/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Dean Admin Dashboard
              </button>
            )}
          </div>
        )}

      </div>
    </header>
  );
}
