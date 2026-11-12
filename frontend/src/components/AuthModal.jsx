import React, { useState, useRef, useEffect } from 'react';
import { X, LogIn, UserPlus, Camera, Check, AlertCircle, Info, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }) {
  const [tab, setTab] = useState('login');
  
  // Login fields
  const [loginRole, setLoginRole] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register fields
  const [fullName, setFullName] = useState('');
  const [rguktId, setRguktId] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('E3');
  const [phone, setPhone] = useState('');
  const [hostel, setHostel] = useState('');
  const [clubName, setClubName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Clean reset when opening modal or switching tabs so previous records don't persist
  useEffect(() => {
    if (isOpen) {
      setError('');
      setLoginRole('student');
      setIdentifier('');
      setPassword('');
      setShowLoginPassword(false);
      setFullName('');
      setRguktId('');
      setEmail('');
      setPhone('');
      setHostel('');
      setClubName('');
      setRegPassword('');
      setShowRegPassword(false);
      setAvatarUrl('');
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setAvatarUrl(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setError('Please enter your RGUKT ID/Email and password');
      return;
    }

    setLoading(true);
    try {
      await onLogin(cleanId, cleanPass, loginRole);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = fullName.trim();
    const cleanId = rguktId.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const cleanPass = regPassword.trim();

    if (!cleanName || cleanName.length < 2) {
      setError('Please provide your full legal name');
      return;
    }

    // Validate Student ID only if provided, or validate format if entered
    if (cleanId) {
      if (!/^[ROSN]\d{6}$/.test(cleanId) && !/^[A-Za-z0-9_-]{3,15}$/.test(cleanId)) {
        setError('Invalid Student / Member ID format (e.g. R210001, O210543, or standard ID)');
        return;
      }
    }

    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError('Please provide a valid email address');
      return;
    }

    if (cleanPhone && !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian phone number (e.g. 9848012345)');
      return;
    }

    if (!cleanPass || cleanPass.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      await onRegister({
        full_name: cleanName,
        email: cleanEmail,
        rgukt_id: cleanId || undefined,
        role,
        department,
        year,
        phone: cleanPhone,
        hostel: hostel.trim(),
        club_name: clubName.trim(),
        password: cleanPass,
        avatar_url: avatarUrl || undefined
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md glass-panel rounded-3xl border border-slate-700/80 overflow-hidden shadow-2xl p-5 sm:p-6 my-6 animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <img src="/assets/rgukt_logo.png" className="h-9 w-auto bg-white p-1 rounded-full border border-blue-500/40" alt="RGUKT" />
            <div>
              <span className="font-heading font-extrabold text-base text-white block leading-tight">
                RGUKT <span className="text-blue-400">RK VALLEY</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Smart College Event Portal</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 mb-4">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'login' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'register' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> New Account
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Sign In Role</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setLoginRole('student')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    loginRole === 'student'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setLoginRole('coordinator')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    loginRole === 'coordinator'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Coordinator
                </button>
                <button
                  type="button"
                  onClick={() => setLoginRole('admin')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    loginRole === 'admin'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dean Admin
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  {loginRole === 'student' ? 'Student ID or Webmail' : (loginRole === 'coordinator' ? 'Coordinator ID or Email' : 'Faculty Admin ID or Email')}
                </label>
                <span className="text-[10px] text-blue-400 font-medium">
                  {loginRole === 'student' ? 'Student Portal' : (loginRole === 'coordinator' ? 'Organizer Hub' : 'Dean Administration')}
                </span>
              </div>
              <input
                type="text"
                placeholder={
                  loginRole === 'student'
                    ? 'Enter Student ID or email (e.g. R210001)'
                    : (loginRole === 'coordinator'
                      ? 'Enter Coordinator email (e.g. coordinator@rguktrkv.ac.in)'
                      : 'Enter Admin email (e.g. admin@rguktrkv.ac.in)')
                }
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-400 placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="Enter your account password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-400 placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 focus:outline-none transition-colors"
                  title={showLoginPassword ? 'Hide password' : 'Show password'}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Sign in with your RGUKT student ID or university email address.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" /> {loading ? 'Authenticating...' : 'Sign In to Campus CEMS'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            
            {/* Real Profile Photo Selector Box */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl border border-blue-500/60 bg-slate-950 overflow-hidden shrink-0 flex items-center justify-center relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-white block">Profile Picture</span>
                <span className="text-[10px] text-slate-400 block">Optional image or automated avatar</span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                {avatarUrl ? 'Change' : 'Upload'}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Account Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-blue-400 font-bold focus:outline-none focus:border-blue-400"
              >
                <option value="student">Student (Festival Attendee & Participant)</option>
                <option value="coordinator">Event Coordinator / Club Organizer</option>
                <option value="admin">Dean / Faculty Administrator</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Official Name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Student / Campus ID</label>
                <input
                  type="text"
                  placeholder="e.g. R210001 (optional for guests)"
                  value={rguktId}
                  onChange={e => setRguktId(e.target.value.toUpperCase())}
                  maxLength={12}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 uppercase font-mono font-bold tracking-wide placeholder-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Department</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
                >
                  <option value="Computer Science & Engineering">CSE</option>
                  <option value="Electronics & Comm Engineering">ECE</option>
                  <option value="Mechanical Engineering">MECH</option>
                  <option value="Civil Engineering">CIVIL</option>
                  <option value="Chemical Engineering">CHEM</option>
                  <option value="Metallurgical Engineering">MME</option>
                  <option value="Student Affairs">Dean / Student Affairs</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Year / Designation</label>
                <select
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
                >
                  <option value="E1">E1 (1st Year)</option>
                  <option value="E2">E2 (2nd Year)</option>
                  <option value="E3">E3 (3rd Year)</option>
                  <option value="E4">E4 (Final Year)</option>
                  <option value="PUC-1">PUC-1</option>
                  <option value="PUC-2">PUC-2</option>
                  <option value="Faculty">Faculty Incharge</option>
                </select>
              </div>
            </div>

            {role === 'coordinator' && (
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Club / Organizing Committee</label>
                <input
                  type="text"
                  placeholder="e.g. Coding Club, Cultural Committee, Sports Council"
                  value={clubName}
                  onChange={e => setClubName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="user@rguktrkv.ac.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="9848012345"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  maxLength={10}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 font-mono placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Create Password</label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Minimum 4 characters"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-10 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 focus:outline-none transition-colors"
                  title={showRegPassword ? 'Hide password' : 'Show password'}
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> {loading ? 'Registering Account...' : 'Complete Registration'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
