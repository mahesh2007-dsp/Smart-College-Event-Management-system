import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, Bell, BarChart3, Building, CreditCard, Download, Users } from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboard({ currentUser, events, onRefreshEvents, announcements, onRefreshAnnouncements }) {
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePriority, setNoticePriority] = useState('info');
  const [broadcasting, setBroadcasting] = useState(false);
  
  // Registration & Payment Audit
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(true);

  useEffect(() => {
    api.getRegistrations()
      .then(data => setRegistrations(data))
      .catch(err => console.error(err))
      .finally(() => setLoadingRegs(false));
  }, []);

  // Check venue conflicts
  const venueMap = {};
  events.forEach(e => {
    if (!venueMap[e.venue_id]) venueMap[e.venue_id] = [];
    venueMap[e.venue_id].push(e);
  });

  const conflicts = [];
  Object.keys(venueMap).forEach(vid => {
    const list = venueMap[vid];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const e1 = list[i];
        const e2 = list[j];
        const s1 = new Date(e1.start_date).getTime();
        const end1 = new Date(e1.end_date || e1.start_date).getTime();
        const s2 = new Date(e2.start_date).getTime();
        const end2 = new Date(e2.end_date || e2.start_date).getTime();
        if (s1 < end2 && end1 > s2) {
          conflicts.push({ venue: e1.venue_name, e1: e1.title, e2: e2.title, date: new Date(s1).toLocaleDateString() });
        }
      }
    }
  });

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;
    setBroadcasting(true);
    try {
      await api.broadcastAnnouncement({
        title: noticeTitle,
        content: noticeContent,
        priority: noticePriority
      });
      setNoticeTitle('');
      setNoticeContent('');
      onRefreshAnnouncements();
      alert('Announcement broadcasted across campus!');
    } catch (err) {
      alert('Broadcast failed');
    } finally {
      setBroadcasting(false);
    }
  };

  const exportAuditCSV = () => {
    if (!registrations.length) return;
    const headers = ['TicketCode', 'StudentName', 'StudentID', 'EventID', 'Department', 'Year', 'PaymentStatus', 'Amount', 'PaymentMode', 'TransactionID', 'RegisteredAt'];
    const rows = registrations.map(r => [
      `"${r.ticket_code}"`, `"${r.student_name}"`, `"${r.student_id}"`, `"${r.event_id}"`,
      `"${r.department}"`, `"${r.year}"`, `"${r.payment_status}"`, `"${r.payment_amount}"`,
      `"${r.payment_mode}"`, `"${r.transaction_id}"`, `"${r.registered_at}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `RGUKT_Dean_Financial_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalFeeCollected = registrations.reduce((sum, r) => sum + (Number(r.payment_amount) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-amber-500/30 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-2xl font-heading font-black">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-heading">{currentUser?.full_name}</h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                Dean Administration
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">University Oversight • Facility Scheduling & Financial Governance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300">
            IIIT RK Valley Central Node
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl glass-panel border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Events</div>
          <div className="text-3xl font-extrabold text-blue-400 font-heading mt-2">{events.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all branches</div>
        </div>
        <div className="p-5 rounded-2xl glass-panel border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase">Student Registrations</div>
          <div className="text-3xl font-extrabold text-cyan-400 font-heading mt-2">
            {registrations.length}
          </div>
          <div className="text-[11px] text-cyan-500/80 mt-1">Total active participants</div>
        </div>
        <div className="p-5 rounded-2xl glass-panel border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Fee Collection</div>
          <div className="text-3xl font-extrabold text-emerald-400 font-heading mt-2">
            ₹{totalFeeCollected.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Event registration receipts</div>
        </div>
        <div className="p-5 rounded-2xl glass-panel border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase">Venue Facilities</div>
          <div className="text-3xl font-extrabold text-purple-400 font-heading mt-2">6</div>
          <div className="text-[11px] text-purple-500/80 mt-1">SAC, OAT, Computer Labs</div>
        </div>
      </div>

      {/* Campus Venue Collision & Conflict Detector */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white font-heading">Campus Venue Collision & Conflict Guard</h3>
          <span className="text-xs text-slate-400">Automated schedule integrity algorithm</span>
        </div>

        {conflicts.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold">Zero Venue Conflicts Detected:</span> All current university facilities (SAC Auditorium, OAT, Computer Labs) are scheduled without any overlapping collisions.
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            <div className="flex items-center gap-2 font-bold text-red-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{conflicts.length} VENUE COLLISION(S) DETECTED!</span>
            </div>
            <ul className="space-y-1 list-disc list-inside">
              {conflicts.map((c, i) => (
                <li key={i}>
                  <b className="text-white">{c.venue}:</b> "{c.e1}" collides with "{c.e2}" on {c.date}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* FINANCIAL & REGISTRATION AUDIT SECTION FOR DEAN */}
      <div className="mb-8 glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white font-heading">Financial Audit & Registration Ledger</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Live university ledger of all student registrations, entry fees, and UPI transaction IDs</p>
          </div>
          <button
            onClick={exportAuditCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md"
          >
            <Download className="w-4 h-4" /> Export Financial Report (.CSV)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Student Name</th>
                <th className="p-3">RGUKT ID</th>
                <th className="p-3">Department</th>
                <th className="p-3">Event Ref</th>
                <th className="p-3">Status</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Payment Mode</th>
                <th className="p-3">UTR / Receipt No</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-400">
                    {loadingRegs ? 'Loading audit records...' : 'No registrations found.'}
                  </td>
                </tr>
              ) : (
                registrations.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">{r.student_name}</td>
                    <td className="p-3 font-mono text-blue-400">{r.student_id}</td>
                    <td className="p-3">{r.department} ({r.year || 'E3'})</td>
                    <td className="p-3 text-slate-300 font-mono text-[11px]">{r.event_id}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {r.payment_status === 'paid' ? 'PAID' : 'FREE'}
                      </span>
                    </td>
                    <td className="p-3 font-bold font-mono">₹{r.payment_amount || 0}</td>
                    <td className="p-3 text-slate-400">{r.payment_mode || 'Free'}</td>
                    <td className="p-3 font-mono text-cyan-400 text-[11px]">{r.transaction_id || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast Campus Announcement */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white font-heading">Broadcast Official Campus Announcement</h3>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Notice Title</label>
              <input
                type="text"
                placeholder="e.g. SAC Auditorium Rehearsal Schedule"
                value={noticeTitle}
                onChange={e => setNoticeTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={noticePriority}
                onChange={e => setNoticePriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
              >
                <option value="info">Standard Notice (Cyan)</option>
                <option value="urgent">Urgent Circular (Red Banner)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notice Content</label>
            <textarea
              rows="2"
              placeholder="Full announcement body..."
              value={noticeContent}
              onChange={e => setNoticeContent(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={broadcasting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Bell className="w-4 h-4" /> {broadcasting ? 'Publishing...' : 'Publish to Campus Feed'}
          </button>
        </form>
      </div>

    </div>
  );
}
