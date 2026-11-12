import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import EventsDiscovery from './pages/EventsDiscovery';
import StudentPortal from './pages/StudentPortal';
import OrganizerHub from './pages/OrganizerHub';
import AdminDashboard from './pages/AdminDashboard';
import VenuesPage from './pages/VenuesPage';
import NoticesPage from './pages/NoticesPage';

import EventDetailModal from './components/EventDetailModal';
import EventRegisterModal from './components/EventRegisterModal';
import TicketPassModal from './components/TicketPassModal';
import CertificateModal from './components/CertificateModal';
import AuthModal from './components/AuthModal';
import AIRecommenderModal from './components/AIRecommenderModal';

import { api } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('events');
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  // Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rkv_cems_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Modal States
  const [detailEvent, setDetailEvent] = useState(null);
  const [registerEvent, setRegisterEvent] = useState(null);
  const [ticketModalData, setTicketModalData] = useState(null);
  const [certModalData, setCertModalData] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Load initial data
  const loadData = async () => {
    try {
      const [evts, vns, anns] = await Promise.all([
        api.getEvents(),
        api.getVenues(),
        api.getAnnouncements()
      ]);
      setEvents(evts);
      setVenues(vns);
      setAnnouncements(anns);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  const loadRegistrations = async () => {
    if (!currentUser) {
      setRegistrations([]);
      return;
    }
    try {
      const regs = await api.getRegistrations({ userId: currentUser.id });
      setRegistrations(regs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [currentUser]);

  // Auth Actions
  const handleLogin = async (identifier, password, role) => {
    const res = await api.login(identifier, password, role);
    setCurrentUser(res.user);
    localStorage.setItem('rkv_cems_user', JSON.stringify(res.user));
    localStorage.setItem('rkv_cems_token', res.token);
    if (res.user.role === 'admin') setActivePage('admin');
    else if (res.user.role === 'coordinator') setActivePage('organizer');
    else setActivePage('student');
  };

  const handleRegister = async (userData) => {
    const res = await api.register(userData);
    setCurrentUser(res.user);
    localStorage.setItem('rkv_cems_user', JSON.stringify(res.user));
    localStorage.setItem('rkv_cems_token', res.token);
    if (res.user.role === 'admin') setActivePage('admin');
    else if (res.user.role === 'coordinator') setActivePage('organizer');
    else setActivePage('student');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('rkv_cems_user');
    localStorage.removeItem('rkv_cems_token');
    setActivePage('events');
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('rkv_cems_user', JSON.stringify(updatedUser));
  };

  // Event Actions
  const handleEventRegistrationSuccess = async (payload) => {
    const newReg = await api.registerForEvent(payload);
    await loadData();
    await loadRegistrations();
    // Launch E-Ticket immediately
    const matchedEvt = events.find(e => e.id === payload.event_id);
    setTicketModalData({ registration: newReg, event: matchedEvt });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Campus Urgent Announcement Ticker */}
      {announcements.length > 0 && (
        <div className="bg-slate-900/90 border-b border-slate-800 text-slate-300">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                announcements[0].priority === 'urgent' ? 'bg-rose-500 text-white animate-pulse' : 'bg-cyan-500 text-slate-950'
              }`}>
                {announcements[0].priority}
              </span>
              <span className="font-bold text-white">{announcements[0].title}:</span>
              <span className="text-slate-300">{announcements[0].content}</span>
            </div>
            <button
              onClick={() => setActivePage('notices')}
              className="text-blue-400 hover:text-blue-300 font-bold ml-4 whitespace-nowrap text-[11px] underline"
            >
              All Notices &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenAI={() => setAiModalOpen(true)}
      />

      {/* Main Pages */}
      <main className="flex-1 pb-16">
        {activePage === 'events' && (
          <>
            <HeroBanner
              onExplore={() => {
                const el = document.getElementById('eventsCatalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenAI={() => setAiModalOpen(true)}
            />
            <div id="eventsCatalog">
              <EventsDiscovery
                events={events}
                onDetails={evt => setDetailEvent(evt)}
                onRegister={evt => {
                  if (!currentUser) setAuthModalOpen(true);
                  else setRegisterEvent(evt);
                }}
              />
            </div>
          </>
        )}

        {activePage === 'student' && (
          <StudentPortal
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
            registrations={registrations}
            events={events}
            onShowTicket={(reg, evt) => setTicketModalData({ registration: reg, event: evt })}
            onShowCert={(reg, evt) => setCertModalData({ registration: reg, event: evt })}
            onOpenEvent={id => {
              const e = events.find(item => item.id === id);
              if (e) setDetailEvent(e);
            }}
          />
        )}

        {activePage === 'organizer' && (
          <OrganizerHub
            currentUser={currentUser}
            events={events}
            venues={venues}
            onRefreshEvents={loadData}
            onOpenEvent={id => {
              const e = events.find(item => item.id === id);
              if (e) setDetailEvent(e);
            }}
          />
        )}

        {activePage === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            events={events}
            onRefreshEvents={loadData}
            announcements={announcements}
            onRefreshAnnouncements={loadData}
          />
        )}

        {activePage === 'venues' && <VenuesPage venues={venues} />}

        {activePage === 'notices' && <NoticesPage announcements={announcements} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/90 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/assets/rgukt_logo.png" className="h-12 w-auto bg-white p-1 rounded-full border border-blue-500" alt="Logo" />
              <div>
                <div className="font-bold text-white text-sm">Rajiv Gandhi University of Knowledge Technologies</div>
                <div className="text-[11px] text-slate-400">IIIT RK Valley Campus • Idupulapaya, Vempalli Mandal, YSR Kadapa, AP - 516330</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <span className="text-blue-400 font-semibold">Smart College Event Management System (Smart CEMS)</span>
              <span>Software Engineering Lab (E3-S1)</span>
              <span>Dean Student Affairs</span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-slate-500 text-[11px]">
            © 2026 RGUKT IIIT RK Valley. All rights reserved. Built with React, Node.js, SQL, Supabase and Python AI.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EventDetailModal
        event={detailEvent}
        onClose={() => setDetailEvent(null)}
        onRegister={evt => {
          if (!currentUser) setAuthModalOpen(true);
          else setRegisterEvent(evt);
        }}
      />

      <EventRegisterModal
        event={registerEvent}
        currentUser={currentUser}
        onClose={() => setRegisterEvent(null)}
        onSuccess={handleEventRegistrationSuccess}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <TicketPassModal
        registration={ticketModalData?.registration}
        event={ticketModalData?.event}
        onClose={() => setTicketModalData(null)}
      />

      <CertificateModal
        registration={certModalData?.registration}
        event={certModalData?.event}
        onClose={() => setCertModalData(null)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <AIRecommenderModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        currentUser={currentUser}
        events={events}
        onSelectEvent={id => {
          const e = events.find(item => item.id === id);
          if (e) setDetailEvent(e);
        }}
        onRegisterEvent={evt => {
          if (!currentUser) setAuthModalOpen(true);
          else setRegisterEvent(evt);
        }}
      />

    </div>
  );
}
