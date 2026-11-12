import React, { useState, useEffect } from 'react';
import { X, Users, CreditCard, ShieldCheck, CheckCircle2, QrCode, Copy, Check, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EventRegisterModal({ event, currentUser, onClose, onSuccess, onOpenAuth }) {
  if (!event) return null;

  const isPaid = event.entry_fee && event.entry_fee.toLowerCase() !== 'free' && !event.entry_fee.toLowerCase().includes('₹0');
  const numericFee = isPaid ? (parseInt(event.entry_fee.replace(/[^0-9]/g, '')) || 100) : 0;
  const isTeam = (event.team_type || '').toLowerCase().includes('team');

  // Form states
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('E3');
  const [phone, setPhone] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState('');
  
  // Payment states
  const [paymentMode, setPaymentMode] = useState('UPI / QR Code');
  const [transactionId, setTransactionId] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const collegeUpiId = 'rguktrkv.events@sbi';

  // RESET FORM WHENEVER EVENT OR USER CHANGES TO PREVENT STALE PREVIOUS RECORDS
  useEffect(() => {
    if (event) {
      setStudentName(currentUser?.full_name || '');
      setStudentId(currentUser?.rgukt_id || '');
      setEmail(currentUser?.email || '');
      setDepartment(currentUser?.department || 'Computer Science & Engineering');
      setYear(currentUser?.year || 'E3');
      setPhone(currentUser?.phone || '');
      setTeamName('');
      setTeamMembers('');
      setPaymentMode('UPI / QR Code');
      setTransactionId('');
      setError('');
      setCopiedUpi(false);
    }
  }, [event, currentUser]);

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(collegeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Validate Student Name
    const cleanName = studentName.trim();
    if (!cleanName || cleanName.length < 2) {
      setError('Please provide your full legal name (minimum 2 characters)');
      return;
    }

    // 2. Validate Student ID
    const cleanId = studentId.trim().toUpperCase();
    const idRegex = /^[A-Za-z0-9_-]{3,15}$/;
    if (!idRegex.test(cleanId)) {
      setError('Invalid Student ID: Please enter your campus ID (e.g. R210001) or registration ID');
      return;
    }

    // 3. Validate Email
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError('Please provide a valid email address for receiving your digital ticket pass');
      return;
    }

    // 4. Validate Phone
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian phone/WhatsApp number (e.g. 9848012345)');
      return;
    }

    // 5. Validate Team details
    if (isTeam) {
      if (!teamName.trim()) {
        setError('Please enter your team name');
        return;
      }
      if (!teamMembers.trim()) {
        setError('Please specify team members (e.g. R210001 Lead, R210002 Member 2)');
        return;
      }
    }

    // 6. Validate Payment & Real UTR Number
    let finalTxnId = 'INST-WAIVER-FREE';
    if (isPaid) {
      if (paymentMode === 'Cash at SAC Desk') {
        finalTxnId = `CASH-DESK-${cleanId}-${Date.now().toString().slice(-4)}`;
      } else {
        const cleanUtr = transactionId.trim().replace(/[\s-]/g, '');
        if (!cleanUtr) {
          setError('UTR / Transaction reference number is mandatory for paid events.');
          return;
        }

        // UPI UTR check: 12 numeric digits or 10-22 alphanumeric characters
        const is12DigitUtr = /^\d{12}$/.test(cleanUtr);
        const isStandardRef = /^[A-Za-z0-9/]{10,24}$/.test(cleanUtr);
        if (!is12DigitUtr && !isStandardRef) {
          setError('Invalid UTR Number: Please enter a valid 12-digit numeric UPI UTR number or Bank Ref ID from your payment app (e.g. 431209876543 or DUK12345678).');
          return;
        }
        finalTxnId = cleanUtr;
      }
    }

    setLoading(true);

    try {
      const payload = {
        event_id: event.id,
        student_name: cleanName,
        student_id: cleanId,
        email: cleanEmail,
        department,
        year,
        phone: cleanPhone,
        team_name: isTeam ? teamName.trim() : 'Individual',
        team_members: isTeam ? teamMembers.trim() : cleanName,
        payment_status: isPaid ? (paymentMode === 'Cash at SAC Desk' ? 'pending' : 'paid') : 'free',
        payment_amount: numericFee,
        payment_mode: isPaid ? paymentMode : 'Free (Institute Sponsored)',
        transaction_id: finalTxnId
      };

      await onSuccess(payload);

      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 }
      });

      handleClose();
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const utrCleanLength = transactionId.trim().replace(/[\s-]/g, '').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl glass-panel rounded-3xl border border-slate-700/80 overflow-hidden shadow-2xl p-5 sm:p-7 my-6 animate-fade-in">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              RGUKT IIIT RK Valley
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white font-heading mt-1">
              Event Registration & Pass
            </h3>
            <p className="text-xs text-slate-300 font-medium truncate max-w-md mt-0.5">{event.title}</p>
          </div>
          <button 
            onClick={handleClose} 
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Row 1: Name and RGUKT ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Student Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter your official name"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-400 placeholder-slate-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Student ID <span className="text-red-400">*</span>
                </label>
                <span className="text-[10px] text-blue-400 font-medium">Campus ID</span>
              </div>
              <input
                type="text"
                placeholder="Enter Student ID (e.g. R210001)"
                value={studentId}
                onChange={e => setStudentId(e.target.value.toUpperCase())}
                required
                maxLength={7}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 uppercase focus:outline-none focus:border-blue-400 font-mono font-bold tracking-wide placeholder-slate-500"
              />
            </div>
          </div>

          {/* Row 2: Department and Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-400"
              >
                <option value="Computer Science & Engineering">CSE (Computer Science)</option>
                <option value="Electronics & Comm Engineering">ECE (Electronics)</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Chemical Engineering">Chemical Engineering</option>
                <option value="Metallurgical Engineering">MME (Metallurgical)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Academic Year</label>
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-400"
              >
                <option value="E1">E1 (1st Year B.Tech)</option>
                <option value="E2">E2 (2nd Year B.Tech)</option>
                <option value="E3">E3 (3rd Year B.Tech)</option>
                <option value="E4">E4 (Final Year B.Tech)</option>
                <option value="PUC-1">PUC-1 (Pre-University)</option>
                <option value="PUC-2">PUC-2 (Pre-University)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Email and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                placeholder="username@rguktrkv.ac.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-400 placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Phone / WhatsApp <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile (e.g. 9848012345)"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                maxLength={10}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-400 font-mono placeholder-slate-500"
              />
            </div>
          </div>

          {/* Team Fields */}
          {isTeam && (
            <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-2.5">
              <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" /> Team Participation Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Team Name</label>
                  <input
                    type="text"
                    placeholder="e.g. ByteWizards"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-400 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Teammates (Names & IDs)</label>
                  <input
                    type="text"
                    placeholder="e.g. R210002 (Ramesh), O210045 (Sita)"
                    value={teamMembers}
                    onChange={e => setTeamMembers(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-400 placeholder-slate-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PAYMENT & FINANCIAL SECTION */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Registration Fee & Pass</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                isPaid ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {isPaid ? `Entry Fee: ₹${numericFee}` : 'FREE ENTRY'}
              </span>
            </div>

            {isPaid ? (
              <div className="space-y-3 pt-1">
                
                {/* Official UPI Payment Box */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white">College Festival UPI ID:</div>
                      <div className="font-mono text-cyan-300 text-xs font-bold">{collegeUpiId}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? 'Copied!' : 'Copy UPI'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Payment Method</label>
                    <select
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-slate-100 focus:border-blue-400"
                    >
                      <option value="UPI / QR Code">UPI (PhonePe / GPay / Paytm)</option>
                      <option value="SBI Collect Portal">SBI Collect Portal / Net Banking</option>
                      <option value="Cash at SAC Desk">Pay Cash at SAC Registration Desk</option>
                    </select>
                  </div>

                  {paymentMode !== 'Cash at SAC Desk' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-slate-300">
                          12-digit UTR / Ref Number <span className="text-red-400">*</span>
                        </label>
                        <span className={`text-[10px] font-mono ${utrCleanLength === 12 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                          {utrCleanLength}/12 digits
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. 431209876543"
                          value={transactionId}
                          onChange={e => setTransactionId(e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-bold focus:border-blue-400 placeholder-slate-600"
                        />
                        {utrCleanLength === 12 && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 flex items-start gap-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    {paymentMode === 'Cash at SAC Desk' 
                      ? 'You can pay the entry fee at the SAC helpdesk before gate entry.'
                      : 'Enter the 12-digit UTR from your UPI payment receipt. Gate coordinators cross-verify this during digital QR ticket scanning.'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Institute-Sponsored Event. No registration fee required for registered university students.</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Validating & Issuing Pass...' : 'Confirm Registration & Generate E-Pass'}
          </button>
        </form>

      </div>
    </div>
  );
}
