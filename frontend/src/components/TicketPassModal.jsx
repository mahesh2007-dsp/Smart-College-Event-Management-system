import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, ShieldCheck } from 'lucide-react';

export default function TicketPassModal({ registration, event, onClose }) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (registration?.ticket_code) {
      QRCode.toDataURL(registration.ticket_code, {
        width: 140,
        margin: 1,
        color: { dark: '#1e3a8a', light: '#ffffff' } // Professional Navy Blue QR
      })
      .then(url => setQrUrl(url))
      .catch(err => console.error(err));
    }
  }, [registration]);

  if (!registration) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md my-8">
        
        {/* Printable Ticket Pass */}
        <div id="printableTicket" className="ticket-container rounded-3xl p-6 shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
            <div className="flex items-center gap-3">
              <img src="/assets/rgukt_logo.png" className="h-10 w-auto bg-white p-1 rounded-full border border-blue-500" alt="Logo" />
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">RGUKT IIIT RK VALLEY</div>
                <div className="text-[10px] text-slate-400">Official Campus Event Entry Pass</div>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              E-PASS
            </span>
          </div>

          {/* Event Details */}
          <div className="mt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">University Event</span>
            <h3 className="text-xl font-extrabold text-white font-heading mt-0.5">
              {event?.title || 'Campus Event'}
            </h3>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block">Date</span>
                <span className="font-bold text-white">{event ? new Date(event.start_date).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Time</span>
                <span className="font-bold text-white">{event ? new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Venue</span>
                <span className="font-bold text-white truncate max-w-[110px] block">{event?.venue_name || 'RGUKT Venue'}</span>
              </div>
            </div>
          </div>

          {/* QR Code & Student Details */}
          <div className="mt-5 flex items-center gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
            <div className="bg-white p-2 rounded-xl shadow-md min-w-[110px] flex items-center justify-center">
              {qrUrl ? <img src={qrUrl} alt="QR Code" className="w-24 h-24" /> : <div className="w-24 h-24 bg-slate-200 animate-pulse" />}
            </div>
            <div className="flex-1 text-xs">
              <div className="font-bold text-white text-sm">{registration.student_name}</div>
              <div className="text-blue-400 font-mono font-bold text-xs">{registration.student_id}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{registration.department} ({registration.year || 'E3'})</div>
              <div className="text-[10px] text-slate-400 mt-1">Team: <span className="text-slate-200 font-semibold">{registration.team_name}</span></div>
              <div className="mt-2 text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 inline-block">
                {registration.ticket_code}
              </div>
            </div>
          </div>

          {/* Payment Status & Audit Badge */}
          <div className="mt-3 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${registration.payment_status === 'paid' ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
              <span className="text-slate-400">Payment:</span>
              <span className="font-bold text-white uppercase">{registration.payment_status === 'paid' ? `Paid (₹${registration.payment_amount})` : 'Free Pass'}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Ref: <span className="text-cyan-300 font-bold">{registration.transaction_id || 'N/A'}</span>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="mt-4 pt-3 border-t border-dashed border-slate-700/80 text-[10px] text-slate-400 text-center flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Scan QR at SAC Entrance
            </span>
            <span className="font-mono text-slate-500">{new Date(registration.registered_at || Date.now()).toLocaleDateString()}</span>
          </div>

        </div>

        {/* Buttons */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>

      </div>
    </div>
  );
}
