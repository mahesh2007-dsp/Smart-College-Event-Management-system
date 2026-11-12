import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Trash2, Users, AlertCircle, CheckCircle, 
  Clock, MapPin, QrCode, FileSpreadsheet, X, Search, 
  Calendar, Check, AlertTriangle, XCircle, CreditCard, DollarSign, Download
} from 'lucide-react';
import { api } from '../services/api';
import QRScanner from '../components/QRScanner';

export default function OrganizerHub({ currentUser, events, onRefreshEvents, onOpenEvent, venues }) {
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'ledger'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  
  // All Registrations for unified ledger
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerPaymentFilter, setLedgerPaymentFilter] = useState('All');

  // Scanner Simulator states
  const [ticketInput, setTicketInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Attendees View
  const [selectedEventAttendees, setSelectedEventAttendees] = useState([]);
  const [currentEventTitle, setCurrentEventTitle] = useState('');

  // Create Event Form state with Dynamic Coordinators
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('Technical');
  const [department, setDepartment] = useState(currentUser?.department || 'Computer Science & Engineering');
  const [venueId, setVenueId] = useState(venues[0]?.id || 'v1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [regDeadline, setRegDeadline] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [teamType, setTeamType] = useState('Individual');
  const [entryFee, setEntryFee] = useState('Free');
  const [prizePool, setPrizePool] = useState('Certificates');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  
  // Dynamic Coordinator fields
  const [coordName, setCoordName] = useState(currentUser?.full_name || '');
  const [coordPhone, setCoordPhone] = useState(currentUser?.phone || '');
  const [coordEmail, setCoordEmail] = useState(currentUser?.email || '');
  const [facultyAdvisor, setFacultyAdvisor] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const resetCreateForm = () => {
    setTitle('');
    setTagline('');
    setCategory('Technical');
    setDepartment(currentUser?.department || 'Computer Science & Engineering');
    setVenueId(venues[0]?.id || 'v1');
    setStartDate('');
    setEndDate('');
    setRegDeadline('');
    setCapacity(100);
    setTeamType('Individual');
    setEntryFee('Free');
    setPrizePool('Certificates');
    setDescription('');
    setRules('');
    setCoordName(currentUser?.full_name || '');
    setCoordPhone(currentUser?.phone || '');
    setCoordEmail(currentUser?.email || '');
    setFacultyAdvisor('');
    setFormError('');
    setFormSuccess('');
  };

  const loadAllRegistrations = async () => {
    setLoadingLedger(true);
    try {
      const data = await api.getRegistrations();
      setAllRegistrations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ledger') {
      loadAllRegistrations();
    }
  }, [activeTab]);

  const handleVerifyTicket = async (overrideCode) => {
    const raw = typeof overrideCode === 'string' ? overrideCode : ticketInput;
    const code = (raw || '').trim();
    if (!code) return;
    if (typeof overrideCode === 'string') {
      setTicketInput(code.toUpperCase());
    }
    setIsVerifying(true);
    try {
      const res = await api.verifyTicket(code);
      setScanResult(res);
      if (activeTab === 'ledger') loadAllRegistrations();
    } catch (err) {
      setScanResult({ valid: false, message: err.message || 'Verification error' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleViewAttendees = async (event) => {
    try {
      const regs = await api.getRegistrations({ eventId: event.id });
      setSelectedEventAttendees(regs);
      setCurrentEventTitle(event.title);
      setShowAttendeesModal(true);
    } catch (err) {
      alert('Failed to load attendees');
    }
  };

  const exportCSV = (list, filename) => {
    if (!list || !list.length) return;
    const headers = [
      'TicketCode', 'StudentName', 'StudentID', 'Email', 
      'Department', 'Year', 'Phone', 'TeamName', 'CheckInStatus',
      'PaymentStatus', 'AmountPaid', 'PaymentMode', 'TransactionID', 'RegisteredAt'
    ];
    const rows = list.map(a => [
      `"${a.ticket_code}"`, `"${a.student_name}"`, `"${a.student_id}"`, `"${a.email}"`,
      `"${a.department}"`, `"${a.year}"`, `"${a.phone}"`, `"${a.team_name}"`, `"${a.check_in_status}"`,
      `"${a.payment_status || 'free'}"`, `"${a.payment_amount || 0}"`, `"${a.payment_mode || 'N/A'}"`, 
      `"${a.transaction_id || 'N/A'}"`, `"${a.registered_at || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.deleteEvent(id);
      onRefreshEvents();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!title || !startDate || !endDate || !coordName) {
      setFormError('Please fill all mandatory fields (Title, Dates, Coordinator)');
      return;
    }

    try {
      const selectedVenue = venues.find(v => v.id === venueId);
      const payload = {
        title,
        tagline,
        category,
        department,
        club_name: currentUser?.club_name || 'RGUKT Club',
        venue_id: venueId,
        venue_name: selectedVenue ? selectedVenue.name : 'SAC Campus Venue',
        start_date: startDate,
        end_date: endDate,
        registration_deadline: regDeadline || startDate,
        capacity: Number(capacity),
        team_type: teamType,
        entry_fee: entryFee,
        prize_pool: prizePool,
        description,
        rules: rules ? rules.split('\n').filter(r => r.trim()) : ['Standard RGUKT conduct rules apply'],
        coordinator_name: coordName,
        coordinator_phone: coordPhone,
        coordinator_email: coordEmail,
        faculty_advisor: facultyAdvisor
      };

      await api.createEvent(payload);
      setFormSuccess('Event successfully created and active in calendar!');
      onRefreshEvents();
      setTimeout(() => {
        setShowCreateModal(false);
        resetCreateForm();
      }, 1200);
    } catch (err) {
      setFormError(err.message || 'Event creation failed');
    }
  };

  // Filtered ledger
  const filteredLedger = allRegistrations.filter(r => {
    const matchesSearch = 
      (r.student_name || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (r.student_id || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (r.ticket_code || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (r.transaction_id || '').toLowerCase().includes(ledgerSearch.toLowerCase());
    
    const matchesPayment = 
      ledgerPaymentFilter === 'All' ? true :
      ledgerPaymentFilter === 'Paid' ? (r.payment_status === 'paid') :
      ledgerPaymentFilter === 'Free' ? (r.payment_status === 'free') : true;

    return matchesSearch && matchesPayment;
  });

  const totalRevenue = allRegistrations.reduce((acc, r) => acc + (Number(r.payment_amount) || 0), 0);
  const totalPaidCount = allRegistrations.filter(r => r.payment_status === 'paid').length;
  const totalFreeCount = allRegistrations.filter(r => r.payment_status === 'free').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-indigo-500/30 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 text-2xl">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-heading">{currentUser?.full_name}</h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentUser?.club_name || 'Event Coordinator'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">RGUKT IIIT RK Valley • {currentUser?.department || 'Engineering'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { resetCreateForm(); setShowCreateModal(true); }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Host New Event
          </button>
          <button
            onClick={() => { setShowScannerModal(true); setScanResult(null); setTicketInput(''); }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
          >
            <QrCode className="w-4 h-4 text-cyan-400" /> Ticket Scanner
          </button>
        </div>
      </div>

      {/* Tab Switcher: Events vs All Registrations & Payment Ledger */}
      <div className="flex items-center gap-3 border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'events' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" /> Managed Events ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'ledger' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Student Registrations & Payment Ledger
        </button>
      </div>

      {/* VIEW 1: MANAGED EVENTS DIRECTORY */}
      {activeTab === 'events' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base font-heading">Campus Events Directory</h3>
              <p className="text-xs text-slate-400">View attendees roster, gate attendance status, and event details</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">{events.length} Events Total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Event Title</th>
                  <th className="px-5 py-3">Event Coordinator</th>
                  <th className="px-5 py-3">Venue & Date</th>
                  <th className="px-5 py-3">Capacity</th>
                  <th className="px-5 py-3">Entry Fee</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {events.map(evt => {
                  const capPercent = Math.min(100, Math.round(((evt.registered_count || 0) / evt.capacity) * 100));
                  return (
                    <tr key={evt.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img src={evt.image_url} className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-700" alt="evt" />
                          <div>
                            <div onClick={() => onOpenEvent(evt.id)} className="font-bold text-white text-sm hover:text-blue-400 cursor-pointer">{evt.title}</div>
                            <div className="text-[11px] text-slate-400">{evt.category} • {evt.department}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-white">{evt.coordinator_name}</div>
                        <div className="text-[11px] text-slate-400">{evt.coordinator_phone || evt.coordinator_email}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-300">
                        <div><MapPin className="w-3.5 h-3.5 text-blue-400 inline mr-1" />{evt.venue_name}</div>
                        <div className="text-slate-400 mt-0.5">{new Date(evt.start_date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-32">
                          <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                            <span>{evt.registered_count || 0} / {evt.capacity}</span>
                            <span>{capPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full" style={{ width: `${capPercent}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          evt.entry_fee && evt.entry_fee.toLowerCase() !== 'free' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {evt.entry_fee || 'Free'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewAttendees(evt)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-blue-500/20 hover:text-blue-400 text-slate-300 transition-colors flex items-center gap-1"
                            title="View Registered Students & Payment Info"
                          >
                            <Users className="w-4 h-4" />
                            <span className="text-[11px] font-bold hidden lg:inline">Attendees ({evt.registered_count || 0})</span>
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: UNIFIED REGISTRATIONS & PAYMENT AUDIT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          
          {/* Financial & Registration KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl glass-panel border border-slate-800">
              <div className="text-xs text-slate-400 font-semibold uppercase">Total Students Registered</div>
              <div className="text-2xl font-extrabold text-blue-400 font-heading mt-1">{allRegistrations.length}</div>
              <div className="text-[11px] text-slate-400">Across all campus events</div>
            </div>
            <div className="p-4 rounded-2xl glass-panel border border-slate-800">
              <div className="text-xs text-slate-400 font-semibold uppercase">Total Fee Collection</div>
              <div className="text-2xl font-extrabold text-emerald-400 font-heading mt-1">₹{totalRevenue.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-500/80">Paid registrations</div>
            </div>
            <div className="p-4 rounded-2xl glass-panel border border-slate-800">
              <div className="text-xs text-slate-400 font-semibold uppercase">Paid Registrations</div>
              <div className="text-2xl font-extrabold text-cyan-400 font-heading mt-1">{totalPaidCount}</div>
              <div className="text-[11px] text-cyan-500/80">Verified via UPI / SBI</div>
            </div>
            <div className="p-4 rounded-2xl glass-panel border border-slate-800">
              <div className="text-xs text-slate-400 font-semibold uppercase">Institute Free Passes</div>
              <div className="text-2xl font-extrabold text-purple-400 font-heading mt-1">{totalFreeCount}</div>
              <div className="text-[11px] text-purple-500/80">University sponsored</div>
            </div>
          </div>

          {/* Ledger Table Panel */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
            <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base font-heading">Student Registrations & Payment Ledger</h3>
                <p className="text-xs text-slate-400">Complete database records with payment audit trails, UTR numbers, and ticket codes</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Student, ID, Ticket, or UTR..."
                    value={ledgerSearch}
                    onChange={e => setLedgerSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-400 w-64"
                  />
                </div>

                <select
                  value={ledgerPaymentFilter}
                  onChange={e => setLedgerPaymentFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="All">All Payment Types</option>
                  <option value="Paid">Paid Only</option>
                  <option value="Free">Free Passes Only</option>
                </select>

                <button
                  onClick={() => exportCSV(filteredLedger, 'RGUKT_All_Registrations_Payments')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md"
                >
                  <Download className="w-4 h-4" /> Export Ledger CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3.5">Student Details</th>
                    <th className="p-3.5">RGUKT ID</th>
                    <th className="p-3.5">Ticket Code</th>
                    <th className="p-3.5">Event Reference</th>
                    <th className="p-3.5">Gate Status</th>
                    <th className="p-3.5">Payment Status</th>
                    <th className="p-3.5">Amount (₹)</th>
                    <th className="p-3.5">Payment Mode & UTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-400">
                        {loadingLedger ? 'Loading registration database records...' : 'No registrations found matching criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map(r => {
                      const evt = events.find(e => e.id === r.event_id);
                      return (
                        <tr key={r.id} className="hover:bg-slate-800/40">
                          <td className="p-3.5">
                            <div className="font-bold text-white">{r.student_name}</div>
                            <div className="text-[11px] text-slate-400">{r.department} • {r.year || 'E3'}</div>
                            <div className="text-[10px] text-slate-500">{r.email} • {r.phone}</div>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-blue-400">{r.student_id}</td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-300">{r.ticket_code}</td>
                          <td className="p-3.5">
                            <div className="font-semibold text-white max-w-[150px] truncate">{evt?.title || r.event_id}</div>
                            <div className="text-[11px] text-slate-400">Team: {r.team_name}</div>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.check_in_status === 'checked_in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                            }`}>
                              {r.check_in_status === 'checked_in' ? '✓ ATTENDED' : 'REGISTERED'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              r.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}>
                              {r.payment_status === 'paid' ? 'PAID' : 'FREE PASS'}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold font-mono">
                            ₹{r.payment_amount !== undefined ? Number(r.payment_amount) : 0}
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-300">{r.payment_mode || 'Free (Institute Sponsored)'}</div>
                            <div className="text-[10px] font-mono text-cyan-400">UTR: {r.transaction_id || 'N/A'}</div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl glass-panel rounded-3xl border border-slate-700 overflow-hidden shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">Host New Campus Event</h3>
                <p className="text-xs text-slate-400">Create academic, technical, cultural or sports festivals at RGUKT IIIT RK Valley</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); resetCreateForm(); }} className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && <div className="p-3 mb-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs">{formError}</div>}
            {formSuccess && <div className="p-3 mb-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs">{formSuccess}</div>}

            <form onSubmit={handleCreateSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Event Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Abhiyaan 2026 National Hackathon"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g. Build the Next Generation of AI & Web Innovations"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Workshops">Workshops</option>
                    <option value="Hackathons">Hackathons</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
                  >
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Electronics & Comm Engineering">ECE</option>
                    <option value="Mechanical Engineering">Mechanical</option>
                    <option value="Civil Engineering">Civil</option>
                    <option value="All Branches">All Branches</option>
                    <option value="Physical Education">Sports Council</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Venue Facility</label>
                  <select
                    value={venueId}
                    onChange={e => setVenueId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
                  >
                    {venues.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Format</label>
                  <select
                    value={teamType}
                    onChange={e => setTeamType(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Team (2-4 Members)">Team (2-4)</option>
                    <option value="Department Team">Department Team</option>
                    <option value="Solo & Group">Solo & Group</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Entry Fee</label>
                  <input
                    type="text"
                    placeholder="Free or ₹150"
                    value={entryFee}
                    onChange={e => setEntryFee(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              {/* Dynamic Coordinator Section */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-blue-500/30 space-y-3">
                <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Dynamic Coordinator Details for this Event
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-0.5">Coordinator Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. B. Tejaswi (Tech Club Head)"
                      value={coordName}
                      onChange={e => setCoordName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-700 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-0.5">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="+91 98..."
                      value={coordPhone}
                      onChange={e => setCoordPhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-700 text-slate-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-0.5">Email Address</label>
                    <input
                      type="email"
                      placeholder="coord@rguktrkv.ac.in"
                      value={coordEmail}
                      onChange={e => setCoordEmail(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-700 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-0.5">Faculty Advisor</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. K. Srinivas Rao"
                      value={facultyAdvisor}
                      onChange={e => setFacultyAdvisor(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-700 text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Detailed event overview..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg transition-all"
              >
                Publish Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SCANNER MODAL (LIVE CAMERA QR + IMAGE + MANUAL FALLBACK) */}
      {showScannerModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-cyan-500/40 overflow-hidden shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">Gate Ticket QR Scanner</h3>
                <p className="text-xs text-slate-400">Point camera or upload QR pass to verify attendance automatically</p>
              </div>
              <button onClick={() => setShowScannerModal(false)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <QRScanner
                onScan={(detectedCode) => handleVerifyTicket(detectedCode)}
                isVerifying={isVerifying}
              />

              <div className="pt-2 border-t border-slate-800">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Manual / USB Barcode Fallback (Optional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. RKV-EVT1-0001-8819"
                    value={ticketInput}
                    onChange={e => setTicketInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-cyan-400 font-mono font-bold uppercase focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={() => handleVerifyTicket()}
                    disabled={isVerifying}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-all"
                  >
                    {isVerifying ? 'Checking...' : 'Verify'}
                  </button>
                </div>
              </div>

              {scanResult && (
                <div className={`p-4 rounded-xl border text-xs ${
                  scanResult.valid
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : scanResult.alreadyCheckedIn
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-red-500/20 border-red-500/40 text-red-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-base mb-1">
                    {scanResult.valid && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                    {scanResult.alreadyCheckedIn && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                    {!scanResult.valid && !scanResult.alreadyCheckedIn && <XCircle className="w-5 h-5 text-red-400" />}
                    <span>{scanResult.valid ? 'ENTRY GRANTED!' : (scanResult.alreadyCheckedIn ? 'ALREADY CHECKED IN' : 'INVALID TICKET')}</span>
                  </div>
                  <p>{scanResult.message}</p>
                  {scanResult.registration && (
                    <div className="mt-2 text-[11px] space-y-0.5">
                      <div>Student: <b>{scanResult.registration.student_name}</b> ({scanResult.registration.student_id})</div>
                      <div>Event: {scanResult.event?.title || 'Campus Event'}</div>
                      <div>Payment: <b className="uppercase">{scanResult.registration.payment_status} (₹{scanResult.registration.payment_amount || 0})</b></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ATTENDEES ROSTER MODAL */}
      {showAttendeesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl glass-panel rounded-3xl border border-slate-700 overflow-hidden shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">{currentEventTitle}</h3>
                <span className="text-xs text-blue-400 font-semibold">{selectedEventAttendees.length} Students Registered & Tracked</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportCSV(selectedEventAttendees, `${currentEventTitle}_Attendees`)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export CSV
                </button>
                <button onClick={() => setShowAttendeesModal(false)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {selectedEventAttendees.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No student registrations recorded yet.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Ticket #</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">RGUKT ID</th>
                      <th className="p-3">Dept & Year</th>
                      <th className="p-3">Team</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Check-in Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {selectedEventAttendees.map(a => (
                      <tr key={a.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-blue-400 font-bold">{a.ticket_code}</td>
                        <td className="p-3 font-bold">{a.student_name}</td>
                        <td className="p-3 font-mono">{a.student_id}</td>
                        <td className="p-3">{a.department} ({a.year || 'E3'})</td>
                        <td className="p-3 text-slate-400">{a.team_name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
                          }`}>
                            {a.payment_status === 'paid' ? `₹${a.payment_amount} (${a.payment_mode || 'UPI'})` : 'FREE PASS'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.check_in_status === 'checked_in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {a.check_in_status === 'checked_in' ? 'ATTENDED' : 'REGISTERED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
